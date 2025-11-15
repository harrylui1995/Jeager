# Implementation Plan: LinkedIn CV-Based Connection Finder

**Branch**: `001-linkedin-cv-matcher` | **Date**: 2025-11-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-linkedin-cv-matcher/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a web application using Vite and vanilla JavaScript that helps users find relevant LinkedIn connections for coffee chats. Users upload their CV (stored in Supabase Storage), which is analyzed to extract skills, experience, and interests. The application searches LinkedIn to recommend companies and individual profiles matching the user's background and career goals. Metadata and search results are persisted in Supabase Database. The application follows a minimal-dependency approach, leveraging vanilla HTML, CSS, and JavaScript wherever possible.

## Technical Context

**Language/Version**: JavaScript (ES2022+) with Vite 5.x build tooling
**Primary Dependencies**:
- Vite 5.x (build tool and dev server)
- Supabase JS Client (authentication, storage, database)
- PDF.js (pdfjs-dist) for PDF parsing
- Mammoth.js for DOCX parsing
- Proxycurl or RapidAPI LinkedIn Data API (third-party LinkedIn integration)

**Storage**:
- Supabase Storage (CV files, max 5MB each)
- Supabase Database/PostgreSQL (user profiles, CV metadata, search results, saved companies/profiles)

**Testing**:
- Vitest (unit tests, integrated with Vite)
- Playwright or Cypress (end-to-end integration tests)
- Manual testing for LinkedIn integration (due to rate limits)

**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Project Type**: Single-page web application (SPA)

**Performance Goals**:
- CV upload and parsing: <30 seconds for 5MB files
- UI interactions: <100ms response time
- LinkedIn searches: <10 seconds including API/network latency
- Page load: First Contentful Paint <1.5s, Time to Interactive <3.5s
- Bundle size: <500KB (excluding Supabase SDK)

**Constraints**:
- Minimal external dependencies (vanilla JS preferred over frameworks)
- API response times: p95 <200ms for database queries
- LinkedIn API rate limits: ~100 searches/user/day
- Storage budget: 5MB per CV, estimated 500 users = 2.5GB storage
- 100 concurrent users without performance degradation

**Scale/Scope**:
- Initial target: 500 users
- CV storage: up to 2500 CV files (500 users × 5 CVs average)
- Database records: ~50K rows (users, CV metadata, companies, profiles, search sessions)
- Freemium model: unlimited CV uploads, rate-limited searches for free tier

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Standards
- ✅ **PASS**: Vanilla JS with Vite encourages simple, self-documenting code
- ✅ **PASS**: Functions will follow SRP; utility modules for parsing, matching, storage
- ✅ **PASS**: Linting via ESLint with standard config; Prettier for formatting
- ✅ **PASS**: JSDoc comments required for all exported functions
- ✅ **PASS**: Security: Input validation for file uploads, sanitization for user-generated content, HTTPS-only

### II. Testing Discipline (NON-NEGOTIABLE)
- ✅ **PASS**: TDD approach for all user stories
- ✅ **PASS**: Vitest for unit tests (CV parsing, matching algorithms, data transformations)
- ✅ **PASS**: Playwright for integration tests (upload flow, search flow, export flow)
- ✅ **PASS**: Contract tests for Supabase database schema and storage operations
- ✅ **PASS (JUSTIFIED)**: LinkedIn integration testing limited by rate limits; will use mocked responses for automated tests and manual validation for production (see Complexity Tracking)
- ✅ **PASS**: Target 80% coverage for new code

### III. User Experience Consistency
- ✅ **PASS**: User scenarios documented in spec.md with Given-When-Then acceptance criteria
- ✅ **PASS**: Component-based UI structure (vanilla JS modules, reusable components)
- ✅ **PASS**: Loading states for CV upload (progress bar), LinkedIn searches (spinner with estimated time)
- ✅ **PASS**: Error messages: actionable and user-friendly (e.g., "Your CV must be under 5MB. Please compress or split your file.")
- ⚠️ **PARTIAL**: WCAG 2.1 Level AA compliance - will implement semantic HTML, keyboard navigation, ARIA labels; automated audit with axe-core
- ✅ **PASS**: Each user story independently testable

### IV. Performance Requirements
- ✅ **PASS**: Performance budgets defined (see Technical Context)
- ✅ **PASS**: Bundle size monitoring via Vite build analyzer
- ✅ **PASS**: Database query optimization: indexes on user_id, created_at, search criteria fields
- ✅ **PASS**: Caching strategy: Supabase client-side caching for user profile and CV metadata
- ✅ **PASS**: Load testing approach resolved - using k6 for load testing 100 concurrent users (see research.md)
- ✅ **PASS**: Lazy loading for search results and large lists

