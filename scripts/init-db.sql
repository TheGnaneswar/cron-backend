-- ============================================================
-- Simplified Single-User Job Hunter Database Schema
-- PostgreSQL / Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- User configuration (single user)
CREATE TABLE IF NOT EXISTS user_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    resume_json JSONB NOT NULL,
    target_roles TEXT[] DEFAULT ARRAY['Platform Engineer', 'Cloud Engineer', 'DevOps Engineer'],
    min_salary_inr INTEGER DEFAULT 1200000,  -- 12 LPA
    preferred_locations TEXT[] DEFAULT ARRAY['Bangalore', 'Hyderabad', 'Pune', 'Remote'],
    scraping_mode TEXT DEFAULT 'past_day' CHECK (scraping_mode IN ('past_day', 'past_week')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Jobs table (with better filtering fields)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT,
    company_size TEXT,  -- startup, scaleup, mid-size, enterprise
    job_link TEXT NOT NULL UNIQUE,
    location TEXT,
    job_type TEXT,  -- full-time, contract, etc.
    
    -- Salary information
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'INR',
    
    -- Experience
    experience_min INTEGER,
    experience_max INTEGER,
    
    -- Job details
    job_description TEXT,
    job_keywords TEXT[],  -- Extracted keywords for faster filtering
    
    -- Metadata
    posted_date TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Quality indicators
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE
);

-- Job scores (simplified for single user)
CREATE TABLE IF NOT EXISTS job_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    
    -- AI scores
    skill_match_score INT CHECK (skill_match_score BETWEEN 0 AND 100),
    role_stretch_score INT CHECK (role_stretch_score BETWEEN 0 AND 100),
    risk_reward_score INT CHECK (risk_reward_score BETWEEN 0 AND 100),
    
    -- Pre-filter scores (before AI)
    title_match_score INT CHECK (title_match_score BETWEEN 0 AND 100),
    keyword_density_score INT CHECK (keyword_density_score BETWEEN 0 AND 100),
    salary_match_score INT CHECK (salary_match_score BETWEEN 0 AND 100),
    experience_match_score INT CHECK (experience_match_score BETWEEN 0 AND 100),
    
    -- Combined score
    overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
    
    -- AI analysis
    missing_skills JSONB,
    ai_recommendation TEXT CHECK (ai_recommendation IN ('auto_apply', 'human_review', 'skip')),
    reason TEXT,
    
    scored_at TIMESTAMP DEFAULT NOW()
);

-- Applications tracking
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    
    auto_apply_enabled BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    
    callback BOOLEAN DEFAULT FALSE,
    callback_at TIMESTAMP,
    callback_type TEXT,  -- phone, email, interview_scheduled
    
    interview_stage TEXT,  -- screening, technical, behavioral, final
    offer_received BOOLEAN DEFAULT FALSE,
    offer_amount INTEGER,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Jobs
CREATE INDEX IF NOT EXISTS idx_jobs_job_link ON jobs(job_link);
CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary_min) WHERE salary_min IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_keywords ON jobs USING GIN(job_keywords);

-- Job Scores
CREATE INDEX IF NOT EXISTS idx_job_scores_job_id ON job_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_job_scores_recommendation ON job_scores(ai_recommendation);
CREATE INDEX IF NOT EXISTS idx_job_scores_overall ON job_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_scores_skill_match ON job_scores(skill_match_score DESC);

