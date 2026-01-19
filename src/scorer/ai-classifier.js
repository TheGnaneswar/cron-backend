const { spawn } = require('child_process');
const path = require('path');
const { scorerLogger } = require('../utils/logger');

/**
 * Lightweight AI classifier for ambiguous job scraping decisions
 * Used during scraping phase, not full scoring
 */
class AIClassifier {
    constructor() {
        this.pythonScript = path.join(__dirname, 'quick-classifier.py');
        this.provider = process.env.AI_PROVIDER || 'gemini';
    }

    /**
     * Quick AI check: Is this job relevant for PE2 DevOps role?
     * Returns: { relevant: true/false, reason: string, confidence: 0-100 }
     */
    async isJobRelevant(jobTitle, jobDescription, company = '') {
        return new Promise((resolve, reject) => {
            const input = JSON.stringify({
                job_title: jobTitle,
                job_description: jobDescription.substring(0, 1500), // Limit for speed
                company: company
            });

            const args = [this.pythonScript, this.provider, input];

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
                    scorerLogger.warn(`AI classifier failed: ${stderr}`);
                    // On failure, default to KEEP (conservative)
                    resolve({
                        relevant: true,
                        reason: 'AI check failed, kept by default',
                        confidence: 50
                    });
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    scorerLogger.debug(`AI classified "${jobTitle}": ${result.relevant ? 'KEEP' : 'REJECT'} (${result.confidence}%)`);
                    resolve(result);
                } catch (error) {
                    scorerLogger.error(`Failed to parse AI classifier output: ${stdout}`);
                    // Default to keep
                    resolve({
                        relevant: true,
                        reason: 'Parse error, kept by default',
                        confidence: 50
                    });
                }
            });

            python.on('error', (error) => {
                scorerLogger.error(`AI classifier spawn error: ${error.message}`);
                // Default to keep
                resolve({
                    relevant: true,
                    reason: 'Spawn error, kept by default',
                    confidence: 50
                });
            });
        });
    }

    /**
     * Batch classify multiple jobs (more efficient)
     */
    async classifyBatch(jobs) {
        const results = [];

        // Process in batches of 5 to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < jobs.length; i += batchSize) {
            const batch = jobs.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(job =>
                    this.isJobRelevant(job.job_title, job.job_description, job.company)
                )
            );
            results.push(...batchResults);

            // Small delay between batches
            if (i + batchSize < jobs.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return results;
    }
}

module.exports = new AIClassifier();
