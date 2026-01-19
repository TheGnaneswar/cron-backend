const BaseScraper = require('./base-scraper');

class WWRScraper extends BaseScraper {
    constructor(config) {
        super('weworkremotely', config);
    }

    async scrape(searchParams = {}) {
        this.log('We Work Remotely scraper not yet implemented');
        return [];
    }
}

module.exports = WWRScraper;
