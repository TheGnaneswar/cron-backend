# 🔍 Search Filters Configuration

**File Location**: `config/search-filters.js`

This is the **most important configuration file** for customizing your job search. It controls what jobs are scraped, filtered, and scored.

---

## 📁 File Structure

```javascript
module.exports = {
    scrapingMode,       // 'past_day' or 'past_week'
    targetRoles,        // Array of job titles to target
    experienceLevel,    // Min/max experience years
    salaryFilter,       // Salary requirements
    locations,          // Geographic preferences
    requiredKeywords,   // Must-have keywords
    excludeKeywords,    // Reject if these appear
    preferredKeywords,  // Bonus points keywords
    companySize,        // Company size preferences
    jobType,            // Full-time, contract, etc.
    scoringWeights,     // How scores are calculated
    timeFilters,        // Time-based scraping
    platformOverrides   // Platform-specific settings
};
```

---

## 🎯 Target Roles

**Lines 10-21**: Define what job titles you're looking for.

```javascript
targetRoles: [
    'Platform Engineer',
    'Platform Engineering',
    'Cloud Engineer',
    'Cloud Infrastructure Engineer',
    'DevOps Engineer',
    'SRE',
    'Site Reliability Engineer',
    'Infrastructure Engineer',
    'DevOps Platform Engineer'
],
```

### To Customize:
1. Add roles you want to target
2. Include variations (e.g., "SRE" and "Site Reliability Engineer")
3. Order doesn't matter

---

## 📊 Experience Level Filter

**Lines 23-28**: Filter by years of experience.

```javascript
experienceLevel: {
    min: 1,             // Minimum years to include
    max: 4,             // Maximum years to include
    idealRange: [2, 3]  // Sweet spot for scoring bonus
},
```

### To Customize:
- **Broaden**: Increase `max` to see more senior roles
- **Narrow**: Increase `min` to skip junior roles
- `idealRange` gives bonus points to jobs matching this range

---

## 💰 Salary Filter

**Lines 30-36**: Set minimum salary requirements.

```javascript
salaryFilter: {
    enabled: true,
    minAnnualINR: 1200000,    // ₹12 LPA minimum
    minAnnualUSD: 70000,      // $70k for remote/US jobs
    preferredMinINR: 1800000  // ₹18 LPA preferred (bonus)
},
```

### To Customize:
- Set `enabled: false` to disable salary filtering
- Adjust INR values for India-based jobs
- Adjust USD values for international/remote jobs
- `preferredMinINR` gives extra points, not a hard filter

---

## 📍 Location Preferences

**Lines 38-43**: Where you want to work.

```javascript
locations: {
    india: ['Bangalore', 'Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'NCR', 'Gurgaon', 'Noida'],
    remote: ['Remote', 'Work from Home', 'WFH', 'Remote-India', 'Anywhere'],
    international: []  // Empty = India + remote only
},
```

### To Customize:
- Add/remove cities from `india` array
- Add countries to `international` to include them
- Leave `international` empty to focus on India

---

## ✅ Required Keywords

**Lines 45-59**: Job MUST have at least one keyword from EACH group.

```javascript
requiredKeywords: {
    // Technical skills (must have at least one)
    technical: [
        'kubernetes', 'k8s', 'docker', 'containers',
        'aws', 'azure', 'gcp', 'cloud',
        'terraform', 'infrastructure as code', 'iac',
        'ci/cd', 'jenkins', 'gitlab', 'github actions',
        'monitoring', 'prometheus', 'grafana'
    ],
    
    // Level indicators (must have at least one)
    level: [
        'mid-level', 'mid level', 'pe2', 'pe-2', 'l4',
        '2-4 years', '2-3 years', '1-4 years',
        'junior-to-mid', 'associate'
    ]
},
```

### To Customize:
- Add your core technical skills to `technical`
- Add level indicators that match your experience

---

## ❌ Exclude Keywords

**Lines 61-81**: Reject job if ANY of these appear.

