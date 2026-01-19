const searchFilters = require('../../config/search-filters');
const { logger } = require('./logger');
const aiClassifier = require('../scorer/ai-classifier');

/**
 * Smart job filtering utility with AI-assisted ambiguity resolution
 * Balances precision and recall - not too broad, not too narrow
 */
class JobFilter {
    constructor() {
        this.filters = searchFilters;
        this.stats = {
            total: 0,
            passedTitleFilter: 0,
            passedKeywordFilter: 0,
            passedExcludeFilter: 0,
            passedSalaryFilter: 0,
            ambiguous: 0,
            aiKept: 0,
            aiRejected: 0,
            final: 0
        };
        this.useAI = process.env.USE_AI_FILTER === 'true'; // Toggle AI-assisted filtering
    }

    /**
     * Main filter function - returns true if job should be kept
     * @param {Object} job - Normalized job object
     * @returns {Boolean}
     */
    shouldKeepJob(job) {
        this.stats.total++;

        // Step 1: Title filter (must match target roles)
        if (!this.matchesTargetRole(job.job_title)) {
            logger.debug(`Rejected (title): ${job.job_title}`);
            return false;
        }
        this.stats.passedTitleFilter++;

        // Step 2: Required keywords (must have technical stack match)
        if (!this.hasRequiredKeywords(job.job_description, job.job_title)) {
            logger.debug(`Rejected (keywords): ${job.job_title}`);
            return false;
        }
        this.stats.passedKeywordFilter++;

        // Step 3: Exclude filter (must NOT have disqualifying keywords)
        if (this.hasExcludedKeywords(job.job_description, job.job_title)) {
            logger.debug(`Rejected (excluded): ${job.job_title} - ${this.getExcludeReason(job)}`);
            return false;
        }
        this.stats.passedExcludeFilter++;

        // Step 4: Salary filter (if salary info available)
        if (job.salary_min && !this.meetsSalaryThreshold(job.salary_min, job.salary_currency)) {
            logger.debug(`Rejected (salary): ${job.job_title} - ${job.salary_min} ${job.salary_currency}`);
            return false;
        }
        this.stats.passedSalaryFilter++;

        this.stats.final++;
        return true;
    }

    /**
     * Check if job title matches target roles
     */
    matchesTargetRole(title) {
        if (!title) return false;

        const titleLower = title.toLowerCase();

        return this.filters.targetRoles.some(role => {
            const roleLower = role.toLowerCase();

            // Exact match or contains
            if (titleLower.includes(roleLower)) return true;

            // Keyword matching (e.g., "Platform" in "Platform Engineer")
            const roleKeywords = roleLower.split(' ');
            return roleKeywords.every(keyword => titleLower.includes(keyword));
        });
    }

    /**
     * Check for required keywords
     * Must have at least ONE from technical AND ONE from level
     */
    hasRequiredKeywords(description, title) {
        if (!description) description = '';

        const text = `${title} ${description}`.toLowerCase();

        // Technical keyword match
        const hasTechnical = this.filters.requiredKeywords.technical.some(keyword =>
            text.includes(keyword.toLowerCase())
        );

        if (!hasTechnical) return false;

        // Level keyword match (more lenient - optional)
        // We'll score this later instead of hard filtering
        return true;
    }

    /**
     * Check for excluded keywords (disqualifiers)
     */
    hasExcludedKeywords(description, title) {
        if (!description) description = '';

        const text = `${title} ${description}`.toLowerCase();

        return this.filters.excludeKeywords.some(keyword =>
            text.includes(keyword.toLowerCase())
        );
    }

    /**
     * Get reason for exclusion (for logging)
     */
    getExcludeReason(job) {
        const text = `${job.job_title} ${job.job_description}`.toLowerCase();

        const matched = this.filters.excludeKeywords.find(keyword =>
            text.includes(keyword.toLowerCase())
        );

        return matched || 'unknown';
    }

    /**
     * Check salary threshold
     */
    meetsSalaryThreshold(salary, currency = 'INR') {
        if (!this.filters.salaryFilter.enabled) return true;
        if (!salary) return true; // No salary info = don't filter out

        const thresholds = this.filters.salaryFilter;

        if (currency === 'INR' && salary < thresholds.minAnnualINR) {
            return false;
        }

        if (currency === 'USD' && salary < thresholds.minAnnualUSD) {
            return false;
        }

        return true;
    }

