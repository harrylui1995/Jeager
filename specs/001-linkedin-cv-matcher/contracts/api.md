# API Contracts: LinkedIn CV-Based Connection Finder

**Date**: 2025-11-15
**Branch**: `001-linkedin-cv-matcher`
**Purpose**: Define client-side service interfaces and function signatures

**Note**: This is a client-side application using vanilla JavaScript. There is no traditional REST API. Instead, this document defines the public interface for JavaScript modules and services that interact with Supabase and external APIs.

---

## Module Structure

```
src/services/
├── supabase.js      # Supabase client initialization
├── auth.js          # Authentication service
├── storage.js       # CV file storage operations
├── database.js      # Database CRUD operations
├── parser.js        # CV parsing service
├── linkedin.js      # LinkedIn search integration
└── matcher.js       # Matching algorithm (scoring and ranking)
```

---

## 1. Authentication Service (`auth.js`)

**Purpose**: Handle user authentication via Supabase Auth.

### `signUp(email, password)`

**Description**: Register a new user account.

**Parameters**:
- `email` (string): User email address
- `password` (string): User password (min 8 characters)

**Returns**: `Promise<{ user, session, error }>`
- `user` (object | null): User object from Supabase Auth
- `session` (object | null): Session with JWT tokens
- `error` (Error | null): Error object if signup failed

**Example**:
```javascript
import { signUp } from './services/auth.js';

const { user, session, error } = await signUp('user@example.com', 'SecurePass123');
if (error) {
  console.error('Signup failed:', error.message);
} else {
  console.log('User created:', user.id);
}
```

---

### `signIn(email, password)`

**Description**: Authenticate existing user.

**Parameters**:
- `email` (string): User email
- `password` (string): User password

**Returns**: `Promise<{ user, session, error }>`

---

### `signOut()`

**Description**: Sign out the current user.

**Returns**: `Promise<{ error }>`

---

### `getCurrentUser()`

**Description**: Get the currently authenticated user.

**Returns**: `Promise<{ user, error }>`

---

### `onAuthStateChange(callback)`

**Description**: Listen for authentication state changes.

**Parameters**:
- `callback` (function): Callback function `(event, session) => void`

**Returns**: `{ data: { subscription }, error }`

---

## 2. Storage Service (`storage.js`)

**Purpose**: Manage CV file uploads and retrievals from Supabase Storage.

### `uploadCV(file, userId)`

**Description**: Upload a CV file to Supabase Storage.

**Parameters**:
- `file` (File): File object from input element
- `userId` (string): UUID of authenticated user

**Returns**: `Promise<{ storagePath, publicUrl, error }>`
- `storagePath` (string): Path in storage bucket (e.g., `cvs/{userId}/{timestamp}_{filename}`)
- `publicUrl` (string | null): Public URL if applicable
- `error` (Error | null): Upload error

**Validation**:
- File size ≤ 5MB
- File type: PDF, DOCX, or TXT
- Throws error if validation fails

**Example**:
```javascript
import { uploadCV } from './services/storage.js';

const fileInput = document.getElementById('cv-input');
const file = fileInput.files[0];
const { storagePath, error } = await uploadCV(file, currentUser.id);
```

---

### `downloadCV(storagePath)`

**Description**: Download a CV file from storage.

**Parameters**:
- `storagePath` (string): Storage path from cv_metadata

**Returns**: `Promise<{ blob, error }>`
- `blob` (Blob | null): File blob
- `error` (Error | null): Download error

---

### `deleteCV(storagePath)`

**Description**: Delete a CV file from storage.

**Parameters**:
- `storagePath` (string): Storage path to delete

**Returns**: `Promise<{ error }>`

---

## 3. Database Service (`database.js`)

**Purpose**: Perform CRUD operations on Supabase PostgreSQL tables.

### `createCVMetadata(cvData)`

**Description**: Create a new CV metadata record.

**Parameters**:
- `cvData` (object):
  ```javascript
  {
    user_id: string,
    storage_path: string,
    original_filename: string,
    file_size_bytes: number,
    file_type: string
  }
  ```

**Returns**: `Promise<{ data, error }>`
- `data` (object | null): Created cv_metadata record
- `error` (Error | null): Database error

---

### `updateCVMetadata(cvId, updates)`

**Description**: Update CV metadata (e.g., parsing status, extracted data).

**Parameters**:
- `cvId` (string): UUID of CV metadata record
- `updates` (object): Fields to update (e.g., `{ parsing_status: 'completed', extracted_data: {...} }`)

**Returns**: `Promise<{ data, error }>`

---

### `getCVMetadata(cvId)`

**Description**: Retrieve a single CV metadata record.

**Parameters**:
- `cvId` (string): UUID of CV record

**Returns**: `Promise<{ data, error }>`

---

### `listUserCVs(userId, options)`

**Description**: List all CVs for a user.

