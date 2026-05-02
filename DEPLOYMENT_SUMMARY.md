# Joe's AI - Render Deployment Summary

## Overview

Joe's AI is a unified AI interface built with Next.js 14 and TypeScript, deployed on Render. The application connects to multiple AI providers (both premium and free) through a single unified API.

## Key Improvements Made

### 1. Free Provider Integration
Added two free AI providers that require **no API keys**:
- **BazaarLink** - Auto-routes to available free models
- **Completions.me** - 100% free tier with unlimited access

These providers are always available, even without any API keys configured.

### 2. Render Configuration
- Single Next.js web service on Render
- Environment variables managed via Render dashboard
- Auto-deploy from GitHub main branch
- Free tier compatible

### 3. Secure API Key Storage
All API keys are stored as **Render environment variables**, never in code:
- `GROQ_API_KEY` - Groq Llama 3
- `GEMINI_API_KEY` - Google Gemini
- `OPENAI_API_KEY` - OpenAI GPT-4
- `ANTHROPIC_API_KEY` - Anthropic Claude
- `BAZAARLINK_API_KEY` - BazaarLink (optional)
- `COMPLETIONS_API_KEY` - Completions.me (optional)
- `JSONBIN_BIN_ID` - Chat history storage
- `JSONBIN_MASTER_KEY` - Chat history storage

### 4. Backend API Routes (Next.js)

#### POST `/api/chat`
Handles chat requests to all AI providers:
- Premium: Groq, Gemini, OpenAI, Claude
- Free: BazaarLink, Completions.me

#### GET `/api/providers`
Returns available providers based on configured keys.

## File Structure

```
joes-ai/
├── app/
│   ├── page.tsx              # Main UI (300+ lines)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind styles
│   └── api/
│       ├── chat/
│       │   └── route.ts      # Chat API (252 lines)
│       └── providers/
│           └── route.ts      # Providers list (updated)
├── public/
│   └── logo.png
├── .env.example              # Environment template (updated)
├── .gitignore                # Git ignore rules
├── next.config.js            # Next.js + CORS config
├── package.json              # Dependencies
├── render.yaml               # Render config
├── tsconfig.json             # TypeScript config
├── README.md                 # Project documentation
└── RENDER_DEPLOYMENT.md      # Detailed deployment guide
```

## How to Deploy on Render

### Step 1: Prepare Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <github-url>
git push -u origin main
```

### Step 2: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. **New +** → **Web Service**
3. Connect GitHub repository
4. Configure:
   - Name: `joes-ai`
   - Environment: `Node`
   - Region: `Oregon`
   - Branch: `main`
   - Build: `npm install`
   - Start: `npm start`

### Step 3: Add Environment Variables

In Render Dashboard → **Environment** tab:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Auto-set | `production` |
| `PORT` | Auto-set | `3000` |
| `GROQ_API_KEY` | No | [Groq Console](https://console.groq.com/keys) |
| `GEMINI_API_KEY` | No | [AI Studio](https://aistudio.google.com/apikey) |
| `OPENAI_API_KEY` | No | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | No | [Anthropic Console](https://console.anthropic.com/settings/keys) |

### Step 4: Deploy

Click **Create Web Service**
- Wait 2-5 minutes for deployment
- Access at `https://joes-ai.onrender.com`

## Free Providers (No Keys Needed)

The app works **out of the box** with free providers:

1. **BazaarLink** (`bazaarlink`)
   - Auto-routes to free models
   - No API key required
   - Always available

2. **Completions.me** (`completions`)
   - 100% free tier
   - Unlimited access
   - No API key required
   - Always available

## Premium Providers (Optional)

Add these in Render Dashboard for more options:

### 1. Groq (Free Credits + Free Tier)
- Visit: https://console.groq.com/keys
- Model: Llama 3 (fast, open-source)
- Cost: Free credits + free tier

### 2. Google Gemini (Free Tier)
- Visit: https://aistudio.google.com/apikey
- Model: Gemini 2.0 Flash
- Cost: Free tier (generous limits)

### 3. OpenAI GPT-4 (Premium)
- Visit: https://platform.openai.com/api-keys
- Model: GPT-4o-mini / GPT-4
- Cost: Paid ($0.03/1K tokens)

### 4. Anthropic Claude (Premium)
- Visit: https://console.anthropic.com/settings/keys
- Model: Claude Sonnet 4
- Cost: Paid ($3/1M tokens)

## API Endpoints

### GET /api/providers
Returns available providers:
```json
{
  "providers": [
    {"id": "bazaarlink", "name": "BazaarLink (Free)", "type": "free"},
    {"id": "completions", "name": "Completions.me (Free)", "type": "free"},
    {"id": "groq", "name": "Groq Llama 3", "type": "free"}
  ]
}
```

### POST /api/chat
Send a message:
```json
{
  "message": "Hello AI",
  "provider": "bazaarlink",
  "mode": "general"
}
```

Response:
```json
{
  "response": "Hello! How can I help you today?"
}
```

## Chat Modes

- **Coding** - Code generation, debugging, refactoring
- **General Q&A** - Questions and answers
- **Personal Advice** - Life and career guidance
- **Predictions** - Sports analysis
- **Creative** - Writing and brainstorming

## Cost Breakdown

### Free Tier ($0/month)
- Render: Free (with sleep)
- BazaarLink: Free
- Completions.me: Free
- JSONBin.io: Free tier

### Paid Tier ($7+/month)
- Render: $7/month (no sleep)
- API usage: Pay-as-you-go
- Typical: $10-50/month total

## Security

✅ API keys stored in environment variables  
✅ CORS headers configured  
✅ Input validation  
✅ Error handling  
✅ No keys in code  
✅ Rate limiting  

## Local Development

```bash
# Install
git clone <repo-url>
cd joes-ai
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys

# Run
npm run dev
```

Open: http://localhost:3000

## Testing Providers

1. Start app
2. Open browser console
3. Check provider list loads
4. Select a provider from dropdown
5. Send a test message
6. Verify response

## Troubleshooting

### "API key not configured"
→ Add key in Render Environment Variables  
→ Redeploy service

### Deployment fails
→ Check `package.json` scripts  
→ Verify `npm start` works  
→ Check Node version >= 18

### Chat not working
→ Check browser console  
→ Verify API keys  
→ Test `/api/providers` endpoint

### Rate limit
→ Free tiers have limits  
→ Add multiple providers  
→ Upgrade to paid plan

## Updating

Push to GitHub → Auto-deploys on Render

```bash
git add .
git commit -m "Update"
git push
# Render auto-deploys
```

## Resources

- [Render Dashboard](https://dashboard.render.com)
- [Groq Console](https://console.groq.com)
- [Google AI Studio](https://aistudio.google.com/apikey)
- [OpenAI Platform](https://platform.openai.com)
- [Anthropic Console](https://console.anthropic.com)
- [BazaarLink](https://bazaarlink.ai)
- [Completions.me](https://completions.me)

## Support

For issues:
1. Check browser console
2. Verify environment variables
3. Test endpoints directly
4. Review Render logs

## Summary

✅ Free providers work without API keys  
✅ Premium providers available via env vars  
✅ Single Next.js service on Render  
✅ Auto-deploy from GitHub  
✅ Secure key storage  
✅ Full documentation  
✅ 6 AI providers supported  
✅ 5 chat modes  
✅ Production-ready  

**Total cost to start: $0** 🎉