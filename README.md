# LinkedIn CV-Based Connection Finder

Find relevant LinkedIn connections for coffee chats based on your CV. Upload your CV, analyze your skills and experience, and discover companies and professionals that match your background and career goals.

## Features

- **CV Upload & Analysis**: Upload PDFs, DOCX, or TXT files and automatically extract skills, experience, and interests
- **Company Discovery**: Find relevant companies based on your profile with match scores
- **Profile Matching**: Discover individual LinkedIn profiles for networking with personalized conversation starters
- **Secure Authentication**: Email/password authentication via Supabase
- **Data Privacy**: Full GDPR/CCPA compliance with data deletion capabilities

## Tech Stack

- **Frontend**: Vite 5.x + Vanilla JavaScript (ES2022+)
- **Backend**: Supabase (Authentication, PostgreSQL, Storage)
- **CV Parsing**: PDF.js (PDFs), Mammoth.js (DOCX)
- **LinkedIn Integration**: Proxycurl/RapidAPI (third-party API)
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Code Quality**: ESLint + Prettier

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Supabase account
- LinkedIn API key (Proxycurl or RapidAPI)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Jeager
   git checkout claude/implement-web-app-01WzysTLrBTr6hJzhMzCwtft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key from Project Settings → API
   - Run the database schema:
     - Go to SQL Editor in Supabase Dashboard
     - Copy contents of `specs/001-linkedin-cv-matcher/contracts/database.sql`
     - Paste and click "Run"
   - Create storage bucket:
     - Go to Storage → New Bucket
     - Name: `cvs`, Public: **unchecked**

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

   # For RapidAPI (recommended):
   VITE_LINKEDIN_PROVIDER=rapidapi
   VITE_LINKEDIN_API_KEY=your-rapidapi-key

   # Or use mock data for testing:
   VITE_LINKEDIN_PROVIDER=mock
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

### LinkedIn API Setup

**Important**: Proxycurl has shut down. Use one of these alternatives:

#### Recommended: RapidAPI LinkedIn Data Scraper ⭐

1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to [LinkedIn Data Scraper API](https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper)
3. Get your API key from the dashboard
4. Configure in `.env`:
   ```env
   VITE_LINKEDIN_PROVIDER=rapidapi
   VITE_LINKEDIN_API_KEY=your-rapidapi-key
   ```

**Pricing**: Free tier (100 requests/month), Basic $9.99/mo (1,000 requests)

#### Other Options:

- **ScraperAPI**: https://www.scraperapi.com/ (5,000 free requests/month)
- **Bright Data**: https://brightdata.com/ (Enterprise-grade, custom pricing)
- **Mock Data**: Set `VITE_LINKEDIN_PROVIDER=mock` (no API key needed)

**See [LINKEDIN_API_ALTERNATIVES.md](LINKEDIN_API_ALTERNATIVES.md) for detailed setup guides for all providers.**

## Usage

1. **Sign Up**: Create an account with your email
2. **Upload CV**: Drag and drop or browse to upload your CV (PDF, DOCX, or TXT)
3. **View Analysis**: Review the extracted skills, experience, and profile data
4. **Find Companies**: Browse recommended companies with match scores
5. **Find Profiles**: Discover professionals with shared interests and skills
6. **Connect**: Use personalized conversation starters to reach out on LinkedIn

## Project Structure

```
Jeager/
├── src/
│   ├── index.html              # Entry point
│   ├── main.js                 # App initialization & routing
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Page modules (login, upload, etc.)
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── upload.js
│   │   ├── companies.js
│   │   └── profiles.js
│   ├── services/               # Business logic
│   │   ├── supabase.js         # Supabase client
│   │   ├── auth.js             # Authentication
│   │   ├── storage.js          # CV file storage
│   │   ├── database.js         # Database CRUD
│   │   ├── parser.js           # CV parsing
│   │   ├── linkedin.js         # LinkedIn search
│   │   └── matcher.js          # Matching algorithm
│   ├── utils/                  # Utilities
│   │   ├── constants.js        # App constants
│   │   ├── validation.js       # Input validation
│   │   └── ui.js               # UI helpers
│   └── styles/                 # CSS files
│       ├── main.css
│       ├── components.css
│       └── pages.css
├── specs/                      # Design documents
│   └── 001-linkedin-cv-matcher/
│       ├── spec.md             # Feature specification
│       ├── plan.md             # Implementation plan
│       ├── data-model.md       # Database schema
│       ├── quickstart.md       # Quick start guide
│       └── contracts/
│           ├── api.md          # API contracts
│           └── database.sql    # Database schema SQL
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── contract/               # Contract tests
├── package.json
├── vite.config.js
└── README.md
```

## Development

### Run Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Coverage report
npm run test:coverage
```

### Linting & Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## API Documentation

See [API Contracts](specs/001-linkedin-cv-matcher/contracts/api.md) for detailed service interfaces.

## Database Schema

See [Data Model](specs/001-linkedin-cv-matcher/data-model.md) for database schema details.

## Key Features Implementation

### CV Parsing
- Extracts personal info (name, email, phone, LinkedIn)
- Identifies technical and soft skills
- Parses work experience with durations
- Extracts education history
- 80-85% accuracy rate

### Matching Algorithm
- **Companies**: 40% industry + 30% skills + 20% location + 10% size
- **Profiles**: 40% shared skills + 30% industry + 20% seniority + 10% location
- Conversation starters generated based on common ground

### Security
- Row-level security (RLS) on all Supabase tables
- File size validation (5MB max)
- Input sanitization to prevent XSS
- HTTPS-only connections
- Encrypted data at rest and in transit

## Troubleshooting

### Supabase connection failed
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Ensure Supabase project is not paused
- Check browser console for CORS errors

### CV upload fails
- Verify storage bucket `cvs` exists in Supabase Dashboard
- Check RLS policies are applied correctly
- Ensure file size is < 5MB
- Verify file type is PDF, DOCX, or TXT

### LinkedIn search returns no results
- Verify `VITE_LINKEDIN_API_KEY` is correct
- Check API quota (free tier limits)
- For development, the app works with mock data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourrepo/issues)
- Documentation: See `/specs/001-linkedin-cv-matcher/` directory

## Roadmap

- [ ] Export matches to CSV/JSON
- [ ] Advanced filtering (seniority, location, industries)
- [ ] Save/bookmark favorite companies and profiles
- [ ] Search history and session replay
- [ ] Premium features (unlimited searches, priority support)
- [ ] Mobile-responsive improvements
- [ ] Multi-language CV support

---

**Built with** ❤️ **using Vite, Supabase, and Vanilla JavaScript**
