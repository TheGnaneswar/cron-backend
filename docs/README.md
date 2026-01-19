# 📚 Job Hunter Engine - Developer Documentation

> **For Backend Developers** — Everything you need to understand, configure, and extend the Job Hunter Engine.

---

## 🎯 What is This?

**Job Hunter Engine** is a **leads generation** backend system that:
1. **Scrapes** job listings from 8+ platforms (LinkedIn, Naukri, Indeed, etc.)
2. **Filters** jobs based on configurable criteria (roles, salary, experience)
3. **Scores** jobs using AI (Gemini/OpenAI) to prioritize best opportunities
4. **Generates leads** — curated job listings ready for manual review and application

> ⚠️ **Note**: This is a leads generation tool, NOT an auto-apply bot. It finds and scores jobs; you apply manually.

It's designed for aggressive job hunting targeting **PE2 (Platform Engineer 2)** and mid-level DevOps/SRE roles.

---

## 📑 Documentation Index

| Document | Description |
|----------|-------------|
| [🚀 Getting Started](./01-getting-started.md) | Database setup, API keys, first run |
| [⚙️ Configuration Guide](./02-configuration.md) | All configurable settings explained |
| [🔍 Search Filters](./03-search-filters.md) | How to customize job filtering |
| [🤖 AI Scoring](./04-ai-scoring.md) | Understanding the AI scoring system |
| [🗄️ Database Schema](./05-database-schema.md) | Tables, functions, and queries |
| [🔌 Platform Scrapers](./06-platform-scrapers.md) | Adding/modifying job scrapers |
| [📊 Building a UI](./07-building-ui.md) | How to build a frontend for this engine |

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Clone and install
npm install
pip install -r requirements.txt

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your keys (see docs/01-getting-started.md)

# 3. Initialize database (run in Supabase SQL Editor)
# Copy contents of scripts/init-db.sql

# 4. Run the engine
npm start
```

---

## 🏗️ Project Structure

```
engine/
├── config/                 # ⚙️ Configuration files
│   ├── ai.js              # AI provider settings (Gemini/OpenAI)
│   ├── database.js        # PostgreSQL connection
│   ├── platforms.js       # Scraper platform configs
│   └── search-filters.js  # Job filtering rules ← EDIT THIS
│
├── src/
│   ├── orchestrator/      # Main cron job runner
│   ├── scrapers/          # Job scrapers (one per platform)
│   ├── storage/           # Database repositories
│   ├── scorer/            # AI scoring logic (Python)
│   ├── sync/              # Google Sheets sync (optional)
│   └── utils/             # Logging and utilities
│
├── scripts/
│   └── init-db.sql        # Database initialization script
│
├── logs/                   # Application logs
├── docs/                   # 📚 You are here
└── package.json
```

---

## 🔑 Key Files to Know

| File | Purpose | When to Edit |
|------|---------|--------------|
| `config/search-filters.js` | Job filtering rules | Customize roles, salary, keywords |
| `config/ai.js` | AI scoring settings | Change thresholds, candidate profile |
| `config/platforms.js` | Scraper configurations | Enable/disable platforms, change search params |
| `scripts/init-db.sql` | Database schema | Adding new tables/columns |
| `.env` | Secrets & credentials | API keys, database URL |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js (scrapers, orchestrator) |
| **AI Scoring** | Python (Gemini/OpenAI) |
| **Database** | PostgreSQL (Supabase) |
| **Scheduler** | node-cron |
| **Optional** | Google Sheets sync |

---

## 📞 Need Help?

1. **Check the logs** — `logs/app.log`, `logs/errors.log`
2. **Read the specific doc** — Use the documentation index above
3. **Inspect the database** — Supabase Dashboard → SQL Editor

---

*Last updated: January 2026*
