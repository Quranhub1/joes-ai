'use client'

import { useState, useRef, useEffect } from 'react'

interface Prediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  output?: string[]
  error?: string
  urls?: {
    get?: string
    cancel?: string
  }
}

interface UsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cachedRequests: number
  averageResponseTime: number
}

export default function GenerateImagePage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const COOLDOWN_PERIOD = 3000 // 3 seconds between generations

  // Load saved images from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('generated_images')
    if (saved) {
      try {
        setGeneratedImages(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load saved images:', e)
      }
    }
  }, [])

  // Load usage stats
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const response = await fetch('/api/usage')
        if (response.ok) {
          const data = await response.json()
          setUsageStats(data.stats)
        }
      } catch (e) {
        console.error('Failed to load usage stats:', e)
      }
    }

    fetchUsageStats()
  }, [])

  // Save images to localStorage
  useEffect(() => {
    localStorage.setItem('generated_images', JSON.stringify(generatedImages))
  }, [generatedImages])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
      }
    }
  }, [])

  // Update cooldown countdown
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
      }
    }
  }, [cooldownRemaining])

  const startGeneration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    const now = Date.now()
    const timeSinceLastGeneration = now - lastGenerationTime

    if (timeSinceLastGeneration < COOLDOWN_PERIOD) {
      const remaining = Math.ceil((COOLDOWN_PERIOD - timeSinceLastGeneration) / 1000)
      setError(`Please wait ${remaining} seconds before generating another image.`)
      return
    }

    setIsGenerating(true)
    setError(null)
    setPrediction(null)
    setLastGenerationTime(now)
    setCooldownRemaining(Math.ceil(COOLDOWN_PERIOD / 1000))

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start image generation')
      }

      setPrediction(data)

      // Start polling for results
      if (data.id) {
        startPolling(data.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsGenerating(false)
    }
  }

  const startPolling = (predictionId: string) => {
    let pollCount = 0
    const maxPolls = 60 // Maximum 2 minutes of polling (60 * 2 seconds)

    const poll = async () => {
      pollCount++

      try {
        const response = await fetch(`/api/generate-image?id=${predictionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch prediction')
        }

        setPrediction(data)

        if (data.status === 'succeeded' && data.output) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }
          setIsGenerating(false)

          // Add new image to gallery
          const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output
          setGeneratedImages(prev => [imageUrl, ...prev])
        } else if (data.status === 'failed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }
          setIsGenerating(false)
          setError(data.error || 'Image generation failed')
        } else if (pollCount >= maxPolls) {
          // Timeout after max polls
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }
          setIsGenerating(false)
          setError('Image generation timed out. Please try again.')
        }
      } catch (err) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
        setError(err instanceof Error ? err.message : 'An error occurred while polling')
        setIsGenerating(false)
      }
    }

    // Start with immediate poll, then use exponential backoff
    poll()

    let interval = 2000 // Start with 2 seconds
    pollIntervalRef.current = setInterval(() => {
      poll()
      // Gradually increase interval up to 10 seconds
      if (interval < 10000) {
        interval = Math.min(interval * 1.2, 10000)
      }
    }, 2000) // Keep base interval at 2 seconds but adjust internal logic
  }

  const clearGallery = () => {
    if (confirm('Are you sure you want to clear all generated images?')) {
      setGeneratedImages([])
      localStorage.removeItem('generated_images')
    }
  }

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flux-image-${Date.now()}.webp`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Failed to download image:', e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Image Generator
          </h1>
          <p className="text-xl text-purple-200">
            Create stunning images with Flux Pro using Replicate
          </p>
        </div>

        {/* Generation Form */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 mb-12 border border-purple-500/30">
          <form onSubmit={startGeneration} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-lg font-medium text-white mb-3">
                Describe your image
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="An abstract painting of a sunrise over mountains, vibrant colors, impressionist style..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                disabled={isGenerating}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim() || cooldownRemaining > 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                isGenerating || !prompt.trim() || cooldownRemaining > 0
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating... (This may take 30-60 seconds)
                </span>
              ) : cooldownRemaining > 0 ? (
                `Wait ${cooldownRemaining}s before generating`
              ) : (
                'Generate Image'
              )}
            </button>
          </form>

          {/* Status */}
          {prediction && prediction.status !== 'succeeded' && prediction.status !== 'failed' && (
            <div className="mt-6 bg-purple-500/20 border border-purple-500/50 rounded-xl p-4 text-purple-200">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing your image... Status: {prediction.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Current Generation Result */}
        {prediction && prediction.status === 'succeeded' && prediction.output && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 mb-12 border border-green-500/30">
            <h2 className="text-2xl font-bold text-white mb-6">Generated Image</h2>
            <div className="flex flex-col items-center">
              <img
                src={Array.isArray(prediction.output) ? prediction.output[0] : prediction.output}
                alt="Generated"
                className="max-w-full max-h-[500px] rounded-xl shadow-2xl"
              />
              <button
                onClick={() => downloadImage(Array.isArray(prediction.output) ? prediction.output[0] : prediction.output)}
                className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Download Image
              </button>
            </div>
          </div>
        )}

        {/* Gallery */}
        {generatedImages.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Gallery</h2>
              <button
                onClick={clearGallery}
                className="bg-red-600/80 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Generated ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-xl shadow-lg transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => downloadImage(imageUrl)}
                      className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all transform translate-y-4 group-hover:translate-y-0"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Stats */}
        {usageStats && (
          <div className="mt-12 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20">
            <h3 className="text-xl font-bold text-white mb-4">Usage Statistics (24h)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{usageStats.totalRequests}</div>
                <div className="text-sm text-gray-400">Total Requests</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{usageStats.successfulRequests}</div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{usageStats.cachedRequests}</div>
                <div className="text-sm text-gray-400">Cached</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{usageStats.averageResponseTime.toFixed(0)}ms</div>
                <div className="text-sm text-gray-400">Avg Response</div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20">
          <h3 className="text-xl font-bold text-white mb-4">Tips for better results:</h3>
          <ul className="space-y-2 text-purple-200">
            <li>• Be specific and descriptive in your prompts</li>
            <li>• Include style references (e.g., "impressionist", "cyberpunk", "watercolor")</li>
            <li>• Mention lighting and mood (e.g., "golden hour", "dramatic lighting")</li>
            <li>• Specify composition (e.g., "close-up", "wide angle", "portrait")</li>
            <li>• Add quality modifiers (e.g., "highly detailed", "4K", "professional")</li>
          </ul>
        </div>
      </div>
    </div>
  )
}