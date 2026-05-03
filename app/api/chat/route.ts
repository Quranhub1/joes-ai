import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPTS: Record<string, string> = {
  coding: `You are a world-class senior software architect and coding expert. Your responses should be comprehensive, detailed.`,
  general: `You are a highly knowledgeable AI assistant. Provide detailed, accurate responses.`,
  personal: `You are a deeply empathetic life advisor. Provide thoughtful, supportive guidance.`,
  predictions: `You are a data-driven sports analyst. Provide detailed analysis with statistics.`,
  creative: `You are a creative writing assistant. Help with storytelling, poetry, and imaginative content.`
}

export async function POST(request: NextRequest) {
  try {
    const { message, mode = 'general', history = [], userName } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        error: 'GROQ_API_KEY not configured. Please set your Groq API key.' 
      }, { status: 500 })
    }

    let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general
    
    if (userName) {
      systemPrompt = `${systemPrompt}\n\nThe user's name is ${userName}. Always remember their name.`
    }

    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-10).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 512  // Reduced to save tokens and avoid rate limits
        })
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMsg = error.error?.message || 'Groq API error'
        
        // Handle rate limit specifically
        if (errorMsg.includes('rate limit') || errorMsg.includes('Rate limit')) {
          return NextResponse.json({ 
            error: 'Rate limit reached. Please wait a moment and try again.',
            limit: true
          }, { status: 429 })
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from Groq')
      }

      return NextResponse.json({ response: content, provider: 'groq' })
    } catch (err) {
      console.error('Groq API error:', err)
      return NextResponse.json({ 
        error: err instanceof Error ? err.message : 'Failed to get response from Groq' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    providers: [{
      id: 'groq',
      name: 'Groq Llama 3.3 70B',
      type: 'configured' as const,
      description: 'Fast, powerful LLM via Groq'
    }]
  })
}