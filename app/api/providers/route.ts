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
      name: 'BazaarLink',
      type: 'free' as const,
      description: 'Free - no key required'
    },
    {
      id: 'completions',
      name: 'Completions.me',
      type: 'free' as const,
      description: 'Free - no key required'
    },
    {
      id: 'together',
      name: 'Together AI',
      type: 'free' as const,
      description: 'Meta Llama 3 70B - Free tier'
    },
    {
      id: 'replicate',
      name: 'Replicate',
      type: 'free' as const,
      description: 'Runs models with free credits'
    },
    {
      id: 'cohere',
      name: 'Cohere',
      type: 'free' as const,
      description: 'Cohere Command model - Free trial'
    },
    {
      id: 'deepinfra',
      name: 'DeepInfra',
      type: 'free' as const,
      description: 'Llama 2 70B - Free tier'
    },
    {
      id: 'lepton',
      name: 'Lepton AI',
      type: 'free' as const,
      description: 'Llama 2 70B - Free tier'
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      type: 'free' as const,
      description: 'Zephyr 7B - Free API'
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
        return true // Always available
      case 'together':
        return !!process.env.TOGETHER_API_KEY
      case 'replicate':
        return !!process.env.REPLICATE_API_KEY
      case 'cohere':
        return !!process.env.COHERE_API_KEY
      case 'deepinfra':
        return !!process.env.DEEPINFRA_API_KEY
      case 'lepton':
        return !!process.env.LEPTON_API_KEY
      case 'huggingface':
        return !!process.env.HUGGINGFACE_API_KEY
      default:
        return false
    }
  })

  return NextResponse.json({ providers: availableProviders })
}
