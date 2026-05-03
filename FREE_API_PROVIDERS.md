# Free & Affordable AI Providers

Joe's AI now supports 12+ AI providers! Here's how to get API keys for the free and affordable options.

## 🟢 Always Available (No API Key Needed)

These work without any configuration:

### 1. **BazaarLink**
- Free, no key required
- Auto-routes to best available model
- Website: [bazaarlink.ai](https://bazaarlink.ai)

### 2. **Completions.me**
- Free, no key required
- Unlimited access
- Website: [completions.me](https://completions.me)

---

## 🔵 Free Tier Providers (Get API Key)

### 3. **Together AI** ⭐ Recommended
- **Model**: Meta Llama 3 70B
- **Free Credits**: $5 monthly
- **Speed**: Very fast
- **Setup**:
  1. Sign up at [together.ai](https://www.together.ai/)
  2. Go to API Keys
  3. Copy your API key
  4. Add to `.env.local`: `TOGETHER_API_KEY=your_key`

### 4. **Groq** ⭐ Recommended
- **Model**: Llama 3 70B
- **Speed**: Extremely fast (free tier)
- **Rate Limit**: Generous
- **Setup**:
  1. Sign up at [console.groq.com](https://console.groq.com/keys)
  2. Create API key
  3. Add to `.env.local`: `GROQ_API_KEY=your_key`

### 5. **DeepInfra** ⭐ Recommended
- **Model**: Llama 2 70B
- **Free Tier**: $0.30 free credit
- **Setup**:
  1. Sign up at [deepinfra.com](https://deepinfra.com/)
  2. Go to API Keys
  3. Copy your API key
  4. Add to `.env.local`: `DEEPINFRA_API_KEY=your_key`

### 6. **Lepton AI**
- **Model**: Llama 2 70B
- **Free Tier**: Yes
- **Setup**:
  1. Sign up at [lepton.ai](https://www.lepton.ai/)
  2. Get API key from dashboard
  3. Add to `.env.local`: `LEPTON_API_KEY=your_key`

### 7. **Replicate**
- **Models**: 100,000+ available
- **Free**: $5 free credit per month
- **Setup**:
  1. Sign up at [replicate.com](https://replicate.com/)
  2. Get API token from settings
  3. Add to `.env.local`: `REPLICATE_API_KEY=your_key`

### 8. **Cohere**
- **Model**: Command (free trial)
- **Free Trial**: Full access for 30 days
- **Setup**:
  1. Sign up at [cohere.ai](https://cohere.ai/)
  2. Get API key from API keys section
  3. Add to `.env.local`: `COHERE_API_KEY=your_key`

### 9. **Hugging Face**
- **Model**: Zephyr 7B
- **Free API**: Limited requests
- **Setup**:
  1. Sign up at [huggingface.co](https://huggingface.co/)
  2. Create access token in settings
  3. Add to `.env.local`: `HUGGINGFACE_API_KEY=your_key`

### 10. **Google Gemini**
- **Model**: Gemini 2.0 Flash
- **Free Tier**: Yes
- **Setup**:
  1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
  2. Create API key
  3. Add to `.env.local`: `GEMINI_API_KEY=your_key`

---

## 💰 Premium Providers (Paid, Most Capable)

### 11. **OpenAI GPT-4**
- **Model**: GPT-4o
- **Cost**: ~$0.30 per 1M input tokens
- **Setup**:
  1. Sign up at [platform.openai.com](https://platform.openai.com/)
  2. Create API key
  3. Add billing info
  4. Add to `.env.local`: `OPENAI_API_KEY=your_key`

### 12. **Anthropic Claude**
- **Model**: Claude 3.5 Sonnet
- **Cost**: ~$0.30 per 1M input tokens
- **Setup**:
  1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
  2. Create API key
  3. Add to `.env.local`: `ANTHROPIC_API_KEY=your_key`

---

## 📋 Quick Setup Steps

1. **Choose providers** from the lists above
2. **Get API keys** following each provider's setup
3. **Add to `.env.local`**:
   ```env
   TOGETHER_API_KEY=xxx
   GROQ_API_KEY=xxx
   DEEPINFRA_API_KEY=xxx
   COHERE_API_KEY=xxx
   LEPTON_API_KEY=xxx
   REPLICATE_API_KEY=xxx
   HUGGINGFACE_API_KEY=xxx
   GEMINI_API_KEY=xxx
   ```
4. **Restart dev server**: `npm run dev`
5. **Test**: Sign into the app and try different providers

---

## 🎯 Best Free Combinations

### For Maximum Speed
1. Groq (fastest)
2. Together AI
3. DeepInfra

### For Most Features
1. Google Gemini
2. Groq
3. Together AI

### For Stability
1. Groq
2. Together AI
3. DeepInfra

### For Coding Questions
1. Open-source models (Together, DeepInfra, Groq)
2. Claude (premium)
3. GPT-4 (premium)

---

## 💡 Tips

- **Start with Groq** - Fast, free, reliable
- **Add Together AI** - Good fallback, same models
- **Use free tiers** - No credit card needed for most
- **Monitor usage** - Check dashboards to avoid surprises
- **Set rate limits** - Some providers have request limits

---

## 🔧 Troubleshooting

**"Provider failed"**
- Check API key is correct
- Verify in `.env.local` has no extra spaces
- Restart dev server after adding keys

**"API quota exceeded"**
- You've used your free tier
- Upgrade to paid, or wait for reset (usually monthly)

**"Network error"**
- Provider might be down
- Try a different provider from fallback list
- Check provider's status page

---

## What's Coming Next?

More providers being added:
- Kilo Code
- Anthropic (Haiku, Opus models)
- Azure OpenAI
- Vertex AI

**Total Free Credits Available**: $100+ if you use all free tiers!