```javascript
excludeKeywords: [
    // Too senior
    'senior', 'staff', 'principal', 'lead', 'architect',
    'director', 'vp', 'chief', 'manager',
    '5+ years', '6+ years', '7+ years', '10+ years',
    'l5', 'l6', 'ic4', 'ic5',

    // Wrong domain
    'data engineer', 'ml engineer', 'frontend', 'mobile',
    'qa', 'test',

    // Wrong job type
    'intern', 'internship', 'trainee', 'fresher',
    'contract', 'freelance', 'part-time'
],
```

### To Customize:
- Add roles you want to avoid
- Add experience levels above your range
- Add tech stacks you don't want

> ⚠️ **Be careful!** Keywords are case-insensitive and match anywhere in the job description.

---

## ⭐ Preferred Keywords (Bonus Points)

**Lines 83-92**: Jobs with these get higher scores.

```javascript
preferredKeywords: [
    'startup', 'well-funded', 'series a', 'series b',
    'fast-growing', 'high-growth',
    'equity', 'esop', 'stock options',
    'remote-first', 'flexible hours',
    'platform team', 'infrastructure team',
    'microservices', 'service mesh', 'observability'
],
```

### To Customize:
- Add keywords that indicate good opportunities
- Add benefits you care about
- Add tech you're excited about

---

## ⚖️ Scoring Weights

**Lines 106-113**: How the overall score is calculated.

```javascript
scoringWeights: {
    titleMatch: 0.3,        // 30% - How well title matches
    keywordDensity: 0.25,   // 25% - Technical keywords presence
    salaryMatch: 0.15,      // 15% - Salary meets threshold
    companyQuality: 0.15,   // 15% - Startup/growth indicators
    experienceMatch: 0.15   // 15% - Experience level fit
},
```

### To Customize:
- Weights must sum to 1.0
- Increase `titleMatch` if exact titles matter
- Increase `salaryMatch` if pay is your priority

---

## ⏰ Time-Based Filtering

**Lines 115-127**: How recent jobs should be.

```javascript
timeFilters: {
    past_day: {
        hours: 24,
        description: 'Jobs posted in last 24 hours',
        recommendedSchedule: '0 */6 * * *'  // Every 6 hours
    },
    past_week: {
        hours: 168,
        description: 'Jobs posted in last 7 days',
        recommendedSchedule: '0 0 * * *'  // Once daily
    }
},
```

### To Use:
Set in `.env`:
```env
SCRAPING_MODE=past_day   # or 'past_week'
```

---

## 🔧 Platform-Specific Overrides

**Lines 129-147**: Override settings for specific platforms.

```javascript
platformOverrides: {
    linkedin: {
        experienceLevel: '2',
        jobType: 'F',
        location: 'India',
        salary: { min: 1200000, currency: 'INR' }
    },
    naukri: {
        experience: '1-4',
        salary: { min: 12, max: 40, unit: 'Lacs' },
        location: 'Bangalore/Bengaluru, Hyderabad, Pune'
    },
    indeed: {
        experience: 'mid_level',
        salary: { min: 1200000, currency: 'INR' }
    }
},
```

---

## 📝 Complete Example

Here's a customized example for a **2-year DevOps Engineer targeting 15+ LPA**:

```javascript
module.exports = {
    scrapingMode: 'past_day',
    
    targetRoles: [
        'DevOps Engineer',
        'Cloud Engineer',
        'SRE',
        'Platform Engineer'
    ],
    
    experienceLevel: {
        min: 1,
        max: 3,
        idealRange: [1.5, 2.5]
    },
    
    salaryFilter: {
        enabled: true,
        minAnnualINR: 1500000,   // 15 LPA
        minAnnualUSD: 80000,
        preferredMinINR: 2000000 // 20 LPA preferred
    },
    
    locations: {
        india: ['Bangalore', 'Hyderabad'],
        remote: ['Remote', 'WFH'],
        international: []
    },
    
    excludeKeywords: [
        'senior', 'lead', 'manager',
        '4+ years', '5+ years',
        'intern', 'fresher'
    ],
    
    // ... rest of config
};
```

---

## 🔄 After Making Changes

1. Save the file
2. Restart the engine: `npm start`
3. Monitor logs: `tail -f logs/app.log`
4. Check database for new jobs meeting your criteria

---

[← Back to Configuration](./02-configuration.md) | [Next: AI Scoring →](./04-ai-scoring.md)
