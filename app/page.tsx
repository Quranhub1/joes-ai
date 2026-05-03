'use client';

import { useState, useEffect, useRef } from 'react';

interface Provider {
  id: string;
  name: string;
  type: 'premium' | 'free';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UserProfile {
  name: string;
  preferences: Record<string, string>;
}

const MODES = [
  { id: 'coding', label: 'Coding' },
  { id: 'general', label: 'General Q&A' },
  { id: 'personal', label: 'Personal Advice' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'creative', label: 'Creative' }
];

export default function Home() {
  const [message, setMessage] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('bazaarlink');
  const [selectedMode, setSelectedMode] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', preferences: {} });
  const [profileStatus, setProfileStatus] = useState('');
  const [profileInput, setProfileInput] = useState('');
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

  // Load chat history and user profile from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to load user profile:', e);
      }
    }

    setIsHistoryLoaded(true);
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem('chatHistory', JSON.stringify(history));
    }
  }, [history, isHistoryLoaded]);

  // Save user profile to localStorage whenever it changes
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
  }, [userProfile, isHistoryLoaded]);

  useEffect(() => {
    setProfileInput(userProfile.name);
  }, [userProfile.name]);

  // Extract user name from messages and update profile
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

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers');
        const data = await res.json();
        setProviders(data.providers);
        if (data.providers.length > 0) {
          setSelectedProvider(data.providers[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
        setError('Could not load providers');
      }
    };
    fetchProviders();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history, loading, error]);

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
          history: updatedHistory.slice(-20),
          userName: userProfile.name
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
        timestamp: Date.now()
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
    setUserProfile({ name: '', preferences: {} });
    setProfileInput('');
    localStorage.removeItem('userProfile');
    setProfileStatus('Profile reset');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4 flex flex-col gap-3 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Joe's AI Interface</h1>
              {userProfile.name ? (
                <p className="text-sm text-green-600">Hello, {userProfile.name}! I’ll remember your name.</p>
              ) : (
                <p className="text-sm text-gray-500">Tell me your name once and I’ll remember it.</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {history.length > 0 && (
              <>
                <button
                  onClick={clearProfile}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  title="Clear learned profile"
                >
                  Reset Profile
                </button>
                <button
                  onClick={clearHistory}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  title="Clear chat history"
                >
                  Clear Chat
                </button>
              </>
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
        </div>
      </header>

      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 mx-6 sm:mx-auto max-w-5xl w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">User Profile</p>
            <p className="text-sm text-slate-500">
              {userProfile.name ? `Stored name: ${userProfile.name}` : 'No name saved yet.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={profileInput}
              onChange={(e) => setProfileInput(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
            <button
              type="button"
              onClick={saveProfileName}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Save Name
            </button>
            <button
              type="button"
              onClick={clearProfile}
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 gap-4">
        
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

        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 py-4">
          {history.map((msg, index) => (
            <div key={index} className="flex gap-4">
              {msg.role === 'user' ? (
                <>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">Y</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800">You</p>
                      <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-gray-700 bg-gray-50 rounded-2xl rounded-tl-md p-4">{msg.content}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800">AI Assistant</p>
                      <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="text-gray-700 bg-gray-50 rounded-2xl rounded-tl-md p-4 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

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

          {history.length === 0 && !loading && !error && isHistoryLoaded && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Joe's AI</h2>
              <p className="text-gray-500">Your chat history is saved automatically. Tell me your name and start chatting!</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
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
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}