# Data Model: LinkedIn CV-Based Connection Finder

**Date**: 2025-11-15
**Branch**: `001-linkedin-cv-matcher`
**Purpose**: Define database schema and entity relationships for Supabase PostgreSQL

---

## Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────────┐         ┌────────────────┐
│   users      │1      * │  cv_metadata     │1      * │ cv_files       │
│              ├─────────┤                  ├─────────┤                │
│ (Supabase    │         │                  │         │ (Storage ref)  │
│  Auth)       │         │                  │         │                │
└──────────────┘         └──────────────────┘         └────────────────┘
                                 │
                                 │ 1
                                 │
                                 │ *
                         ┌───────┴──────────┐
                         │                  │
                    ┌────┴─────┐      ┌─────┴────┐
                    │          │      │          │
              ┌─────┤ company  │      │ profile  │
              │     │ _matches │      │ _matches │
              │     │          │      │          │
              │     └──────────┘      └──────────┘
              │
              │ *
              │
              │ 1
      ┌───────┴──────────┐
      │  search_sessions │
      │                  │
      └──────────────────┘
```

---

## Entity Definitions

### 1. users (Managed by Supabase Auth)

**Purpose**: Represents authenticated users of the application.

**Note**: This table is managed by Supabase Auth. We reference `auth.users.id` in our custom tables.

**Fields** (Read-only, for reference):
- `id` (UUID, Primary Key): User unique identifier
- `email` (String): User email address
- `created_at` (Timestamp): Account creation timestamp
- `updated_at` (Timestamp): Last update timestamp

**Custom Profile Extension** (Optional for future):
```sql
-- If needed, create a separate public.user_profiles table
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free' or 'premium'
  search_quota_remaining INT DEFAULT 10, -- Reset daily for free users
  quota_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. cv_metadata

**Purpose**: Stores extracted and parsed CV information for each user upload.

**Fields**:
- `id` (UUID, Primary Key, Default: `gen_random_uuid()`): Unique CV record identifier
- `user_id` (UUID, Foreign Key → auth.users.id, NOT NULL): Owner of this CV
- `storage_path` (TEXT, NOT NULL): Path to CV file in Supabase Storage (e.g., `cvs/{user_id}/{timestamp}_{filename}`)
- `original_filename` (TEXT, NOT NULL): Original filename uploaded by user
- `file_size_bytes` (INTEGER, NOT NULL): File size in bytes (max 5MB = 5,242,880 bytes)
- `file_type` (TEXT, NOT NULL): MIME type (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain)
- `uploaded_at` (TIMESTAMPTZ, DEFAULT NOW()): Upload timestamp
- `parsed_at` (TIMESTAMPTZ, NULLABLE): When CV parsing completed
- `parsing_status` (TEXT, DEFAULT 'pending'): Status: 'pending', 'processing', 'completed', 'failed'
- `parsing_error` (TEXT, NULLABLE): Error message if parsing failed
- `extracted_data` (JSONB, NULLABLE): Parsed CV data (structure defined below)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Record creation
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): Last modification

**Indexes**:
```sql
CREATE INDEX idx_cv_metadata_user_id ON cv_metadata(user_id);
CREATE INDEX idx_cv_metadata_status ON cv_metadata(parsing_status);
CREATE INDEX idx_cv_metadata_uploaded_at ON cv_metadata(uploaded_at DESC);
```

**RLS Policy**:
```sql
-- Users can only access their own CV metadata
CREATE POLICY "Users can CRUD their own CV metadata"
ON cv_metadata FOR ALL
USING (auth.uid() = user_id);
```

**`extracted_data` JSONB Structure**:
```json
{
  "personal": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "location": "San Francisco, CA"
  },
  "summary": "Experienced software engineer with 8 years...",
  "skills": [
    {"name": "JavaScript", "category": "technical"},
    {"name": "Python", "category": "technical"},
    {"name": "Leadership", "category": "soft"}
  ],
  "experience": [
    {
      "job_title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "start_date": "2020-01",
      "end_date": "2023-12",
      "duration_months": 47,
      "description": "Led team of 5 engineers..."
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of California, Berkeley",
      "graduation_year": 2015
    }
  ],
  "industries": ["Technology", "SaaS", "Fintech"],
  "career_goals": "Seeking senior engineering or leadership roles in early-stage startups",
  "accuracy_score": 0.85
}
```

**Validation Rules**:
- `file_size_bytes` MUST be ≤ 5,242,880 (5MB)
- `file_type` MUST be one of: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
- `parsing_status` MUST be one of: pending, processing, completed, failed
- `extracted_data.skills` MUST have at least 1 skill for completed parsing
- `extracted_data.experience` SHOULD have at least 1 experience entry

