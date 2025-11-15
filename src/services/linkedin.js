/**
 * LinkedIn Search Service
 * Searches LinkedIn for companies and profiles via third-party API (Proxycurl/RapidAPI)
 */

import { API_TIMEOUT_MS } from '../utils/constants.js';

const LINKEDIN_API_KEY = import.meta.env.VITE_LINKEDIN_API_KEY;
const LINKEDIN_API_ENDPOINT = import.meta.env.VITE_LINKEDIN_API_ENDPOINT;

/**
 * Search for companies on LinkedIn
 * @param {object} query - Search query
 * @param {object} filters - Search filters
 * @returns {Promise<{companies, error}>}
 */
export async function searchCompanies(query, filters = {}) {
  try {
    if (!LINKEDIN_API_KEY) {
      // Return mock data for development
      return getMockCompanies(query);
    }

    // Real API implementation (Proxycurl example)
    const { keywords, industries } = query;
    const { locations, company_sizes, limit = 20 } = filters;

    const searchQuery = [...(keywords || []), ...(industries || [])].join(' ');

    const response = await fetch(
      `${LINKEDIN_API_ENDPOINT}/company/search?query=${encodeURIComponent(searchQuery)}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LINKEDIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform API response to our format
    const companies = data.results?.map((company) => ({
      name: company.name,
      linkedin_url: company.linkedin_url,
      industry: company.industry,
      size: company.company_size,
      location: company.location,
      description: company.description,
    })) || [];

    return { companies, error: null };
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
    if (!LINKEDIN_API_KEY) {
      // Return mock data for development
      return getMockProfiles(query);
    }

    const { keywords, companies } = query;
    const { seniority_levels, locations, skills, limit = 30 } = filters;

    const searchQuery = [...(keywords || []), ...(skills || [])].join(' ');

    const response = await fetch(
      `${LINKEDIN_API_ENDPOINT}/profile/search?query=${encodeURIComponent(searchQuery)}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LINKEDIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.statusText}`);
    }

    const data = await response.json();

    const profiles = data.results?.map((profile) => ({
      name: profile.full_name,
      linkedin_url: profile.linkedin_url,
      current_role: profile.current_position?.title,
      current_company: profile.current_position?.company,
      location: profile.location,
      headline: profile.headline,
      skills: profile.skills || [],
    })) || [];

    return { profiles, error: null };
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
// MOCK DATA FOR DEVELOPMENT (Remove when API is configured)
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