**Parameters**:
- `userId` (string): UUID of user
- `options` (object, optional):
  ```javascript
  {
    limit: number,
    offset: number,
    orderBy: 'uploaded_at' | 'created_at',
    orderDirection: 'asc' | 'desc'
  }
  ```

**Returns**: `Promise<{ data, count, error }>`
- `data` (array): Array of cv_metadata records
- `count` (number): Total count (for pagination)
- `error` (Error | null)

---

### `saveCompanyMatch(matchData)`

**Description**: Save a company recommendation to the database.

**Parameters**:
- `matchData` (object):
  ```javascript
  {
    user_id: string,
    cv_id: string,
    search_session_id: string | null,
    company_name: string,
    linkedin_url: string,
    industry: string,
    company_size: string,
    location: string,
    description: string,
    match_score: number, // 0.00-1.00
    matching_criteria: object,
    is_saved: boolean
  }
  ```

**Returns**: `Promise<{ data, error }>`

---

### `getCompanyMatches(userId, cvId, filters)`

**Description**: Retrieve company matches with optional filters.

**Parameters**:
- `userId` (string): UUID of user
- `cvId` (string | null): Filter by specific CV (optional)
- `filters` (object, optional):
  ```javascript
  {
    is_saved: boolean,
    min_score: number,
    industries: string[],
    locations: string[],
    limit: number,
    offset: number
  }
  ```

**Returns**: `Promise<{ data, count, error }>`

---

### `saveProfileMatch(matchData)`

**Description**: Save an individual profile recommendation.

**Parameters**: Similar to `saveCompanyMatch` but for profile_matches schema

**Returns**: `Promise<{ data, error }>`

---

### `getProfileMatches(userId, cvId, filters)`

**Description**: Retrieve profile matches with optional filters.

**Returns**: `Promise<{ data, count, error }>`

---

### `createSearchSession(sessionData)`

**Description**: Record a search session.

**Parameters**:
- `sessionData` (object):
  ```javascript
  {
    user_id: string,
    cv_id: string,
    search_type: 'company' | 'profile',
    filters: object,
    results_count: number
  }
  ```

**Returns**: `Promise<{ data, error }>`

---

### `deleteUserData(userId)`

**Description**: Delete all user data (GDPR compliance).

**Parameters**:
- `userId` (string): UUID of user

**Returns**: `Promise<{ error }>`

**Note**: Cascades to cv_metadata, company_matches, profile_matches, search_sessions

---

## 4. Parser Service (`parser.js`)

**Purpose**: Extract structured data from CV files.

### `parseCV(file)`

**Description**: Parse a CV file and extract structured information.

**Parameters**:
- `file` (File): CV file (PDF, DOCX, or TXT)

**Returns**: `Promise<{ extractedData, accuracyScore, error }>`
- `extractedData` (object | null): Parsed CV data (matches `extracted_data` JSONB structure from data-model.md)
- `accuracyScore` (number): Confidence score 0.00-1.00
- `error` (Error | null): Parsing error

**Example**:
```javascript
import { parseCV } from './services/parser.js';

const file = fileInput.files[0];
const { extractedData, accuracyScore, error } = await parseCV(file);
if (!error) {
  console.log('Extracted skills:', extractedData.skills);
  console.log('Accuracy:', accuracyScore);
}
```

---

### `extractSkills(text)`

**Description**: Extract skills from text using keyword matching and NLP.

**Parameters**:
- `text` (string): Raw text from CV

**Returns**: `Array<{ name: string, category: 'technical' | 'soft' }>`

---

### `extractExperience(text)`

**Description**: Extract work experience entries from CV text.

**Parameters**:
- `text` (string): Raw text

**Returns**: `Array<{ job_title, company, location, start_date, end_date, duration_months, description }>`

---

### `extractEducation(text)`

**Description**: Extract education entries.

**Returns**: `Array<{ degree, institution, graduation_year }>`

---

### `extractContactInfo(text)`

**Description**: Extract personal information (name, email, phone, LinkedIn URL).

**Returns**: `{ name, email, phone, linkedin_url, location }`

---

## 5. LinkedIn Service (`linkedin.js`)

**Purpose**: Search LinkedIn for companies and profiles via third-party API.

### `searchCompanies(query, filters)`

**Description**: Search for companies on LinkedIn.

**Parameters**:
- `query` (object):
  ```javascript
  {
    keywords: string[], // From CV industries/skills
    industries: string[]
  }
  ```
- `filters` (object, optional):
  ```javascript
  {
    locations: string[],
    company_sizes: string[],
    limit: number // Default 20, max 50
  }
  ```

**Returns**: `Promise<{ companies, error }>`
- `companies` (array): Array of company objects:
  ```javascript
  {
    name: string,
    linkedin_url: string,
    industry: string,
    size: string,
    location: string,
    description: string
  }
  ```
- `error` (Error | null): API error or rate limit exceeded

**Example**:
```javascript
import { searchCompanies } from './services/linkedin.js';

const { companies, error } = await searchCompanies(
  { keywords: ['AI', 'SaaS'], industries: ['Technology'] },
  { locations: ['San Francisco'], limit: 20 }
);
```

