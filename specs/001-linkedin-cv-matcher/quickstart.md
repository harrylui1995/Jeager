# Quickstart Guide: LinkedIn CV-Based Connection Finder

**Branch**: `001-linkedin-cv-matcher`
**Date**: 2025-11-15
**Purpose**: Get the development environment set up and running locally

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase CLI** (optional, for local development): `npm install -g supabase`
- **Modern web browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Jeager
git checkout 001-linkedin-cv-matcher
```

---

## Step 2: Install Dependencies

```bash
npm install
```

**Dependencies Installed**:
- Vite 5.x (build tool)
- @supabase/supabase-js (Supabase client)
- pdfjs-dist (PDF parsing)
- mammoth (DOCX parsing)
- Vitest (testing)
- Playwright (E2E testing)
- ESLint + Prettier (code quality)

---

## Step 3: Set Up Supabase

### Option A: Supabase Cloud (Recommended for quick start)

1. **Create a Supabase Project**:
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up/log in
   - Click "New Project"
   - Name: `linkedin-cv-matcher` (or your choice)
   - Database password: Choose a strong password
   - Region: Select closest to you
   - Wait for provisioning (~2 minutes)

2. **Get API Credentials**:
   - Go to Project Settings → API
   - Copy:
     - **Project URL**: `https://<your-project-ref>.supabase.co`
     - **Anon Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Set Up Database Schema**:
   - Go to SQL Editor in Supabase Dashboard
   - Copy contents of `specs/001-linkedin-cv-matcher/contracts/database.sql`
   - Paste and click "Run"
   - Verify tables created successfully

4. **Create Storage Bucket**:
   - Go to Storage in Supabase Dashboard
   - Click "New Bucket"
   - Name: `cvs`
   - Public: **Unchecked** (private bucket)
   - Click "Create Bucket"
   - Go to bucket policies and add RLS policies (copy from `database.sql` storage section)

### Option B: Supabase Local (For advanced users)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Get local credentials
supabase status
```

---

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LinkedIn API (Third-party service)
# Sign up for Proxycurl or RapidAPI LinkedIn service
VITE_LINKEDIN_API_KEY=<your-linkedin-api-key>
VITE_LINKEDIN_API_ENDPOINT=https://api.proxycurl.com/v1
# Or for RapidAPI:
# VITE_LINKEDIN_API_ENDPOINT=https://linkedin-api.p.rapidapi.com

# Optional: Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_MAX_CV_SIZE_MB=5
```

**Security Note**: Never commit `.env` to git. It's already in `.gitignore`.

---

## Step 5: LinkedIn API Setup

