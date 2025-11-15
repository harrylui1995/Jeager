/**
 * LinkedIn Search Service
 * Supports multiple LinkedIn API providers with adapter pattern
 *
 * Supported providers:
 * - RapidAPI (LinkedIn Data Scraper)
 * - ScraperAPI
 * - Bright Data
 * - Mock data (for development)
 */

import { API_TIMEOUT_MS } from '../utils/constants.js';

const LINKEDIN_API_KEY = import.meta.env.VITE_LINKEDIN_API_KEY;
const LINKEDIN_API_ENDPOINT = import.meta.env.VITE_LINKEDIN_API_ENDPOINT;
const LINKEDIN_PROVIDER = import.meta.env.VITE_LINKEDIN_PROVIDER || 'mock'; // rapidapi, scraperapi, brightdata, mock

/**
 * Search for companies on LinkedIn
 * @param {object} query - Search query
 * @param {object} filters - Search filters
 * @returns {Promise<{companies, error}>}
 */
export async function searchCompanies(query, filters = {}) {
  try {
    // Select provider adapter
    switch (LINKEDIN_PROVIDER) {
      case 'rapidapi':
        return await searchCompaniesRapidAPI(query, filters);
      case 'scraperapi':
        return await searchCompaniesScraperAPI(query, filters);
      case 'brightdata':
        return await searchCompaniesBrightData(query, filters);
      case 'mock':
      default:
        return getMockCompanies(query);
    }
  } catch (err) {
    return { companies: null, error: new Error(`Company search failed: ${err.message}`) };
  }
}

/**
 * Search for individual LinkedIn profiles
 * @param {object} query - Search query
 * @param {object} filters - Search filters
 * @returns {Promise<{profiles, error}>}
 */
export async function searchProfiles(query, filters = {}) {
  try {
    // Select provider adapter
    switch (LINKEDIN_PROVIDER) {
      case 'rapidapi':
        return await searchProfilesRapidAPI(query, filters);
      case 'scraperapi':
        return await searchProfilesScraperAPI(query, filters);
      case 'brightdata':
        return await searchProfilesBrightData(query, filters);
      case 'mock':
      default:
        return getMockProfiles(query);
    }
  } catch (err) {
    return { profiles: null, error: new Error(`Profile search failed: ${err.message}`) };
  }
}

/**
 * Check remaining API quota
 * @param {string} userId - User UUID
 * @returns {Promise<{remaining, resetAt, error}>}
 */
export async function checkRateLimit(userId) {
  // In production, this would query user_profiles table
  try {
    // Mock implementation
    return {
      remaining: 85,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      error: null,
    };
  } catch (err) {
    return { remaining: 0, resetAt: null, error: new Error(`Rate limit check failed: ${err.message}`) };
  }
}

// ============================================================================
// PROVIDER ADAPTERS
// ============================================================================

/**
 * RapidAPI LinkedIn Data Scraper Adapter
 * https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper
 */
async function searchCompaniesRapidAPI(query, filters = {}) {
  const { keywords, industries } = query;
  const { limit = 20 } = filters;

  const searchQuery = [...(keywords || []), ...(industries || [])].join(' ');

  const response = await fetch(
    `https://linkedin-data-scraper.p.rapidapi.com/company_search?query=${encodeURIComponent(searchQuery)}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': LINKEDIN_API_KEY,
        'X-RapidAPI-Host': 'linkedin-data-scraper.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.statusText}`);
  }

  const data = await response.json();

  const companies = (data.data || []).slice(0, limit).map((company) => ({
    name: company.name,
    linkedin_url: company.url || `https://www.linkedin.com/company/${company.universalName}`,
    industry: company.industry,
    size: company.staffCount ? `${company.staffCount}` : null,
    location: company.location,
    description: company.tagline || company.description,
  }));

  return { companies, error: null };
}

async function searchProfilesRapidAPI(query, filters = {}) {
  const { keywords } = query;
  const { limit = 30 } = filters;

  const searchQuery = (keywords || []).join(' ');

  const response = await fetch(
    `https://linkedin-data-scraper.p.rapidapi.com/person_search?query=${encodeURIComponent(searchQuery)}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': LINKEDIN_API_KEY,
        'X-RapidAPI-Host': 'linkedin-data-scraper.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.statusText}`);
  }

  const data = await response.json();

  const profiles = (data.data || []).slice(0, limit).map((profile) => ({
    name: `${profile.firstName} ${profile.lastName}`,
    linkedin_url: profile.url || `https://www.linkedin.com/in/${profile.publicIdentifier}`,
    current_role: profile.headline?.split('at')[0]?.trim(),
    current_company: profile.headline?.split('at')[1]?.trim(),
    location: profile.location,
    headline: profile.headline,
    skills: [],
  }));

  return { profiles, error: null };
}

