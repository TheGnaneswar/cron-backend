# 📚 Complete Engine Documentation Index

Welcome to the **Job Hunter Engine** - a production-ready backend for aggressive job hunting with AI-powered scoring.

---

## 🚀 Quick Navigation

### For New Users
1. **Start Here**: [`README.md`](README.md) - Project overview and introduction
2. **Setup Guide**: [`QUICKSTART.md`](QUICKSTART.md) - Get running in 10 minutes
3. **Architecture**: [`SUMMARY.md`](SUMMARY.md) - Complete system overview

### For Developers
4. **Technical Docs**: [`DOCUMENTATION.md`](DOCUMENTATION.md) - Full reference documentation
5. **Execution Flow**: [`FLOW_DIAGRAM.md`](FLOW_DIAGRAM.md) - Visual flow diagrams
6. **File Structure**: [`STRUCTURE.txt`](STRUCTURE.txt) - Complete directory tree

---

## 📖 Documentation Files

| File | Purpose | Audience | Read Time |
|------|---------|----------|-----------|
| **README.md** | High-level overview, features, setup | Everyone | 5 min |
| **QUICKSTART.md** | Step-by-step setup instructions | New users | 10 min (+ setup time) |
| **SUMMARY.md** | Architecture, features, implementation status | Everyone | 15 min |
| **DOCUMENTATION.md** | Complete technical reference | Developers | 30 min |
| **FLOW_DIAGRAM.md** | ASCII flow diagrams | Developers | 10 min |
| **STRUCTURE.txt** | Directory tree | Developers | 2 min |

---

## 🗂️ Source Code Structure

```
engine/
├── 📄 Configuration
│   ├── .env.example          # Environment template
│   ├── package.json          # Node.js dependencies
│   ├── requirements.txt      # Python dependencies
│   └── .gitignore           # Git ignore rules
│
├── 📁 config/               # Application configuration
│   ├── database.js          # PostgreSQL connection
│   ├── platforms.js         # Scraper settings (8 platforms)
│   └── ai.js                # AI provider & thresholds
│
├── 📁 src/                  # Source code
│   ├── orchestrator/        # Main cron coordinator
│   ├── scrapers/            # Job scrapers (Node.js)
│   ├── scorer/              # AI scoring (Python + Node wrapper)
│   ├── storage/             # Database repositories
│   ├── sync/                # Google Sheets sync (optional)
│   └── utils/               # Logging & error handling
│
├── 📁 scripts/              # Database scripts
│   └── init-db.sql          # Schema + functions
│
└── 📁 logs/                 # Runtime logs (generated)
```

---

## 🎯 Core Components

### 1. Orchestrator (`src/orchestrator/index.js`)
- **What**: Main engine coordinator
- **When**: Runs on cron schedule (default: every 4 hours)
- **Does**: 
  - Coordinates all scrapers
  - Manages scoring workflow
  - Logs summary statistics

### 2. Scrapers (`src/scrapers/`)
- **What**: Platform-specific job scrapers
- **Platforms**: LinkedIn, Naukri, Indeed, RemoteOK, WWR, Wellfound, Himalayas, Remotive
- **Status**: RemoteOK ✅ | Others 🔨 (placeholders)

### 3. AI Scorer (`src/scorer/`)
- **Python** (`scorer.py`): Gemini/OpenAI integration
- **Node.js** (`runner.js`): Subprocess wrapper
- **Output**: 3 scores + recommendation

### 4. Database Layer (`src/storage/repositories/`)
- **jobs.js**: Job CRUD operations
- **scores.js**: Score management
- **applications.js**: Application tracking
- **users.js**: User & resume management

### 5. Utilities (`src/utils/`)
- **logger.js**: Winston logging (4 log files)
- **errors.js**: Custom error classes

---

## 🗄️ Database Schema

```sql
users
├─ id (UUID)
├─ email (UNIQUE)
└─ created_at

resumes
├─ id (UUID)
├─ user_id (FK → users)
├─ resume_json (JSONB)
├─ created_at
└─ updated_at

jobs
├─ id (UUID)
├─ platform (text)
├─ job_title (text)
├─ company (text)
├─ job_link (UNIQUE)
├─ location (text)
├─ job_description (text)
├─ scraped_at
└─ created_at

job_scores
├─ id (UUID)
├─ job_id (FK → jobs)
├─ user_id (FK → users)
├─ skill_match_score (0-100)
├─ role_stretch_score (0-100)
├─ risk_reward_score (0-100)
├─ missing_skills (JSONB)
├─ ai_recommendation (text)
├─ reason (text)
└─ scored_at
└─ UNIQUE(job_id, user_id)

applications
├─ id (UUID)
├─ job_id (FK → jobs)
├─ user_id (FK → users)
├─ auto_apply_enabled (bool)
├─ applied (bool)
├─ applied_at
├─ callback (bool)
├─ callback_at
├─ notes (text)
└─ created_at
└─ UNIQUE(job_id, user_id)
```

---

## ⚙️ Configuration

