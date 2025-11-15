/**
 * Supabase Client Initialization
 * Configures and exports Supabase client for authentication, database, and storage
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file. ' +
    'Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY'
  );
}

/**
 * Supabase client instance
 * Provides access to auth, database, and storage services
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'linkedin-cv-matcher',
    },
  },
});

/**
 * Helper: Check if Supabase client is properly initialized
 * @returns {boolean} True if client is ready
 */
export function isSupabaseReady() {
  return !!supabase;
}

/**
 * Helper: Get current session
 * @returns {Promise<{session, error}>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session, error };
}

export default supabase;
