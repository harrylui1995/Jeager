-- Database Schema: LinkedIn CV-Based Connection Finder
-- Target: Supabase PostgreSQL
-- Date: 2025-11-15
-- Branch: 001-linkedin-cv-matcher

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: user_profiles (Optional extension of Supabase Auth users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  search_quota_remaining INT DEFAULT 10 CHECK (search_quota_remaining >= 0),
  quota_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- TABLE: cv_metadata
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cv_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
  file_type TEXT NOT NULL CHECK (file_type IN (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  )),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT,
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cv_metadata
CREATE INDEX idx_cv_metadata_user_id ON public.cv_metadata(user_id);
CREATE INDEX idx_cv_metadata_status ON public.cv_metadata(parsing_status);
CREATE INDEX idx_cv_metadata_uploaded_at ON public.cv_metadata(uploaded_at DESC);

-- RLS Policy for cv_metadata
ALTER TABLE public.cv_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own CV metadata"
ON public.cv_metadata FOR ALL
USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: search_sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES public.cv_metadata(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('company', 'profile')),
  filters JSONB NOT NULL,
  results_count INTEGER DEFAULT 0 CHECK (results_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search_sessions
CREATE INDEX idx_search_sessions_user_id ON public.search_sessions(user_id);
CREATE INDEX idx_search_sessions_cv_id ON public.search_sessions(cv_id);
CREATE INDEX idx_search_sessions_type ON public.search_sessions(search_type);
CREATE INDEX idx_search_sessions_created_at ON public.search_sessions(created_at DESC);

-- RLS Policy for search_sessions
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own search sessions"
ON public.search_sessions FOR ALL
USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: company_matches
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.company_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES public.cv_metadata(id) ON DELETE CASCADE,
  search_session_id UUID REFERENCES public.search_sessions(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL CHECK (linkedin_url LIKE 'https://www.linkedin.com/company/%'),
  industry TEXT,
  company_size TEXT,
  location TEXT,
  description TEXT,
  match_score NUMERIC(3,2) NOT NULL CHECK (match_score >= 0.00 AND match_score <= 1.00),
  matching_criteria JSONB NOT NULL,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cv_id, linkedin_url)
);

-- Indexes for company_matches
CREATE INDEX idx_company_matches_user_id ON public.company_matches(user_id);
CREATE INDEX idx_company_matches_cv_id ON public.company_matches(cv_id);
CREATE INDEX idx_company_matches_session_id ON public.company_matches(search_session_id);
CREATE INDEX idx_company_matches_score ON public.company_matches(match_score DESC);
CREATE INDEX idx_company_matches_saved ON public.company_matches(user_id, is_saved) WHERE is_saved = TRUE;

-- RLS Policy for company_matches
ALTER TABLE public.company_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own company matches"
ON public.company_matches FOR ALL
USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: profile_matches
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profile_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES public.cv_metadata(id) ON DELETE CASCADE,
  search_session_id UUID REFERENCES public.search_sessions(id) ON DELETE SET NULL,
  profile_name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL CHECK (linkedin_url LIKE 'https://www.linkedin.com/in/%'),
  "current_role" TEXT,
  current_company TEXT,
  location TEXT,
  headline TEXT,
  shared_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  shared_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  match_score NUMERIC(3,2) NOT NULL CHECK (match_score >= 0.00 AND match_score <= 1.00),
  conversation_starter TEXT,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cv_id, linkedin_url)
);

-- Indexes for profile_matches
CREATE INDEX idx_profile_matches_user_id ON public.profile_matches(user_id);
CREATE INDEX idx_profile_matches_cv_id ON public.profile_matches(cv_id);
CREATE INDEX idx_profile_matches_session_id ON public.profile_matches(search_session_id);
CREATE INDEX idx_profile_matches_score ON public.profile_matches(match_score DESC);
CREATE INDEX idx_profile_matches_saved ON public.profile_matches(user_id, is_saved) WHERE is_saved = TRUE;

-- RLS Policy for profile_matches
ALTER TABLE public.profile_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own profile matches"
ON public.profile_matches FOR ALL
USING (auth.uid() = user_id);

-- =============================================================================
-- STORAGE BUCKETS & POLICIES
-- =============================================================================

-- Create storage bucket for CVs (run this via Supabase Dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);

-- Storage policy: Users can only access their own CV files
-- CREATE POLICY "Users can upload their own CVs"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can view their own CVs"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can delete their own CVs"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at for cv_metadata
CREATE TRIGGER update_cv_metadata_updated_at
BEFORE UPDATE ON public.cv_metadata
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at for company_matches
CREATE TRIGGER update_company_matches_updated_at
BEFORE UPDATE ON public.company_matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at for profile_matches
CREATE TRIGGER update_profile_matches_updated_at
BEFORE UPDATE ON public.profile_matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Reset daily search quota for free users
CREATE OR REPLACE FUNCTION public.reset_daily_quota()
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET search_quota_remaining = 10,
      quota_reset_at = NOW() + INTERVAL '1 day'
  WHERE subscription_tier = 'free'
    AND quota_reset_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: Schedule this function to run daily via pg_cron or Supabase Edge Function
-- Example using pg_cron (if available):
-- SELECT cron.schedule('reset-daily-quota', '0 0 * * *', 'SELECT public.reset_daily_quota()');

-- =============================================================================
-- SEED DATA (Development Only)
-- =============================================================================

-- Example seed data for testing (remove in production)
-- INSERT INTO public.user_profiles (user_id, display_name, subscription_tier)
-- VALUES
--   ('existing-user-uuid-1', 'Test User 1', 'free'),
--   ('existing-user-uuid-2', 'Test User 2', 'premium');

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. Run this schema via Supabase SQL Editor or migration tools
-- 2. Ensure Supabase Auth is configured with email/password or OAuth providers
-- 3. Storage bucket 'cvs' must be created via Supabase Dashboard
-- 4. Storage policies are commented above (apply via Dashboard or API)
-- 5. For production, consider adding:
--    - Backup policies (daily snapshots)
--    - Monitoring for RLS policy performance
--    - Analytics queries (user growth, search patterns)
-- 6. Data retention: Schedule a job to delete CVs older than 90 days inactive
