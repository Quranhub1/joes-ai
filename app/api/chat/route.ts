import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPTS: Record<string, string> = {
  coding: `You are a world-class senior software architect and coding expert. Provide comprehensive, detailed, and production-ready code responses. Always maintain context of the ongoing conversation — reference previous messages when relevant, and build upon earlier discussion points. Never deviate from the coding topic at hand. If the user pivots, acknowledge the change but stay helpful within the new direction.`,
  general: `You are a highly knowledgeable AI assistant with excellent memory. Provide detailed, accurate responses. CRITICAL RULES: (1) Always maintain conversation context — reference previous messages and build upon earlier topics. (2) Stay strictly on topic — if the user changes subject, adapt but don't forget prior context. (3) If the user asks a follow-up, use the full conversation history to give a coherent, continuous response. (4) Never give generic answers when specific context exists.`,
  personal: `You are a deeply empathetic life advisor with perfect memory of the conversation. Provide thoughtful, supportive guidance. IMPORTANT: Track the user's personal details, feelings, and situation across the entire conversation. Reference previous messages naturally. Build on earlier advice. Show you remember their name, situation, and ongoing concerns. Never lose track of the conversation thread.`,
  predictions: `You are a data-driven sports analyst. Provide detailed analysis with statistics. Always reference previous analysis and predictions made in this conversation. Build on earlier points. If the user asks about a previously mentioned team or player, recall that context. Stay on topic and maintain analytical continuity.`,
  creative: `You are a creative writing assistant with excellent memory. Help with storytelling, poetry, and imaginative content. Remember characters, settings, and plot points mentioned earlier in the conversation. Build the story continuously. Reference previous creative work. Maintain narrative consistency across the entire chat.`
}

function buildConversationSummary(history: Array<{ role: string; content: string }>): string {
  if (history.length === 0) return ''
  
  const recentHistory = history.slice(-30)
  const summary = recentHistory.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant'
    return `${role}: ${msg.content.slice(0, 200)}${msg.content.length > 200 ? '...' : ''}`
  }).join('\n')
  
  return `\n\n--- Recent Conversation Context (last ${recentHistory.length} messages) ---\n${summary}\n--- End of Context ---\n\nIMPORTANT: Use the above context to maintain conversation continuity. Always reference relevant earlier points when responding. Stay on topic and build upon the ongoing discussion.`
}

interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, { type: string; description: string }>
      required: string[]
    }
  }
}

function getTools(availableTools: string[]): ToolDefinition[] {
  const tools: ToolDefinition[] = []

  if (availableTools.includes('web_search')) {
    tools.push({
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for current information, news, facts, or any information you are uncertain about. Use this when the user asks about current events, recent news, or when you need up-to-date information.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query string' }
          },
          required: ['query']
        }
      }
    })
  }

  if (availableTools.includes('youtube_search')) {
    tools.push({
      type: 'function',
      function: {
        name: 'youtube_search',
        description: 'Search YouTube for videos. Use this when the user asks to find videos, tutorials, or video content on any topic.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query for YouTube videos' }
          },
          required: ['query']
        }
      }
    })
  }

  return tools
}

async function executeWebSearch(query: string): Promise<string> {
  const googleApiKey = process.env.GOOGLE_API_KEY
  const googleCx = process.env.GOOGLE_SEARCH_CX

  if (googleApiKey && googleCx) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}`
      const res = await fetch(url, { next: { revalidate: 0 } })
      const data = await res.json()
      
      if (data.items && data.items.length > 0) {
        const results = data.items.slice(0, 5).map((item: any, i: number) => 
          `${i + 1}. **${item.title}**\n   ${item.snippet}\n   ${item.link}`
        ).join('\n\n')
        return `Search results for "${query}":\n\n${results}`
      }
    } catch (e) {
      console.error('Google search failed:', e)
    }
  }

  return `[Search unavailable] Searched for: "${query}". No results available. Consider adding GOOGLE_API_KEY and GOOGLE_SEARCH_CX environment variables for web search.`
}

async function executeYouTubeSearch(query: string): Promise<string> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 0 } })
      const data = await res.json()
      
      if (data.items && data.items.length > 0) {
        const results = data.items.map((item: any, i: number) => {
          const videoId = item.id.videoId
          const title = item.snippet.title
          const channel = item.snippet.channelTitle
          return `${i + 1}. **${title}** by ${channel}\n   https://www.youtube.com/watch?v=${videoId}`
        }).join('\n\n')
        return `YouTube search results for "${query}":\n\n${results}`
      }
    } catch (e) {
      console.error('YouTube search failed:', e)
    }
  }

  return `[YouTube search unavailable] Searched for: "${query}". No results available. Consider adding YOUTUBE_API_KEY environment variable for YouTube search.`
}

