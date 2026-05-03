// Simple in-memory cache (in production, use Redis or similar)
interface CacheEntry {
  prompt: string
  output: string[]
  timestamp: number
  expiresAt: number
}

const imageCache = new Map<string, CacheEntry>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_SIZE = 1000 // Limit cache size

// Simple hash function for Edge Runtime compatibility (no crypto module needed)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export function getCachedImage(prompt: string): string[] | null {
  const hash = simpleHash(prompt.trim().toLowerCase())
  const entry = imageCache.get(hash)

  if (!entry) return null

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    imageCache.delete(hash)
    return null
  }

  // Update access time (simple LRU-like behavior)
  entry.timestamp = Date.now()
  return entry.output
}

export function setCachedImage(prompt: string, output: string[]): void {
  const hash = simpleHash(prompt.trim().toLowerCase())

  // Evict oldest entries if cache is full
  if (imageCache.size >= MAX_CACHE_SIZE) {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of imageCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      imageCache.delete(oldestKey)
    }
  }

  imageCache.set(hash, {
    prompt: prompt.trim(),
    output,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL
  })
}

export function getCacheStats(): { size: number; hits: number; misses: number } {
  return {
    size: imageCache.size,
    hits: 0, // Would need to track this separately
    misses: 0
  }
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of imageCache.entries()) {
    if (now > entry.expiresAt) {
      imageCache.delete(key)
    }
  }
}, 60000) // Clean up every minute