# ⚙️ Configuration Guide

All configuration files are in the `config/` directory. This guide explains each one.

---

## 📁 Configuration Files Overview

| File | Purpose |
|------|---------|
| `config/search-filters.js` | Job filtering rules (roles, salary, keywords) |
| `config/ai.js` | AI provider settings and scoring thresholds |
| `config/platforms.js` | Platform-specific scraper configurations |
| `config/database.js` | PostgreSQL connection settings |
| `.env` | Environment variables and secrets |

---

## 🔐 Environment Variables (`.env`)

Copy `.env.example` to `.env` and configure:

```env
# ═══════════════════════════════════════════════════════════
# DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════════════
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=your-anon-key

# ═══════════════════════════════════════════════════════════
# AI PROVIDER (choose one: 'gemini' or 'openai')
# ═══════════════════════════════════════════════════════════
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
# OPENAI_API_KEY=your-openai-api-key  # Uncomment if using OpenAI

# ═══════════════════════════════════════════════════════════
# SCRAPING SETTINGS
# ═══════════════════════════════════════════════════════════
SCRAPING_MODE=past_day      # 'past_day' or 'past_week'
SCRAPER_CONCURRENCY=3       # Parallel scraper limit
SCRAPER_TIMEOUT_MS=30000    # 30 seconds timeout
JOBS_PER_PLATFORM=50        # Max jobs per platform

# ═══════════════════════════════════════════════════════════
# CRON SCHEDULE
# ═══════════════════════════════════════════════════════════
CRON_SCHEDULE=0 */4 * * *   # Every 4 hours
# Examples:
# 0 */6 * * *  = Every 6 hours
# 0 9,18 * * * = At 9 AM and 6 PM
# 0 * * * *    = Every hour

# ═══════════════════════════════════════════════════════════
# APPLICATION SETTINGS
# ═══════════════════════════════════════════════════════════
NODE_ENV=development
LOG_LEVEL=info              # 'debug', 'info', 'warn', 'error'

# ═══════════════════════════════════════════════════════════
# OPTIONAL: Google Sheets Sync
# ═══════════════════════════════════════════════════════════
GOOGLE_SHEETS_ENABLED=false
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_KEY=path/to/service-account.json
```

---

## 🔍 Search Filters (`config/search-filters.js`)

**Location**: `config/search-filters.js`

This is the MOST IMPORTANT file for customizing your job search. See [Search Filters Guide](./03-search-filters.md) for detailed documentation.

### Quick Reference

```javascript
module.exports = {
    // What roles to target
    targetRoles: ['Platform Engineer', 'DevOps Engineer', 'SRE'],
    
    // Experience range
    experienceLevel: { min: 1, max: 4 },
    
    // Salary minimums
    salaryFilter: {
        minAnnualINR: 1200000,  // 12 LPA
        minAnnualUSD: 70000
    },
    
    // Keywords that MUST appear
    requiredKeywords: {...},
    
    // Keywords to EXCLUDE
    excludeKeywords: ['senior', 'lead', 'manager'],
    
    // Bonus keywords
    preferredKeywords: ['startup', 'equity']
};
```

---

## 🤖 AI Configuration (`config/ai.js`)

**Location**: `config/ai.js`

### Provider Settings

```javascript
module.exports = {
    // Which AI to use
    provider: process.env.AI_PROVIDER || 'gemini',

    // Gemini settings
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash-exp',
        temperature: 0.1,
        maxTokens: 1000
    },

    // OpenAI settings (if using)
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 1000
    }
};
```

### Scoring Thresholds

```javascript
scoring: {
    // When to auto-apply (ANY condition = auto_apply)
    autoApplyThresholds: [
        { skill_match: 70, role_stretch: 65 },
        { skill_match: 75 },
        { risk_reward: 70 }
    ],
    
    // When to flag for human review
    humanReviewThreshold: { skill_match: 60 },
    
    // When to skip
    skipThreshold: { skill_match: 50, seniorRole: true }
}
```

### Candidate Profile

Update this to match YOUR profile:

```javascript
candidateProfile: {
    experience: 1.5,           // Your years of experience
    role: 'DevOps Engineer',   // Your current role
    targetLevel: 'PE2'         // What level you're targeting
}
```

---

## 🔌 Platform Configuration (`config/platforms.js`)

**Location**: `config/platforms.js`

Enable/disable platforms and configure search parameters:

```javascript
module.exports = {
    linkedin: {
        enabled: true,           // Set to false to disable
        searchParams: {
            keywords: ['DevOps', 'Platform Engineer'],
            location: 'India',
            experienceLevel: '2',
            limit: 50
        },
        rateLimit: {
            requestsPerMinute: 10,
            delayBetweenRequests: 6000  // ms
        }
    },
    
    naukri: {
        enabled: true,
        searchParams: {
            keywords: ['DevOps Engineer', 'SRE'],
            location: 'Bangalore, Hyderabad',
            experience: '1-3',
            limit: 50
        }
    },
    
    // ... more platforms
};
```

### Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| LinkedIn | ✅ Enabled | May need cookies for auth |
| Naukri | ✅ Enabled | India-focused |
| Indeed | ✅ Enabled | Global |
| RemoteOK | ✅ Enabled | API-based |
| We Work Remotely | ✅ Enabled | Remote jobs |
| Wellfound | ✅ Enabled | Startup jobs |
| Himalayas | ✅ Enabled | Remote jobs |
| Remotive | ✅ Enabled | Remote jobs |

---

## 🗄️ Database Configuration (`config/database.js`)

**Location**: `config/database.js`

Usually you don't need to edit this. Connection is handled via env vars.

```javascript
const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,                    // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});
```

---

## 📝 Quick Edit Reference

| I want to... | Edit this file | Section |
|--------------|----------------|---------|
| Change target roles | `config/search-filters.js` | `targetRoles` |
| Adjust salary minimum | `config/search-filters.js` | `salaryFilter` |
| Add exclude keywords | `config/search-filters.js` | `excludeKeywords` |
| Change AI provider | `.env` | `AI_PROVIDER` |
| Adjust scoring thresholds | `config/ai.js` | `scoring` |
| Enable/disable a platform | `config/platforms.js` | `[platform].enabled` |
| Change cron schedule | `.env` | `CRON_SCHEDULE` |

---

[← Back to Index](./README.md) | [Next: Search Filters →](./03-search-filters.md)
