/**
 * Database Service
 * CRUD operations on Supabase PostgreSQL tables
 */

import { supabase } from './supabase.js';
import { DEFAULT_PAGE_SIZE } from '../utils/constants.js';

// ============================================================================
// CV METADATA OPERATIONS
// ============================================================================

/**
 * Create a new CV metadata record
 * @param {object} cvData - CV metadata
 * @returns {Promise<{data, error}>}
 */
export async function createCVMetadata(cvData) {
  try {
    const { data, error } = await supabase
      .from('cv_metadata')
      .insert([
        {
          user_id: cvData.user_id,
          storage_path: cvData.storage_path,
          original_filename: cvData.original_filename,
          file_size_bytes: cvData.file_size_bytes,
          file_type: cvData.file_type,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Create CV metadata failed: ${err.message}`) };
  }
}

/**
 * Update CV metadata
 * @param {string} cvId - CV record UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data, error}>}
 */
export async function updateCVMetadata(cvId, updates) {
  try {
    const { data, error } = await supabase
      .from('cv_metadata')
      .update(updates)
      .eq('id', cvId)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Update CV metadata failed: ${err.message}`) };
  }
}

/**
 * Get a single CV metadata record
 * @param {string} cvId - CV record UUID
 * @returns {Promise<{data, error}>}
 */
export async function getCVMetadata(cvId) {
  try {
    const { data, error } = await supabase
      .from('cv_metadata')
      .select('*')
      .eq('id', cvId)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Get CV metadata failed: ${err.message}`) };
  }
}

/**
 * List all CVs for a user
 * @param {string} userId - User UUID
 * @param {object} options - Pagination and sorting options
 * @returns {Promise<{data, count, error}>}
 */
export async function listUserCVs(userId, options = {}) {
  try {
    const {
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
      orderBy = 'uploaded_at',
      orderDirection = 'desc',
    } = options;

    const query = supabase
      .from('cv_metadata')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    return { data, count, error };
  } catch (err) {
    return { data: null, count: 0, error: new Error(`List user CVs failed: ${err.message}`) };
  }
}

/**
 * Delete a CV metadata record (cascades to matches and sessions)
 * @param {string} cvId - CV record UUID
 * @returns {Promise<{error}>}
 */
export async function deleteCVMetadata(cvId) {
  try {
    const { error } = await supabase.from('cv_metadata').delete().eq('id', cvId);

    return { error };
  } catch (err) {
    return { error: new Error(`Delete CV metadata failed: ${err.message}`) };
  }
}

// ============================================================================
// COMPANY MATCHES OPERATIONS
// ============================================================================

/**
 * Save a company match
 * @param {object} matchData - Company match data
 * @returns {Promise<{data, error}>}
 */
export async function saveCompanyMatch(matchData) {
  try {
    const { data, error } = await supabase
      .from('company_matches')
      .insert([matchData])
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Save company match failed: ${err.message}`) };
  }
}

/**
 * Get company matches with filters
 * @param {string} userId - User UUID
 * @param {string|null} cvId - Optional CV ID filter
 * @param {object} filters - Filter options
 * @returns {Promise<{data, count, error}>}
 */
