# Job Hunter Engine - Technical Documentation

## Overview

This is a **cron-based backend engine** designed for aggressive job hunting. It scrapes job listings from multiple platforms, scores them using AI (Gemini or OpenAI), and stores results in PostgreSQL (Supabase).

**Key Principe: BIAS TOWARD ACTION**
- Target: PE2 roles with 1.5 years experience
- Strategy: Volume + AI-assisted aggressive filtering
- Goal: Maximize callbacks, not perfect matches

---

## Architecture

```
┌─────────────────────────────────────────┐
│         ORCHESTRATOR (Node.js)          │
│           (Cron-scheduled)              │
└─────────────────────────────────────────┘
           │                  │                  
           ▼                  ▼                  
┌──────────────────┐  ┌──────────────────┐
│   SCRAPERS       │  │   AI SCORER      │
│   (Node.js)      │  │   (Python)       │
│                  │  │                  │
│ • LinkedIn*      │  │ • Gemini API     │
│ • Naukri*        │  │ • OpenAI API     │
│ • Indeed*        │  │                  │
│ • RemoteOK ✓     │  │ Multi-score:     │
│ • WWR*           │  │ - Skill Match    │
│ • Wellfound*     │  │ - Role Stretch   │
│ • Himalayas*     │  │ - Risk/Reward    │
│ • Remotive*      │  │                  │
└──────────────────┘  └──────────────────┘
           │                  │
           ▼                  ▼
    ┌────────────────────────────┐
    │   PostgreSQL (Supabase)    │
    │   • jobs                   │
    │   • job_scores             │
    │   • applications           │
    │   • users & resumes        │
    └────────────────────────────┘

* = Placeholder (requires auth/implementation)
✓ = Fully implemented
```

---

## Database Schema

### Tables

**users**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `created_at` (TIMESTAMP)

**resumes**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `resume_json` (JSONB) - Structured resume data
- `created_at`, `updated_at` (TIMESTAMP)

**jobs**
- `id` (UUID, PK)
- `platform` (TEXT) - linkedin, naukri, indeed, etc.
- `job_title` (TEXT)
- `company` (TEXT)
- `job_link` (TEXT, UNIQUE) - Deduplication key
- `location` (TEXT)
- `job_description` (TEXT)
- `created_at`, `scraped_at` (TIMESTAMP)

**job_scores**
- `id` (UUID, PK)
- `job_id` (UUID, FK → jobs)
- `user_id` (UUID, FK → users)
- `skill_match_score` (INT 0-100)
- `role_stretch_score` (INT 0-100)
- `risk_reward_score` (INT 0-100)
- `missing_skills` (JSONB)
- `ai_recommendation` (TEXT) - 'auto_apply', 'human_review', 'skip'
- `reason` (TEXT)
- `scored_at` (TIMESTAMP)
- UNIQUE(job_id, user_id)

**applications**
- `id` (UUID, PK)
- `job_id` (UUID, FK → jobs)
- `user_id` (UUID, FK → users)
- `auto_apply_enabled` (BOOLEAN) - Flag for automation
- `applied` (BOOLEAN)
- `applied_at` (TIMESTAMP)
- `callback` (BOOLEAN)
- `callback_at` (TIMESTAMP)
- `notes` (TEXT)
- UNIQUE(job_id, user_id)

---

## Execution Flow

### 1. Cron Trigger
- Default: Every 4 hours (`0 */4 * * *`)
- Configurable via `CRON_SCHEDULE` env var

### 2. Scraping Phase
For each enabled platform:
1. Initialize scraper with platform config
2. Call `scraper.scrape(searchParams)`
3. Normalize raw data to standard format
4. Validate required fields
5. Bulk insert into `jobs` table
   - Uses `ON CONFLICT (job_link) DO NOTHING` for deduplication
6. Log results (new vs duplicates)
7. Apply rate limiting delay

### 3. Scoring Phase
For each user:
1. Fetch user's resume from `resumes` table
2. Query unscored jobs:
   ```sql
   SELECT j.* FROM jobs j
   LEFT JOIN job_scores js ON j.id = js.job_id AND js.user_id = $1
   WHERE js.id IS NULL
   ```
3. For each unscored job:
   - Call Python AI scorer via subprocess
   - Pass resume_json + job_description
   - Receive 3 scores + recommendation
4. Insert into `job_scores`
5. Create entry in `applications` with auto_apply flag
6. Delay 1s between AI calls (rate limiting)

### 4. Auto-Apply Decision
Job is marked `auto_apply_enabled=TRUE` if ANY of:
- `skill_match ≥ 70 AND role_stretch ≥ 65`
- `skill_match ≥ 75`
- `risk_reward ≥ 70`

---

## AI Scoring Logic

### System Prompt
```
You are a job-application decision engine.
Bias toward giving chances to slightly underqualified candidates.
Your goal is maximizing interview callbacks, not perfect matches.
```

### Input
- Candidate experience: 1.5 years (DevOps)
- Target: PE2 / Mid-level
- Resume JSON (structured profile)
- Job description (full text)

### Output (JSON)
```json
{
  "skill_match": 75,
  "role_stretch": 68,
  "risk_reward": 70,
  "missing_skills": ["Kubernetes", "Terraform"],
  "apply_recommendation": "auto_apply",
  "reason": "Strong DevOps match, slight Kubernetes gap acceptable"
}
```

### Scoring Criteria

**Skill Match (0-100)**
- Ignores years of experience
- Focuses on tools, stack, responsibilities
- Higher = better technical alignment

