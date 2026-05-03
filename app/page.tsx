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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [loading, response, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setError('')
    setResponse('')
    
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
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">
      {/* Header - Fixed at top */}
      <div className="border-b border-green-800 p-3 bg-black/90 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-green-500 text-center glow-text">JOE'S AI INTERFACE</h1>
          <p className="text-xs text-green-600 text-center">Chat with the best AI models</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-2 sm:p-4 gap-4">
        
        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="flex-1">
            <label className="block text-xs text-green-600 mb-1">[AI_PROVIDER]</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-green-800 rounded text-green-400 focus:outline-none focus:border-green-500 text-sm"
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

          <div className="flex-1">
            <label className="block text-xs text-green-600 mb-1">[MODE_SELECT]</label>
            <div className="flex flex-wrap gap-1">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`px-2 py-1 rounded text-xs transition-all border ${
                    selectedMode === mode.id
                      ? 'bg-green-900 text-green-200 border-green-500'
                      : 'bg-black text-green-600 border-green-800 hover:border-green-600 hover:text-green-400'
                  }`}
                  disabled={loading}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-green-800 rounded-lg p-4 bg-black/50">
          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="text-green-600 text-sm">
              <span className="text-green-500">[SYSTEM]</span> Welcome to Joe's AI Interface v1.0
            </div>

            {/* User Message */}
            {message && (
              <div className="text-green-300">
                <span className="text-green-500">[YOU]</span> {message}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-green-500 animate-pulse">
                <span className="text-green-500">[AI]</span> Processing...
              </div>
            )}

            {/* Response */}
            {response && (
              <div className="text-green-400">
                <span className="text-green-500">[AI_RESPONSE]</span>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{response}</div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-red-400">
                <span className="text-red-500">[ERROR]</span> {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="shrink-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label className="block text-xs text-green-600 mb-1">[INPUT_COMMAND]</label>
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
                placeholder="Enter command... (Press Enter to send)"
                className="w-full px-4 py-3 bg-black border border-green-800 rounded text-green-400 focus:outline-none focus:border-green-500 resize-none text-sm placeholder-green-800"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-green-900 text-green-200 font-bold py-3 rounded border border-green-700 hover:bg-green-800 hover:border-green-500 disabled:bg-gray-900 disabled:text-gray-600 disabled:border-gray-800 transition-all"
            >
              {loading ? '>> PROCESSING...' : '>> EXECUTE'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-green-700 shrink-0">
          JOE'S AI v1.0 | TERMINAL INTERFACE | {new Date().getFullYear()}
        </div>
      </div>

      <style jsx global>{`
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 5px #166534, 0 0 10px #166534; }
          50% { text-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e, 0 0 30px #22c55e; }
        }
        .glow-text {
          animation: glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}