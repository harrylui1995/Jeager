/**
 * Application Constants
 * Centralized configuration and constant values
 */

// File Upload Constraints
export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_CV_SIZE_MB = 5;

export const ALLOWED_FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
};

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt'];

// Parsing Status
export const PARSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Search Types
export const SEARCH_TYPES = {
  COMPANY: 'company',
  PROFILE: 'profile',
};

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
};

// Search Quotas
export const FREE_TIER_DAILY_SEARCHES = 10;
export const PREMIUM_TIER_DAILY_SEARCHES = -1; // Unlimited

// Match Score Thresholds
export const MATCH_SCORE_THRESHOLD = {
  EXCELLENT: 0.8, // 80%+
  GOOD: 0.6, // 60-79%
  FAIR: 0.4, // 40-59%
  POOR: 0.0, // <40%
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// LinkedIn URL Patterns
export const LINKEDIN_PATTERNS = {
  COMPANY: /^https:\/\/www\.linkedin\.com\/company\//,
  PROFILE: /^https:\/\/www\.linkedin\.com\/in\//,
};

// Skill Categories
export const SKILL_CATEGORIES = {
  TECHNICAL: 'technical',
  SOFT: 'soft',
};

// Seniority Levels
export const SENIORITY_LEVELS = {
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  EXECUTIVE: 'executive',
};

// Company Size Categories
export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+',
];

// Common Industries (sample list, extend as needed)
export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Media',
  'Real Estate',
  'Energy',
  'Telecommunications',
  'Transportation',
  'Hospitality',
  'Legal',
  'Non-Profit',
];

// API Configuration
export const LINKEDIN_API_RATE_LIMIT = 100; // requests per day for free tier
export const API_TIMEOUT_MS = 10000; // 10 seconds

// UI Messages
export const MESSAGES = {
  UPLOAD_SUCCESS: 'CV uploaded successfully! Analysis in progress...',
  UPLOAD_ERROR: 'Failed to upload CV. Please try again.',
  PARSING_SUCCESS: 'CV analyzed successfully!',
  PARSING_ERROR: 'Failed to analyze CV. Please try a different file.',
  FILE_TOO_LARGE: `File size exceeds ${MAX_CV_SIZE_MB}MB limit. Please compress or split your file.`,
  INVALID_FILE_TYPE: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.',
  AUTH_ERROR: 'Authentication failed. Please check your credentials.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  RATE_LIMIT_EXCEEDED: 'Daily search limit reached. Upgrade to premium for unlimited searches.',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'cv_matcher_preferences',
  CACHED_CV_DATA: 'cv_matcher_cv_cache',
  SEARCH_HISTORY: 'cv_matcher_search_history',
};

// Debounce Delays (ms)
export const DEBOUNCE_DELAYS = {
  SEARCH_INPUT: 500,
  AUTO_SAVE: 1000,
};

// Animation Durations (ms)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Routes
export const ROUTES = {
  LOGIN: '/',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  COMPANIES: '/companies',
  PROFILES: '/profiles',
  SETTINGS: '/settings',
};

export default {
  MAX_CV_SIZE_BYTES,
  MAX_CV_SIZE_MB,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  PARSING_STATUS,
  SEARCH_TYPES,
  SUBSCRIPTION_TIERS,
  FREE_TIER_DAILY_SEARCHES,
  PREMIUM_TIER_DAILY_SEARCHES,
  MATCH_SCORE_THRESHOLD,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  LINKEDIN_PATTERNS,
  SKILL_CATEGORIES,
  SENIORITY_LEVELS,
  COMPANY_SIZES,
  INDUSTRIES,
  LINKEDIN_API_RATE_LIMIT,
  API_TIMEOUT_MS,
  MESSAGES,
  STORAGE_KEYS,
  DEBOUNCE_DELAYS,
  ANIMATION_DURATIONS,
  ROUTES,
};
