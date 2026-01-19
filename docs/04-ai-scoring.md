# 🤖 AI Scoring System

The AI scoring system evaluates each job against your profile and determines whether to auto-apply, review manually, or skip.

---

## 📁 Relevant Files

| File | Purpose |
|------|---------|
| `config/ai.js` | AI provider settings & thresholds |
| `src/scorer/scorer.py` | Main scoring logic (Python) |
| `src/scorer/runner.js` | Node.js wrapper for Python scorer |
| `src/scorer/ai-classifier.js` | Quick pre-filtering classifier |
| `src/scorer/quick-classifier.py` | Fast classification during scraping |

---

## 🎯 Scoring System Overview

Each job gets THREE scores (0-100):

| Score | What it Measures |
|-------|------------------|
| **Skill Match** | How well your skills match the job requirements |
| **Role Stretch** | How good is the "stretch" opportunity for growth |
| **Risk-to-Reward** | Job urgency, company quality, compensation signals |

---

## 📊 Score Interpretation

### Skill Match Score (0-100)
- **90-100**: Perfect match, you have all required skills
- **70-89**: Strong match, minor gaps
- **50-69**: Moderate match, some learning needed
- **30-49**: Weak match, significant gaps
- **0-29**: Poor match, wrong domain

### Role Stretch Score (0-100)
- **90-100**: Ideal level, perfect career step
- **70-89**: Good stretch, challenging but achievable
- **50-69**: Moderate stretch, might be too senior
- **30-49**: Significant stretch, likely too senior
- **0-29**: Way too senior

### Risk-to-Reward Score (0-100)
- **90-100**: High reward (startup equity, great comp, urgent hire)
- **70-89**: Good upside potential
- **50-69**: Standard opportunity
- **30-49**: Limited upside
- **0-29**: Low reward signals

---

## 🚦 Lead Recommendations

Based on scores, the AI categorizes leads:

| Recommendation | Criteria | What it Means |
|----------------|----------|---------------|
| `high_priority` | High scores, good fit | **Apply ASAP** — Best matches |
| `worth_review` | Moderate scores, worth looking | Review and decide |
| `skip` | Poor fit or too senior | Low priority, likely not a fit |

> 💡 **Note**: This is leads generation. All applications are done manually by you.

### Auto-Apply Thresholds

Located in `config/ai.js`:

```javascript
autoApplyThresholds: [
    // ANY of these conditions triggers auto_apply
    { skill_match: 70, role_stretch: 65 },  // Good overall fit
    { skill_match: 75 },                     // Strong skill match alone
    { risk_reward: 70 }                      // High reward opportunity
],
```

**Translation**: Auto-apply if:
- Skill match ≥70 AND role stretch ≥65, OR
- Skill match ≥75 (any other scores), OR
- Risk-reward ≥70 (hot opportunity)

### Human Review Threshold

```javascript
humanReviewThreshold: {
    skill_match: 60
},
```

Jobs with skill_match 60-69 go to `human_review`.

### Skip Threshold

```javascript
skipThreshold: {
    skill_match: 50,
    seniorRole: true
},
```

Jobs with skill_match <50 OR detected as senior role → `skip`.

---

## 👤 Candidate Profile

The AI uses YOUR profile to score jobs. Update in `config/ai.js`:

```javascript
candidateProfile: {
    experience: 1.5,                    // Your years of experience
    role: 'DevOps / Platform Engineering',  // Current role
    targetLevel: 'PE2 / Mid-level'      // What you're targeting
}
```

**Also update your resume in the database:**

```sql
-- Run in Supabase SQL Editor
UPDATE user_config 
SET resume_json = '{
    "experience_years": 1.5,
    "current_role": "DevOps Engineer",
    "skills": [
        "Docker", "Kubernetes", "AWS", "Terraform",
        "GitLab CI/CD", "Python", "PostgreSQL",
        "Prometheus", "Grafana"
    ],
    "projects": [
        "Deployed microservices on EKS with Karpenter",
        "Built CI/CD pipelines for 8+ services",
        "Implemented monitoring with Prometheus and Loki"
    ],
    "education": "B.Tech in Computer Science"
}'::jsonb
WHERE email = 'your@email.com';
```

---

## 🔧 Customizing Thresholds

### Aggressive Approach (Apply to More)

```javascript
autoApplyThresholds: [
    { skill_match: 60, role_stretch: 55 },
    { skill_match: 65 },
    { risk_reward: 60 }
],
humanReviewThreshold: { skill_match: 50 },
skipThreshold: { skill_match: 40 }
```

### Conservative Approach (Apply to Less)

```javascript
autoApplyThresholds: [
    { skill_match: 80, role_stretch: 75 },
    { skill_match: 85 },
    { risk_reward: 80 }
],
humanReviewThreshold: { skill_match: 70 },
skipThreshold: { skill_match: 60 }
```

---

## 🤖 AI Provider Configuration

### Using Gemini (Recommended)

```javascript
// config/ai.js
gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash-exp',  // Fast and capable
    temperature: 0.1,                // Low = consistent scoring
    maxTokens: 1000
}
```

### Using OpenAI

```javascript
// config/ai.js
openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',  // Cost-effective
    temperature: 0.1,
    maxTokens: 1000
}
```

Switch provider in `.env`:
```env
AI_PROVIDER=gemini   # or 'openai'
```

---

## 📤 Score Output Format

Each scored job produces:

```json
{
    "job_id": "uuid-here",
    "skill_match_score": 78,
    "role_stretch_score": 72,
    "risk_reward_score": 65,
    "overall_score": 74,
    "ai_recommendation": "auto_apply",
    "missing_skills": ["service mesh", "ArgoCD"],
    "reason": "Strong K8s/Terraform match. Good startup with equity. Minor gaps in GitOps."
}
```

---

## 🗄️ Database Tables

Scores are stored in `job_scores`:

| Column | Type | Description |
|--------|------|-------------|
| `job_id` | UUID | Reference to jobs table |
| `skill_match_score` | INT | 0-100 |
| `role_stretch_score` | INT | 0-100 |
| `risk_reward_score` | INT | 0-100 |
| `overall_score` | INT | Weighted combination |
| `ai_recommendation` | TEXT | 'auto_apply', 'human_review', 'skip' |
| `missing_skills` | JSONB | Array of skill gaps |
| `reason` | TEXT | AI explanation |

### Quick Queries

```sql
-- Get all auto-apply jobs
SELECT j.job_title, j.company, js.overall_score, j.job_link
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.ai_recommendation = 'auto_apply'
ORDER BY js.overall_score DESC;

-- Get human review jobs
SELECT j.job_title, j.company, js.skill_match_score, js.reason
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.ai_recommendation = 'human_review'
ORDER BY js.skill_match_score DESC;

-- Jobs with specific missing skills
SELECT j.job_title, j.company, js.missing_skills
FROM jobs j
JOIN job_scores js ON j.id = js.job_id
WHERE js.missing_skills ? 'terraform';
```

---

## 🔍 Debugging Scoring

Check what's happening:

```bash
# View scorer logs
tail -f logs/scorer.log

# Run scorer manually
cd src/scorer
python scorer.py
```

---

[← Back to Search Filters](./03-search-filters.md) | [Next: Database Schema →](./05-database-schema.md)