export async function getCompanyMatches(userId, cvId = null, filters = {}) {
  try {
    const {
      is_saved,
      min_score = 0,
      industries,
      locations,
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
    } = filters;

    let query = supabase
      .from('company_matches')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('match_score', min_score)
      .order('match_score', { ascending: false });

    if (cvId) {
      query = query.eq('cv_id', cvId);
    }

    if (typeof is_saved === 'boolean') {
      query = query.eq('is_saved', is_saved);
    }

    if (industries && industries.length > 0) {
      query = query.in('industry', industries);
    }

    if (locations && locations.length > 0) {
      query = query.in('location', locations);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    return { data, count, error };
  } catch (err) {
    return {
      data: null,
      count: 0,
      error: new Error(`Get company matches failed: ${err.message}`),
    };
  }
}

/**
 * Update company match (e.g., toggle saved status)
 * @param {string} matchId - Match UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data, error}>}
 */
export async function updateCompanyMatch(matchId, updates) {
  try {
    const { data, error } = await supabase
      .from('company_matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Update company match failed: ${err.message}`) };
  }
}

// ============================================================================
// PROFILE MATCHES OPERATIONS
// ============================================================================

/**
 * Save a profile match
 * @param {object} matchData - Profile match data
 * @returns {Promise<{data, error}>}
 */
export async function saveProfileMatch(matchData) {
  try {
    const { data, error } = await supabase
      .from('profile_matches')
      .insert([matchData])
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Save profile match failed: ${err.message}`) };
  }
}

/**
 * Get profile matches with filters
 * @param {string} userId - User UUID
 * @param {string|null} cvId - Optional CV ID filter
 * @param {object} filters - Filter options
 * @returns {Promise<{data, count, error}>}
 */
export async function getProfileMatches(userId, cvId = null, filters = {}) {
  try {
    const {
      is_saved,
      min_score = 0,
      companies,
      locations,
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
    } = filters;

    let query = supabase
      .from('profile_matches')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('match_score', min_score)
      .order('match_score', { ascending: false });

    if (cvId) {
      query = query.eq('cv_id', cvId);
    }

    if (typeof is_saved === 'boolean') {
      query = query.eq('is_saved', is_saved);
    }

    if (companies && companies.length > 0) {
      query = query.in('current_company', companies);
    }

    if (locations && locations.length > 0) {
      query = query.in('location', locations);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    return { data, count, error };
  } catch (err) {
    return {
      data: null,
      count: 0,
      error: new Error(`Get profile matches failed: ${err.message}`),
    };
  }
}

/**
 * Update profile match
 * @param {string} matchId - Match UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data, error}>}
 */
export async function updateProfileMatch(matchId, updates) {
  try {
    const { data, error} = await supabase
      .from('profile_matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Update profile match failed: ${err.message}`) };
  }
}

// ============================================================================
// SEARCH SESSIONS OPERATIONS
// ============================================================================

/**
 * Create a search session
 * @param {object} sessionData - Search session data
 * @returns {Promise<{data, error}>}
 */
export async function createSearchSession(sessionData) {
  try {
    const { data, error } = await supabase
      .from('search_sessions')
      .insert([sessionData])
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Create search session failed: ${err.message}`) };
  }
}

/**
 * Get search sessions for a user
 * @param {string} userId - User UUID
 * @param {object} options - Pagination options
 * @returns {Promise<{data, count, error}>}
 */
export async function getSearchSessions(userId, options = {}) {
  try {
    const { limit = DEFAULT_PAGE_SIZE, offset = 0 } = options;

    const { data, count, error } = await supabase
      .from('search_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, count, error };
  } catch (err) {
    return {
      data: null,
      count: 0,
      error: new Error(`Get search sessions failed: ${err.message}`),
    };
  }
}

// ============================================================================
// USER DATA DELETION (GDPR/CCPA Compliance)
// ============================================================================

/**
 * Delete all user data (GDPR compliance)
 * @param {string} userId - User UUID
 * @returns {Promise<{error}>}
 */
export async function deleteUserData(userId) {
  try {
    // Delete CV metadata (cascades to matches and sessions)
    const { error } = await supabase.from('cv_metadata').delete().eq('user_id', userId);

    if (error) {
      return { error };
    }

    // Delete user profile if exists
    await supabase.from('user_profiles').delete().eq('user_id', userId);

    return { error: null };
  } catch (err) {
    return { error: new Error(`Delete user data failed: ${err.message}`) };
  }
}

export default {
  createCVMetadata,
  updateCVMetadata,
  getCVMetadata,
  listUserCVs,
  deleteCVMetadata,
  saveCompanyMatch,
  getCompanyMatches,
  updateCompanyMatch,
  saveProfileMatch,
  getProfileMatches,
  updateProfileMatch,
  createSearchSession,
  getSearchSessions,
  deleteUserData,
};
