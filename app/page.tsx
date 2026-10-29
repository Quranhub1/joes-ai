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
  const session = null;
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
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [matrixRain, setMatrixRain] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

      const savedTheme = localStorage.getItem('joes-ai-theme');
      if (savedTheme) setTheme(savedTheme as 'dark' | 'light');

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
    localStorage.setItem('joes-ai-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleMatrix = () => {
    setMatrixRain(!matrixRain);
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#0a0e0a] text-[#00ff41]' : 'bg-[#f0fdf4] text-[#059669]'}`}>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)]">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider uppercase glitch" data-text="JOES AI">
                JOES AI
              </h1>
              {userProfile.name ? (
                <p className="text-sm text-[#85e89d]">Hello, {userProfile.name}. Interface active.</p>
              ) : (
                <p className="text-sm text-[#3fb37c]">Identity not established. State your name.</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="hacker-btn text-xs"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={toggleMatrix}
              className="hacker-btn text-xs"
            >
              {matrixRain ? 'Matrix Off' : 'Matrix On'}
            </button>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="hacker-btn text-xs text-red-500 border-red-500/50"
              >
                Wipe Memory
              </button>
            )}
            <button
              onClick={clearProfile}
              className="hacker-btn text-xs text-blue-500 border-blue-500/50"
            >
              Reset Identity
            </button>
          </div>
        </header>

        {userProfile.name === '' && (
          <div className="terminal-window mb-8 p-6 max-w-2xl mx-auto">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot red"></div>
                <div className="terminal-dot yellow"></div>
                <div className="terminal-dot green"></div>
              </div>
              <div className="terminal-title">IDENTITY MODULE</div>
            </div>
            <div className="terminal-content">
              <p className="text-sm text-[#059669] mb-4">No identity on file. The system will remember your name once provided.</p>
              <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
                <input
                  type="text"
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  placeholder="Enter your designation"
                  className="hacker-input flex-1"
                />
                <button
                  type="button"
                  onClick={saveProfileName}
                  className="hacker-btn px-6 py-3"
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={clearProfile}
                  className="hacker-btn border-gray-500/50 text-[#3fb37c] px-6 py-3"
                >
                  Abort
                </button>
              </div>
              {profileStatus && (
                <p className={`mt-3 text-xs ${profileStatus.includes('error') || profileStatus.includes('invalid') ? 'text-red-500' : 'text-[#00ff41]'}`}>
                  {profileStatus}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="terminal-window mb-8 p-1">
          <div className="terminal-header">
            <div className="terminal-dots">
              <div className="terminal-dot red"></div>
              <div className="terminal-dot yellow"></div>
              <div className="terminal-dot green"></div>
            </div>
            <div className="terminal-title">NEURAL LINK v2.0</div>
          </div>
          <div className="terminal-content p-0">
            <div className="flex gap-2 overflow-x-auto pb-4 px-2">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`hacker-btn text-xs px-4 py-2 whitespace-nowrap ${
                    selectedMode === mode.id
                      ? 'active text-[#0a0e0a]'
                      : 'border-[#00ff41]/40 text-[#3fb37c] hover:border-[#00ff41]'
                  }`}
                  disabled={loading}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-[400px] py-4 px-2 space-y-6">
              {history.map((msg, index) => (
                <div key={index} className="flex gap-4">
                  {msg.role === 'user' ? (
                    <>
                      <div className="w-10 h-10 bg-[#00ff41] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,255,65,0.6)]">
                        <span className="text-[#0a0e0a] font-bold text-xs">USER</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-[#00ff41] text-sm">USER</p>
                          <span className="text-xs text-[#3fb37c]/70">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-[#e5e7e5] bg-[#0d1117]/50 border border-[#00ff41]/10 rounded-xl rounded-tl-md p-4 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,255,65,0.5)]">
                        <span className="text-white font-bold text-xs">SYS</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-[#85e89d] text-sm">SYSTEM</p>
                          <span className="text-xs text-[#3fb37c]/70">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="text-[#e5e7e5] bg-[#0d1117]/50 border border-[#00ff41]/10 rounded-xl rounded-tl-md p-4 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>
                        <button
                          onClick={() => copyToClipboard(msg.content, index)}
                          className="mt-2 px-3 py-1 text-xs font-bold text-[#00ff41] hover:text-white hover:bg-[#00ff41]/10 rounded-lg transition-colors border border-[#00ff41]/20"
                        >
                          {copiedMessageIndex === index ? 'DATA COPIED' : 'Extract'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-full flex items-center justify-center shrink-0 animate-pulse shadow-[0_0_15px_rgba(0,255,65,0.6)]">
                    <span className="text-white font-bold text-xs">SYS</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#85e89d] mb-1">SYSTEM</p>
                    <div className="flex gap-2 items-center p-4 bg-[#0d1117]/40 rounded border border-[#00ff41]/10">
                      <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <span className="ml-2 text-xs text-[#3fb37c]">Processing neural input...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#ff4444] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,68,68,0.5)]">
                    <span className="text-white font-bold text-xs">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#ff4444] mb-1">SYSTEM FAULT</p>
                    <p className="text-[#ff4444] bg-[#0d1117]/40 border border-[#ff4444]/20 rounded-xl p-4">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {history.length === 0 && !loading && !error && isHistoryLoaded && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(0,255,65,0.4)]">
                    <span className="text-white font-bold text-3xl">AI</span>
                  </div>
                  <h2 className="text-3xl font-bold text-[#00ff41] mb-2 tracking-widest uppercase">NEURAL LINK ESTABLISHED</h2>
                  <p className="text-[#3fb37c] max-w-md mx-auto">
                    System online. State your designation to begin. Commands are processed through active neural pathways.
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="border-t border-[#00ff41]/20 pt-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
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
                placeholder="Transmit neural command..."
                className="w-full px-4 py-3 pr-16 bg-[#0d1117] border border-[#00ff41]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ff41] focus:border-transparent resize-none text-[#e5e7e5] placeholder-[#3fb37c]/50"
                rows={1}
                disabled={loading}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="hacker-btn px-8 py-3 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Transmitting...
                </>
              ) : (
                'Transmit'
              )}
            </button>
          </form>
          <p className="text-xs text-[#3fb37c]/60 text-center mt-3">
            Enter to transmit &bull; Shift+Enter for new line
          </p>
        </div>
      </div>

      {matrixRain && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="matrix-column"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${12 + Math.random() * 14}px`,
                opacity: 0.3 + Math.random() * 0.4
              }}
            >
              {'01'.repeat(20)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
