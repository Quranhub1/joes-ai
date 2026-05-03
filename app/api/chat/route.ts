import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPTS: Record<string, string> = {
  coding: `You are a world-class senior software architect and coding expert. Your responses should be:
- **Extremely detailed** with comprehensive explanations
- Provide **production-ready, clean, and efficient code** following best practices
- Include **multiple approaches** when applicable, explaining pros and cons
- Add **inline comments** and explain the logic behind your solutions
- Cover **edge cases, error handling, and performance considerations**
- Reference **design patterns, architectural principles, and industry standards**
- Include **code examples** that are well-structured and properly formatted
- Explain **why** you chose a particular solution, not just how
- Consider **scalability, maintainability, and security** in your recommendations
- Break down complex concepts into understandable parts`,

  general: `You are an exceptionally knowledgeable and articulate AI assistant. Your responses should be:
- **Highly detailed and comprehensive** - never superficial
- Provide **in-depth explanations** with context and background
- Use **clear, precise language** while maintaining depth
- Include **relevant examples** to illustrate points
- Structure your answers logically with **proper formatting**
- Anticipate **follow-up questions** and address them proactively
- Be **thorough** in exploring all aspects of a topic
- Maintain a **friendly yet professional** tone
- Provide **nuanced perspectives** on complex issues
- Always aim to **educate and inform** comprehensively`,

  personal: `You are a deeply empathetic, wise, and experienced life advisor with expertise in psychology, career development, and personal growth. Your responses should be:
- **Exceptionally thoughtful and nuanced** - consider all dimensions of the situation
- Show **genuine empathy and understanding** of the person's feelings and circumstances
- Provide **practical, actionable advice** grounded in psychological principles
- Offer **multiple perspectives** to help the person see their situation more clearly
- Be **supportive yet honest** - don't just tell them what they want to hear
- Consider **long-term implications** and personal values
- Include **specific strategies and techniques** they can implement
- Acknowledge the **complexity of human emotions** and relationships
- Draw from **established psychological frameworks** (CBT, mindfulness, etc.) when helpful
- Maintain a **warm, non-judgmental, and encouraging** tone throughout
- Help them **explore their own thoughts** through reflective questioning
- Address both **emotional and practical aspects** of their concerns`,

  predictions: `You are an elite sports data analyst with deep expertise in football (soccer) analytics and match prediction. Your responses should be:
- **Extremely detailed and data-driven** - base predictions on concrete analysis
- Analyze **Head-to-Head (H2H) statistics** comprehensively:
  * Recent meetings (last 5-10 matches)
  * Home vs away performance patterns
  * Goals scored/conceded trends
  * Key player performances in these matchups
- Evaluate **current form** thoroughly:
  * Last 5-10 matches for each team
  * Performance metrics (possession, shots, xG, etc.)
  * Injury updates and squad availability
  * Recent tactical changes or manager impact
- Consider **contextual factors**:
  * League position and motivation (relegation battle, European qualification, etc.)
  * Fixture congestion and fatigue
  * Home advantage and crowd influence
  * Weather conditions if relevant
  * Derby/rivalry intensity
- Provide **tactical analysis**:
  * Playing styles and formations
  * Key matchups between players
  * Strengths and weaknesses of each team
  * How the teams might approach the game
- Give **specific predictions** with confidence levels:
  * Match result (win/draw/loss) with probability estimates
  * Expected goals (over/under)
  * Both teams to score analysis
  * Key players to watch
- Always **explain your reasoning** clearly and acknowledge uncertainties
- Use **statistical evidence** to support your conclusions`,

  creative: `You are an award-winning creative writing assistant with expertise in storytelling, poetry, and imaginative content creation. Your responses should be:
- **Richly detailed and vivid** - paint pictures with words
- Demonstrate **sophisticated use of literary devices** (metaphor, simile, imagery, etc.)
- Show **deep understanding of narrative structure** and pacing
- Create **compelling characters** with depth and motivation
- Use **evocative language** that engages all senses
- Maintain **consistent tone and style** appropriate to the genre
- Provide **constructive feedback** that helps improve creative work
- Offer **multiple creative approaches** or variations when helpful
- Draw from **literary traditions and techniques** while encouraging innovation
- Be **inspirational and encouraging** of creative expression`
}

