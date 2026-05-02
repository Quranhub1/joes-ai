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
    const { message, provider: requestedProvider, mode } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general

    // Get available providers
    const availableProviders = await getAvailableProviders()

    // Determine which provider to use with fallback logic
    let providerToUse = requestedProvider

    // If requested provider is not available, try fallback providers
    const fallbackOrder = ['groq', 'bazaarlink', 'completions', 'openai', 'claude']

    if (!availableProviders.includes(requestedProvider)) {
      // Find first available provider in fallback order
      providerToUse = fallbackOrder.find(p => availableProviders.includes(p)) || requestedProvider
    }

    let response: string
    let lastError: Error | null = null

    // Try the requested provider first, then fallbacks
    const providersToTry = [providerToUse, ...fallbackOrder.filter(p => p !== providerToUse && availableProviders.includes(p))]

    for (const provider of providersToTry) {
      try {
        switch (provider) {
          case 'groq':
            response = await callGroqAPI(message, systemPrompt)
            break
          case 'gemini':
            response = await callGeminiAPI(message, systemPrompt)
            break
          case 'openai':
            response = await callOpenAIAPI(message, systemPrompt)
            break
          case 'claude':
            response = await callClaudeAPI(message, systemPrompt)
            break
          case 'bazaarlink':
            response = await callBazaarLinkAPI(message, systemPrompt)
            break
          case 'completions':
            response = await callCompletionsAPI(message, systemPrompt)
            break
          default:
            continue // Skip unsupported providers
        }

        // If we get here, the provider worked
        return NextResponse.json({
          response,
          provider: provider, // Return which provider was actually used
          fallback: provider !== requestedProvider // Indicate if fallback was used
        })
      } catch (error) {
        lastError = error as Error
        console.warn(`Provider ${provider} failed:`, error)
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

  // Free providers that don't require API keys
  providers.push('bazaarlink', 'completions')

  return providers
}

async function callBazaarLinkAPI(message: string, systemPrompt: string): Promise<string> {
  try {
    const res = await fetch('https://api.bazaarlink.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'auto',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    })

    if (!res.ok) {
      throw new Error(`BazaarLink API error: ${res.status}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || 'No response from BazaarLink'
  } catch (error) {
    throw new Error(`BazaarLink API failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function callCompletionsAPI(message: string, systemPrompt: string): Promise<string> {
  try {
    const res = await fetch('https://api.completions.me/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    })

    if (!res.ok) {
      throw new Error(`Completions.me API error: ${res.status}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || 'No response from Completions.me'
  } catch (error) {
    throw new Error(`Completions.me API failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function callGroqAPI(message: string, systemPrompt: string): Promise<string> {
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Groq API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callGeminiAPI(message: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
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

async function callOpenAIAPI(message: string, systemPrompt: string): Promise<string> {
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'OpenAI API error')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function callClaudeAPI(message: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')

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
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Anthropic API error')
  }

  const data = await res.json()
  return data.content[0].text
}