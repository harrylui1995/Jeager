/**
 * Validation Utilities
 * Input validation helpers for file uploads, forms, and data
 */

import {
  MAX_CV_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  LINKEDIN_PATTERNS,
  MESSAGES,
} from './constants.js';

/**
 * Validate CV file before upload
 * @param {File} file - File object from input element
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateCVFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_CV_SIZE_BYTES) {
    return { valid: false, error: MESSAGES.FILE_TOO_LARGE };
  }

  // Check file type
  const validTypes = Object.values(ALLOWED_FILE_TYPES);
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: MESSAGES.INVALID_FILE_TYPE };
  }

  // Check file extension as backup
  const extension = `.${file.name.split('.').pop().toLowerCase()}`;
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return { valid: false, error: MESSAGES.INVALID_FILE_TYPE };
  }

  return { valid: true, error: null };
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, error: null };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, error: string|null, strength: string}}
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required', strength: 'none' };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
      strength: 'weak',
    };
  }

  // Check strength
  let strength = 'weak';
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaMet = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  if (criteriaMet >= 4) {
    strength = 'strong';
  } else if (criteriaMet >= 3) {
    strength = 'medium';
  }

  return { valid: true, error: null, strength };
}

/**
 * Validate LinkedIn company URL
 * @param {string} url - LinkedIn company URL
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateLinkedInCompanyURL(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'LinkedIn company URL is required' };
  }

  if (!LINKEDIN_PATTERNS.COMPANY.test(url)) {
    return {
      valid: false,
      error: 'Invalid LinkedIn company URL. Must start with https://www.linkedin.com/company/',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate LinkedIn profile URL
 * @param {string} url - LinkedIn profile URL
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateLinkedInProfileURL(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'LinkedIn profile URL is required' };
  }

  if (!LINKEDIN_PATTERNS.PROFILE.test(url)) {
    return {
      valid: false,
      error: 'Invalid LinkedIn profile URL. Must start with https://www.linkedin.com/in/',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate match score
 * @param {number} score - Match score (0.00-1.00)
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateMatchScore(score) {
  if (typeof score !== 'number') {
    return { valid: false, error: 'Match score must be a number' };
  }

  if (score < 0 || score > 1) {
    return { valid: false, error: 'Match score must be between 0.00 and 1.00' };
  }

  return { valid: true, error: null };
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID string
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'UUID is required' };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true, error: null };
}

/**
 * Validate pagination parameters
 * @param {number} limit - Page size
 * @param {number} offset - Offset
 * @returns {{valid: boolean, error: string|null}}
 */
export function validatePagination(limit, offset) {
  if (typeof limit !== 'number' || limit < 1 || limit > 100) {
    return { valid: false, error: 'Limit must be between 1 and 100' };
  }

  if (typeof offset !== 'number' || offset < 0) {
    return { valid: false, error: 'Offset must be a non-negative number' };
  }

  return { valid: true, error: null };
}

export default {
  validateCVFile,
  validateEmail,
  validatePassword,
  validateLinkedInCompanyURL,
  validateLinkedInProfileURL,
  validateMatchScore,
  sanitizeInput,
  validateUUID,
  validatePagination,
};