export async function POST(request: NextRequest) {
  try {
    const { message, provider: requestedProvider, mode, history = [], userName } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general
    
    // Add user name to system prompt if available
    if (userName) {
      systemPrompt = `${systemPrompt}\n\nThe user's name is ${userName}. Always remember their name during this conversation and use it naturally in your replies when appropriate.`
    }

    // Build conversation messages from history
    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-20).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Get available providers
    const availableProviders = await getAvailableProviders()
    console.log('Available providers:', availableProviders)

    // Determine which provider to use with fallback logic
    let providerToUse = requestedProvider

    // Fallback order: Try all providers in sequence until one succeeds
    const fallbackOrder = ['groq', 'gemini', 'bazaarlink', 'completions', 'together', 'deepinfra', 'lepton', 'cohere', 'huggingface', 'openai', 'claude']

    if (!availableProviders.includes(requestedProvider)) {
      // Find first available provider in fallback order
      providerToUse = fallbackOrder.find(p => availableProviders.includes(p)) || requestedProvider
      console.log(`Requested provider ${requestedProvider} not available, using fallback: ${providerToUse}`)
    }

    let response: string
    let lastError: Error | null = null

    // Try the requested provider first, then fallbacks
    const providersToTry = [providerToUse, ...fallbackOrder.filter(p => p !== providerToUse && availableProviders.includes(p))]
    console.log('Providers to try (in order):', providersToTry)

    for (const provider of providersToTry) {
      try {
        console.log(`Attempting provider: ${provider}`)
        switch (provider) {
          case 'groq':
            response = await callGroqAPI(conversationMessages)
            break
          case 'gemini':
            response = await callGeminiAPI(conversationMessages)
            break
          case 'openai':
            response = await callOpenAIAPI(conversationMessages)
            break
          case 'claude':
            response = await callClaudeAPI(conversationMessages)
            break
          case 'bazaarlink':
            response = await callBazaarLinkAPI(conversationMessages)
            break
          case 'completions':
            response = await callCompletionsAPI(conversationMessages)
            break
          case 'together':
            response = await callTogetherAPI(conversationMessages)
            break
          case 'replicate':
            response = await callReplicateAPI(conversationMessages)
            break
          case 'cohere':
            response = await callCohereAPI(conversationMessages)
            break
          case 'deepinfra':
            response = await callDeepInfraAPI(conversationMessages)
            break
          case 'lepton':
            response = await callLeptonAPI(conversationMessages)
            break
          case 'huggingface':
            response = await callHuggingFaceAPI(conversationMessages)
            break
          default:
            continue // Skip unsupported providers
        }

        // If we get here, the provider worked
        console.log(`Provider ${provider} succeeded`)
        return NextResponse.json({
          response,
          provider: provider,
          fallback: provider !== requestedProvider
        })
      } catch (error) {
        lastError = error as Error
        console.error(`Provider ${provider} failed:`, lastError.message)
        // Continue to next provider
      }
    }

    // If all providers failed, return the last error
    console.error('All providers failed. Last error:', lastError)
    return NextResponse.json(
      { error: lastError?.message || 'All AI providers are currently unavailable. Please try again later.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getAvailableProviders(): Promise<string[]> {
  const providers = []

  if (process.env.GROQ_API_KEY) providers.push('groq')
  if (process.env.GEMINI_API_KEY) providers.push('gemini')
  if (process.env.OPENAI_API_KEY) providers.push('openai')
  if (process.env.ANTHROPIC_API_KEY) providers.push('claude')

  // Always available providers (no API key required)
  providers.push('bazaarlink', 'completions')
  
  if (process.env.TOGETHER_API_KEY) providers.push('together')
  if (process.env.REPLICATE_API_KEY) providers.push('replicate')
  if (process.env.COHERE_API_KEY) providers.push('cohere')
  if (process.env.DEEPINFRA_API_KEY) providers.push('deepinfra')
  if (process.env.LEPTON_API_KEY) providers.push('lepton')
  if (process.env.HUGGINGFACE_API_KEY) providers.push('huggingface')

  return providers
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callBazaarLinkAPI(messages: Message[]): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    console.log('Calling BazaarLink API...')
    const res = await fetch('https://api.bazaarlink.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'auto',
        messages,
        temperature: 0.7,
        max_tokens: 1024  // Reduced from 2048 to save tokens
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error details')
      throw new Error(`BazaarLink API error: ${res.status} - ${errorText}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.warn('BazaarLink returned no content in choices')
      throw new Error('BazaarLink returned empty response')
    }
    return content
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        throw new Error('BazaarLink API timeout after 15 seconds')
      }
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        throw new Error('BazaarLink API unreachable - network error')
      }
      throw new Error(`BazaarLink API failed: ${error.message}`)
    }
    throw new Error('BazaarLink API failed with unknown error')
  }
}

async function callCompletionsAPI(messages: Message[]): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add API key if available
    if (process.env.COMPLETIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.COMPLETIONS_API_KEY}`
    }

    console.log('Calling Completions.me API...')
    const res = await fetch('https://completions.me/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1024  // Reduced from 2048 to save tokens
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error details')
      throw new Error(`Completions.me API error: ${res.status} - ${errorText}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.warn('Completions.me returned no content in choices')
      throw new Error('Completions.me returned empty response')
    }
    return content
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        throw new Error('Completions.me API timeout after 15 seconds')
      }
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        throw new Error('Completions.me API unreachable - network error')
      }
      throw new Error(`Completions.me API failed: ${error.message}`)
    }
    throw new Error('Completions.me API failed with unknown error')
  }
}

async function callGroqAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq API key not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1024  // Reduced from 2048 to save tokens
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Groq API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callGeminiAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  // Gemini doesn't support multi-turn conversation natively, so we format as a single prompt
  const conversationText = messages.map(m => `${m.role === 'system' ? 'System' : m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: conversationText }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024  // Reduced from 2048 to save tokens
        }
      })
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Gemini API error')
  }

  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

async function callOpenAIAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1024  // Reduced from 2048 to save tokens
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'OpenAI API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callClaudeAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')

  // Claude uses system message separately
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-default-browser': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,  // Reduced from 2048 to save tokens
      system: systemMessage?.content || 'You are a helpful AI assistant.',
      messages: conversationMessages
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Anthropic API error')
  }

  const data = await res.json()
  return data.content[0].text
}

