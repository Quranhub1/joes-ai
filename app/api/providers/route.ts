import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    providers: [{
      id: 'groq',
      name: 'Groq Llama 3.1 70B',
      type: 'configured' as const,
      description: 'Fast, powerful LLM via Groq'
    }]
  })
}