const BaseScraper = require('./base-scraper');
const axios = require('axios');

class RemoteOKScraper extends BaseScraper {
    constructor(config) {
        super('remoteok', config);
        this.apiUrl = config.apiUrl || 'https://remoteok.com/api';
    }

    async scrape(searchParams = {}) {
        this.log('Starting RemoteOK scrape');

        try {
            const response = await axios.get(this.apiUrl, {
                headers: { 'User-Agent': 'JobHunterEngine/1.0' },
                timeout: 30000
            });

            const jobs = response.data.slice(1);
            this.log(`Fetched ${jobs.length} raw jobs from RemoteOK`);

            let filtered = jobs;
            if (searchParams.tags && Array.isArray(searchParams.tags)) {
                filtered = jobs.filter(job => {
                    const jobTags = (job.tags || []).map(t => t.toLowerCase());
                    return searchParams.tags.some(tag => jobTags.includes(tag.toLowerCase()));
                });
            }

            const limit = searchParams.limit || 50;
            filtered = filtered.slice(0, limit);

            const normalized = [];
            for (const rawJob of filtered) {
                try {
                    const job = this.normalize(rawJob);
                    this.validate(job);
                    normalized.push(job);
                } catch (error) {
                    this.logger.warn(`Skipping invalid job: ${error.message}`);
                }
            }

            this.log(`Successfully scraped ${normalized.length} jobs from RemoteOK`);
            return normalized;
        } catch (error) {
            this.handleError(error, 'RemoteOK API request failed');
        }
    }

    normalize(rawData) {
        return {
            platform: this.platformName,
            job_title: rawData.position || rawData.title || '',
            company: rawData.company || '',
            job_link: rawData.url ? `https://remoteok.com${rawData.url}` : '',
            location: rawData.location || 'Remote',
            job_description: rawData.description || ''
        };
    }
}

module.exports = RemoteOKScraper;
