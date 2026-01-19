const cron = require('node-cron');
const { logger } = require('../utils/logger');
const platformConfig = require('../../config/platforms');
const jobRepo = require('../storage/repositories/jobs');
const scoreRepo = require('../storage/repositories/scores');
const appRepo = require('../storage/repositories/applications');
const userRepo = require('../storage/repositories/users');
const scorer = require('../scorer/runner');

// Import scrapers
const LinkedInScraper = require('../scrapers/linkedin');
const NaukriScraper = require('../scrapers/naukri');
const IndeedScraper = require('../scrapers/indeed');
const RemoteOKScraper = require('../scrapers/remoteok');
const WWRScraper = require('../scrapers/wwr');
const WellfoundScraper = require('../scrapers/wellfound');
const HimalayasScraper = require('../scrapers/himalayas');
const RemotiveScraper = require('../scrapers/remotive');

class Orchestrator {
    constructor() {
        this.scrapers = this.initializeScrapers();
        this.stats = {
            jobsScraped: 0,
            jobsInserted: 0,
            jobsScored: 0,
            errors: 0
        };
    }

    initializeScrapers() {
        return {
            linkedin: new LinkedInScraper(platformConfig.linkedin),
            naukri: new NaukriScraper(platformConfig.naukri),
            indeed: new IndeedScraper(platformConfig.indeed),
            remoteok: new RemoteOKScraper(platformConfig.remoteok),
            weworkremotely: new WWRScraper(platformConfig.weworkremotely),
            wellfound: new WellfoundScraper(platformConfig.wellfound),
            himalayas: new HimalayasScraper(platformConfig.himalayas),
            remotive: new RemotiveScraper(platformConfig.remotive)
        };
    }

    async runScraping() {
        logger.info('=== Starting job scraping cycle ===');
        this.resetStats();

        for (const [platform, scraper] of Object.entries(this.scrapers)) {
            const config = platformConfig[platform];

            if (!config || !config.enabled) {
                logger.info(`Skipping disabled platform: ${platform}`);
                continue;
            }

            try {
                logger.info(`Scraping ${platform}...`);
                const jobs = await scraper.scrape(config.searchParams);

                if (!jobs || jobs.length === 0) {
                    logger.warn(`No jobs found on ${platform}`);
                    continue;
                }

                // Bulk insert jobs
                const insertResult = await jobRepo.bulkInsertJobs(jobs);

                logger.info(`${platform}: ${insertResult.inserted} new, ${insertResult.duplicates} duplicates, ${insertResult.errors} errors`);

                this.stats.jobsScraped += jobs.length;
                this.stats.jobsInserted += insertResult.inserted;
                this.stats.errors += insertResult.errors;

                // Rate limiting
                if (config.rateLimit && config.rateLimit.delayBetweenRequests) {
                    await this.delay(config.rateLimit.delayBetweenRequests);
                }

            } catch (error) {
                logger.error(`Failed to scrape ${platform}: ${error.message}`);
                this.stats.errors++;
            }
        }

        logger.info(`Scraping complete: ${this.stats.jobsInserted} new jobs inserted`);
    }

    async runScoring() {
        logger.info('=== Starting job scoring ===');

        // Get all users
        const users = await userRepo.getAllUsers();

        if (users.length === 0) {
            logger.warn('No users found - skipping scoring');
            return;
        }

        for (const user of users) {
            try {
                await this.scoreJobsForUser(user.id);
            } catch (error) {
                logger.error(`Failed to score jobs for user ${user.id}: ${error.message}`);
                this.stats.errors++;
            }
        }

        logger.info(`Scoring complete: ${this.stats.jobsScored} jobs scored`);
    }

    async scoreJobsForUser(userId) {
        // Get user's resume
        const resumeData = await userRepo.getOrUpdateResume(userId);

        if (!resumeData || !resumeData.resume_json) {
            logger.warn(`No resume found for user ${userId}`);
            return;
        }

        const resumeJson = resumeData.resume_json;

        // Get unscored jobs for this user
        const unscoredJobs = await jobRepo.getUnscoredJobsForUser(userId, 100);

        if (unscoredJobs.length === 0) {
            logger.info(`No unscored jobs for user ${userId}`);
            return;
        }

        logger.info(`Scoring ${unscoredJobs.length} jobs for user ${userId}`);

        for (const job of unscoredJobs) {
            try {
                // Call AI scorer
                const scoreResult = await scorer.scoreJob(resumeJson, job.job_description);

                // Insert score
                await scoreRepo.insertScore({
                    job_id: job.id,
                    user_id: userId,
                    skill_match_score: scoreResult.skill_match,
                    role_stretch_score: scoreResult.role_stretch,
                    risk_reward_score: scoreResult.risk_reward,
                    missing_skills: scoreResult.missing_skills || [],
                    ai_recommendation: scoreResult.apply_recommendation,
                    reason: scoreResult.reason
                });

                // Determine auto-apply flag
                const autoApply = scorer.shouldAutoApply(scoreResult);

                // Create application record
                await appRepo.createApplication(job.id, userId, autoApply);

                this.stats.jobsScored++;

                logger.info(`Scored job ${job.id}: ${scoreResult.apply_recommendation} (auto: ${autoApply})`);

                // Small delay between AI calls to avoid rate limiting
                await this.delay(1000);

            } catch (error) {
                logger.error(`Failed to score job ${job.id}: ${error.message}`);
                this.stats.errors++;
            }
        }
    }

    async run() {
        try {
            logger.info('▶️  Orchestrator starting full cycle');

            // Step 1: Scrape jobs
            await this.runScraping();

            // Step 2: Score jobs
            await this.runScoring();

            // Step 3: Log summary
            this.logSummary();

            logger.info('✅ Orchestrator cycle complete');
        } catch (error) {
            logger.error(`Orchestrator failed: ${error.message}`, { stack: error.stack });
        }
    }

    resetStats() {
        this.stats = {
            jobsScraped: 0,
            jobsInserted: 0,
            jobsScored: 0,
            errors: 0
        };
    }

    logSummary() {
        logger.info('=== CYCLE SUMMARY ===');
        logger.info(`Jobs scraped: ${this.stats.jobsScraped}`);
        logger.info(`Jobs inserted: ${this.stats.jobsInserted}`);
        logger.info(`Jobs scored: ${this.stats.jobsScored}`);
        logger.info(`Errors: ${this.stats.errors}`);
        logger.info('====================');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
const orchestrator = new Orchestrator();

// Cron schedule from env (default: every 4 hours)
const schedule = process.env.CRON_SCHEDULE || '0 */4 * * *';

logger.info(`Scheduling cron job with: ${schedule}`);

cron.schedule(schedule, () => {
    orchestrator.run();
});

// Run immediately on start (optional - comment out if not needed)
logger.info('Running initial cycle...');
orchestrator.run();

// Keep process alive
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    process.exit(0);
});
