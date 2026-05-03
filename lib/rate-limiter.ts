import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 500 // Leave some buffer below Replicate's 600 limit

function getRateLimitKey(request: NextRequest): string {
  // Use IP address as key, fallback to user agent for development
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'
  return ip
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }

  record.count++
  return false
}

function getRemainingRequests(key: string): number {
  const record = rateLimitStore.get(key)
  if (!record) return MAX_REQUESTS_PER_WINDOW
  return Math.max(0, MAX_REQUESTS_PER_WINDOW - record.count)
}

function getResetTime(key: string): number {
  const record = rateLimitStore.get(key)
  return record?.resetTime || Date.now() + RATE_LIMIT_WINDOW
}

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const key = getRateLimitKey(request)

  if (isRateLimited(key)) {
    const resetTime = getResetTime(key)
    const remainingSeconds = Math.ceil((resetTime - Date.now()) / 1000)

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${remainingSeconds} seconds.`,
        retryAfter: remainingSeconds
      },
      {
        status: 429,
        headers: {
          'Retry-After': remainingSeconds.toString(),
          'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        }
      }
    )
  }

  const remaining = getRemainingRequests(key)
  const resetTime = getResetTime(key)

  // Add rate limit headers to successful responses
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())

  return null // No rate limit hit
}

// Clean up old records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute