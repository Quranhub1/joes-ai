import crypto from 'crypto'

const imageCache = new Map<string, { prompt: string; output: string[]; expiresAt: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000

function generatePromptHash(prompt: string): string {
  return crypto.createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex')
}

export function getCachedImage(prompt: string): string[] | null {
  const hash = generatePromptHash(prompt)
  const entry = imageCache.get(hash)
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) imageCache.delete(hash)
    return null
  }
  return entry.output
}

export function setCachedImage(prompt: string, output: string[]): void {
  if (imageCache.size > 1000) return
  imageCache.set(generatePromptHash(prompt), {
    prompt,
    output,
    expiresAt: Date.now() + CACHE_TTL
  })
}