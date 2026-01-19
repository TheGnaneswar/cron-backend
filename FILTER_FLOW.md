# Smart Job Filtering System - Visual Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    SCRAPER STARTS                              │
│         (LinkedIn, Naukri, Indeed, RemoteOK, etc.)             │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│              PLATFORM-SPECIFIC FILTERING                       │
│   • Search keywords: "Platform Engineer", "DevOps", etc.       │
│   • Location: India, Remote                                    │
│   • Experience: 1-4 years                                      │
│   • Salary: ₹12L+ (if platform supports)                       │
│   • Time filter: past_day or past_week                         │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Raw Jobs List │
                   │  (100-500 jobs)│
                   └────────────────┘
                            │
                            ▼
═══════════════════════════════════════════════════════════════════
                    STAGE 1: TITLE FILTER
═══════════════════════════════════════════════════════════════════
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
  ┌──────────────┐                      ┌──────────────┐
  │ MATCHES      │                      │ REJECTED     │
  │ Target Roles │                      │ Wrong Titles │
  └──────────────┘                      └──────────────┘
        │                                    Examples:
        │                                    • "Senior Staff SRE"
        │                                    • "Data Engineer"
        │                                    • "Frontend Developer"
        │                                    • "ML Platform Engineer"
        ▼
   ┌─────────────────────┐
   │ Passed: ~70-80%     │
   │ (180 jobs)          │
   └─────────────────────┘
        │
        ▼
═══════════════════════════════════════════════════════════════════
              STAGE 2: REQUIRED KEYWORDS FILTER
═══════════════════════════════════════════════════════════════════
        │
        │  Must have at least ONE technical keyword:
        │  • kubernetes, docker, aws, terraform, ci/cd, etc.
        │
        ├───────────────────┬───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────┐       ┌──────────┐
  │ Has K8s  │      │ Has AWS  │       │ REJECTED │
  │ + Docker │      │ + CI/CD  │       │ No Stack │
  └──────────┘      └──────────┘       └──────────┘
        │                   │               │
        └───────────────────┴───────────────┘
                    │
                    ▼
              ┌─────────────────────┐
              │ Passed: ~60-70%     │
              │ (120 jobs)          │
              └─────────────────────┘
                    │
                    ▼
═══════════════════════════════════════════════════════════════════
                STAGE 3: EXCLUDE FILTER
═══════════════════════════════════════════════════════════════════
        │
        │  Reject if contains ANY:
        │  • senior, staff, principal, 5+ years
        │  • wrong domains, intern, contract
        │
        ├──────────────────┬──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐     ┌──────────────┐   ┌──────────────┐
  │ CLEAN    │     │ REJECTED     │   │ REJECTED     │
  │ Good fit │     │ "Senior" role│   │ "Contract"   │
  └──────────┘     └──────────────┘   └──────────────┘
        │
        ▼
   ┌─────────────────────┐
   │ Passed: ~40-50%     │
   │ (80 jobs)           │
   └─────────────────────┘
        │
        ▼
═══════════════════════════════════════════════════════════════════
            STAGE 4: SALARY FILTER (if available)
═══════════════════════════════════════════════════════════════════
        │
        ├───────────────────┬───────────────────┬────────────────┐
        │                   │                   │                │
        ▼                   ▼                   ▼                ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐     ┌──────────┐
  │ ₹15L+    │      │ ₹12-15L  │      │ < ₹12L   │     │ No Info  │
  │ GREAT!   │      │ OK       │      │ REJECTED │     │ KEEP     │
  └──────────┘      └──────────┘      └──────────┘     └──────────┘
        │                   │                                  │
        └───────────────────┴──────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────────┐
                   │ Passed: ~20-30%     │
                   │ (50 HIGH-QUALITY)   │
                   └─────────────────────┘
                            │
                            ▼
═══════════════════════════════════════════════════════════════════
                      PRE-FILTER SCORING
═══════════════════════════════════════════════════════════════════
                            │
                    For each job, calculate:
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
 ┌────────────┐      ┌────────────┐     ┌────────────┐
 │ Title      │      │ Keyword    │     │ Salary     │
 │ Match: 85  │      │ Density: 72│     │ Match: 90  │
 └────────────┘      └────────────┘     └────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                   ┌─────────────────────┐
                   │  Overall Pre-Score  │
                   │       78/100        │
                   └─────────────────────┘
                            │
                            ▼
═══════════════════════════════════════════════════════════════════
              INSERT TO DATABASE (with pre-scores)
