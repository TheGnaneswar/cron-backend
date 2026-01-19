# 🔌 Platform Scrapers

The engine supports multiple job platforms. This guide covers how scrapers work and how to customize them.

---

## 📁 Scraper Files

| File | Platform | Status |
|------|----------|--------|
| `src/scrapers/base-scraper.js` | Base class | Core logic |
| `src/scrapers/linkedin.js` | LinkedIn | ✅ Enabled |
| `src/scrapers/naukri.js` | Naukri | ✅ Enabled |
| `src/scrapers/indeed.js` | Indeed | ✅ Enabled |
| `src/scrapers/remoteok.js` | RemoteOK | ✅ Enabled |
| `src/scrapers/wwr.js` | We Work Remotely | ✅ Enabled |
| `src/scrapers/wellfound.js` | Wellfound (AngelList) | ✅ Enabled |
| `src/scrapers/himalayas.js` | Himalayas | ✅ Enabled |
| `src/scrapers/remotive.js` | Remotive | ✅ Enabled |

---

## ⚙️ Platform Configuration

**File**: `config/platforms.js`

### Enable/Disable Platforms

```javascript
module.exports = {
    linkedin: {
        enabled: true,  // Set to false to disable
        // ...
    },
    naukri: {
        enabled: false,  // Disabled
        // ...
    }
};
```

### Configure Search Parameters

Each platform has customizable search params:

```javascript
linkedin: {
    enabled: true,
    searchParams: {
        keywords: ['DevOps', 'Platform Engineer', 'SRE'],
        location: 'India',
        experienceLevel: '2',  // LinkedIn's level code
        jobType: 'F',          // F = Full-time
        limit: 50              // Max jobs to fetch
    },
    rateLimit: {
        requestsPerMinute: 10,
        delayBetweenRequests: 6000  // 6 seconds
    }
}
```

---

## 🏗️ Platform Details

### LinkedIn

```javascript
linkedin: {
    searchParams: {
        keywords: ['DevOps', 'Platform Engineer'],
        location: 'India',
        experienceLevel: '2',  // Options: 1=Entry, 2=Associate, 3=Mid-Senior, 4=Director
        jobType: 'F',          // F=Full-time, P=Part-time, C=Contract
        limit: 50
    }
}
```

> ⚠️ **Note**: LinkedIn may require authentication cookies for full scraping.

### Naukri

```javascript
naukri: {
    searchParams: {
        keywords: ['DevOps Engineer', 'Platform Engineer', 'SRE'],
        location: 'Bangalore, Mumbai, Pune, Hyderabad',
        experience: '1-3',  // Format: min-max years
        limit: 50
    }
}
```

### Indeed

```javascript
indeed: {
    searchParams: {
        keywords: ['DevOps PE2', 'Platform Engineer'],
        location: 'India',
        jobType: 'fulltime',
        limit: 50
    }
}
```

### RemoteOK (API-Based)

```javascript
remoteok: {
    apiUrl: 'https://remoteok.com/api',
    searchParams: {
        tags: ['devops', 'sre', 'platform'],
        limit: 50
    }
}
```

### We Work Remotely

```javascript
weworkremotely: {
    baseUrl: 'https://weworkremotely.com',
    categories: ['engineering']
}
```

### Wellfound (AngelList)

```javascript
wellfound: {
    baseUrl: 'https://wellfound.com',
    searchParams: {
        role: 'platform-engineer',
        experience: ['2', '3', '4'],
        limit: 50
    }
}
```

### Himalayas

```javascript
himalayas: {
    apiUrl: 'https://himalayas.app/jobs',
    searchParams: {
        keywords: ['devops', 'platform engineer'],
        limit: 50
    }
}
```

### Remotive

```javascript
remotive: {
    apiUrl: 'https://remotive.com/api/remote-jobs',
    categories: ['software-dev'],
    searchParams: {
        search: 'devops platform',
        limit: 50
    }
}
```

---

## 🔧 Customizing a Scraper

### Modify Search Keywords

Edit `config/platforms.js`:

