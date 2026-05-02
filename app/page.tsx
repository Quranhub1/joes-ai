'use client'

import { useState, useEffect, useRef } from 'react'

interface Provider {
  id: string
  name: string
  type: 'premium' | 'free'
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
  const [response, setResponse] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState('bazaarlink')
  const [selectedMode, setSelectedMode] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch available providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers')
        const data = await res.json()
        setProviders(data.providers)
        // Set first available provider as default
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

  // Auto-scroll to bottom when loading or response changes
  useEffect(() => {
    if (loading || response) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [loading, response])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Immediately show loading state
    setLoading(true)
    setError('')
    setResponse('')
    
    // Scroll to bottom immediately - use requestAnimationFrame for reliable scroll
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          provider: selectedProvider,
          mode: selectedMode
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await res.json()
      setResponse(data.response)
      setMessage('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">Joes AI Interface</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Chat with the best AI models</p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
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

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`px-2 py-2 sm:px-3 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm ${
                    selectedMode === mode.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  disabled={loading}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                // Submit on Enter (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!loading && message.trim()) {
                    handleSubmit(e as any)
                  }
                }
              }}
              placeholder="Ask me anything... (Press Enter to send)"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-blue-500 text-white font-medium py-2 sm:py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition text-sm sm:text-base"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium text-sm sm:text-base">Error</p>
            <p className="text-red-700 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-indigo-50 border border-indigo-200 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <p className="text-blue-700 text-xs sm:text-sm ml-2">AI is thinking...</p>
            </div>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 font-medium mb-2 text-sm sm:text-base">Response</p>
            <p className="text-blue-800 whitespace-pre-wrap text-sm sm:text-base">{response}</p>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}