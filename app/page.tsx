'use client'

import { useState, useEffect, useRef } from 'react'

interface Provider {
  id: string
  name: string
  type: 'premium' | 'free'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const MODES = [
  { id: 'coding', label: 'Coding' },
  { id: 'general', label: 'General Q&A' },
  { id: 'personal', label: 'Personal Advice' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'creative', label: 'Creative' }
]

export default function Home() {
  const [message, setMessage] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState('bazaarlink')
  const [selectedMode, setSelectedMode] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Message[]>([])
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }
    setIsHistoryLoaded(true)
  }, [])

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem('chatHistory', JSON.stringify(history))
    }
  }, [history, isHistoryLoaded])

  // Fetch providers on mount
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
  }, [history, loading, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    }

    // Add user message to history immediately
    const updatedHistory = [...history, userMessage]
    setHistory(updatedHistory)
    setMessage('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          provider: selectedProvider,
          mode: selectedMode,
          history: updatedHistory.slice(-20) // Send last 20 messages for context
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await res.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }

      setHistory([...updatedHistory, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setHistory([])
      localStorage.removeItem('chatHistory')
      setError('')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Joe's AI Interface</h1>
        </div>
        <div className="flex items-center gap-4">
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
              title="Clear chat history"
            >
              Clear Chat
            </button>
          )}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={loading}
          >
            <optgroup label="Premium">
              {providers
                .filter(p => p.type === 'premium')
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </optgroup>
            <optgroup label="Free">
              {providers
                .filter(p => p.type === 'free')
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </optgroup>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 gap-4">
        
        {/* Mode Selection */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {MODES.map(mode => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelectedMode(mode.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedMode === mode.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 py-4">
          {/* Show all history messages */}
          {history.map((msg, index) => (
            <div key={index} className="flex gap-4">
              {msg.role === 'user' ? (
                <>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">Y</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">You</p>
                    <p className="text-gray-700 bg-gray-50 rounded-2xl rounded-tl-md p-4">{msg.content}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">AI</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">AI Assistant</p>
                    <div className="text-gray-700 bg-gray-50 rounded-2xl rounded-tl-md p-4 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                <span className="text-white text-sm">AI</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">AI Assistant</p>
                <div className="flex gap-2 items-center p-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm">!</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-600 mb-1">Error</p>
                <p className="text-red-500 bg-red-50 rounded-2xl p-4">{error}</p>
              </div>
            </div>
          )}

          {/* Welcome message when no history */}
          {history.length === 0 && !loading && !error && isHistoryLoaded && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Joe's AI</h2>
              <p className="text-gray-500">Your chat history is saved automatically. Select a mode and start chatting!</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 pt-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
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
                placeholder="Send a message..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-400"
                rows={1}
                disabled={loading}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              Send
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-2">
            Press Enter to send, Shift+Enter for new line • Chat is saved automatically
          </p>
        </div>
      </div>
    </div>
  )
}