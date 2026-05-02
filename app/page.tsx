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
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showMatrix, setShowMatrix] = useState(false)
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    localStorage.setItem('joe-ai-theme', (!isDarkMode).toString())
  }

  const toggleMatrix = () => {
    setShowMatrix(!showMatrix)
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
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode
        ? 'bg-black text-green-400'
        : 'bg-gray-100 text-green-800'
    } font-mono relative overflow-hidden`}>
      {/* Matrix Background Effect */}
      {showMatrix && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
          <div className="matrix-rain"></div>
        </div>
      )}

      {/* CRT Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-10">
        <div className="crt-scanlines"></div>
      </div>

      {/* Glitch Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none z-20 opacity-5">
        <div className="glitch-overlay"></div>
      </div>

      <div className="relative z-30 min-h-screen flex flex-col">
        
        {/* Terminal Header */}
        <div className={`border-b-2 ${
          isDarkMode ? 'border-green-500 bg-gray-900' : 'border-green-600 bg-white'
        } p-4 shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Terminal Window Controls */}
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>

              <div className="text-sm opacity-75">
                joe@terminal:~/ai-chat $
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Matrix Toggle */}
              <button
                onClick={toggleMatrix}
                className={`px-3 py-1 text-xs border ${
                  showMatrix
                    ? 'border-green-400 bg-green-900 text-green-300'
                    : 'border-gray-600 bg-gray-800 text-gray-400'
                } rounded hover:opacity-80 transition-all`}
                title="Toggle Matrix Rain"
              >
                {showMatrix ? '█ MATRIX ON' : '█ MATRIX OFF'}
              </button>

              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`px-3 py-1 text-xs border ${
                  isDarkMode
                    ? 'border-green-400 bg-green-900 text-green-300'
                    : 'border-green-600 bg-green-100 text-green-800'
                } rounded hover:opacity-80 transition-all`}
                title="Toggle Theme"
              >
                {isDarkMode ? '🌙 DARK' : '☀️ LIGHT'}
              </button>

              {/* History Controls */}
              <button
                type="button"
                onClick={downloadChatJson}
                disabled={messages.length === 0}
                className={`px-3 py-1 text-xs border ${
                  isDarkMode
                    ? 'border-green-400 bg-green-900 text-green-300 disabled:opacity-50'
                    : 'border-green-600 bg-green-100 text-green-800 disabled:opacity-50'
                } rounded hover:opacity-80 transition-all disabled:cursor-not-allowed`}
              >
                💾 EXPORT
              </button>

              <button
                type="button"
                onClick={syncChatJson}
                disabled={messages.length === 0}
                className={`px-3 py-1 text-xs border ${
                  isDarkMode
                    ? 'border-green-400 bg-green-900 text-green-300 disabled:opacity-50'
                    : 'border-green-600 bg-green-100 text-green-800 disabled:opacity-50'
                } rounded hover:opacity-80 transition-all disabled:cursor-not-allowed`}
              >
                ☁️ SYNC
              </button>

              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className={`px-3 py-1 text-xs border ${
                    isDarkMode
                      ? 'border-red-400 bg-red-900 text-red-300'
                      : 'border-red-600 bg-red-100 text-red-800'
                  } rounded hover:opacity-80 transition-all`}
                >
                  🗑️ CLEAR
                </button>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'} opacity-75`}>
            {historyStatus && (
              <span className="animate-pulse">{historyStatus}</span>
            )}
            {!historyStatus && (
              <span>
                Status: {messages.length} messages | Provider: {selectedProvider || 'none'} | Mode: {selectedMode}
              </span>
            )}
          </div>
        </div>

        {/* Main Terminal Window */}
        <div className="flex-1 flex">
          {/* Sidebar - Provider & Mode Selection */}
          <div className={`w-64 ${
            isDarkMode ? 'bg-gray-900 border-green-500' : 'bg-white border-green-600'
          } border-r-2 p-4`}>
            <div className="space-y-6">
              {/* AI Provider Selection */}
              <div>
                <h3 className={`text-sm font-bold mb-3 ${
                  isDarkMode ? 'text-green-300' : 'text-green-800'
                } border-b border-current pb-1`}>
                  🤖 AI PROVIDER
                </h3>
                <div className="space-y-2">
                  {providers.map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`w-full text-left px-3 py-2 text-xs border ${
                        selectedProvider === provider.id
                          ? (isDarkMode
                              ? 'border-green-400 bg-green-900 text-green-300'
                              : 'border-green-600 bg-green-100 text-green-800')
                          : (isDarkMode
                              ? 'border-gray-600 bg-gray-800 text-gray-400 hover:border-green-500'
                              : 'border-gray-400 bg-gray-50 text-gray-600 hover:border-green-500')
                      } rounded transition-all`}
                      disabled={loading}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <h3 className={`text-sm font-bold mb-3 ${
                  isDarkMode ? 'text-green-300' : 'text-green-800'
                } border-b border-current pb-1`}>
                  🎯 MODE
                </h3>
                <div className="space-y-2">
                  {MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`w-full text-left px-3 py-2 text-xs border ${
                        selectedMode === mode.id
                          ? (isDarkMode
                              ? 'border-green-400 bg-green-900 text-green-300'
                              : 'border-green-600 bg-green-100 text-green-800')
                          : (isDarkMode
                              ? 'border-gray-600 bg-gray-800 text-gray-400 hover:border-green-500'
                              : 'border-gray-400 bg-gray-50 text-gray-600 hover:border-green-500')
                      } rounded transition-all`}
                      disabled={loading}
                    >
                      {mode.emoji} {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Chat Terminal */}
          <div className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              isDarkMode ? 'bg-black' : 'bg-gray-50'
            }`}>
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className={`text-center ${isDarkMode ? 'text-green-500' : 'text-green-700'}`}>
                    <div className="text-6xl mb-4 animate-pulse">⚡</div>
                    <div className="text-lg font-bold mb-2">JOE'S AI TERMINAL</div>
                    <div className="text-sm opacity-75">
                      Initialize conversation sequence...<br/>
                      Select provider and mode, then begin transmission.
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={msg.id} className="animate-fadeIn">
                    {/* User Message */}
                    {msg.type === 'user' && (
                      <div className="flex justify-end mb-4">
                        <div className={`max-w-lg px-4 py-3 border-2 ${
                          isDarkMode
                            ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                            : 'border-blue-600 bg-blue-50 text-blue-800'
                        } rounded-lg`}>
                          <div className="text-xs opacity-75 mb-1">
                            [USER] {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message */}
                    {msg.type === 'assistant' && (
                      <div className="flex justify-start mb-4">
                        <div className={`max-w-2xl px-4 py-3 border-2 ${
                          isDarkMode
                            ? 'border-green-500 bg-green-900/20 text-green-300'
                            : 'border-green-600 bg-green-50 text-green-800'
                        } rounded-lg`}>
                          <div className="text-xs opacity-75 mb-1 flex items-center justify-between">
                            <span>
                              [AI:{msg.provider.toUpperCase()}] {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className={`text-xs hover:opacity-70 transition-opacity ${
                                copiedId === msg.id ? 'text-yellow-400' : 'opacity-50'
                              }`}
                              title="Copy response"
                            >
                              {copiedId === msg.id ? '✓ COPIED' : '📋 COPY'}
                            </button>
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words font-mono">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-3 border-2 ${
                    isDarkMode
                      ? 'border-green-500 bg-green-900/20 text-green-300'
                      : 'border-green-600 bg-green-50 text-green-800'
                  } rounded-lg`}>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                      <span className="text-sm">Processing query...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <div className={`mx-4 mb-4 p-3 border-2 ${
                isDarkMode
                  ? 'border-red-500 bg-red-900/20 text-red-300'
                  : 'border-red-600 bg-red-50 text-red-800'
              } rounded-lg`}>
                <div className="text-sm font-bold mb-1">[ERROR]</div>
                <div className="text-sm">{error}</div>
              </div>
            )}

            {/* Input Terminal */}
            <div className={`border-t-2 ${
              isDarkMode ? 'border-green-500 bg-gray-900' : 'border-green-600 bg-white'
            } p-4`}>
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1">
                  <div className={`text-xs mb-2 ${
                    isDarkMode ? 'text-green-300' : 'text-green-700'
                  }`}>
                    joe@terminal:~/ai-chat/input $
                  </div>
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
                    placeholder="Enter your query... (Shift+Enter for new line)"
                    className={`w-full px-3 py-2 text-sm border-2 ${
                      isDarkMode
                        ? 'border-green-500 bg-black text-green-400 placeholder-green-600'
                        : 'border-green-600 bg-white text-green-800 placeholder-green-500'
                    } rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none font-mono`}
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !message.trim() || !selectedProvider}
                  className={`px-6 py-2 border-2 ${
                    isDarkMode
                      ? 'border-green-400 bg-green-900 text-green-300 hover:bg-green-800'
                      : 'border-green-600 bg-green-100 text-green-800 hover:bg-green-200'
                  } rounded font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 font-mono text-sm`}
                  title="Execute query (Enter)"
                >
                  {loading ? 'EXECUTING...' : 'EXECUTE'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>