# 🚀 Getting Started

This guide walks you through setting up the Job Hunter Engine from scratch.

---

## 📋 Prerequisites

- **Node.js** v18+ 
- **Python** 3.8+
- **Supabase account** (free tier works fine)
- **API Key** for either Gemini or OpenAI

---

## Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

---

## Step 2: Get Your API Keys 🔑

You need the following credentials:

### 2.1 Supabase Database Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI format)
   - It looks like: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
5. Go to **Settings** → **API**
6. Copy:
   - **Project URL** (SUPABASE_URL)
   - **anon public key** (SUPABASE_ANON_KEY)

### 2.2 AI Provider Keys

Choose ONE of the following:

#### Option A: Gemini (Recommended - Free tier!)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key

#### Option B: OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key

---

## Step 3: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
```

Open `.env` and fill in:

```env
# DATABASE (Required)
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# AI PROVIDER (Choose one)
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here

# OR if using OpenAI:
# AI_PROVIDER=openai
# OPENAI_API_KEY=your-openai-api-key-here

# Defaults (adjust as needed)
NODE_ENV=development
LOG_LEVEL=info
CRON_SCHEDULE=0 */4 * * *
SCRAPING_MODE=past_day
```

---

## Step 4: Initialize Database 🗄️

The database schema must be created before running the engine.

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the sidebar
4. Click **"New Query"**
5. Copy the entire contents of `scripts/init-db.sql`
6. Paste it into the SQL Editor
7. Click **"Run"** (or press Ctrl+Enter)

### Option B: Using Command Line

If you have `psql` installed:

```bash
psql -h db.[YOUR-PROJECT-REF].supabase.co \
     -U postgres \
     -d postgres \
     -f scripts/init-db.sql
```

> 💡 **Tip**: You can view your database directly in Supabase.
> Go to **Table Editor** to see all tables, or use **SQL Editor** for custom queries.

---

## Step 5: Update Your Profile

After running the database init script, update the default user profile:

```sql
-- Run this in Supabase SQL Editor
UPDATE user_config 
SET 
    email = 'your-actual@email.com',
    name = 'Your Name',
    resume_json = '{
        "experience_years": 1.5,
        "current_role": "Your Current Role",
        "skills": ["Docker", "Kubernetes", "AWS", "Terraform"],
        "projects": ["Your key projects here"],
        "education": "Your Education"
    }'::jsonb
WHERE email = 'your@email.com';
```

---

## Step 6: Run the Engine

```bash
# Start the engine
npm start
```

You should see logs like:
```
[INFO] Scheduling cron job with: 0 */4 * * *
[INFO] Running initial cycle...
[INFO] === Starting job scraping cycle ===
[INFO] Scraping linkedin...
...
```

---

## 🧪 Verify It's Working

1. **Check logs**: `logs/app.log`
2. **Check database**: Go to Supabase → Table Editor → `jobs` table
3. **Check scores**: Go to Supabase → Table Editor → `job_scores` table

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` | Check SUPABASE_DB_URL is correct |
| `Invalid API key` | Verify your Gemini/OpenAI key |
| `No jobs scraped` | Some scrapers may need authentication or be rate-limited |
| `Module not found` | Run `npm install` and `pip install -r requirements.txt` again |

---

## ⏭️ Next Steps

- [Configure Search Filters](./03-search-filters.md) — Customize what jobs to target
- [Understand AI Scoring](./04-ai-scoring.md) — How jobs are scored
- [Build a UI](./07-building-ui.md) — Create a frontend for this data

---

[← Back to Index](./README.md)
