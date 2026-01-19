const BaseScraper = require('./base-scraper');

class RemotiveScraper extends BaseScraper {
    constructor(config) {
        super('remotive', config);
    }

    async scrape(searchParams = {}) {
        this.log('Remotive scraper not yet implemented');
        return [];
    }
}

module.exports = RemotiveScraper;
