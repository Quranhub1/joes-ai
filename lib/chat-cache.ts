// Simple in-memory cache for chat responses
interface ChatCacheEntry {
  response: string
  provider: string
  timestamp: number
  expiresAt: number
}

const chatCache = new Map<string, ChatCacheEntry>()
const CHAT_CACHE_TTL = 60 * 60 * 1000 // 1 hour
const MAX_CHAT_CACHE_SIZE = 500

// Simple hash function (no crypto module needed)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

function generateChatHash(message: string, provider: string, mode: string): string {
  const content = `${message.trim().toLowerCase()}:${provider}:${mode}`
  return simpleHash(content)
}

export function getCachedChatResponse(message: string, provider: string, mode: string): { response: string; provider: string } | null {
  const hash = generateChatHash(message, provider, mode)
  const entry = chatCache.get(hash)

  if (!entry) return null

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    chatCache.delete(hash)
    return null
  }

  // Update access time
  entry.timestamp = Date.now()
  return { response: entry.response, provider: entry.provider }
}

export function setCachedChatResponse(message: string, provider: string, mode: string, response: string): void {
  const hash = generateChatHash(message, provider, mode)

  // Evict oldest entries if cache is full
  if (chatCache.size >= MAX_CHAT_CACHE_SIZE) {
    let oldestKey = ''
    let oldestTime = Date.now()

    // Use forEach instead of for...of to avoid downlevelIteration issues
    chatCache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      chatCache.delete(oldestKey)
    }
  }

  chatCache.set(hash, {
    response,
    provider,
    timestamp: Date.now(),
    expiresAt: Date.now() + CHAT_CACHE_TTL
  })
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  // Use forEach instead of for...of to avoid downlevelIteration issues
  chatCache.forEach((entry, key) => {
    if (now > entry.expiresAt) {
      chatCache.delete(key)
    }
  })
}, 300000) // Clean up every 5 minutes