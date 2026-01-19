const BaseScraper = require('./base-scraper');

class HimalayasScraper extends BaseScraper {
    constructor(config) {
        super('himalayas', config);
    }

    async scrape(searchParams = {}) {
        this.log('Himalayas scraper not yet implemented');
        return [];
    }
}

module.exports = HimalayasScraper;