    /**
     * Detect if job is ambiguous (borderline case that needs AI check)
     * Ambiguous if it passes basic filters but has unclear relevance
     */
    isAmbiguous(job) {
        const title = job.job_title.toLowerCase();
        const desc = (job.job_description || '').toLowerCase();

        // Case 1: Title contains ambiguous terms
        const ambiguousTerms = [
            'engineer', // Too generic alone
            'technical',
            'operations',
            'infrastructure',
            'platform' // Could be "product platform"
        ];

        const hasOnlyGenericTitle = ambiguousTerms.some(term =>
            title.includes(term) && title.split(' ').length <= 3
        );

        // Case 2: Borderline keyword density (1-2 matches only)
        const keywordCount = this.filters.requiredKeywords.technical.filter(keyword =>
            desc.includes(keyword.toLowerCase())
        ).length;

        const borderlineKeywords = keywordCount >= 1 && keywordCount <= 2;

        // Case 3: Title matches but description seems off
        const titleMatch = this.scoreTitleMatch(job.job_title);
        const keywordDensity = this.scoreKeywordDensity(job.job_description);

        const titleGoodButDescWeak = titleMatch >= 70 && keywordDensity < 40;

        // Case 4: Mixed signals (has some good + some bad keywords)
        const hasPreferredKeywords = this.filters.preferredKeywords.some(keyword =>
            desc.includes(keyword.toLowerCase())
        );

        const hasSomeExcluded = this.filters.excludeKeywords.slice(0, 5).some(keyword =>
            desc.toLowerCase().includes(keyword.toLowerCase())
        );

        const mixedSignals = hasPreferredKeywords && hasSomeExcluded;

        return hasOnlyGenericTitle || borderlineKeywords || titleGoodButDescWeak || mixedSignals;
    }

    /**
     * Async filter with AI assistance for ambiguous cases
     * Use this instead of shouldKeepJob when you want AI help
     */
    async shouldKeepJobWithAI(job) {
        // Run basic filters first
        this.stats.total++;

        // Step 1: Title filter
        if (!this.matchesTargetRole(job.job_title)) {
            logger.debug(`Rejected (title): ${job.job_title}`);
            return { keep: false, reason: 'title_mismatch' };
        }
        this.stats.passedTitleFilter++;

        // Step 2: Keywords
        if (!this.hasRequiredKeywords(job.job_description, job.job_title)) {
            logger.debug(`Rejected (keywords): ${job.job_title}`);
            return { keep: false, reason: 'missing_keywords' };
        }
        this.stats.passedKeywordFilter++;

        // Step 3: Excludes
        if (this.hasExcludedKeywords(job.job_description, job.job_title)) {
            logger.debug(`Rejected (excluded): ${job.job_title} - ${this.getExcludeReason(job)}`);
            return { keep: false, reason: 'excluded_keywords' };
        }
        this.stats.passedExcludeFilter++;

        // Step 4: Salary
        if (job.salary_min && !this.meetsSalaryThreshold(job.salary_min, job.salary_currency)) {
            logger.debug(`Rejected (salary): ${job.job_title} - ${job.salary_min}`);
            return { keep: false, reason: 'low_salary' };
        }
        this.stats.passedSalaryFilter++;

        // Step 5: AI Check for Ambiguous Jobs (NEW!)
        if (this.useAI && this.isAmbiguous(job)) {
            this.stats.ambiguous++;
            logger.info(`🤔 Ambiguous job, asking AI: "${job.job_title}" at ${job.company}`);

            try {
                const aiResult = await aiClassifier.isJobRelevant(
                    job.job_title,
                    job.job_description,
                    job.company
                );

                if (aiResult.relevant) {
                    this.stats.aiKept++;
                    this.stats.final++;
                    logger.info(`✅ AI KEPT (${aiResult.confidence}%): ${job.job_title} - ${aiResult.reason}`);
                    return {
                        keep: true,
                        reason: 'ai_approved',
                        aiConfidence: aiResult.confidence,
                        aiReason: aiResult.reason
                    };
                } else {
                    this.stats.aiRejected++;
                    logger.info(`❌ AI REJECTED (${aiResult.confidence}%): ${job.job_title} - ${aiResult.reason}`);
                    return {
                        keep: false,
                        reason: 'ai_rejected',
                        aiConfidence: aiResult.confidence,
                        aiReason: aiResult.reason
                    };
                }
            } catch (error) {
                logger.error(`AI classification error: ${error.message}`);
                // On error, fall through to keep the job (conservative)
            }
        }

        // Not ambiguous or AI disabled - keep it
        this.stats.final++;
        return { keep: true, reason: 'passed_filters' };
    }

