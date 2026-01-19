const pool = require('../../../config/database');
const { DatabaseError } = require('../../utils/errors');
const { logger } = require('../../utils/logger');

class ApplicationRepository {
    /**
     * Create an application record
     * @param {String} jobId - Job UUID
     * @param {String} userId - User UUID
     * @param {Boolean} autoApply - Whether auto-apply is enabled
     * @returns {Promise<String>} Application ID
     */
    async createApplication(jobId, userId, autoApply = false) {
        const query = `
      INSERT INTO applications (job_id, user_id, auto_apply_enabled)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_id, user_id) DO NOTHING
      RETURNING id
    `;

        try {
            const result = await pool.query(query, [jobId, userId, autoApply]);
            if (result.rows.length > 0) {
                logger.info(`Created application for job ${jobId}, auto_apply: ${autoApply}`);
                return result.rows[0].id;
            }
            return null; // Already exists
        } catch (error) {
            throw new DatabaseError('createApplication', error.message, error);
        }
    }

    /**
     * Mark an application as applied
     * @param {String} applicationId - Application UUID
     * @returns {Promise<Object>} Updated application
     */
    async markAsApplied(applicationId) {
        const query = `
      UPDATE applications 
      SET applied = TRUE, applied_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

        try {
            const result = await pool.query(query, [applicationId]);
            logger.info(`Marked application ${applicationId} as applied`);
            return result.rows[0];
        } catch (error) {
            throw new DatabaseError('markAsApplied', error.message, error);
        }
    }

    /**
     * Mark an application as having received a callback
     * @param {String} applicationId - Application UUID
     * @param {String} notes - Callback notes
     * @returns {Promise<Object>} Updated application
     */
    async markCallback(applicationId, notes = '') {
        const query = `
      UPDATE applications 
      SET callback = TRUE, callback_at = NOW(), notes = $2
      WHERE id = $1
      RETURNING *
    `;

        try {
            const result = await pool.query(query, [applicationId, notes]);
            logger.info(`Marked application ${applicationId} with callback`);
            return result.rows[0];
        } catch (error) {
            throw new DatabaseError('markCallback', error.message, error);
        }
    }

    /**
     * Get pending auto-apply jobs
     * @param {String} userId - User UUID
     * @returns {Promise<Array>} Array of pending jobs
     */
    async getPendingAutoApplyJobs(userId) {
        const query = `SELECT * FROM get_pending_auto_apply_jobs($1)`;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw new DatabaseError('getPendingAutoApplyJobs', error.message, error);
        }
    }

    /**
     * Get application by job and user
     * @param {String} jobId - Job UUID
     * @param {String} userId - User UUID
     * @returns {Promise<Object>} Application object
     */
    async getApplication(jobId, userId) {
        const query = `
      SELECT * FROM applications
      WHERE job_id = $1 AND user_id = $2
    `;

        try {
            const result = await pool.query(query, [jobId, userId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError('getApplication', error.message, error);
        }
    }

    /**
     * Get all applications for a user
     * @param {String} userId - User UUID
     * @param {Boolean} appliedOnly - Filter only applied jobs
     * @returns {Promise<Array>} Array of applications with job details
     */
    async getUserApplications(userId, appliedOnly = false) {
        let query = `
      SELECT 
        a.*,
        j.job_title,
        j.company,
        j.job_link,
        j.platform,
        js.skill_match_score,
        js.ai_recommendation
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN job_scores js ON a.job_id = js.job_id AND a.user_id = js.user_id
      WHERE a.user_id = $1
    `;

        if (appliedOnly) {
            query += ' AND a.applied = TRUE';
        }

        query += ' ORDER BY a.created_at DESC';

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw new DatabaseError('getUserApplications', error.message, error);
        }
    }
}

module.exports = new ApplicationRepository();
