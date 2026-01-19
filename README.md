# 🎯 Job Hunter Engine

> **Automated leads generation** for DevOps / Platform Engineering job hunting.

[![Made with Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](https://supabase.com)

---

## 🚀 What is This?

A cron-based backend engine that:
- **Scrapes** jobs from 8+ platforms (LinkedIn, Naukri, Indeed, RemoteOK, etc.)
- **Filters** based on roles, salary, experience, and keywords
- **Scores** using AI (Gemini/OpenAI) to prioritize best opportunities
- **Generates leads** — curated job listings ready for your review

> ⚠️ **Note**: This is a leads generation tool. You apply manually.

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[Getting Started](docs/01-getting-started.md)** | Setup, API keys, first run |
| **[Configuration](docs/02-configuration.md)** | All settings explained |
| **[Search Filters](docs/03-search-filters.md)** | Customize job targeting |
| **[AI Scoring](docs/04-ai-scoring.md)** | How scoring works |
| **[Database Schema](docs/05-database-schema.md)** | Tables & SQL queries |
| **[Platform Scrapers](docs/06-platform-scrapers.md)** | Scraper configs |
| **[Building a UI](docs/07-building-ui.md)** | Frontend suggestions |

### Legacy Docs
| Document | Description |
|----------|-------------|
| [Quick Start](docs/QUICKSTART.md) | Original quick setup |
| [Filter Flow](docs/FILTER_FLOW.md) | Detailed filter pipeline |
| [AI Filtering](docs/AI_FILTERING.md) | AI classification details |
| [Flow Diagram](docs/FLOW_DIAGRAM.md) | System architecture |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase & Gemini keys

# 3. Initialize database (run in Supabase SQL Editor)
# Paste contents of: scripts/init-db.sql

# 4. Run the engine
npm start
```

---

## 🏗️ Project Structure

```
engine/
├── config/              # Configuration files
│   ├── ai.js           # AI provider settings
│   ├── database.js     # PostgreSQL connection
│   ├── platforms.js    # Scraper configs
│   └── search-filters.js  # ⭐ Main filters (edit this!)
├── docs/               # 📚 Documentation
├── scripts/
│   └── init-db.sql     # Database setup
├── src/
│   ├── orchestrator/   # Main cron runner
│   ├── scrapers/       # Job scrapers
│   ├── scorer/         # AI scoring (Python)
│   ├── storage/        # Database repos
│   └── utils/          # Helpers
└── logs/               # Application logs
```

---

## 🔧 Key Configuration

Edit `config/search-filters.js` to customize:
- **Target roles** — What job titles to search
- **Salary range** — Minimum salary requirements  
- **Keywords** — Required/excluded/preferred terms
- **Locations** — Geographic preferences

---

## 📊 Platforms Supported

| Platform | Type | Focus |
|----------|------|-------|
| LinkedIn | Major | All jobs |
| Naukri | India | Indian market |
| Indeed | Global | All jobs |
| RemoteOK | Remote | Remote-first |
| We Work Remotely | Remote | Remote-first |
| Wellfound | Startups | Startup jobs |
| Himalayas | Remote | Remote jobs |
| Remotive | Remote | Remote jobs |

---

## 📈 Scoring System

Jobs are scored on three dimensions:
- **Skill Match** (0-100) — How well your skills align
- **Role Stretch** (0-100) — Growth opportunity fit
- **Risk-to-Reward** (0-100) — Company/comp signals

Leads are categorized as:
- `high_priority` — Best matches, apply ASAP
- `worth_review` — Good, worth looking at
- `skip` — Not a fit

---

## 📜 License

MIT

---

*Built for aggressive job hunting* 🎯
