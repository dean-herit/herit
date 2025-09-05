import { put } from "@vercel/blob";

/**
 * Utility functions for handling profile photos from OAuth providers
 */

/**
 * Checks if a Google profile photo URL is a placeholder/default image
 * Google's default avatars typically:
 * - Have "default" in the URL
 * - Are generated initials (single letters)
 * - Have specific patterns for placeholder images
 */
export function isGooglePlaceholderImage(photoUrl: string): boolean {
  if (!photoUrl) return true;

  // Common patterns for Google placeholder images
  const placeholderPatterns = [
    /\/default_user/i,
    /\/default[/_]avatar/i,
    /\/avatar[/_]anonymous/i,
    /\/avatar[/_]default/i,
    /googleusercontent\.com.*\/photo\.jpg\?sz=\d+$/i, // Default photo.jpg pattern
    /\/s\d+-c\/photo\.jpg$/i, // Pattern like /s96-c/photo.jpg (often placeholders)
  ];

  // Check if it matches any known placeholder patterns
  for (const pattern of placeholderPatterns) {
    if (pattern.test(photoUrl)) {
      return true;
    }
  }

  // Additional heuristic: if the URL is suspiciously short or generic
  if (photoUrl.includes("photo.jpg") && photoUrl.length < 100) {
    return true;
  }

  return false;
}

/**
 * Downloads a Google profile photo and stores it in our Vercel Blob storage
 * Returns null if the photo is a placeholder or if download fails
 */
export async function downloadAndStoreGooglePhoto(
  googlePhotoUrl: string,
  userId: string,
  userEmail: string,
): Promise<string | null> {
  try {
    // Skip if it's a placeholder image
    if (isGooglePlaceholderImage(googlePhotoUrl)) {
      console.log("Skipping Google placeholder image:", googlePhotoUrl);

      return null;
    }

    // Download the image from Google
    console.log("Downloading Google profile photo:", googlePhotoUrl);
    const response = await fetch(googlePhotoUrl);

    if (!response.ok) {
      console.warn("Failed to download Google profile photo:", response.status);

      return null;
    }

    const blob = await response.blob();

    // Validate it's actually an image
    if (!blob.type.startsWith("image/")) {
      console.warn("Google photo URL did not return an image:", blob.type);

      return null;
    }

    // Check file size (skip if too large, > 10MB)
    if (blob.size > 10 * 1024 * 1024) {
      console.warn("Google profile photo too large:", blob.size);

      return null;
    }

    // Generate a unique filename for our storage
    const timestamp = Date.now();
    const fileExtension = getFileExtensionFromMimeType(blob.type) || "jpg";
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `oauth/google/photos/${sanitizedEmail}/${userId}-${timestamp}.${fileExtension}`;

    // Upload to our Vercel Blob storage
    const uploadedBlob = await put(pathname, blob, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("Successfully stored Google profile photo:", uploadedBlob.url);

    return uploadedBlob.url;
  } catch (error) {
    console.error("Error downloading/storing Google profile photo:", error);

    return null;
  }
}

/**
 * Helper function to get file extension from MIME type
 */
function getFileExtensionFromMimeType(mimeType: string): string | null {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
  };

  return mimeToExt[mimeType.toLowerCase()] || null;
}

/**
 * Processes Google OAuth profile photo:
 * 1. Checks if it's a real photo (not placeholder)
 * 2. Downloads and stores in our service
 * 3. Returns our URL or null if placeholder/failed
 */
export async function processGoogleProfilePhoto(
  googlePhotoUrl: string | null,
  userId: string,
  userEmail: string,
): Promise<string | null> {
  if (!googlePhotoUrl) return null;

  // Download and store the photo in our service
  return await downloadAndStoreGooglePhoto(googlePhotoUrl, userId, userEmail);
}
