const BaseScraper = require('./base-scraper');

/**
 * Indeed scraper placeholder
 */
class IndeedScraper extends BaseScraper {
    constructor(config) {
        super('indeed', config);
        this.baseUrl = 'https://in.indeed.com';
    }

    async scrape(searchParams = {}) {
        this.log('Indeed scraper not yet implemented');
        return [];
    }
}

module.exports = IndeedScraper;
