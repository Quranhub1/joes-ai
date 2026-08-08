import { NextResponse } from 'next/server'

function getConfiguredProviders() {
  const providers: Array<{
    id: string
    name: string
    type: 'premium' | 'free'
    description: string
  }> = []

  if (process.env.GROQ_API_KEY) {
    providers.push({
      id: 'groq',
      name: 'Groq Llama 3.3 70B',
      type: 'free',
      description: 'Fast, powerful LLM via Groq (free tier)'
    })
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      id: 'openai',
      name: 'OpenAI GPT-4o',
      type: 'premium',
      description: 'Most capable OpenAI model with 128K context'
    })
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      id: 'anthropic',
      name: 'Claude 3.5 Sonnet',
      type: 'premium',
      description: 'Anthropic\'s most intelligent model'
    })
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      id: 'gemini',
      name: 'Google Gemini Pro',
      type: 'free',
      description: 'Google\'s advanced multimodal AI'
    })
  }

  if (process.env.REPLICATE_API_TOKEN) {
    providers.push({
      id: 'replicate',
      name: 'Replicate Llama 3',
      type: 'premium',
      description: 'Open-source models via Replicate'
    })
  }

  return providers
}

export async function GET() {
  const providers = getConfiguredProviders()
  
  if (providers.length === 0) {
    return NextResponse.json({
      providers: [{
        id: 'none',
        name: 'No providers configured',
        type: 'free' as const,
        description: 'Please add an API key to get started'
      }]
    })
  }

  return NextResponse.json({ providers })
}