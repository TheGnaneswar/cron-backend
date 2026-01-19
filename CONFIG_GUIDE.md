# Job Search Configuration Guide

## Overview

The system is now optimized for **single-user, high-quality job hunting** targeting:
- **Platform Engineering**
- **Cloud Engineering**  
- **DevOps / SRE roles**
- **High-paying positions** (₹12L+ minimum)

---

## 🎯 Key Features

### 1. Role-Based Filtering
Only scrapes jobs matching your target roles. Configured in `config/search-filters.js`:

```javascript
targetRoles: [
  'Platform Engineer',
  'Cloud Engineer',
  'DevOps Engineer',
  'SRE',
  'Infrastructure Engineer'
]
```

**How to change:**
Edit `config/search-filters.js` → `targetRoles` array

---

### 2. Salary Filtering  
Only keeps high-paying jobs:
- **Minimum**: ₹12 LPA (1,200,000 INR) or $70k USD
- **Preferred**: ₹18 LPA+ (1,800,000 INR)

**How to change:**
```javascript
// In config/search-filters.js
salaryFilter: {
  enabled: true,
  minAnnualINR: 1200000,   // Change this
  preferredMinINR: 1800000  // Change this
}
```

---

### 3. Time-Based Scraping Toggle

**Two modes:**

#### Past Day Mode (Default)
- Scrapes jobs posted in **last 24 hours**
- Recommended schedule: **Every 6 hours**
- Best for: High-volume platforms (LinkedIn, Naukri)

#### Past Week Mode
- Scrapes jobs posted in **last 7 days**
- Recommended schedule: **Once daily**
- Best for: Initial setup, catching up on missed jobs

**How to switch:**
```bash
# In .env
SCRAPING_MODE=past_day   # or 'past_week'
```

Or change in `config/search-filters.js`:
```javascript
scrapingMode: 'past_day'  // or 'past_week'
```

---

### 4. Smart Filtering (Multi-Stage)

Jobs go through **4 filter stages**:

#### Stage 1: Title Filter
✅ **Keeps**: "Platform Engineer", "Cloud Engineer PE2", "DevOps Lead"  
❌ **Rejects**: "Senior Architect", "Data Engineer", "Frontend Developer"

#### Stage 2: Keyword Filter (Technical)
✅ **Requires at least ONE**:
- kubernetes, docker, aws, azure, gcp
- terraform, ci/cd, monitoring
- prometheus, grafana, etc.

#### Stage 3: Exclude Filter
❌ **Rejects if contains ANY**:
- Senior, Staff, Principal, Architect
- 5+ years, 10+ years
- Data Engineer, ML Engineer, Frontend
- Intern, Contract, Freelance

#### Stage 4: Salary Filter
✅ **Keeps**: ₹12L+ or $70k+  
❌ **Rejects**: Below threshold (if salary info available)

---

## 📊 Filter Accuracy Balance

The system is tuned to:
- **Not too broad**: Filters out unrelated roles
- **Not too narrow**: Doesn't miss good opportunities

### Precision vs Recall Settings

**Current settings** (in `config/search-filters.js`):
```javascript
requiredKeywords: {
  technical: ['kubernetes', 'docker', 'aws', ...],  // Must have ONE
  level: ['mid-level', 'pe2', '2-4 years', ...]     // Optional (scored later)
}
```

**To make STRICTER** (fewer jobs, higher quality):
- Add more required keywords
- Increase salary threshold
- Make level keywords required

**To make LOOSER** (more jobs, some noise):
- Reduce exclude keywords
- Lower salary threshold
- Remove some technical keyword requirements

---

## 🔧 Configuration Files

### Main Configuration
**File**: `config/search-filters.js`

This is your **control center**. Change:
- Target roles
- Salary thresholds
- Required/excluded keywords
- Location preferences
- Scraping mode

### Environment Variables
**File**: `.env`

Quick toggles:
```bash
SCRAPING_MODE=past_day
MIN_SALARY_INR=1200000
TARGET_ROLES=Platform Engineer,Cloud Engineer,DevOps Engineer
```

---

## 📝 Customization Examples

### Example 1: Focus on Remote-Only Jobs

```javascript
// config/search-filters.js
locations: {
  india: [],  // Disable India-specific locations
  remote: ['Remote', 'Work from Home', 'WFH', 'Fully Remote'],
  international: ['USA', 'Europe', 'Canada']  // Add international
}
```

### Example 2: Target Only Startups

```javascript
// config/search-filters.js
companySize: {
  preferred: ['startup', 'scaleup'],
  exclude: ['enterprise', 'large-corp']
},

preferredKeywords: [
  'seed', 'series a', 'series b',
  'startup', 'well-funded', 'fast-growing',
  ...
]
```

### Example 3: Widen Experience Range

```javascript
// config/search-filters.js
experienceLevel: {
  min: 0,    // Include junior roles
  max: 5,    // Include some senior roles
  idealRange: [1, 4]
}
```

