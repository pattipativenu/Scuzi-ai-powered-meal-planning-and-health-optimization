/**
 * Temporary image cache to store AI-generated images when DynamoDB update fails
 * This ensures we don't lose generated images
 */

interface CachedImage {
  historyItemId: string;
  imageUrl: string;
  timestamp: number;
  dishName: string;
}

// In-memory cache (in production, this could be Redis or file-based)
const imageCache = new Map<string, CachedImage>();

/**
 * Store generated image in cache
 */
export function cacheGeneratedImage(historyItemId: string, imageUrl: string, dishName: string): void {
  const cached: CachedImage = {
    historyItemId,
    imageUrl,
    timestamp: Date.now(),
    dishName
  };
  
  imageCache.set(historyItemId, cached);
  console.log('[IMAGE CACHE] ✅ Cached image for history item:', historyItemId);
  console.log('[IMAGE CACHE] ✅ Cache size:', imageCache.size);
}

/**
 * Retrieve cached image by history item ID
 */
export function getCachedImage(historyItemId: string): CachedImage | null {
  const cached = imageCache.get(historyItemId);
  if (cached) {
    console.log('[IMAGE CACHE] ✅ Found cached image for:', historyItemId);
    return cached;
  }
  console.log('[IMAGE CACHE] ❌ No cached image for:', historyItemId);
  return null;
}

/**
 * Get all cached images
 */
export function getAllCachedImages(): CachedImage[] {
  return Array.from(imageCache.values());
}

/**
 * Clear old cached images (older than 1 hour)
 */
export function clearOldCachedImages(): number {
  const oneHourAgo = Date.now() - 3600000;
  let cleared = 0;
  
  for (const [key, cached] of imageCache.entries()) {
    if (cached.timestamp < oneHourAgo) {
      imageCache.delete(key);
      cleared++;
    }
  }
  
  if (cleared > 0) {
    console.log('[IMAGE CACHE] 🧹 Cleared', cleared, 'old cached images');
  }
  
  return cleared;
}