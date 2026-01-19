const { ScraperError, ValidationError } = require('../utils/errors');
const { scraperLogger } = require('../utils/logger');

/**
 * Abstract base class for all job scrapers
 * All platform-specific scrapers must extend this class
 */
class BaseScraper {
    constructor(platformName, config = {}) {
        this.platformName = platformName;
        this.config = config;
        this.logger = scraperLogger;
    }

    /**
     * Abstract method - must be implemented by child classes
     * @param {Object} searchParams - Platform-specific search parameters
     * @returns {Promise<Array>} Array of raw job objects
     */
    async scrape(searchParams) {
        throw new Error(`scrape() must be implemented by ${this.platformName} scraper`);
    }

    /**
     * Normalize scraped data to standard format
     * @param {Object} rawData - Raw job data from platform
     * @returns {Object} Normalized job object
     */
    normalize(rawData) {
        try {
            const normalized = {
                platform: this.platformName,
                job_title: this.extractField(rawData, ['title', 'job_title', 'position', 'role']),
                company: this.extractField(rawData, ['company', 'company_name', 'employer']),
                job_link: this.extractField(rawData, ['link', 'url', 'job_link', 'apply_url']),
                location: this.extractField(rawData, ['location', 'remote', 'city', 'country']) || 'Remote',
                job_description: this.extractField(rawData, ['description', 'job_description', 'details', 'summary']) || ''
            };

            // Clean and validate
            normalized.job_link = this.cleanUrl(normalized.job_link);
            normalized.job_title = this.cleanText(normalized.job_title);
            normalized.company = this.cleanText(normalized.company);

            return normalized;
        } catch (error) {
            throw new ScraperError(this.platformName, `Normalization failed: ${error.message}`, error);
        }
    }

    /**
     * Extract field from raw data using multiple possible keys
     * @param {Object} data - Raw data object
     * @param {Array} keys - Possible field names
     * @returns {String} Extracted value
     */
    extractField(data, keys) {
        for (const key of keys) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                return String(data[key]);
            }
        }
        return '';
    }

    /**
     * Validate required fields
     * @param {Object} job - Normalized job object
     * @throws {ValidationError} If validation fails
     */
    validate(job) {
        if (!job.job_title || job.job_title.trim() === '') {
            throw new ValidationError('job_title', 'Job title is required');
        }

        if (!job.job_link || job.job_link.trim() === '') {
            throw new ValidationError('job_link', 'Job link is required');
        }

        if (!this.isValidUrl(job.job_link)) {
            throw new ValidationError('job_link', `Invalid URL: ${job.job_link}`);
        }

        return true;
    }

    /**
     * Clean and normalize text
     * @param {String} text - Raw text
     * @returns {String} Cleaned text
     */
    cleanText(text) {
        if (!text) return '';
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .substring(0, 1000); // Limit length
    }

    /**
     * Clean and normalize URL
     * @param {String} url - Raw URL
     * @returns {String} Cleaned URL
     */
    cleanUrl(url) {
        if (!url) return '';
        url = url.trim();

        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        return url;
    }

    /**
     * Validate URL format
     * @param {String} url - URL to validate
     * @returns {Boolean}
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Add delay between requests (rate limiting)
     * @param {Number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle scraping errors gracefully
     * @param {Error} error - Error object
     * @param {String} context - Error context
     */
    handleError(error, context = '') {
        const message = context ? `${context}: ${error.message}` : error.message;
        this.logger.error(`[${this.platformName}] ${message}`, { stack: error.stack });
        throw new ScraperError(this.platformName, message, error);
    }

    /**
     * Log scraping progress
     * @param {String} message - Log message
     * @param {Object} meta - Additional metadata
     */
    log(message, meta = {}) {
        this.logger.info(`[${this.platformName}] ${message}`, meta);
    }
}

module.exports = BaseScraper;
