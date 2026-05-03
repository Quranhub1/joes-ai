import { NextRequest, NextResponse } from 'next/server'

// Simple rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const MAX_REQUESTS_PER_WINDOW = 500

function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 60000 })
    return null
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  record.count++
  return null
}

export { checkRateLimit }