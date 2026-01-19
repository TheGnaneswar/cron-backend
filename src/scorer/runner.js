const { spawn } = require('child_process');
const path = require('path');
const { AIError } = require('../utils/errors');
const { scorerLogger } = require('../utils/logger');
const aiConfig = require('../../config/ai');

/**
 * Node.js wrapper for Python AI scorer
 * Calls the Python subprocess and parses JSON response
 */
class ScorerRunner {
    constructor() {
        this.provider = aiConfig.provider;
        this.pythonScript = path.join(__dirname, 'scorer.py');
    }

    /**
     * Score a single job against a resume
     * @param {Object} resumeJson - Resume in JSON format
     * @param {String} jobDescription - Job description text
     * @returns {Promise<Object>} Score result
     */
    async scoreJob(resumeJson, jobDescription) {
        return new Promise((resolve, reject) => {
            const args = [
                this.pythonScript,
                this.provider,
                JSON.stringify(resumeJson),
                jobDescription
            ];

            scorerLogger.info(`Calling Python scorer with provider: ${this.provider}`);

            const python = spawn('python', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    scorerLogger.error(`Python scorer exited with code ${code}`);
                    scorerLogger.error(`STDERR: ${stderr}`);
                    reject(new AIError(
                        this.provider,
                        `Scorer process failed with code ${code}`,
                        new Error(stderr)
                    ));
                    return;
                }

                try {
                    const result = JSON.parse(stdout);

                    if (result.error) {
                        scorerLogger.error(`AI scoring error: ${result.error}`);
                        reject(new AIError(this.provider, result.error, new Error(result.details)));
                        return;
                    }

                    scorerLogger.info(`Successfully scored job: ${result.apply_recommendation}`);
                    resolve(result);
                } catch (error) {
                    scorerLogger.error(`Failed to parse Python output: ${stdout}`);
                    reject(new AIError(
                        this.provider,
                        'Failed to parse scorer output',
                        error
                    ));
                }
            });

            python.on('error', (error) => {
                scorerLogger.error(`Failed to spawn Python process: ${error.message}`);
                reject(new AIError(this.provider, 'Failed to start Python scorer', error));
            });
        });
    }

    /**
     * Determine if job should be auto-applied based on scores
     * Uses the aggressive threshold logic
     * @param {Object} scores - Score object from AI
     * @returns {Boolean}
     */
    shouldAutoApply(scores) {
        const thresholds = aiConfig.scoring.autoApplyThresholds;

        for (const threshold of thresholds) {
            if (threshold.skill_match && threshold.role_stretch) {
                if (scores.skill_match >= threshold.skill_match &&
                    scores.role_stretch >= threshold.role_stretch) {
                    return true;
                }
            } else if (threshold.skill_match) {
                if (scores.skill_match >= threshold.skill_match) {
                    return true;
                }
            } else if (threshold.risk_reward) {
                if (scores.risk_reward >= threshold.risk_reward) {
                    return true;
                }
            }
        }

        return false;
    }
}

module.exports = new ScorerRunner();