### Example 4: Add More Target Roles

```javascript
// config/search-filters.js
targetRoles: [
  'Platform Engineer',
  'Cloud Engineer',
  'DevOps Engineer',
  'SRE',
  'Infrastructure Engineer',
  'Build Engineer',          // ADD
  'Production Engineer',     // ADD
  'Reliability Engineer'     // ADD
]
```

---

## 🎯 Recommended Settings by Goal

### Goal: Maximum Quality (Conservative)
```javascript
salaryFilter: { minAnnualINR: 1800000 },  // 18 LPA minimum
scrapingMode: 'past_day',
excl   udeKeywords: [..., '3+ years'],  // Very strict
targetRoles: ['Platform Engineer', 'SRE']  // Only top roles
```
**Result**: ~10-20 jobs/day, all excellent matches

---

### Goal: Maximum Volume (Aggressive)
```javascript
salaryFilter: { minAnnualINR: 1000000 },  // 10 LPA minimum
scrapingMode: 'past_week',
excludeKeywords: [/* only critical exclusions */],
targetRoles: [/* all related roles */]
```
**Result**: ~100-200 jobs/day, more noise

---

### Goal: Balanced (Recommended)
```javascript
salaryFilter: { minAnnualINR: 1200000 },  // 12 LPA
scrapingMode: 'past_day',
excludeKeywords: [/* default list */],
targetRoles: [/* PE, Cloud, DevOps, SRE */]
```
**Result**: ~30-50 jobs/day, good quality ✅

---

## 🔄 Time-Based Scraping Details

### Past Day Mode
```javascript
timeFilters: {
  past_day: {
    hours: 24,
    recommendedSchedule: '0 */6 * * *'  // Every 6 hours
  }
}
```

**Cron schedule**:
```bash
# In .env
CRON_SCHEDULE="0 */6 * * *"  # Runs at: 12am, 6am, 12pm, 6pm
```

**Use when:**
- System is running 24/7
- Want fresh jobs ASAP
- High-volume platforms (LinkedIn)

---

### Past Week Mode
```javascript
timeFilters: {
  past_week: {
    hours: 168,  // 7 days
    recommendedSchedule: '0 0 * * *'  // Once daily
  }
}
```

**Cron schedule**:
```bash
# In .env
CRON_SCHEDULE="0 0 * * *"  # Runs at midnight
```

**Use when:**
- First-time setup
- Catching up on missed jobs
- Lower-volume platforms

---

## 📈 Monitoring Filter Performance

After running, check filter stats:

```javascript
// In orchestrator logs
[INFO] Filter Statistics:
  Total jobs scraped: 250
  Passed title filter: 180 (72%)
  Passed keyword filter: 120 (48%)
  Passed exclude filter: 80 (32%)
  Passed salary filter: 50 (20%)
  Final kept: 50 (20%)
```

### Interpreting Stats

**Filter rate ~20-30%** = Good balance ✅
- Not losing too many opportunities
- Not drowning in noise

**Filter rate <10%** = Too strict ⚠️
- Loosen exclude keywords
- Lower salary threshold
- Add more target roles

**Filter rate >50%** = Too loose ⚠️
- Add more exclude keywords
- Increase requirements
- Raise salary threshold

---

## 🛠️ Quick Adjustments

### To Get More Jobs
1. Lower salary: `minAnnualINR: 1000000`
2. Change mode: `SCRAPING_MODE=past_week`
3. Reduce excludes: Comment out some `excludeKeywords`
4. Add roles: Expand `targetRoles` list

### To Get Better Quality
1. Raise salary: `minAnnualINR: 1500000`
2. Stricter filters: More `excludeKeywords`
3. Narrow roles: Only keep top 3-4 `targetRoles`
4. Add company filter: Only startups/scaleups

---

## 📋 Checklist Before Running

- [ ] Updated `TARGET_ROLES` in `.env`
- [ ] Set `MIN_SALARY_INR` to desired threshold
- [ ] Chose `SCRAPING_MODE` (past_day or past_week)
- [ ] Reviewed `config/search-filters.js` keywords
- [ ] Set appropriate `CRON_SCHEDULE`
- [ ] Added your resume to database

---

## 🎓 Pro Tips

1. **Start with past_week mode** for first run (catch up on jobs)
2. **Switch to past_day mode** after initial run (stay current)
3. **Review filter stats** after each run (tune accuracy)
4. **Adjust salary threshold** based on callback rate
5. **Add/remove keywords** based on job quality

---

## 📞 Need Help?

See filter stats in logs:
```bash
tail -f logs/scraper.log | grep "Filter Statistics"
```

Check which keyword caused rejection:
```bash
tail -f logs/scraper.log | grep "Rejected"
```

---

**The system is now tuned for high-quality, role-specific job hunting!** 🎯
