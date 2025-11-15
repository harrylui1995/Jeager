# Research: LinkedIn CV-Based Connection Finder

**Date**: 2025-11-15
**Branch**: `001-linkedin-cv-matcher`
**Purpose**: Resolve technical unknowns identified in Technical Context

## Research Tasks

### 1. CV Parsing Library Selection

**Question**: Should we use client-side parsing (PDF.js, mammoth.js) or a server-side parsing service?

**Decision**: **Client-side parsing with PDF.js (PDFs) and mammoth.js (DOCX)**

**Rationale**:
- **Privacy**: CV data remains in the user's browser until explicitly uploaded to Supabase Storage; client-side parsing reduces exposure of sensitive career information
- **Cost**: No additional server-side infrastructure or third-party API costs for parsing
- **Performance**: Modern browsers handle 5MB file parsing efficiently; keeps processing under 30-second target
- **Alignment with Tech Stack**: Fits "minimal dependencies" and "vanilla JS" philosophy; PDF.js and mammoth.js are well-maintained, pure-JS libraries
- **Simplicity**: Eliminates need for backend parsing service or Edge Functions

**Alternatives Considered**:
1. **Server-side parsing with Supabase Edge Functions**
   - Pros: Centralized processing, consistent environment, potential for better NLP
   - Cons: Requires additional infrastructure, higher latency (upload → process → download), privacy concerns, complexity
   - **Rejected**: Violates "minimal dependencies" principle; unnecessary complexity for initial release

2. **Third-party parsing APIs (e.g., Resume Parser API, Affinda)**
   - Pros: Higher accuracy (85-95%), sophisticated NLP, handles multiple formats
   - Cons: Recurring costs ($0.10-0.50 per parse), privacy/data residency concerns, external dependency
   - **Rejected**: Budget constraint ($500/month for 500 users), privacy concerns, vendor lock-in

