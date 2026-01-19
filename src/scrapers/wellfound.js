const BaseScraper = require('./base-scraper');

class WellfoundScraper extends BaseScraper {
    constructor(config) {
        super('wellfound', config);
    }

    async scrape(searchParams = {}) {
        this.log('Wellfound scraper not yet implemented');
        return [];
    }
}

module.exports = WellfoundScraper;
