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
  typed?: boolean;
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

const BOOT_MESSAGES = [
  'INITIALIZING NEURAL INTERFACE...',
  'LOADING QUANTUM CORES...',
  'ESTABLISHING SYNTHETIC LINK...',
  'BYPASSING FIREWALL PROTOCOLS...',
  'HACKING TERMINAL v2.0...',
  'CONNECTION SECURED. AWAITING COMMAND.'
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
  const [bootComplete, setBootComplete] = useState(false);
  const [bootIndex, setBootIndex] = useState(0);
  const [typingMessage, setTypingMessage] = useState<{ content: string; index: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

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

  const logToConsole = (text: string, level: 'info' | 'warn' | 'error' = 'info') => {
    if (!consoleRef.current) return;
    const line = document.createElement('div');
    line.className = 'log-line';
    const ts = new Date().toLocaleTimeString([], { hour12: false });
    line.innerHTML = `<span class="log-timestamp">[${ts}]</span><span class="log-level ${level}">${level.toUpperCase()}</span>${text}`;
    consoleRef.current.appendChild(line);
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
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
      setProfileStatus(`Identity learned: ${newName}`);
      logToConsole(`User identity registered: ${newName}`, 'info');
      const timer = window.setTimeout(() => setProfileStatus(''), 4000);
      return () => window.clearTimeout(timer);
    }
  }, [history, userProfile.name]);

  useEffect(() => {
    if (!bootComplete && bootIndex < BOOT_MESSAGES.length) {
      const timer = setTimeout(() => {
        logToConsole(`> ${BOOT_MESSAGES[bootIndex]}`, 'info');
        setBootIndex(prev => prev + 1);
      }, 400 + bootIndex * 350);
      return () => clearTimeout(timer);
    }
    if (!bootComplete && bootIndex >= BOOT_MESSAGES.length) {
      const timer = setTimeout(() => {
        setBootComplete(true);
        logToConsole('> SYSTEM ONLINE. NEURAL LINK ACTIVE.', 'info');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [bootComplete, bootIndex]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history, loading, error, typingMessage]);

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
    logToConsole(`User transmitted: "${message.slice(0, 60)}..."`, 'info');

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

      setTypingMessage({ content: data.response, index: 0 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logToConsole(`Error: ${errorMessage}`, 'error');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!typingMessage) return;
    const { content, index } = typingMessage;
    if (index < content.length) {
      const timer = setTimeout(() => {
        setTypingMessage(prev => {
          if (!prev || prev.content !== content) return prev;
          return { content, index: prev.index + 1 };
        });
      }, 25 + Math.random() * 35);
      return () => clearTimeout(timer);
    }
  }, [typingMessage]);

  useEffect(() => {
    if (typingMessage && typingMessage.index >= typingMessage.content.length) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: typingMessage.content,
        timestamp: Date.now(),
        typed: true
      };
      setHistory(prev => [...prev, assistantMessage]);
      setTypingMessage(null);
      logToConsole('Response received and logged.', 'info');
    }
  }, [typingMessage]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('chatHistory');
    syncToJsonBin({ chatHistory: [], userProfile });
    setError('');
    logToConsole('Memory wiped. History cleared.', 'warn');
  };

  const saveProfileName = () => {
    const trimmedName = profileInput.trim();
    if (!trimmedName) {
      setProfileStatus('Please enter a valid designation');
      return;
    }

    setUserProfile(prev => ({ ...prev, name: trimmedName }));
    setProfileStatus(`Identity registered: ${trimmedName}`);
    logToConsole(`New identity registered: ${trimmedName}`, 'info');
  };

  const clearProfile = () => {
    const clearedProfile = { name: '', preferences: {} };
    setUserProfile(clearedProfile);
    setProfileInput('');
    localStorage.removeItem('userProfile');
    syncToJsonBin({ chatHistory: history, userProfile: clearedProfile });
    setProfileStatus('Identity reset');
    logToConsole('Identity cleared from memory.', 'warn');
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

  const renderTypingContent = () => {
    if (!typingMessage) return null;
    const { content, index } = typingMessage;
    const display = content.slice(0, index);
    const cursor = index < content.length ? <span className="cursor"></span> : null;
    return (
      <div className="text-[#e5e7e5] bg-[#0d1117]/50 border border-[#00ff41]/10 rounded-xl rounded-tl-md p-4 whitespace-pre-wrap leading-relaxed">
        {display}{cursor}
      </div>
    );
  };

  if (!bootComplete) {
    return (
      <div className="min-h-screen bg-[#0a0e0a] flex items-center justify-center overflow-hidden">
        <div className="matrix-rain" aria-hidden="true">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="matrix-column"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${1.5 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 6}s`,
                fontSize: `${10 + Math.random() * 16}px`,
                opacity: 0.2 + Math.random() * 0.5
              }}
            >
              {'01'.repeat(24)}
            </div>
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,65,0.6)] animate-pulse">
            <span className="text-white font-bold text-2xl">AI</span>
          </div>
          <h1 className="text-4xl font-bold text-[#00ff41] mb-2 tracking-widest uppercase glitch" data-text="BOOTING">
            BOOTING
          </h1>
          <p className="text-[#3fb37c] text-sm mb-8 tracking-widest">NEURAL INTERFACE INITIALIZATION SEQUENCE</p>
          <div className="w-full max-w-xs mx-auto">
            <div className="w-full bg-[#0d1117] border border-[#00ff41]/30 rounded-full h-2 overflow-hidden">
              <div className="bg-[#00ff41] h-full rounded-full shadow-[0_0_10px_rgba(0,255,65,0.8)] animate-pulse" style={{ width: `${Math.min((bootIndex / BOOT_MESSAGES.length) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-[#00ff41]/70 mt-2 text-center">{BOOT_MESSAGES[Math.min(bootIndex, BOOT_MESSAGES.length - 1)] || 'INITIALIZING...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#0a0e0a] text-[#00ff41]' : 'bg-[#f0fdf4] text-[#059669]'}`}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,65,0.5)] border border-[#00ff41]/30">
              <span className="text-white font-bold text-sm">NEURAL</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider uppercase glitch" data-text="JOES AI">
                JOES AI
              </h1>
              {userProfile.name ? (
                <p className="text-sm text-[#85e89d]">Hello, {userProfile.name}. Neural link active.</p>
              ) : (
                <p className="text-sm text-[#3fb37c]">No identity on file. Establish designation.</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117]/40 border border-[#00ff41]/20 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse"></span>
              <span className="text-[#00ff41]">ONLINE</span>
            </div>
            <button
              onClick={toggleTheme}
              className="hacker-btn text-xs"
            >
              {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>
            <button
              onClick={toggleMatrix}
              className="hacker-btn text-xs"
            >
              {matrixRain ? 'MATRIX OFF' : 'MATRIX ON'}
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
              <div className="terminal-title">IDENTITY REGISTRATION</div>
            </div>
            <div className="terminal-content">
              <p className="text-sm text-[#059669] mb-4">The system does not recognize your designation. Provide a name to initialize the neural link.</p>
              <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
                <input
                  type="text"
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  placeholder="Enter your designation"
                  className="hacker-input flex-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={saveProfileName}
                  className="hacker-btn px-6 py-3"
                >
                  REGISTER
                </button>
                <button
                  type="button"
                  onClick={clearProfile}
                  className="hacker-btn border-gray-500/50 text-[#3fb37c] px-6 py-3"
                >
                  ABORT
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 order-last lg:order-first">
            <div className="terminal-window mb-6">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot red"></div>
                  <div className="terminal-dot yellow"></div>
                  <div className="terminal-dot green"></div>
                </div>
                <div className="terminal-title">MODE SELECT</div>
              </div>
              <div className="terminal-content p-4">
                {MODES.map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`w-full mb-2 py-2 text-left rounded text-xs font-bold transition-all ${
                      selectedMode === mode.id
                        ? 'bg-[#00ff41] text-[#0a0e0a] shadow-[0_0_10px_rgba(0,255,65,0.6)]'
                        : 'bg-[#0d1117]/30 border border-[#00ff41]/10 text-[#3fb37c] hover:border-[#00ff41] hover:text-[#00ff41]'
                    }`}
                    disabled={loading}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="terminal-window mb-6">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot red"></div>
                  <div className="terminal-dot yellow"></div>
                  <div className="terminal-dot green"></div>
                </div>
                <div className="terminal-title">PROVIDER LINK</div>
              </div>
              <div className="terminal-content p-4">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="hacker-select w-full mb-4 text-xs"
                  disabled={loading}
                >
                  <optgroup label="PREMIUM">
                    {providers
                      .filter(p => p.type === 'premium')
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </optgroup>
                  <optgroup label="FREE">
                    {providers
                      .filter(p => p.type === 'free')
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </optgroup>
                </select>
                <div className="text-[10px] text-[#3fb37c]/70">
                  {providers.length > 0 ? `${providers.length} link${providers.length !== 1 ? 's' : ''} active` : 'No links established'}
                </div>
              </div>
            </div>

            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot red"></div>
                  <div className="terminal-dot yellow"></div>
                  <div className="terminal-dot green"></div>
                </div>
                <div className="terminal-title">SYSTEM CONSOLE</div>
              </div>
              <div className="terminal-content console-log p-3" ref={consoleRef}>
                <div className="log-line"><span class="log-timestamp">[SYS]</span><span class="log-level info">INFO</span>Terminal v2.0 initialized.</div>
                <div className="log-line"><span class="log-timestamp">[SYS]</span><span class="log-level info">INFO</span>Neural pathways established.</div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 order-first lg:order-last">
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

                <div className="flex-1 overflow-y-auto min-h-[450px] py-4 px-2 space-y-6">
                  {history.map((msg, index) => (
                    <div key={index} className="flex gap-4 animate-fadeIn">
                      {msg.role === 'user' ? (
                        <>
                          <div className="w-10 h-10 bg-[#00ff41] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,255,65,0.6)] border border-[#00ff41]/40">
                            <span className="text-[#0a0e0a] font-bold text-xs">USER</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-[#00ff41] text-xs">USER DESIGNATION</p>
                              <span className="text-xs text-[#3fb37c]/70">{formatTime(msg.timestamp)}</span>
                            </div>
                            <p className="text-[#e5e7e5] bg-[#0d1117]/40 border border-[#00ff41]/10 rounded-xl rounded-tl-md p-4 whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,255,65,0.5)] border border-[#00ff41]/30">
                            <span className="text-white font-bold text-xs">SYS</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-[#85e89d] text-xs">SYSTEM RESPONSE</p>
                              <span className="text-xs text-[#3fb37c]/70">{formatTime(msg.timestamp)}</span>
                            </div>
                            {typingMessage && typingMessage.index < typingMessage.content.length && index === history.length - 1
                              ? renderTypingContent()
                              : (
                                <div className="text-[#e5e7e5] bg-[#0d1117]/40 border border-[#00ff41]/10 rounded-xl rounded-tl-md p-4 whitespace-pre-wrap leading-relaxed">
                                  {msg.content}
                                </div>
                              )}
                            <button
                              onClick={() => copyToClipboard(msg.content, index)}
                              className="mt-2 px-3 py-1 text-xs font-bold text-[#00ff41] hover:text-white hover:bg-[#00ff41]/10 rounded-lg transition-colors border border-[#00ff41]/20"
                            >
                              {copiedMessageIndex === index ? 'DATA EXTRACTED' : 'Extract'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {loading && !typingMessage && (
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
                      <div className="w-20 h-20 bg-gradient-to-br from-[#00ff41] to-[#059669] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(0,255,65,0.4)] border border-[#00ff41]/30">
                        <span className="text-white font-bold text-3xl">AI</span>
                      </div>
                      <h2 className="text-3xl font-bold text-[#00ff41] mb-2 tracking-widest uppercase">NEURAL LINK ESTABLISHED</h2>
                      <p className="text-[#3fb37c] max-w-md mx-auto">
                        System online and awaiting your command. Establish your designation to begin transmitting.
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
                    className="w-full px-4 py-3 pr-20 bg-[#0d1117] border border-[#00ff41]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ff41] focus:border-transparent resize-none text-[#e5e7e5] placeholder-[#3fb37c]/50"
                    rows={1}
                    disabled={loading}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="absolute right-2 top-2 bg-[#00ff41] text-[#0a0e0a] font-bold px-3 py-2 rounded hover:bg-[#059669] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    SEND
                  </button>
                </div>
              </form>
              <p className="text-xs text-[#3fb37c]/60 text-center mt-3">
                Enter to transmit &bull; Shift+Enter for new line
              </p>
            </div>
          </main>
        </div>
      </div>

      {matrixRain && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {[...Array(45)].map((_, i) => (
            <div
              key={i}
              className="matrix-column"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${12 + Math.random() * 14}px`,
                opacity: 0.25 + Math.random() * 0.4
              }}
            >
              {'01'.repeat(22)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
