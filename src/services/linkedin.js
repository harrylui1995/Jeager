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

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('[LinkedIn Service] Configuration:', {
    provider: LINKEDIN_PROVIDER,
    hasApiKey: !!LINKEDIN_API_KEY,
    apiKeyLength: LINKEDIN_API_KEY?.length || 0,
    endpoint: LINKEDIN_API_ENDPOINT || 'default',
  });
  
  if (LINKEDIN_PROVIDER === 'rapidapi' && !LINKEDIN_API_KEY) {
    console.warn(
      '[LinkedIn Service] ⚠️ RapidAPI provider selected but VITE_LINKEDIN_API_KEY is missing!\n' +
      'Set VITE_LINKEDIN_API_KEY in your .env file or use VITE_LINKEDIN_PROVIDER=mock for testing.'
    );
  }
}

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
    // Preserve the original error message which now includes detailed diagnostics
    return { companies: null, error: err };
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
    // Preserve the original error message which now includes detailed diagnostics
    return { profiles: null, error: err };
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
  // Validate API key before making request
  if (!LINKEDIN_API_KEY || LINKEDIN_API_KEY.trim() === '') {
    throw new Error(
      'RapidAPI key is missing. Please set VITE_LINKEDIN_API_KEY in your .env file. ' +
      'Get your API key from: https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper'
    );
  }

  const { keywords, industries } = query;
  const { limit = 20 } = filters;

  const searchQuery = [...(keywords || []), ...(industries || [])].join(' ');

  if (!searchQuery || searchQuery.trim() === '') {
    throw new Error('Search query is empty. Please provide keywords or industries to search for companies.');
  }

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
    // Try to get more detailed error information
    let errorMessage = `RapidAPI error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }
      
      // Provide specific guidance for common errors
      if (response.status === 403) {
        errorMessage += 
          '\n\nPossible causes:' +
          '\n1. Invalid or missing API key - Check VITE_LINKEDIN_API_KEY in .env' +
          '\n2. API key not subscribed to this endpoint - Subscribe at https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper' +
          '\n3. Free tier quota exceeded - Upgrade your plan or wait for quota reset' +
          '\n4. API key expired or revoked - Generate a new key from RapidAPI dashboard';
      } else if (response.status === 429) {
        errorMessage += '\n\nRate limit exceeded. Please wait before making more requests.';
      } else if (response.status === 401) {
        errorMessage += '\n\nUnauthorized. Please check your API key is correct.';
      }
    } catch (e) {
      // If we can't parse the error response, use the status text
      errorMessage += `\n\nResponse body could not be parsed. Status: ${response.status}`;
    }
    
    throw new Error(errorMessage);
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
  // Validate API key before making request
  if (!LINKEDIN_API_KEY || LINKEDIN_API_KEY.trim() === '') {
    throw new Error(
      'RapidAPI key is missing. Please set VITE_LINKEDIN_API_KEY in your .env file. ' +
      'Get your API key from: https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper'
    );
  }

  const { keywords } = query;
  const { limit = 30 } = filters;

  const searchQuery = (keywords || []).join(' ');

  if (!searchQuery || searchQuery.trim() === '') {
    throw new Error('Search query is empty. Please provide keywords to search for profiles.');
  }

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
    // Try to get more detailed error information
    let errorMessage = `RapidAPI error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }
      
      // Provide specific guidance for common errors
      if (response.status === 403) {
        errorMessage += 
          '\n\nPossible causes:' +
          '\n1. Invalid or missing API key - Check VITE_LINKEDIN_API_KEY in .env' +
          '\n2. API key not subscribed to this endpoint - Subscribe at https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-scraper' +
          '\n3. Free tier quota exceeded - Upgrade your plan or wait for quota reset' +
          '\n4. API key expired or revoked - Generate a new key from RapidAPI dashboard';
      } else if (response.status === 429) {
        errorMessage += '\n\nRate limit exceeded. Please wait before making more requests.';
      } else if (response.status === 401) {
        errorMessage += '\n\nUnauthorized. Please check your API key is correct.';
      }
    } catch (e) {
      // If we can't parse the error response, use the status text
      errorMessage += `\n\nResponse body could not be parsed. Status: ${response.status}`;
    }
    
    throw new Error(errorMessage);
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