### V. Documentation & Maintainability
- ✅ **PASS**: README.md with setup instructions, architecture overview, deployment guide
- ✅ **PASS**: JSDoc comments for all public functions and modules
- ✅ **PASS**: ADRs documented in research.md (CV parsing, LinkedIn integration, load testing, storage, freemium model)
- ✅ **PASS**: Quickstart.md guide for local development (Phase 1 complete)
- ✅ **PASS**: Data model documentation (Phase 1 complete)
- ✅ **PASS**: API contract documentation (Phase 1 complete)

### Quality Gates Summary

**Status**: ✅ FULL PASS (Post-Phase 1 Re-evaluation)

**All Research Items Resolved**:
1. ✅ **CV Parsing**: Client-side parsing with PDF.js and mammoth.js (see research.md)
2. ✅ **LinkedIn Integration**: Third-party API via Proxycurl/RapidAPI (see research.md)
3. ✅ **Load Testing**: k6 selected for load testing (see research.md)
4. ✅ **Data Model**: Complete schema with RLS policies (see data-model.md)
5. ✅ **API Contracts**: All service interfaces documented (see contracts/api.md)
6. ✅ **Quickstart Guide**: Development setup documented (see quickstart.md)

**Remaining Justification** (documented in Complexity Tracking):
1. **LinkedIn Integration Testing Limitation**: Automated testing constrained by LinkedIn API rate limits
   - **Justification**: LinkedIn enforces strict rate limits (~100 requests/day per user), making comprehensive automated testing impractical
   - **Mitigation**: Mock LinkedIn responses for automated tests; manual validation for production; fallback error handling

## Project Structure

### Documentation (this feature)

```text
specs/001-linkedin-cv-matcher/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api.md          # Client-side API structure (modules and functions)
│   └── database.sql    # Supabase database schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (Vite + vanilla JS)
src/
├── index.html           # Main HTML entry point
├── main.js              # Application bootstrap
├── styles/
│   ├── main.css         # Global styles
│   ├── components.css   # Reusable component styles
│   └── pages.css        # Page-specific styles
├── components/
│   ├── upload.js        # CV upload component
│   ├── profile.js       # Extracted profile display/edit
│   ├── search.js        # Company and profile search UI
│   ├── results.js       # Search results display
│   └── export.js        # Export functionality
├── services/
│   ├── supabase.js      # Supabase client initialization
│   ├── auth.js          # Authentication service
│   ├── storage.js       # CV storage operations
│   ├── database.js      # Database CRUD operations
│   ├── parser.js        # CV parsing service
│   ├── linkedin.js      # LinkedIn search integration
│   └── matcher.js       # Matching algorithm (scoring and ranking)
├── utils/
│   ├── validation.js    # Input validation utilities
│   ├── formatters.js    # Data formatting helpers
│   └── constants.js     # Application constants
└── pages/
    ├── login.js         # Login/signup page
    ├── dashboard.js     # Main dashboard
    ├── upload.js        # CV upload page
    ├── companies.js     # Company search/results page
    └── profiles.js      # Profile search/results page

tests/
├── unit/
│   ├── parser.test.js       # CV parsing tests
│   ├── matcher.test.js      # Matching algorithm tests
│   ├── validation.test.js   # Validation tests
│   └── formatters.test.js   # Formatter tests
├── integration/
│   ├── upload-flow.test.js      # End-to-end upload and analysis
│   ├── search-flow.test.js      # End-to-end search workflow
│   └── export-flow.test.js      # End-to-end export functionality
└── contract/
    ├── database.test.js         # Database schema and query tests
    └── storage.test.js          # Supabase storage operations tests

public/
├── assets/
│   ├── icons/
│   └── images/
└── favicon.ico

supabase/
├── migrations/              # Database migration files
│   └── 001_initial_schema.sql
├── seed.sql                 # Seed data for development
└── config.toml              # Supabase local config
```

**Structure Decision**: Selected **Web application structure** (customized single-page app). This is a browser-based application built with Vite for fast development and optimized bundling. The structure separates concerns into components (UI), services (business logic and external integrations), utils (helpers), and pages (routing/views). Supabase handles authentication, storage, and database, eliminating the need for a separate backend server. Tests are organized by type (unit, integration, contract) to align with constitution testing requirements.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| LinkedIn Integration Testing Limited by Rate Limits | LinkedIn API enforces strict rate limits (~100 requests/day), making comprehensive automated testing impractical | Full automated testing would require expensive enterprise API access or violate LinkedIn ToS; mocked tests + manual validation provides adequate coverage while staying compliant |
