/**
 * Authentication Service
 * Handles user authentication via Supabase Auth
 */

import { supabase } from './supabase.js';

/**
 * Register a new user account
 * @param {string} email - User email address
 * @param {string} password - User password (min 8 characters)
 * @returns {Promise<{user, session, error}>}
 */
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: new Error(`Sign up failed: ${err.message}`),
    };
  }
}

/**
 * Authenticate existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, session, error}>}
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: new Error(`Sign in failed: ${err.message}`),
    };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error}>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    return { error: new Error(`Sign out failed: ${err.message}`) };
  }
}

/**
 * Get the currently authenticated user
 * @returns {Promise<{user, error}>}
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: new Error(`Get user failed: ${err.message}`) };
  }
}

/**
 * Listen for authentication state changes
 * @param {Function} callback - Callback function (event, session) => void
 * @returns {{data: {subscription}, error}}
 */
export function onAuthStateChange(callback) {
  try {
    const { data, error } = supabase.auth.onAuthStateChange(callback);
    return { data, error };
  } catch (err) {
    return { data: null, error: new Error(`Auth state listener failed: ${err.message}`) };
  }
}

/**
 * Reset password for email
 * @param {string} email - User email
 * @returns {Promise<{error}>}
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  } catch (err) {
    return { error: new Error(`Password reset failed: ${err.message}`) };
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<{user, error}>}
 */
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: new Error(`Password update failed: ${err.message}`) };
  }
}