---

### `searchProfiles(query, filters)`

**Description**: Search for individual LinkedIn profiles.

**Parameters**:
- `query` (object):
  ```javascript
  {
    keywords: string[], // Job titles, skills
    companies: string[] // Optional: target companies
  }
  ```
- `filters` (object, optional):
  ```javascript
  {
    seniority_levels: string[], // 'entry', 'mid', 'senior', 'executive'
    locations: string[],
    skills: string[],
    limit: number // Default 30, max 50
  }
  ```

**Returns**: `Promise<{ profiles, error }>`
- `profiles` (array): Array of profile objects:
  ```javascript
  {
    name: string,
    linkedin_url: string,
    current_role: string,
    current_company: string,
    location: string,
    headline: string,
    skills: string[] // If available
  }
  ```

---

### `checkRateLimit(userId)`

**Description**: Check remaining API quota for user.

**Parameters**:
- `userId` (string): User UUID

**Returns**: `Promise<{ remaining, resetAt, error }>`
- `remaining` (number): Searches remaining today
- `resetAt` (timestamp): When quota resets

---

## 6. Matcher Service (`matcher.js`)

**Purpose**: Calculate match scores and rank recommendations.

### `rankCompanies(companies, cvData)`

**Description**: Score and rank companies based on CV profile.

**Parameters**:
- `companies` (array): Companies from LinkedIn search
- `cvData` (object): Extracted CV data from parser

**Returns**: `Array<{ ...company, match_score, matching_criteria }>`
- Sorted by `match_score` descending

**Algorithm**:
1. **Industry match** (40% weight): Count matching industries
2. **Skills match** (30% weight): Shared skills/keywords
3. **Location match** (20% weight): Geographic alignment
4. **Size preference** (10% weight): Company size fits user preferences

---

### `rankProfiles(profiles, cvData)`

**Description**: Score and rank individual profiles.

**Parameters**:
- `profiles` (array): Profiles from LinkedIn search
- `cvData` (object): Extracted CV data

**Returns**: `Array<{ ...profile, match_score, shared_skills, shared_interests, conversation_starter }>`

**Algorithm**:
1. **Shared skills** (40% weight): Overlapping skills
2. **Industry/interests** (30% weight): Common professional interests
3. **Seniority alignment** (20% weight): +1 to +2 levels above user
4. **Location** (10% weight): Geographic proximity

---

### `generateConversationStarter(profile, cvData)`

**Description**: Generate a personalized icebreaker message.

**Parameters**:
- `profile` (object): LinkedIn profile
- `cvData` (object): User's CV data

**Returns**: `string` - Suggested conversation starter

**Example Output**:
> "Hi [Name], I noticed we both have experience with Python and cloud architecture. I'm currently exploring opportunities in [industry] and would love to hear about your journey from [previous role] to [current role]."

---

## Error Handling

All services follow consistent error handling:

```javascript
try {
  const { data, error } = await someService.someFunction();
  if (error) throw error;
  // Process data
} catch (err) {
  console.error('Operation failed:', err.message);
  // Display user-friendly error message
}
```

**Common Error Types**:
- `AuthError`: Authentication failures
- `StorageError`: File upload/download failures
- `DatabaseError`: Supabase query errors
- `ParsingError`: CV parsing failures
- `RateLimitError`: LinkedIn API quota exceeded
- `ValidationError`: Input validation failures

---

## Performance Considerations

- **Caching**: Cache CV metadata and search results in memory for current session
- **Pagination**: All list operations support `limit` and `offset`
- **Lazy Loading**: Load profile/company details on demand (not upfront)
- **Debouncing**: Debounce search inputs by 500ms to reduce API calls
- **Progressive Enhancement**: Show cached results immediately, update with fresh data asynchronously

---

## Testing Contracts

All services include corresponding test files in `tests/unit/`:

- `auth.test.js`: Test authentication flows
- `storage.test.js`: Test file upload/download
- `database.test.js`: Test database operations
- `parser.test.js`: Test CV parsing accuracy
- `linkedin.test.js`: Test LinkedIn API integration (mocked)
- `matcher.test.js`: Test scoring algorithms

**Contract Test Example**:
```javascript
// tests/contract/database.test.js
import { describe, it, expect } from 'vitest';
import { createCVMetadata } from '../src/services/database.js';

describe('Database Contracts', () => {
  it('should create CV metadata with valid data', async () => {
    const cvData = {
      user_id: 'test-user-uuid',
      storage_path: 'cvs/test/file.pdf',
      original_filename: 'resume.pdf',
      file_size_bytes: 1024000,
      file_type: 'application/pdf'
    };
    const { data, error } = await createCVMetadata(cvData);
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.parsing_status).toBe('pending');
  });
});
```

---

## Next Steps

- ✅ API contracts documented
- ➡️ Generate quickstart.md with setup instructions
- ➡️ Implement services following these contracts
- ➡️ Write contract tests for validation
