const pool = require('../../../config/database');
const { DatabaseError } = require('../../utils/errors');
const { logger } = require('../../utils/logger');

class ScoreRepository {
    /**
     * Insert or update a job score
     * @param {Object} scoreData - Score data to insert
     * @returns {Promise<String>} Score ID
     */
    async insertScore(scoreData) {
        const query = `
      INSERT INTO job_scores (
        job_id, user_id, skill_match_score, role_stretch_score, 
        risk_reward_score, missing_skills, ai_recommendation, reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (job_id, user_id) DO UPDATE SET
        skill_match_score = EXCLUDED.skill_match_score,
        role_stretch_score = EXCLUDED.role_stretch_score,
        risk_reward_score = EXCLUDED.risk_reward_score,
        missing_skills = EXCLUDED.missing_skills,
        ai_recommendation = EXCLUDED.ai_recommendation,
        reason = EXCLUDED.reason,
        scored_at = NOW()
      RETURNING id
    `;

        const values = [
            scoreData.job_id,
            scoreData.user_id,
            scoreData.skill_match_score,
            scoreData.role_stretch_score,
            scoreData.risk_reward_score,
            JSON.stringify(scoreData.missing_skills || []),
            scoreData.ai_recommendation,
            scoreData.reason
        ];

        try {
            const result = await pool.query(query, values);
            logger.info(`Inserted score for job ${scoreData.job_id}: ${scoreData.ai_recommendation}`);
            return result.rows[0].id;
        } catch (error) {
            throw new DatabaseError('insertScore', error.message, error);
        }
    }

    /**
     * Get score for a specific job and user
     * @param {String} jobId - Job UUID
     * @param {String} userId - User UUID
     * @returns {Promise<Object>} Score object
     */
    async getScore(jobId, userId) {
        const query = `
      SELECT * FROM job_scores
      WHERE job_id = $1 AND user_id = $2
    `;

        try {
            const result = await pool.query(query, [jobId, userId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError('getScore', error.message, error);
        }
    }

    /**
     * Get all scores for a user with job details
     * @param {String} userId - User UUID
     * @param {String} recommendation - Filter by recommendation (optional)
     * @returns {Promise<Array>} Array of scores with job details
     */
    async getScoresForUser(userId, recommendation = null) {
        let query = `
      SELECT 
        js.*,
        j.job_title,
        j.company,
        j.job_link,
        j.platform,
        j.location
      FROM job_scores js
      JOIN jobs j ON js.job_id = j.id
      WHERE js.user_id = $1
    `;

        const values = [userId];

        if (recommendation) {
            query += ' AND js.ai_recommendation = $2';
            values.push(recommendation);
        }

        query += ' ORDER BY js.skill_match_score DESC, js.scored_at DESC';

        try {
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            throw new DatabaseError('getScoresForUser', error.message, error);
        }
    }

    /**
     * Get statistics for a user's scores
     * @param {String} userId - User UUID
     * @returns {Promise<Object>} Statistics object
     */
    async getUserStats(userId) {
        const query = `SELECT * FROM get_user_stats($1)`;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            throw new DatabaseError('getUserStats', error.message, error);
        }
    }
}

module.exports = new ScoreRepository();
