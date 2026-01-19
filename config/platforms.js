/**
 * Platform-specific configurations for job scrapers
 */

module.exports = {
    linkedin: {
        enabled: true,
        searchParams: {
            keywords: ['DevOps', 'PE2', 'Platform Engineer', 'SRE'],
            location: 'India',
            experienceLevel: '2', // 2-5 years
            jobType: 'F', // Full-time
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 10,
            delayBetweenRequests: 6000 // ms
        }
    },

    naukri: {
        enabled: true,
        searchParams: {
            keywords: ['DevOps Engineer', 'Platform Engineer', 'SRE'],
            location: 'Bangalore, Mumbai, Pune, Hyderabad',
            experience: '1-3',
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 15,
            delayBetweenRequests: 4000
        }
    },

    indeed: {
        enabled: true,
        searchParams: {
            keywords: ['DevOps PE2', 'Platform Engineer'],
            location: 'India',
            jobType: 'fulltime',
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 20,
            delayBetweenRequests: 3000
        }
    },

    remoteok: {
        enabled: true,
        apiUrl: 'https://remoteok.com/api',
        searchParams: {
            tags: ['devops', 'sre', 'platform'],
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 30,
            delayBetweenRequests: 2000
        }
    },

    weworkremotely: {
        enabled: true,
        baseUrl: 'https://weworkremotely.com',
        categories: ['engineering'],
        rateLimit: {
            requestsPerMinute: 20,
            delayBetweenRequests: 3000
        }
    },

    wellfound: {
        enabled: true,
        baseUrl: 'https://wellfound.com',
        searchParams: {
            role: 'platform-engineer',
            experience: ['2', '3', '4'],
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 15,
            delayBetweenRequests: 4000
        }
    },

    himalayas: {
        enabled: true,
        apiUrl: 'https://himalayas.app/jobs',
        searchParams: {
            keywords: ['devops', 'platform engineer'],
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 25,
            delayBetweenRequests: 2500
        }
    },

    remotive: {
        enabled: true,
        apiUrl: 'https://remotive.com/api/remote-jobs',
        categories: ['software-dev'],
        searchParams: {
            search: 'devops platform',
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 20,
            delayBetweenRequests: 3000
        }
    }
};
