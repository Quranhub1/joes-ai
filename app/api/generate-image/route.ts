import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Image generation is currently disabled - requires REPLICATE_API_KEY
    return NextResponse.json({
      error: 'Image generation is temporarily unavailable. Please configure the REPLICATE_API_KEY environment variable to enable this feature.'
    }, { status: 503 })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }, { status: 500 })
  }
}