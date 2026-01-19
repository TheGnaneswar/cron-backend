# Quick Start Guide

## 🚀 Get Running in 10 Minutes

### 1. Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Supabase account (free tier works)
- Gemini API key (free from Google AI Studio)

---

### 2. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Project Settings → Database
3. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Run the database initialization:
   - Open SQL Editor in Supabase dashboard
   - Copy/paste contents of `scripts/init-db.sql`
   - Click "Run"

---

### 3. Get Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key"
3. Create new key (free tier: 60 requests/minute)
4. Copy the key

---

### 4. Install Dependencies

```bash
cd engine

# Node.js packages
npm install

# Python packages
pip install -r requirements.txt
```

---

### 5. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env with your actual values
```

Required values in `.env`:
```bash
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
GEMINI_API_KEY=your-gemini-api-key-here
DEFAULT_USER_EMAIL=your-email@example.com
AI_PROVIDER=gemini
```

---

### 6. Add Your Resume

Create a file `data/my_resume.json`:

```json
{
  "experience_years": 1.5,
  "current_role": "DevOps Engineer",
  "skills": [
    "Docker",
    "Kubernetes",
    "AWS",
    "GitLab CI/CD",
    "Terraform",
    "Python",
    "Node.js",
    "PostgreSQL",
    "Monitoring (Prometheus/Grafana)"
  ],
  "projects": [
    "Deployed microservices on EKS with Karpenter autoscaling",
    "Built CI/CD pipelines for 8+ services",
    "Implemented monitoring with Prometheus and Loki"
  ],
  "education": "B.Tech in Computer Science",
  "certifications": []
}
```

Then insert into database:

```sql
-- Run in Supabase SQL Editor

-- Create user
INSERT INTO users (email) 
VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;

-- Insert resume (replace JSON with your actual resume)
INSERT INTO resumes (user_id, resume_json)
SELECT id, '{
  "experience_years": 1.5,
  "current_role": "DevOps Engineer",
  "skills": ["Docker", "Kubernetes", "AWS", "GitLab CI/CD", "Terraform", "Python", "Node.js"],
  "projects": ["Deployed microservices on EKS", "Built CI/CD pipelines"]
}'::jsonb
FROM users WHERE email = 'your-email@example.com';
```

---

### 7. Test the System

**Test RemoteOK scraper** (works without auth):

```javascript
// test.js
const RemoteOKScraper = require('./src/scrapers/remoteok');
const config = require('./config/platforms');

const scraper = new RemoteOKScraper(config.remoteok);

scraper.scrape({ tags: ['devops'], limit: 5 })
  .then(jobs => {
    console.log(`Found ${jobs.length} jobs:`);
    jobs.forEach(j => console.log(`- ${j.job_title} at ${j.company}`));
  })
  .catch(err => console.error(err));
```

Run:
```bash
node test.js
```

---

### 8. Test AI Scorer

```bash
# Test Python scorer directly
python src/scorer/scorer.py gemini '{"skills":["Docker","AWS"]}' "We need a DevOps engineer with Docker and Kubernetes experience"
```

Should return JSON with scores.

---

### 9. Run the Engine

```bash
npm start
```

You should see:
```
[INFO] Scheduling cron job with: 0 */4 * * *
[INFO] Running initial cycle...
[INFO] === Starting job scraping cycle ===
[INFO] Scraping remoteok...
...
```

---

### 10. Check Results

Query your database in Supabase SQL Editor:

```sql
-- See scraped jobs
SELECT * FROM jobs ORDER BY created_at DESC LIMIT 10;

-- See scores
SELECT 
  j.job_title,
  j.company,
  js.skill_match_score,
  js.ai_recommendation
FROM job_scores js
JOIN jobs j ON js.job_id = j.id
ORDER BY js.skill_match_score DESC
LIMIT 10;

-- See auto-apply candidates
SELECT * FROM get_pending_auto_apply_jobs('your-user-id-here');
```

---

## ⚠️ Important Notes

### Cron Schedule
Default: Runs every 4 hours

To change:
```bash
# In .env
CRON_SCHEDULE="0 */2 * * *"  # Every 2 hours
CRON_SCHEDULE="0 9 * * *"    # Every day at 9 AM
```

### Platforms That Work Out-of-the-Box
- ✅ RemoteOK (API-based, no auth)
- ❌ LinkedIn (requires Playwright + auth - not implemented yet)
- ❌ Naukri (requires auth - placeholder)
- ❌ Indeed (requires scraping - placeholder)

Start with RemoteOK, then build others.

### Cost Estimates
- **Supabase**: Free tier (500MB database)
- **Gemini API**: Free tier (60 req/min)
- **EC2**: t3.micro (~$8/month) or run locally

### Debugging

Watch logs in real-time:
```bash
tail -f logs/app.log
tail -f logs/scorer.log
```

---

## 🎯 Next Steps

1. **Verify RemoteOK scraper works**
2. **Check that jobs are being scored**
3. **Implement LinkedIn scraper** (highest ROI)
4. **Build auto-apply module**
5. **Add callback tracking**

---

## 🆘 Common Issues

**"Cannot find module 'pg'"**
```bash
npm install
```

**"Python: No module named 'google.generativeai'"**
```bash
pip install -r requirements.txt
```

**"Database connection ECONNREFUSED"**
- Check your Supabase connection string
- Verify project is not paused

**"Gemini API error: 429"**
- You're rate-limited
- Add delay between scoring calls (already has 1s delay)

---

## 📊 Expected Results

After 24 hours:
- ~50-100 jobs scraped (from RemoteOK only)
- ~30-60 jobs scored
- ~10-20 auto-apply candidates

Once LinkedIn is implemented:
- ~300-500 jobs/day
- ~100-150 new scores/day
- ~30-50 auto-apply candidates/day

---

Good luck! 🚀
