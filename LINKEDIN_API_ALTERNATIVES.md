# LinkedIn API Provider Setup Guide

Since Proxycurl has shut down, here are the best alternative options for LinkedIn data access:

## Recommended Alternatives

### 1. **RapidAPI - LinkedIn Data Scraper** ⭐ (Recommended)

**Best for**: Quick setup, pay-as-you-go pricing

- **Website**: https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper
- **Pricing**:
  - Free tier: 100 requests/month
  - Basic: $9.99/month (1,000 requests)
  - Pro: $49.99/month (10,000 requests)
  - Ultra: $199.99/month (100,000 requests)

**Setup**:
```bash
# 1. Sign up at rapidapi.com
# 2. Subscribe to "LinkedIn Data Scraper" API
# 3. Get your API key from the dashboard
# 4. Update .env file:
VITE_LINKEDIN_PROVIDER=rapidapi
VITE_LINKEDIN_API_KEY=your-rapidapi-key
VITE_LINKEDIN_API_ENDPOINT=https://linkedin-data-scraper.p.rapidapi.com
```

**Features**:
- ✅ Company search
- ✅ People/profile search
- ✅ Company details
- ✅ Profile details
- ✅ JSON responses (easy to integrate)

---

### 2. **ScraperAPI**

**Best for**: High-volume scraping with proxy rotation

- **Website**: https://www.scraperapi.com/
- **Pricing**:
  - Free tier: 5,000 requests/month
  - Hobby: $49/month (100,000 requests)
  - Startup: $149/month (1M requests)
  - Business: $299/month (3M requests)

**Setup**:
```bash
VITE_LINKEDIN_PROVIDER=scraperapi
VITE_LINKEDIN_API_KEY=your-scraperapi-key
VITE_LINKEDIN_API_ENDPOINT=https://api.scraperapi.com
```

**Note**: Requires HTML parsing. You'll need to add a parser library like `cheerio` or use the response HTML directly.

---

### 3. **Bright Data (formerly Luminati)**

**Best for**: Enterprise-grade, most reliable

- **Website**: https://brightdata.com/products/web-scraper/linkedin
- **Pricing**:
  - Pay-as-you-go: $3/1,000 requests
  - Monthly plans: Custom pricing
  - Enterprise: Contact sales

**Setup**:
```bash
VITE_LINKEDIN_PROVIDER=brightdata
VITE_LINKEDIN_API_KEY=your-brightdata-token
VITE_LINKEDIN_API_ENDPOINT=https://api.brightdata.com/datasets/v3/trigger
```

**Features**:
- ✅ Most comprehensive data
- ✅ Highest success rate
- ✅ Premium proxy network
- ✅ Structured data output
- ⚠️ Higher cost

---

### 4. **Apify - LinkedIn Scrapers**

**Best for**: Custom scraping workflows

- **Website**: https://apify.com/store?search=linkedin
- **Pricing**:
  - Free tier: $5 worth of credits
  - Personal: $49/month
  - Team: $499/month

**Popular Actors**:
- LinkedIn Company Scraper
- LinkedIn People Search Scraper
- LinkedIn Profile Scraper

**Setup**:
```javascript
// Requires Apify SDK integration
npm install apify-client
```

---

### 5. **PhantomBuster**

**Best for**: No-code automation

- **Website**: https://phantombuster.com/
- **Pricing**:
  - Starter: $69/month
  - Pro: $159/month
  - Team: $439/month

**Features**:
- No-code interface
- Pre-built LinkedIn workflows
- Cloud-based execution

---

## Quick Comparison

| Provider | Setup Difficulty | Cost (Entry) | Data Quality | Rate Limits |
|----------|-----------------|--------------|--------------|-------------|
| **RapidAPI** | ⭐ Easy | $9.99/mo | Good | 1,000/mo |
| **ScraperAPI** | ⭐⭐ Medium | $49/mo | Good | 100K/mo |
| **Bright Data** | ⭐⭐⭐ Complex | Custom | Excellent | High |
| **Apify** | ⭐⭐ Medium | $49/mo | Good | Variable |
| **PhantomBuster** | ⭐ Easy | $69/mo | Good | Variable |

---

## Recommended Setup (RapidAPI)

For this project, I recommend starting with **RapidAPI LinkedIn Data Scraper**:

### Step 1: Sign Up
1. Go to https://rapidapi.com
2. Create a free account
3. Search for "LinkedIn Data Scraper"
4. Subscribe to a plan (free tier available)

### Step 2: Get API Key
1. Go to your RapidAPI dashboard
2. Navigate to "LinkedIn Data Scraper" API
3. Copy your API key (starts with "X-RapidAPI-Key")

### Step 3: Configure Environment
```bash
# Edit .env file
VITE_LINKEDIN_PROVIDER=rapidapi
VITE_LINKEDIN_API_KEY=your-rapidapi-key-here
VITE_LINKEDIN_API_ENDPOINT=https://linkedin-data-scraper.p.rapidapi.com
```

### Step 4: Test the Integration
```bash
npm run dev
# Upload a CV and try searching for companies/profiles
```

---

## Alternative: Use Mock Data

For development and testing without API costs:

```bash
# In .env file
VITE_LINKEDIN_PROVIDER=mock
# No API key needed
```

The app includes realistic mock data that demonstrates all features without requiring an API subscription.

---

## Official LinkedIn API

**Note**: The official LinkedIn API has very limited access:

- **Requires**: LinkedIn Partner Program approval
- **Use cases**: Only for authorized partners
- **Not suitable** for this use case (scraping/searching)

---

## Legal & Ethical Considerations

⚠️ **Important**:
- LinkedIn's Terms of Service prohibit automated scraping
- Use these services at your own risk
- Consider rate limits and fair use policies
- Some providers use official APIs, others use scraping
- For production use, consult with legal counsel

**Recommended approach**:
1. Use these tools for **personal research** and **networking**
2. Respect rate limits
3. Don't abuse the services
4. Consider LinkedIn's official offerings for commercial use

---

## Need Help?

If you have questions about setting up a specific provider, create an issue in the repository with:
- Provider name
- Error message (if any)
- Your .env configuration (without API keys)

---

**Updated**: 2025-11-15
**Status**: Proxycurl shutdown confirmed, alternatives verified and tested
