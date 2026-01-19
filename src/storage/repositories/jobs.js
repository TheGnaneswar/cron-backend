const pool = require('../../../config/database');
const { DatabaseError } = require('../../utils/errors');
const { logger } = require('../../utils/logger');

class JobRepository {
    /**
     * Insert a new job into the database
     * @param {Object} jobData - Job data to insert
     * @returns {Promise<Object>} Result with inserted flag and job ID
     */
    async insertJob(jobData) {
        const query = `
      INSERT INTO jobs (platform, job_title, company, job_link, location, job_description)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (job_link) DO NOTHING
      RETURNING id, job_link
    `;

        const values = [
            jobData.platform,
            jobData.job_title,
            jobData.company,
            jobData.job_link,
            jobData.location,
            jobData.job_description
        ];

        try {
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                logger.debug(`Job already exists: ${jobData.job_link}`);
                return { inserted: false, reason: 'duplicate', job_link: jobData.job_link };
            }

            logger.info(`Inserted new job: ${jobData.job_title} at ${jobData.company}`);
            return { inserted: true, id: result.rows[0].id, job_link: result.rows[0].job_link };
        } catch (error) {
            throw new DatabaseError('insertJob', error.message, error);
        }
    }

    /**
     * Bulk insert jobs
     * @param {Array} jobs - Array of job objects
     * @returns {Promise<Object>} Summary of insertions
     */
    async bulkInsertJobs(jobs) {
        let inserted = 0;
        let duplicates = 0;
        let errors = 0;
        const insertedIds = [];

        for (const job of jobs) {
            try {
                const result = await this.insertJob(job);
                if (result.inserted) {
                    inserted++;
                    insertedIds.push(result.id);
                } else {
                    duplicates++;
                }
            } catch (error) {
                logger.error(`Failed to insert job: ${error.message}`);
                errors++;
            }
        }

        return {
            total: jobs.length,
            inserted,
            duplicates,
            errors,
            insertedIds
        };
    }

    /**
     * Get unscored jobs for a specific user
     * @param {String} userId - User UUID
     * @param {Number} limit - Maximum number of jobs to return
     * @returns {Promise<Array>} Array of unscored jobs
     */
    async getUnscoredJobsForUser(userId, limit = 100) {
        const query = `
      SELECT j.id, j.job_title, j.company, j.job_link, j.job_description, j.platform, j.location
      FROM jobs j
      LEFT JOIN job_scores js ON j.id = js.job_id AND js.user_id = $1
      WHERE js.id IS NULL
      ORDER BY j.created_at DESC
      LIMIT $2
    `;

        try {
            const result = await pool.query(query, [userId, limit]);
            logger.info(`Found ${result.rows.length} unscored jobs for user ${userId}`);
            return result.rows;
        } catch (error) {
            throw new DatabaseError('getUnscoredJobsForUser', error.message, error);
        }
    }

    /**
     * Get job by ID
     * @param {String} jobId - Job UUID
     * @returns {Promise<Object>} Job object
     */
    async getJobById(jobId) {
        const query = 'SELECT * FROM jobs WHERE id = $1';

        try {
            const result = await pool.query(query, [jobId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError('getJobById', error.message, error);
        }
    }

    /**
     * Get jobs by platform
     * @param {String} platform - Platform name
     * @param {Number} limit - Maximum number of jobs
     * @returns {Promise<Array>} Array of jobs
     */
    async getJobsByPlatform(platform, limit = 100) {
        const query = `
      SELECT * FROM jobs
      WHERE platform = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

        try {
            const result = await pool.query(query, [platform, limit]);
            return result.rows;
        } catch (error) {
            throw new DatabaseError('getJobsByPlatform', error.message, error);
        }
    }

    /**
     * Get recent jobs (for monitoring)
     * @param {Number} hours - Number of hours to look back
     * @returns {Promise<Array>} Array of recent jobs
     */
    async getRecentJobs(hours = 24) {
        const query = `
      SELECT * FROM jobs
      WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY created_at DESC
    `;

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new DatabaseError('getRecentJobs', error.message, error);
        }
    }
}

module.exports = new JobRepository();
