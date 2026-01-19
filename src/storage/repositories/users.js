const pool = require('../../../config/database');
const { DatabaseError } = require('../../utils/errors');
const { logger } = require('../../utils/logger');

class UserRepository {
    /**
     * Get or create a user by email
     * @param {String} email - User email
     * @returns {Promise<Object>} User object
     */
    async getOrCreateUser(email) {
        const query = `
      INSERT INTO users (email)
      VALUES ($1)
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING *
    `;

        try {
            const result = await pool.query(query, [email]);
            logger.info(`Got/created user: ${email}`);
            return result.rows[0];
        } catch (error) {
            throw new DatabaseError('getOrCreateUser', error.message, error);
        }
    }

    /**
     * Get user by ID
     * @param {String} userId - User UUID
     * @returns {Promise<Object>} User object
     */
    async getUserById(userId) {
        const query = 'SELECT * FROM users WHERE id = $1';

        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError('getUserById', error.message, error);
        }
    }

    /**
     * Get all users
     * @returns {Promise<Array>} Array of users
     */
    async getAllUsers() {
        const query = 'SELECT * FROM users ORDER BY created_at DESC';

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new DatabaseError('getAllUsers', error.message, error);
        }
    }

    /**
     * Get or update user resume
     * @param {String} userId - User UUID
     * @param {Object} resumeJson - Resume in JSON format (optional)
     * @returns {Promise<Object>} Resume object
     */
    async getOrUpdateResume(userId, resumeJson = null) {
        if (resumeJson) {
            // Update/insert resume
            const query = `
        INSERT INTO resumes (user_id, resume_json)
        VALUES ($1, $2)
        ON CONFLICT (user_id) 
        DO UPDATE SET resume_json = EXCLUDED.resume_json, updated_at = NOW()
        RETURNING *
      `;

            try {
                const result = await pool.query(query, [userId, JSON.stringify(resumeJson)]);
                logger.info(`Updated resume for user ${userId}`);
                return result.rows[0];
            } catch (error) {
                throw new DatabaseError('updateResume', error.message, error);
            }
        } else {
            // Get resume
            const query = `
        SELECT * FROM resumes
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

            try {
                const result = await pool.query(query, [userId]);
                return result.rows[0] || null;
            } catch (error) {
                throw new DatabaseError('getResume', error.message, error);
            }
        }
    }
}

module.exports = new UserRepository();
