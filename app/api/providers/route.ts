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
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      type: 'premium' as const,
      description: 'Most capable GPT-4 model'
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      type: 'premium' as const,
      description: 'Safe, reliable AI assistant'
    },
    {
      id: 'bazaarlink',
      name: 'BazaarLink (Free)',
      type: 'free' as const,
      description: 'Auto-routing to free models - no key required'
    },
    {
      id: 'completions',
      name: 'Completions.me (Free)',
      type: 'free' as const,
      description: 'Unlimited free access - no key required'
    }
  ]

  const availableProviders = providers.filter(provider => {
    switch (provider.id) {
      case 'groq':
        return !!process.env.GROQ_API_KEY
      case 'gemini':
        return !!process.env.GEMINI_API_KEY
      case 'openai':
        return !!process.env.OPENAI_API_KEY
      case 'claude':
        return !!process.env.ANTHROPIC_API_KEY
      case 'bazaarlink':
      case 'completions':
        return true
      default:
        return true
    }
  })

  return NextResponse.json({ providers: availableProviders })
}