```javascript
linkedin: {
    searchParams: {
        keywords: [
            'Cloud Engineer',
            'AWS Engineer',
            'Infrastructure Engineer',
            'Kubernetes Engineer'
        ],
        // ...
    }
}
```

### Change Rate Limits

```javascript
linkedin: {
    rateLimit: {
        requestsPerMinute: 5,       // Slower
        delayBetweenRequests: 12000 // 12 seconds between requests
    }
}
```

### Add New Locations (Naukri)

```javascript
naukri: {
    searchParams: {
        location: 'Bangalore, Hyderabad, Pune, Chennai, Delhi NCR, Remote'
    }
}
```

---

## ➕ Adding a New Scraper

### Step 1: Create the Scraper File

Create `src/scrapers/new-platform.js`:

```javascript
const BaseScraper = require('./base-scraper');

class NewPlatformScraper extends BaseScraper {
    constructor(config) {
        super('newplatform', config);
    }

    async scrape(params) {
        const jobs = [];
        
        try {
            // Your scraping logic here
            // Use this.httpClient for requests
            
            const response = await this.httpClient.get(
                `${this.config.baseUrl}/api/jobs`,
                { params }
            );
            
            for (const item of response.data.jobs) {
                jobs.push(this.normalizeJob({
                    platform: 'newplatform',
                    job_title: item.title,
                    company: item.company_name,
                    job_link: item.url,
                    location: item.location,
                    job_description: item.description,
                    salary_min: item.salary?.min,
                    salary_max: item.salary?.max,
                    posted_date: new Date(item.posted_at)
                }));
            }
            
        } catch (error) {
            this.logger.error(`Scraping failed: ${error.message}`);
        }
        
        return jobs;
    }
}

module.exports = NewPlatformScraper;
```

### Step 2: Add Configuration

In `config/platforms.js`:

```javascript
newplatform: {
    enabled: true,
    baseUrl: 'https://newplatform.com',
    searchParams: {
        keywords: ['devops'],
        limit: 50
    },
    rateLimit: {
        requestsPerMinute: 20,
        delayBetweenRequests: 3000
    }
}
```

### Step 3: Register in Orchestrator

In `src/orchestrator/index.js`:

```javascript
// Add import
const NewPlatformScraper = require('../scrapers/new-platform');

// Add to initializeScrapers()
initializeScrapers() {
    return {
        // ... existing scrapers
        newplatform: new NewPlatformScraper(platformConfig.newplatform)
    };
}
```

---

## 🐛 Debugging Scrapers

### Check Scraper Logs

```bash
tail -f logs/scraper.log
```

### Test Individual Scraper

```javascript
// Create a test file: test-scraper.js
const LinkedInScraper = require('./src/scrapers/linkedin');
const config = require('./config/platforms');

const scraper = new LinkedInScraper(config.linkedin);

scraper.scrape(config.linkedin.searchParams)
    .then(jobs => console.log(`Found ${jobs.length} jobs`))
    .catch(err => console.error(err));
```

Run:
```bash
node test-scraper.js
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Site may block scrapers; add delay |
| No jobs returned | Check if API changed; update selectors |
| Rate limited | Increase `delayBetweenRequests` |
| SSL errors | May need to update SSL config |

---

## 📊 Scraper Output Format

All scrapers must return jobs in this format:

```javascript
{
    platform: 'linkedin',           // Required
    job_title: 'Platform Engineer', // Required
    company: 'Tech Corp',           // Optional
    job_link: 'https://...',        // Required, unique
    location: 'Bangalore, India',   // Optional
    job_type: 'full-time',          // Optional
    salary_min: 1500000,            // Optional (INR)
    salary_max: 2500000,            // Optional
    salary_currency: 'INR',         // Optional
    experience_min: 2,              // Optional (years)
    experience_max: 4,              // Optional
    job_description: '...',         // Optional but recommended
    job_keywords: ['k8s', 'aws'],   // Optional
    posted_date: new Date(),        // Optional
    company_size: 'startup'         // Optional
}
```

---

[← Back to Database Schema](./05-database-schema.md) | [Next: Building a UI →](./07-building-ui.md)
