require('dotenv').config();

/**
 * AI Provider Configuration
 */

module.exports = {
    provider: process.env.AI_PROVIDER || 'gemini', // 'gemini' or 'openai'

    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash-exp',
        temperature: 0.1, // Low temperature for consistent scoring
        maxTokens: 1000
    },

    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 1000
    },

    // Scoring thresholds for aggressive bias
    scoring: {
        autoApplyThresholds: [
            // ANY of these conditions = auto_apply
            { skill_match: 70, role_stretch: 65 },
            { skill_match: 75 },
            { risk_reward: 70 }
        ],
        humanReviewThreshold: {
            skill_match: 60
        },
        skipThreshold: {
            skill_match: 50,
            seniorRole: true
        }
    },

    // Candidate profile (used in prompts)
    candidateProfile: {
        experience: 1.5,
        role: 'DevOps / Platform Engineering',
        targetLevel: 'PE2 / Mid-level'
    }
};