### Environment Variables
```bash
# Database
SUPABASE_DB_URL=postgresql://...

# AI Provider
AI_PROVIDER=gemini  # or 'openai'
GEMINI_API_KEY=...
OPENAI_API_KEY=...  # if using OpenAI

# User
DEFAULT_USER_EMAIL=your@email.com

# Schedule
CRON_SCHEDULE="0 */4 * * *"  # Every 4 hours

# Optional
GOOGLE_SHEETS_ENABLED=false
LOG_LEVEL=info
```

### Platform Configuration (`config/platforms.js`)
```javascript
{
  platform_name: {
    enabled: true/false,
    searchParams: { ... },
    rateLimit: {
      requestsPerMinute: X,
      delayBetweenRequests: Y
    }
  }
}
```

---

## 🧠 AI Scoring Logic

### Input
- Resume (JSON structured data)
- Job description (full text)
- Candidate context (1.5 years exp, targeting PE2)

### Output JSON
```json
{
  "skill_match": 75,
  "role_stretch": 68,
  "risk_reward": 70,
  "missing_skills": ["Kubernetes"],
  "apply_recommendation": "auto_apply",
  "reason": "Strong DevOps match..."
}
```

### Auto-Apply Decision
Job is flagged `auto_apply_enabled=TRUE` if **ANY**:
- `skill_match ≥ 70 AND role_stretch ≥ 65`
- `skill_match ≥ 75`
- `risk_reward ≥ 70`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Supabase account (free)
- Gemini API key (free)

### Installation
```bash
cd engine
npm install
pip install -r requirements.txt
cp .env.example .env
# Edit .env
```

### Initialize Database
Run `scripts/init-db.sql` in Supabase SQL Editor

### Add Resume
```sql
INSERT INTO users (email) VALUES ('you@email.com');
INSERT INTO resumes (user_id, resume_json)
SELECT id, '{ ... }'::jsonb FROM users WHERE email = 'you@email.com';
```

### Run
```bash
npm start
```

---

## 📊 Expected Performance

| Metric | Current (RemoteOK) | With All Platforms |
|--------|-------------------|-------------------|
| Jobs/day | 50-100 | 300-500 |
| Scored/day | 30-60 | 150-200 |
| Auto-apply candidates/day | 10-20 | 50-80 |

### Callback Estimates
- 100 applications → 8-12 callbacks
- 300 applications/month → 20-30 callbacks

---

## 🛠️ Development Roadmap

### ✅ Completed
- [x] Database schema
- [x] Orchestrator engine
- [x] RemoteOK scraper
- [x] AI scoring (Gemini + OpenAI)
- [x] Auto-apply logic
- [x] Logging system
- [x] Error handling

### 🔨 Next Up
- [ ] LinkedIn scraper (highest priority)
- [ ] Naukri scraper
- [ ] Indeed scraper
- [ ] Auto-apply automation
- [ ] Callback tracking
- [ ] Dashboard (optional)

---

## 📞 Support & Troubleshooting

### Common Issues
- **Python not found**: Ensure Python 3 is in PATH
- **DB connection failed**: Check `SUPABASE_DB_URL`
- **AI errors**: Verify API key and quota

### Debug Logs
```bash
tail -f logs/app.log
tail -f logs/scraper.log
tail -f logs/scorer.log
tail -f logs/errors.log
```

---

## 📚 Additional Resources

### Database Queries
```sql
-- Get auto-apply jobs
SELECT * FROM get_pending_auto_apply_jobs('user-uuid');

-- Get statistics
SELECT * FROM get_user_stats('user-uuid');

-- Top scored jobs
SELECT j.job_title, js.skill_match_score
FROM job_scores js
JOIN jobs j ON js.job_id = j.id
WHERE js.user_id = 'user-uuid'
ORDER BY js.skill_match_score DESC;
```

### Extending the System
1. **New scraper**: Extend `BaseScraper` class
2. **New AI provider**: Add to `config/ai.js`
3. **New scoring logic**: Edit threshold rules

---

## 🎓 What You'll Learn

This project demonstrates:
- ✅ Microservices architecture
- ✅ Polyglot systems (Node.js + Python)
- ✅ AI/LLM integration
- ✅ Database design (PostgreSQL + JSONB)
- ✅ Cron-based automation
- ✅ Error handling patterns
- ✅ Logging best practices
- ✅ Configuration management

---

## 💰 Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Supabase | Free | $0 |
| Gemini API | Free | $0 |
| OpenAI (optional) | Pay-as-you-go | ~$3/month |
| Hosting (EC2) | t3.micro | ~$8/month |
| **Total** | | **$0-11/month** |

---

## 📄 License

MIT License - Use however you want!

---

## 🎉 Final Notes

This is a **production-ready backend engine** — not a tutorial project.

You now have:
- ✅ Complete database schema
- ✅ Working orchestrator
- ✅ Functional scraper (RemoteOK)
- ✅ AI scoring system
- ✅ Comprehensive logging
- ✅ Error handling
- ✅ Full documentation

**Next steps**: Implement the LinkedIn scraper and start applying!

---

Built for aggressive job hunters who take action. 🚀