interface ProviderConfig {
  id: string
  name: string
  apiKey?: string
  baseUrl: string
  model: string
  headers: Record<string, string>
  transformMessages: (messages: Array<{ role: string; content: string }>, systemPrompt: string) => Array<{ role: string; content: string }>
  parseResponse: (data: any) => string
  parseToolCalls: (data: any) => Array<{ name: string; arguments: Record<string, any> }> | null
  type: 'openai-compatible' | 'anthropic' | 'gemini' | 'replicate'
  supportsTools: boolean
}

function getProviderConfig(providerId: string, systemPrompt: string): ProviderConfig | null {
  switch (providerId) {
    case 'groq':
      if (!process.env.GROQ_API_KEY) return null
      return {
        id: 'groq',
        name: 'Groq Llama 3.3 70B',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformMessages: (messages, sysPrompt) => [
          { role: 'system', content: sysPrompt },
          ...messages
        ],
        parseResponse: (data) => data.choices?.[0]?.message?.content || '',
        parseToolCalls: (data) => data.choices?.[0]?.message?.tool_calls || null,
        type: 'openai-compatible',
        supportsTools: true
      }

    case 'openai':
      if (!process.env.OPENAI_API_KEY) return null
      return {
        id: 'openai',
        name: 'OpenAI GPT-4o',
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformMessages: (messages, sysPrompt) => [
          { role: 'system', content: sysPrompt },
          ...messages
        ],
        parseResponse: (data) => data.choices?.[0]?.message?.content || '',
        parseToolCalls: (data) => data.choices?.[0]?.message?.tool_calls || null,
        type: 'openai-compatible',
        supportsTools: true
      }

    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) return null
      return {
        id: 'anthropic',
        name: 'Claude 3.5 Sonnet',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-5-sonnet-20241022',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        transformMessages: (messages, sysPrompt) => {
          const systemMessage = { role: 'user' as const, content: sysPrompt }
          const filteredMessages = messages.filter(m => m.role !== 'system')
          return [systemMessage, ...filteredMessages]
        },
        parseResponse: (data) => data.content?.[0]?.text || '',
        parseToolCalls: (data) => null,
        type: 'anthropic',
        supportsTools: false
      }

    case 'gemini':
      if (!process.env.GEMINI_API_KEY) return null
      return {
        id: 'gemini',
        name: 'Google Gemini Pro',
        apiKey: process.env.GEMINI_API_KEY,
        baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        model: 'gemini-2.0-flash',
        headers: {
          'Content-Type': 'application/json'
        },
        transformMessages: (messages, sysPrompt) => {
          const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }))
          return [{ systemInstruction: { parts: [{ text: sysPrompt }] }, contents } as any]
        },
        parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        parseToolCalls: (data) => null,
        type: 'gemini',
        supportsTools: false
      }

    case 'replicate':
      if (!process.env.REPLICATE_API_TOKEN) return null
      return {
        id: 'replicate',
        name: 'Replicate Llama 3',
        apiKey: process.env.REPLICATE_API_TOKEN,
        baseUrl: 'https://api.replicate.com/v1/predictions',
        model: 'meta/llama-3-70b-instruct',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        transformMessages: (messages, sysPrompt) => messages,
        parseResponse: (data) => data.output || '',
        parseToolCalls: (data) => null,
        type: 'replicate',
        supportsTools: false
      }

    default:
      return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, mode = 'general', history = [], userName, provider = 'groq', tools = [] } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general
    
    if (userName) {
      systemPrompt = `${systemPrompt}\n\nThe user's name is ${userName}. Always remember and use their name naturally in conversation.`
    }

    // Inject conversation summary for context continuity
    const conversationSummary = buildConversationSummary(history)
    if (conversationSummary) {
      systemPrompt = `${systemPrompt}${conversationSummary}`
    }

    // Use up to 50 messages for rich context (approx 1GB equivalent conversation memory)
    const contextMessages = history.slice(-50).map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    const providerConfig = getProviderConfig(provider, systemPrompt)
    
    if (!providerConfig) {
      return NextResponse.json({ 
        error: `${provider.toUpperCase()} API key not configured. Please set your ${provider.toUpperCase()}_API_KEY environment variable.` 
      }, { status: 500 })
    }

    const availableTools = tools.length > 0 ? tools : (process.env.ENABLE_WEB_SEARCH === 'true' ? ['web_search'] : [])
    const toolDefinitions = getTools(availableTools)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

      let response: Response
      let body: any

      if (providerConfig.type === 'openai-compatible') {
        const conversationMessages = providerConfig.transformMessages(contextMessages, systemPrompt)
        body = {
          model: providerConfig.model,
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 4096,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.1
        }

        if (toolDefinitions.length > 0 && providerConfig.supportsTools) {
          body.tools = toolDefinitions
          body.tool_choice = 'auto'
        }

        response = await fetch(providerConfig.baseUrl, {
          method: 'POST',
          headers: providerConfig.headers,
          body: JSON.stringify(body),
          signal: controller.signal
        })
      } else if (providerConfig.type === 'anthropic') {
        const conversationMessages = providerConfig.transformMessages(contextMessages, systemPrompt)
        body = {
          model: providerConfig.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: contextMessages,
          temperature: 0.7,
          top_p: 0.9
        }

        response = await fetch(providerConfig.baseUrl, {
          method: 'POST',
          headers: providerConfig.headers,
          body: JSON.stringify(body),
          signal: controller.signal
        })
      } else if (providerConfig.type === 'gemini') {
        const geminiMessages = providerConfig.transformMessages(contextMessages, systemPrompt) as any[]
        body = {
          contents: geminiMessages[0]?.contents || [],
          systemInstruction: geminiMessages[0]?.systemInstruction || { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            topP: 0.9
          }
        }

        response = await fetch(providerConfig.baseUrl, {
          method: 'POST',
          headers: providerConfig.headers,
          body: JSON.stringify(body),
          signal: controller.signal
        })
      } else if (providerConfig.type === 'replicate') {
        const prompt = contextMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
        body = {
          input: {
            prompt: `${systemPrompt}\n\n${prompt}\n\nAssistant:`,
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 0.9
          }
        }

        response = await fetch(providerConfig.baseUrl, {
          method: 'POST',
          headers: providerConfig.headers,
          body: JSON.stringify(body),
          signal: controller.signal
        })
      } else {
        throw new Error(`Unsupported provider type: ${providerConfig.type}`)
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error?.message || errorData.message || `${providerConfig.name} API error`
        
        // Handle rate limit specifically
        if (errorMsg.includes('rate limit') || errorMsg.includes('Rate limit') || errorMsg.includes('quota')) {
          return NextResponse.json({ 
            error: `${providerConfig.name} rate limit reached. Please wait a moment and try again.`,
            limit: true
          }, { status: 429 })
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json()
      const content = providerConfig.parseResponse(data)

      // Handle tool calls for openai-compatible providers
      const toolCalls = providerConfig.parseToolCalls(data)
      let toolResults: Array<{ name: string; result: string }> = []
      
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.name === 'web_search') {
            const result = await executeWebSearch(toolCall.arguments.query || '')
            toolResults.push({ name: 'web_search', result })
          } else if (toolCall.name === 'youtube_search') {
            const result = await executeYouTubeSearch(toolCall.arguments.query || '')
            toolResults.push({ name: 'youtube_search', result })
          }
        }

        // If we have tool results, send them back to the model for final response
        if (toolResults.length > 0) {
          const toolResultMessages = contextMessages.concat([{ role: 'assistant', content: content }])
          
          const followUpMessages = providerConfig.transformMessages(
            toolResultMessages.map((m: any) => ({ ...m, content: m.content })),
            systemPrompt
          )
          
          followUpMessages.push({
            role: 'user',
            content: toolResults.map(t => `[Tool: ${t.name}]\n${t.result}`).join('\n\n')
          })

          const followUpController = new AbortController()
          const followUpTimeout = setTimeout(() => followUpController.abort(), 120000)

          const followUpResponse = await fetch(providerConfig.baseUrl, {
            method: 'POST',
            headers: providerConfig.headers,
            body: JSON.stringify({
              model: providerConfig.model,
              messages: followUpMessages,
              temperature: 0.7,
              max_tokens: 4096,
              top_p: 0.9,
              frequency_penalty: 0.3,
              presence_penalty: 0.1
            }),
            signal: followUpController.signal
          })

          clearTimeout(followUpTimeout)

          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json()
            const finalContent = providerConfig.parseResponse(followUpData)
            
            if (finalContent) {
              return NextResponse.json({ 
                response: finalContent, 
                provider: providerConfig.id,
                toolResults 
              })
            }
          }
        }
      }

      if (!content) {
        throw new Error(`Empty response from ${providerConfig.name}`)
      }

      return NextResponse.json({ response: content, provider: providerConfig.id, toolResults })
    } catch (err) {
      console.error(`${providerConfig?.name || 'Provider'} API error:`, err)
      return NextResponse.json({ 
        error: err instanceof Error ? err.message : `Failed to get response from ${providerConfig?.name || 'provider'}` 
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
