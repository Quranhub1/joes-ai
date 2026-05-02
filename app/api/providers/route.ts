import { NextResponse } from 'next/server'

export async function GET() {
  const providers = [
    {
      id: 'groq',
      name: 'Groq Llama 3',
      type: 'free' as const,
      description: 'Fast, open-source LLM via Groq'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      type: 'free' as const,
      description: 'Google multimodal AI model'
    }
  ]

  const availableProviders = providers.filter(provider => {
    switch (provider.id) {
      case 'groq':
        return !!process.env.GROQ_API_KEY
      case 'gemini':
        return !!process.env.GEMINI_API_KEY
      default:
        return false
    }
  })

  return NextResponse.json({ providers: availableProviders })
}