═══════════════════════════════════════════════════════════════════
                            │
                            ▼
                    ┌───────────────┐
                    │  jobs table   │
                    │  + keywords   │
                    │  + salary     │
                    │  + pre-scores │
                    └───────────────┘
                            │
                            ▼
═══════════════════════════════════════════════════════════════════
                        AI SCORING PHASE
                 (Only for high pre-score jobs)
═══════════════════════════════════════════════════════════════════
                            │
            Query: SELECT jobs WHERE pre_score >= 60
                            │
                            ▼
                ┌───────────────────────┐
                │ For each job:         │
                │ • Get user resume     │
                │ • Call AI (Gemini)    │
                │ • Get 3 scores        │
                └───────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
 ┌────────────┐      ┌────────────┐     ┌────────────┐
 │ Skill      │      │ Role       │     │ Risk/      │
 │ Match: 78  │      │ Stretch: 85│     │ Reward: 72 │
 └────────────┘      └────────────┘     └────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
═══════════════════════════════════════════════════════════════════
                 AUTO-APPLY DECISION MATRIX
═══════════════════════════════════════════════════════════════════
                            │
                   Check if ANY is TRUE:
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ Skill≥70│        │ Skill≥75│        │ Risk≥70 │
   │ Stretch≥65│      │         │        │         │
   └─────────┘        └─────────┘        └─────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
          ┌─────────────┐      ┌─────────────┐
          │ AUTO_APPLY  │      │ HUMAN_REVIEW│
          │ (15-20/day) │      │ (10-15/day) │
          └─────────────┘      └─────────────┘
                 │                     │
                 └──────────┬──────────┘
                            ▼
═══════════════════════════════════════════════════════════════════
                    FINAL RESULT: DATABASE
═══════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────┐
│        YOUR CURATED JOB LIST (50 quality jobs/day)               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎯 15-20 AUTO-APPLY FLAGGED                                    │
│     • Skill match ≥ 70                                          │
│     • Salary ≥ ₹12L                                             │
│     • Good role stretch                                         │
│     • Ready to apply                                            │
│                                                                  │
│  ⚠️  10-15 HUMAN REVIEW                                          │
│     • Skill match 60-70                                         │
│     • Needs your judgment                                       │
│     • Potentially great opportunities                           │
│                                                                  │
│  ❌ 15-20 SKIP                                                   │
│     • Low match                                                 │
│     • Logged for analytics                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                    QUERY YOUR RESULTS
═══════════════════════════════════════════════════════════════════

-- Get auto-apply candidates
SELECT * FROM get_pending_auto_apply_jobs();

-- Get high-paying jobs
SELECT * FROM get_high_paying_jobs(1800000);

-- Get recent jobs
SELECT * FROM get_recent_jobs(24);

-- Get statistics
SELECT * FROM get_stats();


═══════════════════════════════════════════════════════════════════
                      FILTERING STATS
═══════════════════════════════════════════════════════════════════

Start:           250 jobs scraped
After Title:     180 jobs (72%) ✅
After Keywords:  120 jobs (48%) ✅
After Excludes:   80 jobs (32%) ✅
After Salary:     50 jobs (20%) ✅ PERFECT BALANCE

Pre-Filter:       50 jobs scored
AI Scoring:       50 jobs analyzed
Auto-Apply:       15-20 flagged
Human Review:     10-15 flagged
Skip:             15-20 logged

Final Output:     30-35 ACTIONABLE JOBS/DAY 🎯


═══════════════════════════════════════════════════════════════════
                  TIME-BASED SCRAPING MODES
═══════════════════════════════════════════════════════════════════

┌─────────────────────┐              ┌─────────────────────┐
│   PAST DAY MODE     │              │  PAST WEEK MODE     │
│   (Recommended)     │              │  (Initial Setup)    │
├─────────────────────┤              ├─────────────────────┤
│ • Last 24 hours     │              │ • Last 7 days       │
│ • Run every 6 hrs   │              │ • Run once daily    │
│ • ~30-50 jobs/day   │              │ • ~200-300 jobs     │
│ • Stay current      │              │ • Catch-up mode     │
└─────────────────────┘              └─────────────────────┘
        │                                       │
        ▼                                       ▼
  Fresh jobs ASAP                     Build initial pool


Use Case:                            Use Case:
└─ Daily operation                   └─ First run
└─ High-volume platforms             └─ After system downtime
└─ Fast-moving market                └─ Weekly digest

```

**Filter Accuracy: 20-30% pass rate = OPTIMAL** ✅
- Not too strict (missing opportunities)
- Not too loose (wasting time on noise)
- Balanced precision and recall
