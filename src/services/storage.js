/**
 * CV Storage Service
 * Manages CV file uploads and retrievals from Supabase Storage
 */

import { supabase } from './supabase.js';
import { validateCVFile } from '../utils/validation.js';

const STORAGE_BUCKET = 'cvs';

/**
 * Upload a CV file to Supabase Storage
 * @param {File} file - File object from input element
 * @param {string} userId - UUID of authenticated user
 * @returns {Promise<{storagePath, publicUrl, error}>}
 */
export async function uploadCV(file, userId) {
  try {
    // Validate file
    const validation = validateCVFile(file);
    if (!validation.valid) {
      return { storagePath: null, publicUrl: null, error: new Error(validation.error) };
    }

    // Generate unique file path: cvs/{userId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${timestamp}_${sanitizedFilename}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    });

    if (error) {
      return { storagePath: null, publicUrl: null, error };
    }

    // Get public URL (NOTE: This only works if the bucket is public)
    // For private buckets, use getSignedURL() or getCVUrl() instead
    // Accessing publicUrl on a private bucket will result in a 400 error
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    return {
      storagePath: data.path,
      publicUrl: urlData?.publicUrl || null, // May be null or invalid if bucket is private
      error: null,
    };
  } catch (err) {
    return {
      storagePath: null,
      publicUrl: null,
      error: new Error(`Upload failed: ${err.message}`),
    };
  }
}

/**
 * Download a CV file from storage
 * @param {string} storagePath - Storage path from cv_metadata
 * @returns {Promise<{blob, error}>}
 */
export async function downloadCV(storagePath) {
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);

    if (error) {
      return { blob: null, error };
    }

    return { blob: data, error: null };
  } catch (err) {
    return { blob: null, error: new Error(`Download failed: ${err.message}`) };
  }
}

/**
 * Delete a CV file from storage
 * @param {string} storagePath - Storage path to delete
 * @returns {Promise<{error}>}
 */
export async function deleteCV(storagePath) {
  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (err) {
    return { error: new Error(`Delete failed: ${err.message}`) };
  }
}

/**
 * List all CV files for a user
 * @param {string} userId - User UUID
 * @returns {Promise<{files, error}>}
 */
export async function listUserCVFiles(userId) {
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      return { files: null, error };
    }

    return { files: data, error: null };
  } catch (err) {
    return { files: null, error: new Error(`List files failed: ${err.message}`) };
  }
}

/**
 * Get signed URL for private file access
 * @param {string} storagePath - Storage path
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<{signedUrl, error}>}
 */
export async function getSignedURL(storagePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      return { signedUrl: null, error };
    }

    return { signedUrl: data.signedUrl, error: null };
  } catch (err) {
    return { signedUrl: null, error: new Error(`Get signed URL failed: ${err.message}`) };
  }
}

/**
 * Get a valid URL for accessing a CV file (uses signed URL for private buckets)
 * This is the recommended way to get a URL that will actually work
 * @param {string} storagePath - Storage path
 * @param {number} expiresIn - Expiration time in seconds for signed URLs (default: 3600 = 1 hour)
 * @returns {Promise<{url, error}>}
 */
export async function getCVUrl(storagePath, expiresIn = 3600) {
  try {
    // Try to get a signed URL first (works for private buckets)
    const { signedUrl, error: signedError } = await getSignedURL(storagePath, expiresIn);
    
    if (!signedError && signedUrl) {
      return { url: signedUrl, error: null };
    }

    // Fallback to public URL if signed URL fails (might work if bucket is public)
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    
    if (urlData?.publicUrl) {
      return { url: urlData.publicUrl, error: null };
    }

    return { 
      url: null, 
      error: new Error('Failed to generate URL. Check bucket permissions.') 
    };
  } catch (err) {
    return { url: null, error: new Error(`Get CV URL failed: ${err.message}`) };
  }
}

export default {
  uploadCV,
  downloadCV,
  deleteCV,
  listUserCVFiles,
  getSignedURL,
  getCVUrl,
};
