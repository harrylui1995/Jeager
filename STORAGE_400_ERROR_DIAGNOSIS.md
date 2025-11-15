# Storage 400 Error Diagnosis

## Problem

You're seeing a 400 Bad Request error when trying to access a CV file:
```
jppmoobizmdoqkkupzwi.supabase.co/storage/v1/object/cvs/babd9c7b-53fc-4bbf-8eb0-216eb78cd1cc/1763242479816_GNLui_CV_Nov_Industry.pdf:1  Failed to load resource: the server responded with a status of 400 ()
```

## Root Cause

**Supabase Storage buckets are private by default.** When you call `getPublicUrl()`, it returns a URL even for private buckets, but accessing that URL will result in a 400 error because the file is not publicly accessible.

This is expected behavior for security reasons - CV files contain sensitive personal information and should remain private.

**⚠️ IMPORTANT:** For signed URLs to work properly, you **must** configure Storage RLS policies in Supabase. See `SUPABASE_STORAGE_SETUP.md` for detailed setup instructions.

## Solutions

### Solution 1: Use Signed URLs (Recommended)

Instead of using `publicUrl` from `uploadCV()`, use the new `getCVUrl()` function which automatically handles private buckets:

```javascript
import { getCVUrl } from './services/storage.js';

// Get a valid URL that works for both public and private buckets
const { url, error } = await getCVUrl(storagePath);

if (!error && url) {
  // Use this URL in iframe, anchor tag, etc.
  // Signed URLs expire after 1 hour by default
  const iframe = document.createElement('iframe');
  iframe.src = url;
}
```

### Solution 2: Use downloadCV() for Downloads

For downloading files, use the `downloadCV()` function which properly handles authentication:

```javascript
import { downloadCV } from './services/storage.js';

const { blob, error } = await downloadCV(storagePath);

if (!error && blob) {
  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cv.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
```

### Solution 3: Make Bucket Public (Not Recommended)

**⚠️ Warning:** Only do this if you truly need public access. CV files contain sensitive information!

In Supabase Dashboard:
1. Go to Storage → Buckets
2. Click on your `cvs` bucket
3. Toggle "Public bucket" to ON

**Security Risk:** Anyone with the URL can access the file. This is not recommended for production.

## Where the Error Might Be Coming From

The 400 error suggests that somewhere in your code (or browser extension), a public URL is being accessed. Check for:

1. **Iframe tags** trying to display PDFs:
   ```html
   <!-- This will fail if bucket is private -->
   <iframe src="<publicUrl>"></iframe>
   ```

2. **Anchor tags** or direct links:
   ```html
   <!-- This will fail if bucket is private -->
   <a href="<publicUrl>">Download CV</a>
   ```

3. **Image or object tags**:
   ```html
   <!-- This will fail if bucket is private -->
   <object data="<publicUrl>" type="application/pdf"></object>
   ```

## Code Changes Made

1. **Added `getCVUrl()` function** in `storage.js`:
   - Automatically tries signed URL first (works for private buckets)
   - Falls back to public URL if bucket is public
   - Returns a URL that will actually work

2. **Added comments** in `uploadCV()` to warn about `publicUrl` limitations

## Next Steps

1. **Find where the URL is being used**: Search your codebase for any usage of `publicUrl` from the upload response
2. **Replace with `getCVUrl()`**: Update any code that displays or links to CV files to use `getCVUrl()` instead
3. **Test**: Verify that CV files can now be accessed without 400 errors

## Example: Updating Dashboard to Display CV Links

If you want to add download/view links in the dashboard:

```javascript
import { getCVUrl } from '../services/storage.js';

// When displaying CV list
for (const cv of cvs) {
  const { url } = await getCVUrl(cv.storage_path);
  
  // Use this URL for download/view
  const downloadLink = `<a href="${url}" target="_blank">View CV</a>`;
}
```

## Additional Notes

- Signed URLs expire after a set time (default: 1 hour). You may need to refresh them for long-lived views.
- The `downloadCV()` function works regardless of bucket permissions because it uses authenticated requests.
- For better security, keep your bucket private and use signed URLs only when needed.