---

### 3. company_matches

**Purpose**: Stores recommended companies for user's CV profile.

**Fields**:
- `id` (UUID, Primary Key, Default: `gen_random_uuid()`): Unique match identifier
- `user_id` (UUID, Foreign Key → auth.users.id, NOT NULL): User who received this recommendation
- `cv_id` (UUID, Foreign Key → cv_metadata.id, NOT NULL, ON DELETE CASCADE): Source CV for this match
- `search_session_id` (UUID, Foreign Key → search_sessions.id, NULLABLE, ON DELETE SET NULL): Associated search session
- `company_name` (TEXT, NOT NULL): Company name
- `linkedin_url` (TEXT, NOT NULL): LinkedIn company page URL
- `industry` (TEXT, NULLABLE): Industry classification
- `company_size` (TEXT, NULLABLE): e.g., "51-200 employees", "1001-5000 employees"
- `location` (TEXT, NULLABLE): Primary location or headquarters
- `description` (TEXT, NULLABLE): Company description/tagline
- `match_score` (NUMERIC(3,2), NOT NULL): Relevance score 0.00-1.00
- `matching_criteria` (JSONB, NOT NULL): Explanation of why matched (structure below)
- `is_saved` (BOOLEAN, DEFAULT FALSE): User bookmarked this company
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): When match was generated
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): Last modification

**Indexes**:
```sql
CREATE INDEX idx_company_matches_user_id ON company_matches(user_id);
CREATE INDEX idx_company_matches_cv_id ON company_matches(cv_id);
CREATE INDEX idx_company_matches_session_id ON company_matches(search_session_id);
CREATE INDEX idx_company_matches_score ON company_matches(match_score DESC);
CREATE INDEX idx_company_matches_saved ON company_matches(user_id, is_saved) WHERE is_saved = TRUE;
```

**RLS Policy**:
```sql
CREATE POLICY "Users can CRUD their own company matches"
ON company_matches FOR ALL
USING (auth.uid() = user_id);
```

**`matching_criteria` JSONB Structure**:
```json
{
  "matched_skills": ["JavaScript", "Python", "Cloud Architecture"],
  "matched_industries": ["Technology", "SaaS"],
  "location_match": true,
  "size_preference": "startup",
  "explanation": "Matches 3 of your key skills and operates in your target industry."
}
```

**Validation Rules**:
- `match_score` MUST be between 0.00 and 1.00
- `linkedin_url` MUST start with https://www.linkedin.com/company/
- Unique constraint on (user_id, cv_id, linkedin_url) to prevent duplicates

---

### 4. profile_matches

**Purpose**: Stores recommended LinkedIn profiles (individuals) for user's networking.

**Fields**:
- `id` (UUID, Primary Key, Default: `gen_random_uuid()`): Unique match identifier
- `user_id` (UUID, Foreign Key → auth.users.id, NOT NULL): User who received this recommendation
- `cv_id` (UUID, Foreign Key → cv_metadata.id, NOT NULL, ON DELETE CASCADE): Source CV for this match
- `search_session_id` (UUID, Foreign Key → search_sessions.id, NULLABLE, ON DELETE SET NULL): Associated search session
- `profile_name` (TEXT, NOT NULL): Individual's name
- `linkedin_url` (TEXT, NOT NULL): LinkedIn profile URL
- `current_role` (TEXT, NULLABLE): Current job title
- `current_company` (TEXT, NULLABLE): Current employer
- `location` (TEXT, NULLABLE): Profile location
- `headline` (TEXT, NULLABLE): LinkedIn headline/tagline
- `shared_skills` (TEXT[], DEFAULT ARRAY[]::TEXT[]): Skills in common with user
- `shared_interests` (TEXT[], DEFAULT ARRAY[]::TEXT[]): Shared interests/industries
- `match_score` (NUMERIC(3,2), NOT NULL): Relevance score 0.00-1.00
- `conversation_starter` (TEXT, NULLABLE): Suggested icebreaker based on common ground
- `is_saved` (BOOLEAN, DEFAULT FALSE): User bookmarked this profile
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): When match was generated
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): Last modification

**Indexes**:
```sql
CREATE INDEX idx_profile_matches_user_id ON profile_matches(user_id);
CREATE INDEX idx_profile_matches_cv_id ON profile_matches(cv_id);
CREATE INDEX idx_profile_matches_session_id ON profile_matches(search_session_id);
CREATE INDEX idx_profile_matches_score ON profile_matches(match_score DESC);
CREATE INDEX idx_profile_matches_saved ON profile_matches(user_id, is_saved) WHERE is_saved = TRUE;
```

