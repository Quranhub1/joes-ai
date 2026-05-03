import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '../../../lib/rate-limiter'
import { getCachedImage, setCachedImage } from '../../../lib/image-cache'
import { trackUsage } from '../../../lib/usage-tracker'

// Global rate limiter for Replicate API calls
let lastReplicateCall = 0
const REPLICATE_MIN_INTERVAL = 100 // Minimum 100ms between Replicate API calls

async function throttleReplicateCall() {
  const now = Date.now()
  const timeSinceLastCall = now - lastReplicateCall

  if (timeSinceLastCall < REPLICATE_MIN_INTERVAL) {
    const waitTime = REPLICATE_MIN_INTERVAL - timeSinceLastCall
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }

  lastReplicateCall = Date.now()
}

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Check rate limit first
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) {
    trackUsage({
      endpoint: '/api/generate-image',
      method: 'POST',
      ip,
      success: false,
      duration: Date.now() - startTime
    })
    return rateLimitResponse
  }

  try {
    const { prompt, model = 'black-forest-labs/flux-pro' } = await request.json()

    if (!prompt?.trim()) {
      trackUsage({
        endpoint: '/api/generate-image',
        method: 'POST',
        ip,
        success: false,
        duration: Date.now() - startTime
      })
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cachedResult = getCachedImage(prompt.trim())
    if (cachedResult) {
      trackUsage({
        endpoint: '/api/generate-image',
        method: 'POST',
        ip,
        success: true,
        duration: Date.now() - startTime,
        cached: true
      })
      return NextResponse.json({
        id: 'cached',
        status: 'succeeded',
        output: cachedResult,
        cached: true
      })
    }

    // Check if Replicate API key is configured
    const replicateApiKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN
    if (!replicateApiKey) {
      trackUsage({
        endpoint: '/api/generate-image',
        method: 'POST',
        ip,
        success: false,
        duration: Date.now() - startTime
      })
      return NextResponse.json(
        { error: 'Replicate API key not configured' },
        { status: 500 }
      )
    }

    // Throttle Replicate API calls to avoid rate limits
    await throttleReplicateCall()

    // Call Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'd4146a7153a1a514661333d46d246663a7d9cc5d8fc6421b7ae64d9756307b4e', // Flux Pro model version
        input: {
          prompt: prompt.trim(),
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 90,
          num_inference_steps: 28
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      trackUsage({
        endpoint: '/api/generate-image',
        method: 'POST',
        ip,
        success: false,
        duration: Date.now() - startTime
      })
      throw new Error(errorData.detail || `Replicate API error: ${response.status}`)
    }

    const data = await response.json()

    // Cache successful results
    if (data.status === 'succeeded' && data.output) {
      setCachedImage(prompt.trim(), Array.isArray(data.output) ? data.output : [data.output])
    }

    trackUsage({
      endpoint: '/api/generate-image',
      method: 'POST',
      ip,
      success: true,
      duration: Date.now() - startTime
    })

    // Return the prediction data
    return NextResponse.json({
      id: data.id,
      status: data.status,
      output: data.output,
      urls: data.urls
    })
  } catch (error) {
    trackUsage({
      endpoint: '/api/generate-image',
      method: 'POST',
      ip,
      success: false,
      duration: Date.now() - startTime
    })
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    )
  }
}