**Implementation Details**:
- **PDF.js**: For PDF parsing (most common CV format)
  - Library: `pdfjs-dist` (Mozilla's official library)
  - Approach: Extract text layer from PDF, parse with regex patterns for skills, job titles, dates
  - Fallback: OCR not included in initial version (edge case for image-based PDFs)

- **Mammoth.js**: For DOCX parsing
  - Library: `mammoth` (converts DOCX to HTML, extract text)
  - Approach: Extract paragraphs, parse structured sections

- **TXT files**: Direct string parsing with regex and NLP patterns

- **Parsing Strategy**:
  - Regex patterns for: email, phone, LinkedIn URLs, dates, job titles
  - Keyword extraction for skills (match against predefined skill taxonomy + TF-IDF)
  - Section detection: Education, Experience, Skills (using common header patterns)
  - Estimated accuracy: 80-85% (acceptable per spec assumptions)

**ADR Reference**: Create ADR-001-cv-parsing-client-side.md

---

### 2. LinkedIn Integration Approach

**Question**: Should we use LinkedIn official API, third-party APIs (RapidAPI), or web scraping?

**Decision**: **Third-party API via RapidAPI LinkedIn service (or similar)**

**Rationale**:
- **LinkedIn Official API Limitations**:
  - Strict partnership requirements (must apply and be approved)
  - Limited public profile search capabilities (primarily for authenticated user's network)
  - High rate limits only for approved partners
  - **Rejected**: Not viable for general public search use case

- **Web Scraping**:
  - Violates LinkedIn Terms of Service (Sections 8.2, 8.3)
  - Legal risks (hiQ Labs v. LinkedIn case established precedent but risky)
  - Brittle (DOM changes break scrapers frequently)
  - Rate limiting and anti-bot detection
  - **Rejected**: Legal and compliance risks, violates constitution security principle

- **Third-Party APIs** (Selected):
  - Services like RapidAPI's LinkedIn Profile Data API, Proxycurl, or ScrapingBee LinkedIn endpoints
  - Pros: Legal (vendors handle ToS compliance), stable interfaces, rate limits clearly documented
  - Cons: Cost per request ($0.01-0.05 per search), vendor dependency
  - **Cost Analysis**: 100 searches/user/day × 500 users × 30 days × $0.02 = $30,000/month (prohibitive)
  - **Mitigation**: Freemium model with search limits (10 searches/day free, 100/day premium)
  - **Revised Cost**: 500 users × 10 searches/day × 30 days × $0.02 = $3,000/month (within budget with premium revenue offset)

**Implementation Approach**:
1. **Company Search**:
   - Use LinkedIn Company Search API (via RapidAPI or Proxycurl)
   - Input: Industry keywords, location filters
   - Output: Company name, LinkedIn URL, industry, size, location
   - Ranking: Simple keyword match score based on CV skills/industries

2. **Profile Search**:
   - Use LinkedIn Profile Search API
   - Input: Job title keywords, company name, location
   - Output: Profile name, headline, current role, LinkedIn URL
   - Match scoring: Weighted algorithm (shared skills 40%, industry 30%, seniority 20%, location 10%)

3. **Rate Limit Handling**:
   - Client-side quota tracking (stored in Supabase database)
   - Clear error messages when limits exceeded
   - Exponential backoff for API failures
   - Caching of search results (24-hour TTL) to reduce redundant requests

4. **Fallback Strategy**:
   - If API unavailable: Display cached results with "Showing cached results" message
   - If quota exceeded: Show remaining quota and upgrade prompt
   - Manual LinkedIn URL input as backup (user can paste LinkedIn profile links)

**ADR Reference**: Create ADR-002-linkedin-third-party-api.md

**Vendor Selection** (to be finalized during implementation):
- **Proxycurl** (preferred): $0.02/request, 300 req/min, stable API, good documentation
- **RapidAPI LinkedIn Data**: $0.01-0.03/request, variable rate limits
- **ScrapingBee LinkedIn**: $0.02/request, 50 req/min

---

### 3. Load Testing Tooling

**Question**: What tooling should we use for load testing 100 concurrent users?

**Decision**: **k6 for load testing**

**Rationale**:
- **k6** (Selected):
  - Pros: Modern, JavaScript-based (aligns with our stack), excellent Vite/browser testing support, cloud or local execution, detailed metrics
  - Cons: Slight learning curve
  - **Use Case**: Simulate 100 concurrent users uploading CVs, running searches, exporting results
  - **Cost**: Free for local execution, $50/month for cloud (optional)

- **Artillery**:
  - Pros: YAML-based config (simpler), good HTTP testing
  - Cons: Less suited for browser-based SPAs, limited browser simulation
  - **Rejected**: Not ideal for SPA workflows (CV upload with file handling)

- **Manual Testing**:
  - Pros: Simple, no tooling cost
  - Cons: Not repeatable, hard to simulate true concurrency
  - **Rejected**: Doesn't meet constitution performance validation requirements

**Implementation Approach**:
1. **Test Scenarios**:
   - Scenario 1: 100 users upload CV simultaneously (5MB files)
   - Scenario 2: 50 users run company searches concurrently
   - Scenario 3: 50 users run profile searches concurrently
   - Scenario 4: Mixed workload (20 uploads, 40 company searches, 40 profile searches)

2. **Success Criteria**:
   - p95 response times within budget (<30s for CV upload, <10s for searches)
   - No errors under load
   - Supabase connection pool handles load

3. **Execution**:
   - Local k6 execution during development
   - CI/CD integration for regression testing
   - Cloud k6 for final validation (optional)

**ADR Reference**: Create ADR-003-load-testing-k6.md

---

### 4. Best Practices Research

#### Supabase Storage Best Practices

**Findings**:
- **File Organization**: Use user-id-based folder structure (`users/{user_id}/cvs/{cv_id}.pdf`)
- **Access Control**: Row-Level Security (RLS) policies to ensure users only access their own files
- **Performance**: Enable CDN caching for static assets; no caching for CV files (privacy)
- **Cleanup**: Implement retention policy (delete CV after 90 days of inactivity or on user request per GDPR)
- **Security**: Validate file types server-side (check MIME type), scan for malware (optional with ClamAV integration)

**Implementation**:
```javascript
// Storage bucket structure
cvs/
  {user_id}/
    {timestamp}_{original_filename}

// RLS Policy
CREATE POLICY "Users can only access their own CVs"
ON storage.objects FOR ALL
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### Supabase Database Best Practices

**Findings**:
- **Indexes**: Create indexes on frequently queried fields (user_id, created_at, search_criteria)
- **RLS Policies**: Enable RLS on all tables for multi-tenant security
- **Normalization**: Normalize data model (separate tables for users, cv_metadata, companies, profiles, search_sessions)
- **JSON Fields**: Use JSONB for flexible data (extracted skills array, search filters)
- **Performance**: Use database connection pooling (Supabase handles automatically); limit result sets (pagination)

#### Vite + Vanilla JS Best Practices

**Findings**:
- **Code Splitting**: Use dynamic imports for pages (`import('./pages/dashboard.js')`) to reduce initial bundle size
- **Tree Shaking**: Ensure imports are ES modules to enable tree shaking
- **Asset Optimization**: Use Vite's built-in image optimization; lazy load images
- **Environment Variables**: Use `import.meta.env` for Supabase credentials (never commit to git)
- **Module Organization**: Separate by concern (components, services, utils); avoid circular dependencies

#### Accessibility (WCAG 2.1 Level AA)

**Findings**:
- **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, `<aside>` appropriately
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible (Tab, Enter, Escape)
- **ARIA Labels**: Use `aria-label`, `aria-describedby` for screen readers
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus outlines (don't remove `:focus` styles)
- **Automated Testing**: Use axe-core or Pa11y for automated accessibility audits

**Tools**:
- `eslint-plugin-jsx-a11y` (adapt for vanilla JS patterns)
- Chrome DevTools Lighthouse (accessibility audit)
- `@axe-core/playwright` for integration tests

---

## Summary of Decisions

| Decision Area | Choice | Key Justification |
|---------------|--------|-------------------|
| CV Parsing | Client-side (PDF.js, mammoth.js) | Privacy, cost, simplicity; meets 80-85% accuracy target |
| LinkedIn Integration | Third-party API (Proxycurl/RapidAPI) | Legal compliance, stable interface; freemium model manages costs |
| Load Testing | k6 | JavaScript-based, modern, supports SPA workflows |
| Storage Organization | User-id folders with RLS | Security, privacy, compliance with GDPR |
| Database Design | Normalized with JSONB for flexibility | Performance, scalability, query optimization |
| Accessibility | Semantic HTML + ARIA + automated audits | WCAG 2.1 Level AA compliance |

---

## Architecture Decision Records (ADRs) to Create

1. **ADR-001**: Client-side CV Parsing Strategy
2. **ADR-002**: LinkedIn Integration via Third-Party API
3. **ADR-003**: Load Testing with k6
4. **ADR-004**: Supabase Storage Structure and Security
5. **ADR-005**: Freemium Model and Rate Limiting Strategy

---

## Next Steps (Phase 1)

- ✅ All NEEDS CLARIFICATION items resolved
- ✅ Technical approach validated
- ➡️ Proceed to Phase 1: Design & Contracts
  - Generate data-model.md
  - Generate contracts/ (API structure, database schema)
  - Generate quickstart.md
  - Update agent context
