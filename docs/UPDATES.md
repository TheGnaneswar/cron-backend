# ✅ System Updates: Single-User, Role-Focused Job Hunter

## What Changed

I've refactored the engine based on your requirements:

---

## 🎯 Key Updates

### 1. **Single-User Focus** ✅
- ❌ Removed: Multi-user complexity
- ✅ Added: `user_config` table with resume
- ✅ Simplified: All repos now single-user
- ✅ Faster: No user loops, direct queries

**What this means:**
- Simpler setup (one resume, one config)
- Faster execution (no per-user loops)
- Easier to maintain

---

### 2. **Role-Based Filtering** ✅
- ✅ Target roles: Platform Engineering, Cloud Engineer, DevOps, SRE
- ✅ Configurable: Easy to add/remove roles
- ✅ Smart matching: Title + keyword-based

**What this means:**
- Only scrapes relevant jobs
- No data scientist, frontend, senior architect noise
- Focused on your exact career path

**Configure in:**
```javascript
// config/search-filters.js
targetRoles: [
  'Platform Engineer',
  'Cloud Engineer',
  'DevOps Engineer',
  'SRE'
]
```

---

### 3. **High-Paid Jobs Filter** ✅
- ✅ Minimum: ₹12 LPA (adjustable)
- ✅ Preferred: ₹18 LPA+
- ✅ USD support: $70k+ for remote/international

**What this means:**
- No low-ball offers
- Focus on quality employers
- Salary-conscious from day 1

**Configure in:**
```bash
# .env
MIN_SALARY_INR=1200000  # 12 LPA
```

---

### 4. **Time-Based Scraping Toggle** ✅
- ✅ **Past Day Mode**: Jobs from last 24 hours (default)
- ✅ **Past Week Mode**: Jobs from last 7 days

**What this means:**
- Fresh jobs daily (past_day mode)
- Or catch-up mode (past_week for initial run)
- No redundant searches every day

**Toggle:**
```bash
# .env
SCRAPING_MODE=past_day   # or 'past_week'
```

**Recommended usage:**
1. **First run**: Use `past_week` to build initial job pool
2. **Daily runs**: Switch to `past_day` to stay current

---

### 5. **Smart Multi-Stage Filtering** ✅
Jobs filtered through **4 stages**:

#### Stage 1: Title Match
- ✅ Keeps: Platform Engineer, Cloud Engineer, DevOps
- ❌ Rejects: Senior Staff, Data roles, Frontend

#### Stage 2: Technical Keywords
- ✅ Requires: kubernetes, docker, aws, terraform, ci/cd
- ❌ Rejects: No tech stack mentioned

#### Stage 3: Exclude Filter
- ✅ Rejects: Senior, Principal, 5+ years, wrong domains

#### Stage 4: Salary Filter
- ✅ Keeps: ₹12L+ (if salary available)
- ❌ Rejects: Below threshold

**Result:**
- Balanced filtering (~20-30% pass rate)
- Not too broad (no noise)
- Not too narrow (no missed opportunities)

---

## 📁 New Files Created

### 1. `config/search-filters.js`
**The control center** for all filtering logic:
- Target roles
- Salary thresholds
- Required/excluded keywords
- Scraping mode

**When to edit:** When you want to change what jobs get scraped

---

### 2. `src/utils/job-filter.js`
**The filtering engine**:
- Multi-stage filtering
- Pre-scoring (before AI)
- Keyword extraction
- Statistics tracking

**When to edit:** Rarely (unless changing filter logic itself)

---

### 3. `CONFIG_GUIDE.md`
**Complete configuration manual**:
- How to adjust filters
- Examples for different goals
- Troubleshooting filter stats

**When to read:** Before making changes to filters

---

### 4. Updated `scripts/init-db.sql`
**New schema for single-user:**
- `user_config` table (your resume + settings)
- Enhanced `jobs` table (salary, keywords, posted_date)
- Better `job_scores` table (pre-filter scores)
- Helper functions for queries

**When to use:** Run once during setup

---

## 🗂️ Database Changes

### Old Schema (Multi-User)
```
users → resumes → job_scores → applications
```

### New Schema (Single-User)
```
user_config (all-in-one)
    ↓
jobs (enhanced with salary, keywords)
    ↓
job_scores (pre-filter + AI scores)
    ↓
applications (tracking)
```

---

## 🎮 How to Use

### Initial Setup

1. **Run new database schema:**
```sql
-- In Supabase SQL Editor
-- Run contents of scripts/init-db.sql
```