    /**
     * Extract keywords from job description
     */
    extractKeywords(description) {
        if (!description) return [];

        const text = description.toLowerCase();
        const keywords = [];

        // Technical keywords
        this.filters.requiredKeywords.technical.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                keywords.push(keyword);
            }
        });

        // Preferred keywords
        this.filters.preferredKeywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                keywords.push(keyword);
            }
        });

        return [...new Set(keywords)]; // Deduplicate
    }

    /**
     * Calculate pre-filter scores (before AI)
     * These are fast heuristic scores
     */
    calculatePreFilterScores(job) {
        const scores = {
            title_match_score: this.scoreTitleMatch(job.job_title),
            keyword_density_score: this.scoreKeywordDensity(job.job_description),
            salary_match_score: this.scoreSalary(job.salary_min, job.salary_currency),
            experience_match_score: this.scoreExperience(job.experience_min, job.experience_max)
        };

        // Calculate overall pre-filter score
        const weights = this.filters.scoringWeights;
        scores.overall_score = Math.round(
            scores.title_match_score * weights.titleMatch +
            scores.keyword_density_score * weights.keywordDensity +
            scores.salary_match_score * weights.salaryMatch +
            scores.experience_match_score * weights.experienceMatch
        );

        return scores;
    }

    /**
     * Score title match (0-100)
     */
    scoreTitleMatch(title) {
        if (!title) return 0;

        const titleLower = title.toLowerCase();
        let score = 0;

        // Exact role match = high score
        this.filters.targetRoles.forEach((role, index) => {
            const roleLower = role.toLowerCase();
            if (titleLower === roleLower) {
                score = 100;
            } else if (titleLower.includes(roleLower)) {
                score = Math.max(score, 85 - (index * 5)); // Prefer earlier roles
            }
        });

        return Math.min(score, 100);
    }

    /**
     * Score keyword density (0-100)
     */
    scoreKeywordDensity(description) {
        if (!description) return 0;

        const text = description.toLowerCase();
        let matchCount = 0;
        let totalKeywords = this.filters.requiredKeywords.technical.length;

        this.filters.requiredKeywords.technical.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                matchCount++;
            }
        });

        // Bonus for preferred keywords
        this.filters.preferredKeywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                matchCount += 0.5;
            }
        });

        const density = (matchCount / totalKeywords) * 100;
        return Math.min(Math.round(density), 100);
    }

    /**
     * Score salary (0-100)
     */
    scoreSalary(salary, currency = 'INR') {
        if (!salary) return 50; // Neutral if no salary info

        const thresholds = this.filters.salaryFilter;

        if (currency === 'INR') {
            if (salary < thresholds.minAnnualINR) return 0;
            if (salary >= thresholds.preferredMinINR) return 100;

            // Linear scale between min and preferred
            const range = thresholds.preferredMinINR - thresholds.minAnnualINR;
            const position = salary - thresholds.minAnnualINR;
            return Math.round((position / range) * 100);
        }

        if (currency === 'USD') {
            if (salary < thresholds.minAnnualUSD) return 0;
            if (salary >= 120000) return 100; // $120k+ = perfect

            const range = 120000 - thresholds.minAnnualUSD;
            const position = salary - thresholds.minAnnualUSD;
            return Math.round((position / range) * 100);
        }

        return 50;
    }

    /**
     * Score experience match (0-100)
     */
    scoreExperience(expMin, expMax) {
        if (!expMin && !expMax) return 70; // Neutral if not specified

        const targetExp = 1.5;
        const idealRange = this.filters.experienceLevel.idealRange;

        // If min > 4 years, it's too senior
        if (expMin && expMin > 4) return 0;

        // If max < 1 year, it's too junior
        if (expMax && expMax < 1) return 0;

        // If target (1.5) falls in range, high score
        if (expMin && expMax) {
            if (targetExp >= expMin && targetExp <= expMax) return 100;
            if (targetExp >= (expMin - 0.5) && targetExp <= (expMax + 0.5)) return 85;
        }

        // If no max specified but min is reasonable
        if (expMin && !expMax) {
            if (expMin <= 2) return 90;
            if (expMin <= 3) return 70;
        }

        return 60;
    }

    /**
     * Get filter statistics
     */
    getStats() {
        return {
            ...this.stats,
            filterRate: ((this.stats.final / this.stats.total) * 100).toFixed(1) + '%'
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            total: 0,
            passedTitleFilter: 0,
            passedKeywordFilter: 0,
            passedExcludeFilter: 0,
            passedSalaryFilter: 0,
            ambiguous: 0,
            aiKept: 0,
            aiRejected: 0,
            final: 0
        };
    }
}

module.exports = new JobFilter();