1. **Choose a Provider** (pick one):
   - **Proxycurl** (Recommended): [https://nubela.co/proxycurl/](https://nubela.co/proxycurl/)
     - Sign up for free trial (100 credits)
     - Get API key from dashboard
     - Costs: $0.02/request after trial
   - **RapidAPI LinkedIn Profile Data**: [https://rapidapi.com](https://rapidapi.com)
     - Search for "LinkedIn Profile Data API"
     - Subscribe to free tier (10 requests/day)
     - Get API key from dashboard

2. **Add API Key to `.env`** (see Step 4)

3. **Test API Connection** (optional):
   ```bash
   curl -X GET "https://api.proxycurl.com/v1/linkedin/profile" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{"url": "https://www.linkedin.com/in/williamhgates"}'
   ```

---

## Step 6: Run Development Server

```bash
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Step 7: Verify Setup

### Test Authentication

1. Navigate to http://localhost:5173
2. Click "Sign Up"
3. Enter email and password
4. Check for successful account creation
5. Sign out and sign in again

### Test CV Upload

1. Sign in
2. Navigate to "Upload CV" page
3. Select a PDF, DOCX, or TXT file (< 5MB)
4. Click "Upload and Analyze"
5. Verify:
   - File uploads to Supabase Storage
   - Parsing status shows "Processing" → "Completed"
   - Extracted skills and experience are displayed

### Test LinkedIn Search (requires API key)

1. After CV analysis completes
2. Navigate to "Find Companies" or "Find Profiles"
3. Click "Search"
4. Verify LinkedIn results are displayed with match scores

---

## Step 8: Run Tests

### Unit Tests

```bash
npm run test:unit
```

**Expected Output**: All unit tests pass (CV parsing, matching algorithms, utilities)

### Integration Tests

```bash
npm run test:integration
```

**Note**: Requires Supabase credentials in `.env`

### End-to-End Tests

```bash
npm run test:e2e
```

**Note**: Requires running dev server (`npm run dev`) in another terminal

### Test Coverage

```bash
npm run test:coverage
```

**Target**: 80%+ coverage for new code

---

## Step 9: Build for Production

```bash
npm run build
```

**Output**: Optimized bundle in `dist/` directory

**Preview Production Build**:
```bash
npm run preview
```

Open [http://localhost:4173](http://localhost:4173)

---

## Project Structure

```
Jeager/
├── src/
│   ├── index.html          # Entry point
│   ├── main.js             # App initialization
│   ├── components/         # UI components
│   ├── services/           # Business logic (auth, storage, etc.)
│   ├── utils/              # Utilities
│   ├── pages/              # Page modules
│   └── styles/             # CSS files
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── contract/           # Contract tests
├── public/                 # Static assets
├── supabase/               # Supabase migrations (if using local)
├── specs/                  # Design docs
│   └── 001-linkedin-cv-matcher/
│       ├── spec.md
│       ├── plan.md
│       ├── research.md
│       ├── data-model.md
│       ├── contracts/
│       └── quickstart.md   # This file
├── .env.example            # Environment template
├── .gitignore
├── package.json
├── vite.config.js
├── vitest.config.js
└── README.md
```

---

## Common Issues & Troubleshooting

### Issue: "Supabase connection failed"

**Solution**:
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Ensure Supabase project is running (not paused)
- Check browser console for CORS errors

### Issue: "CV upload fails"

**Solution**:
- Verify storage bucket `cvs` exists in Supabase Dashboard
- Check RLS policies are applied correctly
- Ensure file size is < 5MB
- Verify file type is PDF, DOCX, or TXT

### Issue: "LinkedIn search returns no results"

**Solution**:
- Verify `VITE_LINKEDIN_API_KEY` is correct
- Check API quota (free tier limits)
- Inspect network tab for 401/403 errors
- Test API key with `curl` (see Step 5)

### Issue: "Parsing accuracy is low"

**Solution**:
- CV parsing is 80-85% accurate by design
- Works best with structured CVs (clear sections)
- Users can manually edit extracted data
- Complex layouts (tables, columns) may reduce accuracy

### Issue: "Tests fail on first run"

**Solution**:
```bash
# Clear test cache
npm run test:clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm run test:unit
```

---

## Next Steps

After completing the quickstart:

1. **Read the Spec**: Review `specs/001-linkedin-cv-matcher/spec.md` to understand user stories
2. **Review Data Model**: Study `specs/001-linkedin-cv-matcher/data-model.md` for database schema
3. **Explore API Contracts**: See `specs/001-linkedin-cv-matcher/contracts/api.md` for service interfaces
4. **Start Implementing**:
   - Follow TDD approach (write tests first)
   - Implement User Story 1 (CV Upload and Analysis) first
   - Then User Story 2 (Company Discovery)
   - Finally User Story 3 (Profile Matching)

---

## Development Workflow

1. **Write Tests First** (TDD):
   ```bash
   # Create test file
   touch tests/unit/parser.test.js

   # Write failing test
   # Implement feature
   # Verify test passes
   ```

2. **Run Linter**:
   ```bash
   npm run lint
   npm run format
   ```

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: implement CV parsing for PDFs"
   ```

4. **Run Full Test Suite Before Push**:
   ```bash
   npm run test:all
   npm run build
   ```

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vite Guide**: https://vitejs.dev/guide/
- **PDF.js Docs**: https://mozilla.github.io/pdf.js/
- **Mammoth.js**: https://github.com/mwilliamson/mammoth.js
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/

---

## Getting Help

If you encounter issues not covered here:

1. Check the GitHub Issues page
2. Review the constitution (`constitution.md`) for coding standards
3. Consult the data model (`data-model.md`) for database questions
4. Review API contracts (`contracts/api.md`) for service interfaces

---

**You're all set!** 🚀 Start building with `npm run dev` and follow the TDD workflow.
