# 🗄️ Database Schema

The Job Hunter Engine uses **PostgreSQL** via **Supabase**. This document covers the complete schema.

---

## 🚀 Initializing the Database

**Script Location**: `scripts/init-db.sql`

### Option 1: Supabase SQL Editor (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `scripts/init-db.sql`
6. Click **Run**

### Option 2: Command Line (psql)

```bash
psql -h db.[YOUR-PROJECT].supabase.co \
     -U postgres \
     -d postgres \
     -f scripts/init-db.sql
```

You'll be prompted for your database password.

---

## 📊 Tables Overview

| Table | Purpose |
|-------|---------|
| `user_config` | Your profile and resume |
| `jobs` | Scraped job listings |
| `job_scores` | AI scores for each job |
| `applications` | Application tracking |

---

## 👤 user_config Table

Stores your profile and preferences.

```sql
CREATE TABLE user_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    resume_json JSONB NOT NULL,
    target_roles TEXT[] DEFAULT ARRAY['Platform Engineer', 'Cloud Engineer'],
    min_salary_inr INTEGER DEFAULT 1200000,
    preferred_locations TEXT[] DEFAULT ARRAY['Bangalore', 'Remote'],
    scraping_mode TEXT DEFAULT 'past_day',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `email` | TEXT | Your email (unique identifier) |
| `resume_json` | JSONB | Your resume as JSON |
| `target_roles` | TEXT[] | Array of target job titles |
| `min_salary_inr` | INT | Minimum salary in INR |
| `preferred_locations` | TEXT[] | Preferred cities |

### Update Your Profile

```sql
UPDATE user_config 
SET 
    name = 'Your Name',
    resume_json = '{
        "experience_years": 1.5,
        "current_role": "DevOps Engineer",
        "skills": ["Docker", "Kubernetes", "AWS", "Terraform"],
        "projects": ["EKS deployment", "CI/CD pipelines"],
        "education": "B.Tech CS"
    }'::jsonb,
    target_roles = ARRAY['Platform Engineer', 'SRE', 'DevOps Engineer'],
    min_salary_inr = 1500000
WHERE email = 'your@email.com';
```

---

## 💼 jobs Table

Stores all scraped job listings.

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT,
    company_size TEXT,
    job_link TEXT NOT NULL UNIQUE,
    location TEXT,
    job_type TEXT,
    
    -- Salary
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'INR',
    
    -- Experience
    experience_min INTEGER,
    experience_max INTEGER,
    
    -- Details
    job_description TEXT,
    job_keywords TEXT[],
    
    -- Timestamps
    posted_date TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Quality flags
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE
);
```

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `platform` | TEXT | Source (linkedin, naukri, etc.) |
| `job_link` | TEXT | URL to apply (unique) |
| `salary_min/max` | INT | Salary range |
| `job_keywords` | TEXT[] | Extracted keywords |
| `posted_date` | TIMESTAMP | When job was posted |

### Useful Queries

```sql
-- Count jobs by platform
SELECT platform, COUNT(*) as count
FROM jobs
GROUP BY platform
ORDER BY count DESC;

-- Recent high-paying jobs
SELECT job_title, company, salary_min, location
FROM jobs
WHERE salary_min >= 1800000
ORDER BY created_at DESC
LIMIT 20;

-- Jobs from last 24 hours
SELECT job_title, company, platform, posted_date
FROM jobs
WHERE posted_date >= NOW() - INTERVAL '24 hours'
ORDER BY posted_date DESC;
```

---

## 📊 job_scores Table

Stores AI-generated scores for each job.

```sql
CREATE TABLE job_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    
    -- AI Scores
    skill_match_score INT CHECK (skill_match_score BETWEEN 0 AND 100),
    role_stretch_score INT CHECK (role_stretch_score BETWEEN 0 AND 100),
    risk_reward_score INT CHECK (risk_reward_score BETWEEN 0 AND 100),
    
    -- Pre-filter scores
    title_match_score INT,
    keyword_density_score INT,
    salary_match_score INT,
    experience_match_score INT,
    
    -- Combined
    overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
    
    -- AI Output
    missing_skills JSONB,
    ai_recommendation TEXT CHECK (ai_recommendation IN ('auto_apply', 'human_review', 'skip')),
    reason TEXT,
    
    scored_at TIMESTAMP DEFAULT NOW()
);
```

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `skill_match_score` | INT | 0-100 skill alignment |
| `role_stretch_score` | INT | 0-100 growth opportunity |
| `ai_recommendation` | TEXT | 'auto_apply', 'human_review', 'skip' |
| `missing_skills` | JSONB | Array of skill gaps |
| `reason` | TEXT | AI explanation |