**Role Stretch (0-100)**
- 100 = perfect stretch (slightly underqualified but capable)
- Penalizes only if clearly senior (Staff/Principal)
- Higher = better growth opportunity

**Risk-to-Reward (0-100)**
- Higher = generic role, urgent hiring, high volume
- Lower = niche, leadership-heavy
- Higher = more likely to get callback

---

## Configuration

### Environment Variables

Required:
```bash
SUPABASE_DB_URL=postgresql://...
AI_PROVIDER=gemini  # or 'openai'
GEMINI_API_KEY=...  # if using Gemini
DEFAULT_USER_EMAIL=your@email.com
```

Optional:
```bash
OPENAI_API_KEY=...  # if using OpenAI
CRON_SCHEDULE="0 */4 * * *"
GOOGLE_SHEETS_ENABLED=false
LOG_LEVEL=info
```

### Platform Configuration

Edit `config/platforms.js` to:
- Enable/disable platforms
- Configure search parameters
- Set rate limits

Example:
```javascript
remoteok: {
  enabled: true,
  searchParams: {
    tags: ['devops', 'sre'],
    limit: 50
  },
  rateLimit: {
    delayBetweenRequests: 2000
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies

**Node.js**:
```bash
cd engine
npm install
```

**Python**:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Initialize Database
```bash
# SSH into Supabase or run locally
psql -h <host> -U postgres -d postgres -f scripts/init-db.sql
```

### 4. Add User & Resume

```sql
INSERT INTO users (email) VALUES ('your@email.com');

INSERT INTO resumes (user_id, resume_json)
SELECT id, '{
  "experience_years": 1.5,
  "skills": ["Docker", "Kubernetes", "AWS", "GitLab CI", "Python", "Node.js"],
  "roles": ["DevOps Engineer", "Backend Developer"],
  "projects": ["Microservices deployment", "CI/CD pipelines"]
}'::jsonb
FROM users WHERE email = 'your@email.com';
```

### 5. Run Engine
```bash
npm start
```

---

## Error Handling

### Scraper Failures
- Each platform scraper fails independently
- Errors logged but don't stop other platforms
- Stats tracked: `{ inserted, duplicates, errors }`

### AI Scorer Failures
- Individual job scoring failures are logged
- Skips to next job (doesn't crash cycle)
- Returns error JSON with details

### Database Failures
- Connection pool auto-retries
- Unique constraint violations handled gracefully
- Foreign key constraints ensure data integrity

---

## Monitoring & Logs

Logs are written to `logs/`:
- `app.log` - General application logs
- `scraper.log` - Scraper-specific logs
- `scorer.log` - AI scoring logs
- `errors.log` - Error tracking

Each cycle logs:
```
=== CYCLE SUMMARY ===
Jobs scraped: 150
Jobs inserted: 42
Jobs scored: 38
Errors: 3
====================
```

---

## Querying Results

### Get auto-apply jobs pending application
```sql
SELECT * FROM get_pending_auto_apply_jobs('user-uuid');
```

### Get user statistics
```sql
SELECT * FROM get_user_stats('user-uuid');
```

### Get top-scoring jobs
```sql
SELECT j.job_title, j.company, js.skill_match_score, js.ai_recommendation
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.user_id = 'user-uuid'
  AND js.ai_recommendation IN ('auto_apply', 'human_review')
ORDER BY js.skill_match_score DESC
LIMIT 50;
```

---

## Next Steps (To Implement)

### High Priority
1. **LinkedIn Scraper** - Playwright + saved session
2. **Naukri Scraper** - Email-based apply
3. **Indeed Scraper** - External redirect handling

### Medium Priority
4. **Auto-apply module** - Actual application submission
5. **Callback tracking** - Mark when recruiter responds
6. **Resume customization** - Generate tailored resumes per job

### Low Priority
7. **Google Sheets sync** - Real-time reporting mirror
8. **Slack/Email notifications** - Alert on high-scoring jobs
9. **Dashboard** - Simple web UI for monitoring

---

## Security Notes

- **Never commit** `.env` or `*.json` service accounts
- Store Supabase credentials in env vars only
- API keys should be read-only where possible
- Use Supabase Row Level Security (RLS) in production

---

## Performance Considerations

- Scrapers run sequentially (not parallel) to respect rate limits
- AI scoring has 1s delay between jobs
- Database uses connection pooling (max 20)
- Cron runs every 4 hours by default (customize as needed)

**Expected throughput**:
- 200-300 jobs/day scraped
- ~80-120 new jobs/day scored
- 20-40 auto-apply candidates/day

---

## Troubleshooting

**"Python not found"**
- Ensure Python 3 is in PATH
- Try `python3` instead of `python` (edit `src/scorer/runner.js`)

**"Database connection failed"**
- Check `SUPABASE_DB_URL` format
- Verify Supabase project is running
- Check firewall/network access

**"AI scoring returns error"**
- Verify API key is set correctly
- Check API quota/billing
- Review `logs/scorer.log` for details

**"No jobs scraped"**
- Most platforms need authentication (LinkedIn, Naukri, Indeed)
- Start with RemoteOK which works out-of-the-box
- Check platform config `enabled: true`

---

## Contributing

When adding a new scraper:
1. Extend `BaseScraper` class
2. Implement `scrape(searchParams)` method
3. Override `normalize(rawData)` if needed
4. Add config to `config/platforms.js`
5. Register in `orchestrator/index.js`

---

## License
MIT