-- Applications
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applied ON applications(applied);
CREATE INDEX IF NOT EXISTS idx_applications_callback ON applications(callback);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Get unscored jobs with filtering
CREATE OR REPLACE FUNCTION get_unscored_jobs(p_limit INT DEFAULT 100)
RETURNS TABLE (
    id UUID,
    job_title TEXT,
    company TEXT,
    job_link TEXT,
    job_description TEXT,
    platform TEXT,
    location TEXT,
    salary_min INTEGER,
    experience_min INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.job_title,
        j.company,
        j.job_link,
        j.job_description,
        j.platform,
        j.location,
        j.salary_min,
        j.experience_min
    FROM jobs j
    LEFT JOIN job_scores js ON j.id = js.job_id
    WHERE js.id IS NULL
    ORDER BY j.posted_date DESC NULLS LAST, j.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get pending auto-apply jobs
CREATE OR REPLACE FUNCTION get_pending_auto_apply_jobs()
RETURNS TABLE (
    job_id UUID,
    job_title TEXT,
    company TEXT,
    job_link TEXT,
    platform TEXT,
    ai_recommendation TEXT,
    skill_match_score INT,
    overall_score INT,
    salary_min INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.job_title,
        j.company,
        j.job_link,
        j.platform,
        js.ai_recommendation,
        js.skill_match_score,
        js.overall_score,
        j.salary_min
    FROM jobs j
    JOIN job_scores js ON j.id = js.job_id
    JOIN applications a ON j.id = a.job_id
    WHERE js.ai_recommendation = 'auto_apply'
      AND a.applied = FALSE
      AND a.auto_apply_enabled = TRUE
    ORDER BY js.overall_score DESC, js.skill_match_score DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Get statistics
CREATE OR REPLACE FUNCTION get_stats()
RETURNS TABLE (
    total_jobs INT,
    total_scored INT,
    auto_apply_count INT,
    human_review_count INT,
    skip_count INT,
    applied_count INT,
    callback_count INT,
    interview_count INT,
    offer_count INT,
    avg_salary_applied INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT j.id)::INT,
        COUNT(DISTINCT js.job_id)::INT,
        COUNT(DISTINCT CASE WHEN js.ai_recommendation = 'auto_apply' THEN js.job_id END)::INT,
        COUNT(DISTINCT CASE WHEN js.ai_recommendation = 'human_review' THEN js.job_id END)::INT,
        COUNT(DISTINCT CASE WHEN js.ai_recommendation = 'skip' THEN js.job_id END)::INT,
        COUNT(DISTINCT CASE WHEN a.applied = TRUE THEN a.job_id END)::INT,
        COUNT(DISTINCT CASE WHEN a.callback = TRUE THEN a.job_id END)::INT,
        COUNT(DISTINCT CASE WHEN a.interview_stage IS NOT NULL THEN a.job_id END)::INT,
        COUNT(DISTINCT CASE WHEN a.offer_received = TRUE THEN a.job_id END)::INT,
        AVG(j.salary_min)::INT
    FROM jobs j
    LEFT JOIN job_scores js ON j.id = js.job_id
    LEFT JOIN applications a ON j.id = a.job_id;
END;
$$ LANGUAGE plpgsql;

-- Get jobs by salary range
CREATE OR REPLACE FUNCTION get_high_paying_jobs(min_salary INT DEFAULT 1800000)
RETURNS TABLE (
    id UUID,
    job_title TEXT,
    company TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    skill_match_score INT,
    overall_score INT,
    job_link TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.job_title,
        j.company,
        j.salary_min,
        j.salary_max,
        js.skill_match_score,
        js.overall_score,
        j.job_link
    FROM jobs j
    JOIN job_scores js ON j.id = js.job_id
    WHERE j.salary_min >= min_salary
    ORDER BY j.salary_min DESC, js.overall_score DESC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql;

-- Get recent jobs by time filter
CREATE OR REPLACE FUNCTION get_recent_jobs(hours_ago INT DEFAULT 24)
RETURNS TABLE (
    id UUID,
    job_title TEXT,
    company TEXT,
    platform TEXT,
    posted_date TIMESTAMP,
    job_link TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.job_title,
        j.company,
        j.platform,
        j.posted_date,
        j.job_link
    FROM jobs j
    WHERE j.posted_date >= NOW() - (hours_ago || ' hours')::INTERVAL
       OR (j.posted_date IS NULL AND j.created_at >= NOW() - (hours_ago || ' hours')::INTERVAL)
    ORDER BY j.posted_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Create default user config (update with your details)
INSERT INTO user_config (email, name, resume_json, target_roles, min_salary_inr)
VALUES (
    'your@email.com',
    'Your Name',
    '{
        "experience_years": 1.5,
        "current_role": "DevOps Engineer",
        "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "GitLab CI/CD", "Python", "Node.js", "PostgreSQL", "Prometheus", "Grafana"],
        "projects": [
            "Deployed microservices on EKS with Karpenter autoscaling",
            "Built CI/CD pipelines for 8+ services",
            "Implemented monitoring stack with Prometheus and Loki"
        ],
        "certifications": [],
        "education": "B.Tech in Computer Science"
    }'::jsonb,
    ARRAY['Platform Engineer', 'Cloud Engineer', 'DevOps Engineer', 'SRE'],
    1200000
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE user_config IS 'Single user configuration and resume';
COMMENT ON TABLE jobs IS 'Scraped job listings with rich metadata';
COMMENT ON TABLE job_scores IS 'AI-generated scores for jobs (single user)';
COMMENT ON TABLE applications IS 'Job applications tracking';

COMMENT ON COLUMN jobs.job_keywords IS 'Extracted keywords for fast filtering (indexed with GIN)';
COMMENT ON COLUMN jobs.posted_date IS 'When the job was posted on the platform (if available)';
COMMENT ON COLUMN job_scores.overall_score IS 'Weighted combination of all scores';
