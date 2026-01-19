# 📊 Building a UI for Job Hunter

This guide helps backend developers understand how to build a frontend for the Job Hunter Engine.

---

## 🎯 What You're Building

The engine collects and scores jobs. A UI would:

1. **Dashboard** — Show stats and top opportunities
2. **Job Browser** — List/filter/search jobs
3. **Review Queue** — Handle `human_review` jobs
4. **Application Tracker** — Track your applications
5. **Settings** — Configure filters and profile

---

## 🛠️ Tech Stack Suggestions

The backend is already set. For the UI:

| Option | Pros | Cons |
|--------|------|------|
| **Supabase + React** | Direct DB access, real-time | Requires Supabase SDK |
| **Next.js** | Full-stack, SSR | Heavier |
| **Plain HTML/JS** | Simple, no build step | More manual work |
| **Low-code (Retool)** | Fastest to build | Less customizable |

---

## 🔗 Connecting to the Database

### Option 1: Supabase JavaScript SDK (Recommended)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://YOUR-PROJECT.supabase.co',
    'your-anon-key'
)

// Fetch top jobs
const { data: jobs } = await supabase
    .from('jobs')
    .select(`
        *,
        job_scores (*)
    `)
    .eq('job_scores.ai_recommendation', 'auto_apply')
    .order('job_scores.overall_score', { ascending: false })
    .limit(20)
```

### Option 2: Direct PostgreSQL Connection

If building a backend API:

```javascript
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL
})

const result = await pool.query(`
    SELECT j.*, js.overall_score, js.ai_recommendation
    FROM jobs j
    JOIN job_scores js ON j.id = js.job_id
    WHERE js.ai_recommendation = 'auto_apply'
    ORDER BY js.overall_score DESC
    LIMIT 20
`)
```

### Option 3: Supabase Dashboard (Quick & Dirty)

Just use Supabase's built-in Table Editor and SQL Editor! Perfect for quick data access without building anything.

---

## 📊 Dashboard Queries

### Get Overview Stats

```sql
SELECT * FROM get_stats();
```

Returns:
```json
{
    "total_jobs": 1234,
    "total_scored": 1100,
    "auto_apply_count": 89,
    "human_review_count": 234,
    "skip_count": 777,
    "applied_count": 45,
    "callback_count": 12,
    "interview_count": 5,
    "offer_count": 1
}
```

### Jobs by Day (Chart Data)

```sql
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE id IN (
        SELECT job_id FROM job_scores WHERE ai_recommendation = 'auto_apply'
    )) as auto_apply
FROM jobs
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY date
ORDER BY date;
```

### Platform Breakdown (Pie Chart)

```sql
SELECT platform, COUNT(*) as count
FROM jobs
GROUP BY platform
ORDER BY count DESC;
```

---

## 📋 Job List Queries

### All Auto-Apply Jobs

```sql
SELECT 
    j.id,
    j.job_title,
    j.company,
    j.location,
    j.salary_min,
    j.job_link,
    js.overall_score,
    js.skill_match_score,
    js.reason,
    a.applied
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
LEFT JOIN applications a ON j.id = a.job_id
WHERE js.ai_recommendation = 'auto_apply'
ORDER BY js.overall_score DESC;
```

### Human Review Queue

```sql
SELECT 
    j.id,
    j.job_title,
    j.company,
    j.job_description,
    j.job_link,
    js.skill_match_score,
    js.missing_skills,
    js.reason
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.ai_recommendation = 'human_review'
ORDER BY js.skill_match_score DESC;
```

### Search Jobs

```sql
SELECT j.*, js.overall_score
FROM jobs j
LEFT JOIN job_scores js ON j.id = js.job_id
WHERE 
    j.job_title ILIKE '%platform%'
    OR j.company ILIKE '%google%'
ORDER BY js.overall_score DESC NULLS LAST;
```

### Filter by Salary

```sql
SELECT j.*, js.ai_recommendation
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE j.salary_min >= 1800000  -- 18 LPA+
ORDER BY j.salary_min DESC;
```

---

## ✅ Application Actions

### Mark Job as Applied

```sql
UPDATE applications
SET applied = TRUE, applied_at = NOW()
WHERE job_id = 'job-uuid-here';
```

### Record Callback

```sql
UPDATE applications
SET 
    callback = TRUE, 
    callback_at = NOW(),
    callback_type = 'phone'  -- or 'email', 'interview_scheduled'
WHERE job_id = 'job-uuid-here';
```

### Update Interview Stage

```sql
UPDATE applications
SET interview_stage = 'technical'  -- 'screening', 'technical', 'behavioral', 'final'
WHERE job_id = 'job-uuid-here';
```

### Record Offer

```sql
UPDATE applications
SET 
    offer_received = TRUE,
    offer_amount = 2500000
WHERE job_id = 'job-uuid-here';
```

### Override AI Recommendation

```sql
-- Mark a 'skip' job as worth applying
UPDATE job_scores
SET ai_recommendation = 'human_review'
WHERE job_id = 'job-uuid-here';
```

---

## 🎨 UI Components to Build

### 1. Stats Cards

Show key metrics:
- Total jobs scraped
- Auto-apply ready
- Applied this week
- Callbacks received

### 2. Job Table

Columns:
- Title + Company
- Salary range
- Score (color-coded)
- Recommendation badge
- Platform icon
- Apply button

### 3. Job Detail Modal

Show:
- Full description
- Missing skills
- AI reason
- Quick apply button
- Notes field

### 4. Filters Sidebar

- Platform checkboxes
- Salary slider
- Score range
- Recommendation filter
- Date range

### 5. Application Pipeline

Kanban-style board:
- To Apply
- Applied
- Callback
- Interviewing
- Offer

---

## 🔄 Real-time Updates (Optional)

Supabase supports real-time subscriptions:

```javascript
// Subscribe to new jobs
supabase
    .channel('jobs')
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload) => {
            console.log('New job:', payload.new)
            // Update your UI
        }
    )
    .subscribe()
```

---

## 🚀 Quick Start: Retool Dashboard

If you want a UI in 30 minutes:

1. Sign up at [retool.com](https://retool.com)
2. Connect your Supabase database
3. Create a dashboard with:
   - Stats cards (use `get_stats()`)
   - Table for jobs (join `jobs` + `job_scores`)
   - Action buttons for apply/callback

---

## 📱 API Endpoints (If Building Backend)

Suggested REST API:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard stats |
| GET | `/api/jobs` | List jobs with filters |
| GET | `/api/jobs/:id` | Single job detail |
| PATCH | `/api/jobs/:id/apply` | Mark as applied |
| PATCH | `/api/jobs/:id/callback` | Record callback |
| GET | `/api/review` | Human review queue |
| GET | `/api/pipeline` | Application pipeline |

---

## 💡 Pro Tips

1. **Start with Supabase Dashboard** — You can view/query everything without building UI
2. **Use the built-in functions** — `get_stats()`, `get_high_paying_jobs()`, etc.
3. **Real-time is optional** — Polling every minute is fine
4. **Mobile-friendly** — Most job checking happens on phone
5. **Export to CSV** — Supabase lets you export data easily

---

## 🆘 Need the Data Only?

If you just want to see your data without building a UI:

1. **Supabase Table Editor** — Point and click interface
2. **Supabase SQL Editor** — Run any query
3. **Google Sheets Sync** — Enable in config, see data in Sheets

---

[← Back to Platform Scrapers](./06-platform-scrapers.md) | [Back to Index →](./README.md)
