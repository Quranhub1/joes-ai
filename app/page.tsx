'use client'

import { FormEvent, useState, useEffect, useRef } from 'react'

interface Provider {
  id: string
  name: string
  type: 'premium' | 'free'
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  mode: string
  provider: string
  timestamp: Date
}

const MODES = [
  { id: 'coding', label: 'Coding', emoji: '💻' },
  { id: 'general', label: 'General Q&A', emoji: '💬' },
  { id: 'personal', label: 'Personal Advice', emoji: '🧘' },
  { id: 'predictions', label: 'Predictions', emoji: '⚽' },
  { id: 'creative', label: 'Creative', emoji: '🎨' }
]

export default function Home() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedMode, setSelectedMode] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [historyStatus, setHistoryStatus] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch available providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers')
        const data = await res.json()
        setProviders(data.providers)
        if (data.providers.length > 0) {
          setSelectedProvider(data.providers[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err)
        setError('Could not load providers')
      }
    }
    fetchProviders()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Load saved conversation from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('joe-ai-chat')
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        const restored = parsed.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setMessages(restored)
      }
    } catch (error) {
      console.warn('Unable to restore saved chat:', error)
    }
  }, [])

  // Keep conversation saved locally
  useEffect(() => {
    window.localStorage.setItem('joe-ai-chat', JSON.stringify(messages))
  }, [messages])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const clearConversation = () => {
    if (confirm('Clear entire conversation?')) {
      setMessages([])
      setMessage('')
      setError('')
      setHistoryStatus('Conversation cleared')
      setTimeout(() => setHistoryStatus(''), 2000)
    }
  }

  const downloadChatJson = () => {
    const payload = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    }))

    const json = JSON.stringify({ messages: payload }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'joes-ai-chat.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const syncChatJson = async () => {
    if (messages.length === 0) {
      setHistoryStatus('No messages to sync')
      setTimeout(() => setHistoryStatus(''), 2000)
      return
    }

    setHistoryStatus('Syncing to JSONBin...')
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to sync chat history')
      }
      setHistoryStatus('Saved to JSONBin')
    } catch (err) {
      setHistoryStatus(err instanceof Error ? err.message : 'Sync failed')
      console.error('History sync error:', err)
    } finally {
      setTimeout(() => setHistoryStatus(''), 3000)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim()) return

    if (!selectedProvider) {
      setError('Please select an AI provider')
      setLoading(false)
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      mode: selectedMode,
      provider: selectedProvider,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          provider: selectedProvider,
          mode: selectedMode
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await res.json()
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.response,
        mode: selectedMode,
        provider: selectedProvider,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl h-screen sm:h-[90vh] flex flex-col bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30 p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                ⚡ Joe's AI
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-1">Chat with the best AI models</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={downloadChatJson}
                disabled={messages.length === 0}
                className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                📥 Export JSON
              </button>
              <button
                type="button"
                onClick={syncChatJson}
                disabled={messages.length === 0}
                className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ☁️ Save to JSONBin
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition-colors"
                  title="Clear conversation"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>
          {historyStatus && (
            <div className="text-xs text-gray-300 mb-3">{historyStatus}</div>
          )}

          {/* Provider & Mode Controls */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 block">🤖 Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white disabled:opacity-50"
                disabled={loading}
              >
                <optgroup label="Premium" className="bg-slate-800">
                  {providers
                    .filter(p => p.type === 'premium')
                    .map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                    ))}
                </optgroup>
                <optgroup label="Free" className="bg-slate-800">
                  {providers
                    .filter(p => p.type === 'free')
                    .map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                    ))}
                </optgroup>
              </select>
            </div>
            
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 block">🎯 Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white disabled:opacity-50"
                disabled={loading}
              >
                {MODES.map(mode => (
                  <option key={mode.id} value={mode.id} className="bg-slate-800">
                    {mode.emoji} {mode.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="text-gray-400">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-sm">Start a conversation by typing a message below</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl px-4 py-3 rounded-xl shadow-lg transition-all ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800/80 border border-purple-500/30 text-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">{msg.content}</p>
                  <div className={`text-xs mt-2 flex items-center justify-between gap-2 ${msg.type === 'user' ? 'text-purple-100' : 'text-gray-400'}`}>
                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.type === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className={`hover:opacity-70 transition-opacity ${copiedId === msg.id ? 'text-green-400' : ''}`}
                        title="Copy message"
                      >
                        {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/80 border border-purple-500/30 text-gray-100 px-4 py-3 rounded-xl rounded-bl-none">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-purple-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 sm:mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm sm:text-base">⚠️ {error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-purple-500/30 bg-slate-900/50 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!loading && message.trim()) {
                    handleSubmit(e as any)
                  }
                }
              }}
              placeholder="Ask me anything... (Shift+Enter for new line)"
              className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-base bg-slate-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-500 resize-none disabled:opacity-50 transition-all"
              rows={3}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 text-xs sm:text-base whitespace-nowrap"
              title="Send message (or press Enter)"
            >
              {loading ? '...' : '🚀'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        :global(.animate-fadeIn) {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}