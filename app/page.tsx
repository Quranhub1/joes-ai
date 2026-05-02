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

    setLoading(true)
    setError('')
    setResponse('')
    
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">Joe's AI Interface</h1>
          <p className="text-sm sm:text-base text-gray-600">Chat with the best AI models</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-50 to-pink-50 p-3 rounded-xl">
            <label className="block text-sm font-semibold text-gray-800 mb-2">AI Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base bg-white shadow-sm"
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

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-xl">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Mode</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`px-2 py-2 rounded-xl font-semibold transition text-xs sm:text-sm shadow-sm ${
                    selectedMode === mode.id
                      ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200'
                  }`}
                  disabled={loading}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Your Message</label>
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
              placeholder="Ask me anything... (Press Enter to send)"
              className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm sm:text-base bg-white shadow-sm"
              rows={4}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:from-indigo-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-lg"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {response && (
          <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-pink-50 border-2 border-indigo-200 rounded-xl">
            <p className="text-indigo-900 font-semibold mb-2">AI Response</p>
            <p className="text-indigo-800 whitespace-pre-wrap text-sm leading-relaxed">{response}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}