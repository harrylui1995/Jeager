# Supabase Storage Setup Checklist

## Critical: Storage RLS Policies Required

**YES, you need to configure Storage RLS policies in Supabase** for signed URLs to work properly. Without these policies, signed URLs may fail even if the bucket exists.

## Step-by-Step Setup

### 1. Verify/Create the Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Check if a bucket named `cvs` exists
3. If it doesn't exist:
   - Click **"New Bucket"**
   - **Name**: `cvs`
   - **Public bucket**: **❌ UNCHECKED** (keep it private for security)
   - Click **"Create Bucket"**

### 2. Set Up Storage RLS Policies (REQUIRED)

The storage policies in your `database.sql` are commented out. You **must** set them up via the Dashboard UI (SQL Editor won't work due to permissions).

#### ✅ Via Dashboard UI (USE THIS METHOD)

**Important**: You cannot create storage policies via SQL Editor due to permissions. Use the Dashboard UI instead.

1. Go to **Supabase Dashboard** → **Storage**
2. Click on your `cvs` bucket (or go to **Storage** → **Policies**)
3. Click the **"Policies"** tab (you should see sections for SELECT, INSERT, DELETE)

#### Policy 1: Users can upload their own CVs (INSERT)

1. Under **"INSERT"** policies, click **"New Policy"** or **"Create Policy"**
2. Choose **"For full customization"** or **"Custom policy"**
3. **Policy name**: `Users can upload their own CVs`
4. **Allowed operation**: `INSERT` (should be pre-selected)
5. **Target roles**: `authenticated` (or `public` if you want)
6. **USING expression**: Leave empty or remove it (INSERT uses WITH CHECK)
7. **WITH CHECK expression**: Paste this:
   ```sql
   bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
8. Click **"Review"** then **"Save policy"**

#### Policy 2: Users can view their own CVs (SELECT) ⚠️ CRITICAL

This is **required for signed URLs to work**:

1. Under **"SELECT"** policies, click **"New Policy"** or **"Create Policy"**
2. Choose **"For full customization"** or **"Custom policy"**
3. **Policy name**: `Users can view their own CVs`
4. **Allowed operation**: `SELECT` (should be pre-selected)
5. **Target roles**: `authenticated` (or `public` if you want)
6. **USING expression**: Paste this:
   ```sql
   bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
7. **WITH CHECK expression**: Leave empty (SELECT uses USING)
8. Click **"Review"** then **"Save policy"**

#### Policy 3: Users can delete their own CVs (DELETE)

1. Under **"DELETE"** policies, click **"New Policy"** or **"Create Policy"**
2. Choose **"For full customization"** or **"Custom policy"**
3. **Policy name**: `Users can delete their own CVs`
4. **Allowed operation**: `DELETE` (should be pre-selected)
5. **Target roles**: `authenticated` (or `public` if you want)
6. **USING expression**: Paste this:
   ```sql
   bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
7. **WITH CHECK expression**: Leave empty (DELETE uses USING)
8. Click **"Review"** then **"Save policy"**

**Note**: The Dashboard UI might vary slightly in wording, but the key is:
- **INSERT**: Uses `WITH CHECK` expression
- **SELECT**: Uses `USING` expression (this is critical for signed URLs!)
- **DELETE**: Uses `USING` expression

### 3. Verify Policies Are Active

After creating policies:

1. Go to **Storage** → **Policies**
2. You should see 3 policies for the `cvs` bucket:
   - ✅ "Users can upload their own CVs" (INSERT)
   - ✅ "Users can view their own CVs" (SELECT) ← **Critical for signed URLs**
   - ✅ "Users can delete their own CVs" (DELETE)

### 4. Test the Setup

After setting up policies, test in your app:

```javascript
import { getSignedURL } from './services/storage.js';

// Test getting a signed URL
const { signedUrl, error } = await getSignedURL('your-user-id/filename.pdf');

if (error) {
  console.error('Signed URL failed:', error);
} else {
  console.log('Signed URL:', signedUrl);
  // This URL should work now (no 400 error)
}
```

## Why These Policies Are Required

- **Without RLS policies**: Supabase Storage denies access, even with signed URLs
- **The SELECT policy**: Allows `createSignedUrl()` to work properly
- **The folder check**: `(storage.foldername(name))[1] = auth.uid()::text` ensures users only access their own files (matches your path structure: `{userId}/{filename}`)

## Common Issues

### Issue: "new row violates row-level security policy"
**Solution**: Make sure the INSERT policy is created and active

### Issue: Signed URLs still return 400
**Solution**: 
1. Verify the SELECT policy exists and is active
2. Check that the file path matches the user ID (first folder in path)
3. Ensure the user is authenticated (`auth.uid()` must not be null)

### Issue: "permission denied for table storage.objects"
**Solution**: You might need to use the Dashboard UI instead of SQL Editor, or check your database permissions

## Bucket Settings Summary

| Setting | Value | Reason |
|---------|-------|--------|
| **Bucket Name** | `cvs` | Must match `STORAGE_BUCKET` constant in code |
| **Public Bucket** | ❌ **False** | Keep private for security (CVs contain personal info) |
| **File Size Limit** | 5MB | Matches your validation (adjust in bucket settings if needed) |
| **Allowed MIME Types** | PDF, DOCX, TXT | Optional: Set in bucket settings for extra security |

## Quick Verification

Run this in your browser console after logging in:

```javascript
// After uploading a CV, check if signed URL works
const { signedUrl, error } = await getSignedURL('your-storage-path');
console.log('Signed URL:', signedUrl, 'Error:', error);

// If no error, try accessing the URL
if (signedUrl) {
  window.open(signedUrl, '_blank');
}
```

If you see a signed URL and can access the file, your setup is correct! ✅

