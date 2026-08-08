'use client';

import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Provider {
  id: string;
  name: string;
  type: 'premium' | 'free';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolResults?: Array<{ name: string; result: string }>;
}

interface UserProfile {
  name: string;
  preferences: Record<string, string>;
}

const MODES = [
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'general', label: 'General', icon: '💬' },
  { id: 'personal', label: 'Personal', icon: '🧠' },
  { id: 'predictions', label: 'Predictions', icon: '🔮' },
  { id: 'creative', label: 'Creative', icon: '🎨' }
];

export default function Home() {
  const [message, setMessage] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [selectedMode, setSelectedMode] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState({ messages: 0, characters: 0 });
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', preferences: {} });
  const [profileStatus, setProfileStatus] = useState('');
  const [profileInput, setProfileInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const extractUserName = (text: string) => {
    const patterns = [
      /(?:my name is|i am|i'm|call me|i go by|everyone calls me|this is)\s+([A-Z][a-zA-Z]{1,30})/i,
      /(?:you can call me|name's|name is)\s+([A-Z][a-zA-Z]{1,30})/i,
      /(?:it's|its)\s+([A-Z][a-zA-Z]{1,30})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return '';
  };

  const syncToJsonBin = async (data: { chatHistory: Message[]; userProfile: UserProfile }) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.warn('Failed to sync to JSONBin:', err);
    }
  };

  const loadFromJsonBin = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.chatHistory) setHistory(data.chatHistory);
      if (data.userProfile) setUserProfile(data.userProfile);
    } catch (err) {
      console.warn('Failed to load from JSONBin:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadFromJsonBin();

      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory && history.length === 0) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to load chat history:', e);
        }
      }

      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile && userProfile.name === '') {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch (e) {
          console.error('Failed to load user profile:', e);
        }
      }

      setIsHistoryLoaded(true);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isHistoryLoaded && history.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(history));
      syncToJsonBin({ chatHistory: history, userProfile });
    }
  }, [history, isHistoryLoaded, userProfile]);

  useEffect(() => {
    if (isHistoryLoaded && userProfile.name) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      syncToJsonBin({ chatHistory: history, userProfile });
    }
  }, [userProfile, isHistoryLoaded, history]);

  useEffect(() => {
    setProfileInput(userProfile.name);
  }, [userProfile.name]);

  useEffect(() => {
    if (history.length === 0) return;

    const newName = [...history]
      .reverse()
      .filter(m => m.role === 'user')
      .map(m => extractUserName(m.content))
      .find(Boolean);

    if (newName && newName !== userProfile.name) {
      setUserProfile(prev => ({ ...prev, name: newName }));
      setProfileStatus(`Learned your name: ${newName}`);
      const timer = window.setTimeout(() => setProfileStatus(''), 4000);
      return () => window.clearTimeout(timer);
    }
  }, [history, userProfile.name]);

  useEffect(() => {
    const totalChars = history.reduce((sum, msg) => sum + msg.content.length, 0)
    setMemoryUsage({
      messages: history.length,
      characters: totalChars
    })
  }, [history])

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers');
        const data = await res.json();
        setProviders(data.providers);
        if (data.providers.length > 0 && !data.providers.find(p => p.id === selectedProvider)) {
          setSelectedProvider(data.providers[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
        setError('Could not load providers');
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    const updatedHistory = [...history, userMessage];
    setHistory(updatedHistory);
    setMessage('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          provider: selectedProvider,
          mode: selectedMode,
          history: updatedHistory.slice(-100),
          userName: userProfile.name,
          tools: ['web_search', 'youtube_search']
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await res.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        toolResults: data.toolResults
      };

      setHistory([...updatedHistory, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('chatHistory');
    syncToJsonBin({ chatHistory: [], userProfile });
    setError('');
  };

  const saveProfileName = () => {
    const trimmedName = profileInput.trim();
    if (!trimmedName) {
      setProfileStatus('Please enter a valid name');
      return;
    }

    setUserProfile(prev => ({ ...prev, name: trimmedName }));
    setProfileStatus(`Saved profile name: ${trimmedName}`);
  };

  const clearProfile = () => {
    const clearedProfile = { name: '', preferences: {} };
    setUserProfile(clearedProfile);
    setProfileInput('');
    localStorage.removeItem('userProfile');
    syncToJsonBin({ chatHistory: history, userProfile: clearedProfile });
    setProfileStatus('Profile reset');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const newChat = () => {
    setHistory([]);
    setError('');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-900 text-gray-100 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={newChat}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Recent Chats</p>
          {history.length > 0 && (
            <div className="space-y-1">
              {history.filter(m => m.role === 'user').slice(-10).reverse().map((msg, i) => (
                <button
                  key={i}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-sm text-gray-300 truncate transition-colors"
                >
                  {msg.content.slice(0, 30)}...
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">JOES AI</p>
              <p className="text-xs text-gray-400">Advanced Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">JOES AI</h1>
              {userProfile.name && (
                <p className="text-xs text-green-600">Hello, {userProfile.name}</p>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{memoryUsage.messages} msgs</span>
            </div>
            
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white font-bold text-3xl">AI</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to JOES AI</h2>
              <p className="text-gray-500 text-center max-w-md mb-8">
                Your advanced AI assistant with memory, tools, and multi-provider support.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                {[
                  { mode: 'coding', label: 'Code Assistant', icon: '💻' },
                  { mode: 'general', label: 'General Q&A', icon: '💬' },
                  { mode: 'personal', label: 'Life Advisor', icon: '🧠' },
                  { mode: 'predictions', label: 'Analysis', icon: '🔮' },
                  { mode: 'creative', label: 'Creative', icon: '🎨' }
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setSelectedMode(item.mode)}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm font-medium text-gray-700">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 space-y-6">
              {history.map((msg, index) => (
                <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                    
                    <div className={`rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <>
                          <MarkdownRenderer content={msg.content} />
                          {msg.toolResults && msg.toolResults.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              {msg.toolResults.map((tool, i) => (
                                <div key={i} className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-1">
                                  <span className="font-medium">{tool.name}:</span> {tool.result.slice(0, 100)}...
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => copyToClipboard(msg.content, index)}
                            className="mt-2 px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {copiedMessageIndex === index ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">Y</span>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-4">
                    <div className="flex gap-2 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-md p-4 max-w-[80%]">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedMode === mode.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  disabled={loading}
                >
                  {mode.icon} {mode.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!loading && message.trim()) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                  placeholder="Send a message... (Shift+Enter for new line)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-400"
                  rows={1}
                  disabled={loading}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
