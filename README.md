# Job Hunter Engine

A cron-based backend engine for aggressive job hunting targeting PE2 roles.

## Architecture

- **Runtime**: Node.js (scrapers, orchestrator) + Python (AI scoring)
- **Database**: PostgreSQL (Supabase)
- **AI**: Gemini or OpenAI
- **Scheduler**: node-cron
- **Storage**: Google Sheets (optional mirror)

## Directory Structure

```
engine/
├── config/           # Configuration files
├── src/
│   ├── orchestrator/ # Main cron runner
│   ├── scrapers/     # Job scrapers (Node.js)
│   ├── storage/      # Database repositories
│   ├── scorer/       # AI scoring (Python)
│   ├── sync/         # Google Sheets sync
│   └── utils/        # Utilities
├── scripts/          # Database initialization
├── logs/             # Application logs
└── package.json
```

## Setup

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Initialize database**:
   ```bash
   psql -h <your-supabase-host> -U postgres -d postgres -f scripts/init-db.sql
   ```

5. **Run the engine**:
   ```bash
   npm start
   ```

## Platforms Supported

- LinkedIn
- Naukri
- Indeed
- RemoteOK
- We Work Remotely
- Wellfound
- Himalayas
- Remotive

## Scoring Strategy

The AI uses a 3-score system:

1. **Skill Match Score** (0-100): Tool/stack alignment
2. **Role Stretch Score** (0-100): How good the experience gap is
3. **Risk-to-Reward Score** (0-100): Job urgency/volume indicators

## Auto-Apply Logic

Jobs are auto-applied if ANY of these conditions are met:
- `skill_match >= 70 AND role_stretch >= 65`
- `skill_match >= 75`
- `risk_reward >= 70`

## Monitoring

Logs are stored in `logs/` directory:
- `app.log` - General application logs
- `scraper.log` - Scraper-specific logs
- `scorer.log` - AI scoring logs
- `errors.log` - Error tracking