async function callTogetherAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) throw new Error('Together AI API key not configured')

  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3-70b-chat-hf',
      messages,
      temperature: 0.7,
      max_tokens: 1024  // Reduced from 2048 to save tokens
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Together AI API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callReplicateAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.REPLICATE_API_KEY
  if (!apiKey) throw new Error('Replicate API key not configured')

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'e0f031d3bce1e7e763e01e91588783e913e3587e170550ee4b66b58f1eef9759',
      input: {
        prompt: messages[messages.length - 1].content
      }
    })
  })

  if (!res.ok) {
    throw new Error('Replicate API error')
  }

  const data = await res.json()
  return data.output?.join('') || 'No response'
}

async function callCohereAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.COHERE_API_KEY
  if (!apiKey) throw new Error('Cohere API key not configured')

  const conversationHistory = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      message: m.content
    }))

  const res = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: messages[messages.length - 1].content,
      chat_history: conversationHistory.slice(0, -1),
      model: 'command'
    })
  })

  if (!res.ok) {
    throw new Error('Cohere API error')
  }

  const data = await res.json()
  return data.text
}

async function callDeepInfraAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.DEEPINFRA_API_KEY
  if (!apiKey) throw new Error('DeepInfra API key not configured')

  const res = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-2-70b-chat-hf',
      messages,
      temperature: 0.7,
      max_tokens: 1024  // Reduced from 2048 to save tokens
    })
  })

  if (!res.ok) {
    throw new Error('DeepInfra API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callLeptonAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.LEPTON_API_KEY
  if (!apiKey) throw new Error('Lepton AI API key not configured')

  const res = await fetch('https://api.lepton.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama2-70b',
      messages,
      temperature: 0.7,
      max_tokens: 1024  // Reduced from 2048 to save tokens
    })
  })

  if (!res.ok) {
    throw new Error('Lepton AI API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callHuggingFaceAPI(messages: Message[]): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) throw new Error('Hugging Face API key not configured')

  const res = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'HuggingFaceH4/zephyr-7b-beta',
      messages,
      temperature: 0.7,
      max_tokens: 1024  // Reduced from 2048 to save tokens
    })
  })

  if (!res.ok) {
    throw new Error('Hugging Face API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}