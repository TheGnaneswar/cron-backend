const { google } = require('googleapis');
const { logger } = require('../utils/logger');
const path = require('path');

/**
 * Google Sheets sync module (optional reporting mirror)
 */
class SheetsSync {
    constructor() {
        this.enabled = process.env.GOOGLE_SHEETS_ENABLED === 'true';
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        this.serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (this.enabled) {
            this.initializeClient();
        }
    }

    async initializeClient() {
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: this.serviceAccountPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            logger.info('Google Sheets client initialized');
        } catch (error) {
            logger.error(`Failed to initialize Google Sheets: ${error.message}`);
            this.enabled = false;
        }
    }

    async syncJobs(jobs) {
        if (!this.enabled) {
            return;
        }

        try {
            const values = [
                ['Job Title', 'Company', 'Platform', 'Location', 'Job Link', 'Date Added']
            ];

            for (const job of jobs) {
                values.push([
                    job.job_title,
                    job.company,
                    job.platform,
                    job.location,
                    job.job_link,
                    new Date(job.created_at).toISOString()
                ]);
            }

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'Jobs!A1',
                valueInputOption: 'RAW',
                resource: { values }
            });

            logger.info(`Synced ${jobs.length} jobs to Google Sheets`);
        } catch (error) {
            logger.error(`Failed to sync jobs to Sheets: ${error.message}`);
        }
    }

    async syncScores(scores) {
        if (!this.enabled) {
            return;
        }

        try {
            const values = [
                ['Job Title', 'Company', 'Skill Match', 'Role Stretch', 'Risk/Reward', 'Recommendation', 'Date Scored']
            ];

            for (const score of scores) {
                values.push([
                    score.job_title,
                    score.company,
                    score.skill_match_score,
                    score.role_stretch_score,
                    score.risk_reward_score,
                    score.ai_recommendation,
                    new Date(score.scored_at).toISOString()
                ]);
            }

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'Scores!A1',
                valueInputOption: 'RAW',
                resource: { values }
            });

            logger.info(`Synced ${scores.length} scores to Google Sheets`);
        } catch (error) {
            logger.error(`Failed to sync scores to Sheets: ${error.message}`);
        }
    }
}

module.exports = new SheetsSync();