/**
 * ScraperAPI Adapter
 * https://www.scraperapi.com/
 */
async function searchCompaniesScraperAPI(query, filters = {}) {
  const { keywords, industries } = query;
  const searchQuery = [...(keywords || []), ...(industries || [])].join(' ');

  // ScraperAPI uses a proxy approach - construct LinkedIn search URL
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(searchQuery)}`;

  const response = await fetch(
    `https://api.scraperapi.com?api_key=${LINKEDIN_API_KEY}&url=${encodeURIComponent(linkedinSearchUrl)}`,
    {
      method: 'GET',
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error(`ScraperAPI error: ${response.statusText}`);
  }

  const html = await response.text();

  // Note: You'll need to parse the HTML to extract company data
  // This is a simplified example - in production, use a proper HTML parser
  console.warn('ScraperAPI requires HTML parsing - returning mock data for now');
  return getMockCompanies(query);
}

async function searchProfilesScraperAPI(query, filters = {}) {
  // Similar to companies but for people search
  console.warn('ScraperAPI requires HTML parsing - returning mock data for now');
  return getMockProfiles(query);
}

/**
 * Bright Data Adapter
 * https://brightdata.com/products/web-scraper/linkedin
 */
async function searchCompaniesBrightData(query, filters = {}) {
  const { keywords, industries } = query;
  const { limit = 20 } = filters;

  const searchQuery = [...(keywords || []), ...(industries || [])].join(' ');

  const response = await fetch(LINKEDIN_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      zone: 'linkedin_companies',
      url: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(searchQuery)}`,
      limit,
    }),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Bright Data error: ${response.statusText}`);
  }

  const data = await response.json();

  const companies = (data || []).map((company) => ({
    name: company.name,
    linkedin_url: company.linkedin_url,
    industry: company.industry,
    size: company.company_size,
    location: company.location,
    description: company.description,
  }));

  return { companies, error: null };
}

async function searchProfilesBrightData(query, filters = {}) {
  const { keywords } = query;
  const { limit = 30 } = filters;

  const searchQuery = (keywords || []).join(' ');

  const response = await fetch(LINKEDIN_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      zone: 'linkedin_people',
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`,
      limit,
    }),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Bright Data error: ${response.statusText}`);
  }

  const data = await response.json();

  const profiles = (data || []).map((profile) => ({
    name: profile.name,
    linkedin_url: profile.linkedin_url,
    current_role: profile.current_role,
    current_company: profile.current_company,
    location: profile.location,
    headline: profile.headline,
    skills: profile.skills || [],
  }));

  return { profiles, error: null };
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

function getMockCompanies(query) {
  const mockCompanies = [
    {
      name: 'TechCorp Innovation',
      linkedin_url: 'https://www.linkedin.com/company/techcorp',
      industry: 'Technology',
      size: '501-1000',
      location: 'San Francisco, CA',
      description: 'Leading AI and cloud solutions provider',
    },
    {
      name: 'DataFlow Systems',
      linkedin_url: 'https://www.linkedin.com/company/dataflow',
      industry: 'SaaS',
      size: '51-200',
      location: 'New York, NY',
      description: 'Enterprise data analytics platform',
    },
    {
      name: 'CloudScale Inc',
      linkedin_url: 'https://www.linkedin.com/company/cloudscale',
      industry: 'Technology',
      size: '201-500',
      location: 'Seattle, WA',
      description: 'Cloud infrastructure and DevOps solutions',
    },
  ];

  return { companies: mockCompanies, error: null };
}

function getMockProfiles(query) {
  const mockProfiles = [
    {
      name: 'Jane Smith',
      linkedin_url: 'https://www.linkedin.com/in/janesmith',
      current_role: 'Senior Software Engineer',
      current_company: 'TechCorp',
      location: 'San Francisco, CA',
      headline: 'Building scalable cloud solutions | Python & JavaScript expert',
      skills: ['Python', 'JavaScript', 'AWS', 'Docker'],
    },
    {
      name: 'John Doe',
      linkedin_url: 'https://www.linkedin.com/in/johndoe',
      current_role: 'Engineering Manager',
      current_company: 'DataFlow Systems',
      location: 'New York, NY',
      headline: 'Leading high-performing engineering teams',
      skills: ['Leadership', 'Agile', 'Architecture', 'React'],
    },
    {
      name: 'Alice Johnson',
      linkedin_url: 'https://www.linkedin.com/in/alicejohnson',
      current_role: 'DevOps Engineer',
      current_company: 'CloudScale Inc',
      location: 'Seattle, WA',
      headline: 'Kubernetes & CI/CD specialist',
      skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform'],
    },
  ];

  return { profiles: mockProfiles, error: null };
}

export default {
  searchCompanies,
  searchProfiles,
  checkRateLimit,
};