### Useful Queries

```sql
-- Get best auto-apply candidates
SELECT j.job_title, j.company, j.job_link,
       js.skill_match_score, js.overall_score
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.ai_recommendation = 'auto_apply'
ORDER BY js.overall_score DESC
LIMIT 20;

-- Jobs needing review with reasons
SELECT j.job_title, j.company, 
       js.skill_match_score, js.reason
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.ai_recommendation = 'human_review'
ORDER BY js.skill_match_score DESC;

-- See what skills you're missing most
SELECT missing_skill, COUNT(*) as frequency
FROM job_scores, jsonb_array_elements_text(missing_skills) as missing_skill
WHERE ai_recommendation != 'skip'
GROUP BY missing_skill
ORDER BY frequency DESC
LIMIT 10;
```

---

## 📝 applications Table

Tracks application status.

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    
    auto_apply_enabled BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    
    callback BOOLEAN DEFAULT FALSE,
    callback_at TIMESTAMP,
    callback_type TEXT,
    
    interview_stage TEXT,
    offer_received BOOLEAN DEFAULT FALSE,
    offer_amount INTEGER,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tracking Progress

```sql
-- Mark as applied
UPDATE applications
SET applied = TRUE, applied_at = NOW()
WHERE job_id = 'your-job-uuid';

-- Got a callback!
UPDATE applications
SET callback = TRUE, callback_at = NOW(), callback_type = 'phone'
WHERE job_id = 'your-job-uuid';

-- Interview scheduled
UPDATE applications
SET interview_stage = 'technical'
WHERE job_id = 'your-job-uuid';

-- Got an offer!
UPDATE applications
SET offer_received = TRUE, offer_amount = 2000000
WHERE job_id = 'your-job-uuid';
```

---

## 📈 Built-in Functions

The init script creates useful helper functions:

### get_unscored_jobs(limit)

```sql
SELECT * FROM get_unscored_jobs(100);
```

Returns jobs that haven't been scored yet.

### get_pending_auto_apply_jobs()

```sql
SELECT * FROM get_pending_auto_apply_jobs();
```

Returns auto-apply jobs that haven't been applied to yet.

### get_stats()

```sql
SELECT * FROM get_stats();
```

Returns overall statistics:
- Total jobs
- Scored jobs
- Auto-apply count
- Applied count
- Callback count
- etc.

### get_high_paying_jobs(min_salary)

```sql
SELECT * FROM get_high_paying_jobs(1800000);  -- 18 LPA+
```

Returns high-paying jobs sorted by salary.

### get_recent_jobs(hours_ago)

```sql
SELECT * FROM get_recent_jobs(24);  -- Last 24 hours
SELECT * FROM get_recent_jobs(168); -- Last week
```

Returns jobs posted within the timeframe.

---

## 🔗 Quick Reference: Common Queries

```sql
-- Dashboard stats
SELECT * FROM get_stats();

-- Top opportunities
SELECT j.job_title, j.company, js.overall_score, j.job_link
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.ai_recommendation = 'auto_apply'
ORDER BY js.overall_score DESC
LIMIT 10;

-- Pipeline status
SELECT 
    a.interview_stage,
    COUNT(*) as count
FROM applications a
WHERE a.applied = TRUE
GROUP BY a.interview_stage;

-- Weekly summary
SELECT 
    DATE_TRUNC('day', j.created_at) as date,
    COUNT(*) as jobs_found,
    COUNT(CASE WHEN js.ai_recommendation = 'auto_apply' THEN 1 END) as auto_apply
FROM jobs j
LEFT JOIN job_scores js ON j.id = js.job_id
WHERE j.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', j.created_at)
ORDER BY date;
```

---

## 🛠️ Modify the Schema

To add new columns or tables:

1. Write your migration SQL
2. Run in Supabase SQL Editor
3. Update the repository code if needed

Example: Adding a `company_rating` column:

```sql
ALTER TABLE jobs ADD COLUMN company_rating FLOAT;
```

---

[← Back to AI Scoring](./04-ai-scoring.md) | [Next: Platform Scrapers →](./06-platform-scrapers.md)
