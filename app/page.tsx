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
    if (loading || response) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [loading, response])

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
    <div className="min-h-screen bg-black text-green-400 font-mono p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-500 mb-2 glow-text">JOE'S AI INTERFACE</h1>
          <p className="text-sm text-green-600">Chat with the best AI models</p>
        </div>

        <div className="border-2 border-green-800 rounded-lg p-4 sm:p-6 bg-black/50 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-green-600 mb-2">[AI_PROVIDER]</label>
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

            <div>
              <label className="block text-sm text-green-600 mb-2">[MODE_SELECT]</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {MODES.map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`px-2 py-2 rounded text-xs sm:text-sm transition-all border ${
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

            <div>
              <label className="block text-sm text-green-600 mb-2">[INPUT_COMMAND]</label>
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
                rows={4}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-green-900 text-green-200 font-bold py-3 rounded border border-green-700 hover:bg-green-800 hover:border-green-500 disabled:bg-gray-900 disabled:text-gray-600 disabled:border-gray-800 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">PROCESSING...</span>
                </span>
              ) : (
                '>> EXECUTE'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded">
              <p className="text-red-400 font-semibold">[ERROR]</p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
            </div>
          )}

          {response && (
            <div className="mt-4 p-4 bg-green-900/10 border border-green-800 rounded">
              <p className="text-green-500 font-semibold mb-2">[AI_RESPONSE]</p>
              <p className="text-green-400 whitespace-pre-wrap text-sm leading-relaxed">{response}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 text-center text-xs text-green-700">
          <p>JOE'S AI v1.0 | TERMINAL INTERFACE | {new Date().getFullYear()}</p>
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