2. **Configure your settings:**
```bash
# .env
SCRAPING_MODE=past_week  # For first run
MIN_SALARY_INR=1200000
TARGET_ROLES=Platform Engineer,Cloud Engineer,DevOps Engineer
```

3. **Add your details to database:**
```sql
-- Already in init-db.sql, just update:
UPDATE user_config 
SET email = 'your@email.com',
    name = 'Your Name',
    resume_json = '{ your resume }'::jsonb
WHERE id = (SELECT id FROM user_config LIMIT 1);
```

---

### Daily Operation

**Mode 1: Aggressive (Catch-Up)**
```bash
# .env
SCRAPING_MODE=past_week
CRON_SCHEDULE="0 0 * * *"  # Once daily

npm start
```
**Result:** ~100-200 jobs/day on first run

---

**Mode 2: Steady (Recommended)**
```bash
# .env
SCRAPING_MODE=past_day
CRON_SCHEDULE="0 */6 * * *"  # Every 6 hours

npm start
```
**Result:** ~30-50 fresh jobs/day

---

## 📊 Filter Performance

After running, you'll see stats like:

```
=== FILTER STATISTICS ===
Total jobs scraped: 250
Passed title filter: 180 (72%)
Passed keyword filter: 120 (48%)
Passed exclude filter: 80 (32%)
Passed salary filter: 50 (20%)
Final kept: 50 (20%)
========================
```

### Good Filter Rate: **20-30%**
- Means filters are working correctly
- Not too strict, not too loose

---

## 🔧 Customization Quick Reference

### Change Target Roles
**File:** `config/search-filters.js`
```javascript
targetRoles: [
  'Platform Engineer',
  'Your New Role Here'
]
```

### Change Salary Threshold
**File:** `.env`
```bash
MIN_SALARY_INR=1500000  # 15 LPA
```

### Change Scraping Mode
**File:** `.env`
```bash
SCRAPING_MODE=past_week  # or 'past_day'
```

### Change Schedule
**File:** `.env`
```bash
CRON_SCHEDULE="0 */4 * * *"  # Every 4 hours
```

---

## 🚀 What You Can Do Now

### Query High-Quality Jobs
```sql
-- Top 20 jobs by overall score
SELECT j.job_title, j.company, j.salary_min, js.overall_score
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
ORDER BY js.overall_score DESC
LIMIT 20;
```

### Query High-Paying Jobs
```sql
SELECT * FROM get_high_paying_jobs(1800000);  -- 18 LPA+
```

### Query Recent Jobs
```sql
SELECT * FROM get_recent_jobs(24);  -- Last 24 hours
```

### Get Main Stats
```sql
SELECT * FROM get_stats();
```

---

## 📋 Migration Checklist

If you already had the old system running:

- [ ] Backup old database (if needed)
- [ ] Run new `init-db.sql`
- [ ] Update `.env` with new variables
- [ ] Add your resume to `user_config` table
- [ ] Configure `config/search-filters.js`
- [ ] Run engine
- [ ] Check filter stats
- [ ] Adjust filters if needed

---

## 🎯 Summary of Benefits

### Before (Multi-User, Broad Scraping)
- ❌ Scraped everything
- ❌ Complex multi-user setup
- ❌ Low signal-to-noise ratio
- ❌ Wasted API calls on irrelevant jobs

### After (Single-User, Smart Filtering)
- ✅ Only scrapes relevant roles
- ✅ Simple single-user setup
- ✅ High-quality job matches
- ✅ Salary-aware from start
- ✅ Time-based scraping (fresh jobs)
- ✅ Configurable and maintainable

---

## 📚 Documentation Updated

1. **CONFIG_GUIDE.md** ← Configuration manual
2. **init-db.sql** ← New schema
3. **search-filters.js** ← Filter rules
4. **job-filter.js** ← Filter logic
5. **.env.example** ← New variables
6. **This file** ← Update summary

---

## ⚡ Next Steps

1. **Read:** `CONFIG_GUIDE.md` for detailed config options
2. **Setup:** Run new database schema
3. **Configure:** Edit `.env` and `search-filters.js`
4. **Test:** Run with `past_week` mode first
5. **Monitor:** Check filter statistics
6. **Tune:** Adjust filters based on results
7. **Switch:** Move to `past_day` mode for daily operation

---

**The system is now a precision instrument for role-specific, high-quality job hunting!** 🎯

Questions? Check `CONFIG_GUIDE.md` for detailed explanations.
