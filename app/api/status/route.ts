import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const providers = []
  
  // Check each provider's availability
  const checks = [
    {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/models',
      requiresKey: true,
      hasKey: !!process.env.GROQ_API_KEY
    },
    {
      name: 'bazaarlink',
      url: 'https://api.bazaarlink.ai/health',
      requiresKey: false,
      hasKey: true
    },
    {
      name: 'completions',
      url: 'https://completions.me/api/health',
      requiresKey: false,
      hasKey: true
    }
  ]

  for (const check of checks) {
    if (check.requiresKey && !check.hasKey) {
      providers.push({
        name: check.name,
        available: false,
        reason: 'API key not configured'
      })
      continue
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(check.url, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      providers.push({
        name: check.name,
        available: response.ok,
        reason: response.ok ? 'OK' : `HTTP ${response.status}`
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      providers.push({
        name: check.name,
        available: false,
        reason: errorMsg.includes('aborted') ? 'Timeout' : `Network error: ${errorMsg}`
      })
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    providers
  })
}