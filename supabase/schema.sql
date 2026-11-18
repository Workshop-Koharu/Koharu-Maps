-- ====================================================================
-- Koharu Maps — Supabase PostgreSQL Schema
-- Database setup for users, api keys, favorites, and verification codes
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'local',
    provider_id TEXT,
    avatar_url TEXT,
    last_login_ip TEXT,
    last_login_location TEXT,
    last_login_device TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT '장소',
    address TEXT,
    lon DOUBLE PRECISION NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Verification Codes Table (Resend Email Verification)
CREATE TABLE IF NOT EXISTS public.verification_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at BIGINT NOT NULL
);

-- 5. Policy Change Email Notice Log Table
-- Tracks mandatory 30-day advance notice emails sent to users
CREATE TABLE IF NOT EXISTS public.policy_notice_logs (
    id SERIAL PRIMARY KEY,
    policy_name TEXT NOT NULL,
    effective_date DATE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_count INTEGER NOT NULL,
    notes TEXT
);

-- Indexes for Ultra-Fast Lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(key);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