**RLS Policy**:
```sql
CREATE POLICY "Users can CRUD their own profile matches"
ON profile_matches FOR ALL
USING (auth.uid() = user_id);
```

**Validation Rules**:
- `match_score` MUST be between 0.00 and 1.00
- `linkedin_url` MUST start with https://www.linkedin.com/in/
- Unique constraint on (user_id, cv_id, linkedin_url) to prevent duplicates

---

### 5. search_sessions

**Purpose**: Tracks search queries and filters applied by users for repeatability and analytics.

**Fields**:
- `id` (UUID, Primary Key, Default: `gen_random_uuid()`): Unique session identifier
- `user_id` (UUID, Foreign Key → auth.users.id, NOT NULL): User who performed search
- `cv_id` (UUID, Foreign Key → cv_metadata.id, NOT NULL, ON DELETE CASCADE): CV used for search
- `search_type` (TEXT, NOT NULL): 'company' or 'profile'
- `filters` (JSONB, NOT NULL): Applied filters (structure below)
- `results_count` (INTEGER, DEFAULT 0): Number of results returned
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Search timestamp

**Indexes**:
```sql
CREATE INDEX idx_search_sessions_user_id ON search_sessions(user_id);
CREATE INDEX idx_search_sessions_cv_id ON search_sessions(cv_id);
CREATE INDEX idx_search_sessions_type ON search_sessions(search_type);
CREATE INDEX idx_search_sessions_created_at ON search_sessions(created_at DESC);
```

**RLS Policy**:
```sql
CREATE POLICY "Users can CRUD their own search sessions"
ON search_sessions FOR ALL
USING (auth.uid() = user_id);
```

**`filters` JSONB Structure** (for company searches):
```json
{
  "industries": ["Technology", "Healthcare"],
  "locations": ["San Francisco, CA", "New York, NY"],
  "company_sizes": ["51-200", "201-500"],
  "keywords": ["AI", "Machine Learning"]
}
```

**`filters` JSONB Structure** (for profile searches):
```json
{
  "job_titles": ["Senior Engineer", "Engineering Manager"],
  "companies": ["Google", "Meta"],
  "seniority_levels": ["senior", "lead"],
  "skills": ["Python", "Kubernetes"],
  "locations": ["Remote", "San Francisco"]
}
```

**Validation Rules**:
- `search_type` MUST be 'company' or 'profile'
- `results_count` MUST be ≥ 0

---

## Database Schema Summary

**Total Tables**: 5 (1 Supabase Auth + 4 custom + 1 optional user_profiles)

**Storage Estimates** (for 500 users):
- `cv_metadata`: ~500 rows × 10KB avg = 5MB
- `company_matches`: ~500 users × 20 companies × 2KB = 20MB
- `profile_matches`: ~500 users × 30 profiles × 2KB = 30MB
- `search_sessions`: ~500 users × 50 searches × 1KB = 25MB
- **Total Database**: ~80MB (well within Supabase free tier: 500MB)

**Key Relationships**:
1. One user → Many CVs (cv_metadata)
2. One CV → Many company matches
3. One CV → Many profile matches
4. One user → Many search sessions
5. One search session → Many company/profile matches (optional linkage)

**Cascade Deletes**:
- Delete user → Cascade delete all cv_metadata (via Supabase Auth trigger)
- Delete cv_metadata → Cascade delete associated company_matches, profile_matches, search_sessions
- Delete search_session → Set NULL on associated matches (preserve match data)

---

## State Transitions

### CV Metadata Parsing Status

```
pending → processing → completed
                    ↘ failed
```

**Transitions**:
1. **Upload**: Create record with `parsing_status = 'pending'`
2. **Start Parsing**: Update to `parsing_status = 'processing'`, set `parsed_at = NOW()`
3. **Success**: Update to `parsing_status = 'completed'`, populate `extracted_data`
4. **Failure**: Update to `parsing_status = 'failed'`, set `parsing_error` message

---

## Data Retention & Privacy

**GDPR/CCPA Compliance**:
- Users can delete their data anytime via "Delete My Data" button
- Deletion triggers:
  1. Delete all `cv_metadata` records (cascade deletes matches and sessions)
  2. Delete CV files from Supabase Storage
  3. Optionally anonymize user profile (per Supabase Auth policies)
- Retention policy: CVs older than 90 days with no activity are flagged for deletion (user notified)

**Encryption**:
- Supabase provides encryption at rest by default
- Encryption in transit via HTTPS/TLS

---

## Next Steps

- ✅ Data model documented
- ➡️ Generate database schema SQL (contracts/database.sql)
- ➡️ Generate API contracts (contracts/api.md)
- ➡️ Generate quickstart.md with database setup instructions
