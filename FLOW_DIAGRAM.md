# Execution Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CRON TRIGGER                              │
│                  (Every 4 hours by default)                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR START                             │
│                  (src/orchestrator/index.js)                      │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌─────────────────┐                      ┌────────────────────┐
│  SCRAPING PHASE │                      │   SCORING PHASE    │
└─────────────────┘                      └────────────────────┘
        │                                           │
        ▼                                           ▼

═══════════════════════════════════════════════════════════════════
SCRAPING PHASE - For Each Platform
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  1. Check if platform enabled (config/platforms.js)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Initialize scraper (e.g., RemoteOKScraper)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Call scraper.scrape(searchParams)                           │
│     • Makes HTTP/API request                                    │
│     • Parses response                                           │
│     • Returns raw job array                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. For each job: normalize(rawData)                            │
│     rawData: {position, company, url, ...}                      │
│     normalized: {job_title, company, job_link, ...}             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Validate job (required: job_title, job_link)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Database INSERT                                             │
│     INSERT INTO jobs (...)                                      │
│     ON CONFLICT (job_link) DO NOTHING                           │
│     RETURNING id                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │   NEW JOB    │    │  DUPLICATE   │
            │  (inserted)  │    │  (skipped)   │
            └──────────────┘    └──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Apply rate limit delay (e.g., 2 seconds)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Log results: X new, Y duplicates, Z errors                  │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
SCORING PHASE - For Each User
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  1. Get all users from database                                 │
│     SELECT * FROM users                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. For each user: get resume                                   │
│     SELECT resume_json FROM resumes WHERE user_id = $1          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Get unscored jobs for this user                             │
│     SELECT j.* FROM jobs j                                      │
│     LEFT JOIN job_scores js ON j.id = js.job_id                 │
│     WHERE js.id IS NULL                                         │
│     LIMIT 100                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        │      FOR EACH UNSCORED JOB:              │
        │                                           │
        ▼                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Call AI Scorer                                              │
│     Node.js: scorer.scoreJob(resume_json, job_description)      │
│         ↓                                                       │
│     Spawn Python subprocess:                                    │
│         python scorer.py gemini <resume> <job_desc>             │
│         ↓                                                       │
│     Python calls Gemini/OpenAI API                              │
│         ↓                                                       │
│     Returns JSON:                                               │
│     {                                                           │
│       skill_match: 75,                                          │
│       role_stretch: 68,                                         │
│       risk_reward: 70,                                          │
│       missing_skills: ["Kubernetes"],                           │
│       apply_recommendation: "auto_apply",                       │
│       reason: "Strong match..."                                 │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Parse and validate AI response                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. INSERT into job_scores                                      │
│     INSERT INTO job_scores (                                    │
│       job_id, user_id, skill_match_score,                       │
│       role_stretch_score, risk_reward_score,                    │
│       missing_skills, ai_recommendation, reason                 │
│     ) VALUES (...)                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Determine auto_apply flag                                   │
│     Check thresholds:                                           │
│     • skill_match ≥ 70 AND role_stretch ≥ 65? → TRUE           │
│     • skill_match ≥ 75? → TRUE                                  │
│     • risk_reward ≥ 70? → TRUE                                  │
│     Otherwise → FALSE                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. INSERT into applications                                    │
│     INSERT INTO applications (                                  │
│       job_id, user_id, auto_apply_enabled                       │
│     ) VALUES ($1, $2, $3)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. Delay 1 second (AI rate limiting)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. Log: "Scored job X: auto_apply (auto: true)"               │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
CYCLE COMPLETE
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Final Summary Log:                                             │
│  ═══ CYCLE SUMMARY ═══                                          │
│  Jobs scraped: 127                                              │
│  Jobs inserted: 43                                              │
│  Jobs scored: 38                                                │
│  Errors: 2                                                      │
│  ══════════════════════                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Optional: Sync to Google Sheets                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Wait for next cron trigger (4 hours)                           │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
DATABASE STATE AFTER CYCLE
═══════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────┐
│ TABLES                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  jobs                         job_scores                         │
│  ├─ id                        ├─ id                             │
│  ├─ platform                  ├─ job_id (FK)                    │
│  ├─ job_title                 ├─ user_id (FK)                   │
│  ├─ company                   ├─ skill_match_score              │
│  ├─ job_link (UNIQUE)         ├─ role_stretch_score            │
│  ├─ location                  ├─ risk_reward_score              │
│  ├─ job_description           ├─ missing_skills                 │
│  └─ created_at                ├─ ai_recommendation              │
│                               ├─ reason                          │
│                               └─ scored_at                       │
│                                                                  │
│  applications                 users                             │
│  ├─ id                        ├─ id                             │
│  ├─ job_id (FK)               ├─ email                          │
│  ├─ user_id (FK)              └─ created_at                     │
│  ├─ auto_apply_enabled                                          │
│  ├─ applied                   resumes                           │
│  ├─ applied_at                ├─ id                             │
│  ├─ callback                  ├─ user_id (FK)                   │
│  ├─ callback_at               ├─ resume_json (JSONB)            │
│  ├─ notes                     ├─ created_at                     │
│  └─ created_at                └─ updated_at                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
EXAMPLE QUERIES
═══════════════════════════════════════════════════════════════════

-- Get auto-apply jobs ready to submit
SELECT * FROM get_pending_auto_apply_jobs('user-uuid');

-- Get user statistics
SELECT * FROM get_user_stats('user-uuid');

-- Get top 20 scored jobs
SELECT 
  j.job_title,
  j.company,
  js.skill_match_score,
  js.ai_recommendation
FROM job_scores js
JOIN jobs j ON js.job_id = j.id
WHERE js.user_id = 'user-uuid'
ORDER BY js.skill_match_score DESC
LIMIT 20;

```
