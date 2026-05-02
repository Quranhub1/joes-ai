# Joe's AI - Render Deployment Guide

This guide explains how the Joe's AI application is structured for deployment on Render.com.

## Architecture Overview

Joe's AI is a Next.js 14 full-stack application deployed as a single web service on Render.

```
Frontend (React/Next.js) → Next.js API Routes → AI Provider APIs
    ↓
   Render (Node.js)
    ↓
Environment Variables (Render Dashboard)
```

## Repository Structure

### Core Files

```
├── app/
│   ├── page.tsx              # Main UI (React/TypeScript)
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── api/
│       ├── chat/
│       │   └── route.ts      # POST /api/chat - Chat endpoint
│       └── providers/
│           └── route.ts      # GET /api/providers - Provider list
├── public/
│   └── logo.png              # App logo
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── next.config.js            # Next.js config
├── package.json              # Dependencies
├── render.yaml               # Render configuration
└── tsconfig.json             # TypeScript config
```

## Render Configuration

### render.yaml

```yaml
services:
  - type: web
    name: joes-ai
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      # Add API keys below in Render Dashboard
```

## Environment Variables

### Required (for deployment)
- `NODE_ENV=production`
- `PORT=3000`

### Optional (AI Provider Keys)

| Variable | Provider | Required | Notes |
|----------|----------|----------|-------|
| `GROQ_API_KEY` | Groq Llama 3 | No | Free tier available |
| `GEMINI_API_KEY` | Google Gemini | No | Free tier available |
| `OPENAI_API_KEY` | OpenAI GPT-4 | No | Premium, paid |
| `ANTHROPIC_API_KEY` | Anthropic Claude | No | Premium, paid |
| `BAZAARLINK_API_KEY` | BazaarLink | No | Free, no key required |
| `COMPLETIONS_API_KEY` | Completions.me | No | Free, no key required |
| `JSONBIN_BIN_ID` | JSONBin.io | No | For chat history |
| `JSONBIN_MASTER_KEY` | JSONBin.io | No | For chat history |

### How to Set Environment Variables in Render

1. Go to your Render service dashboard
2. Navigate to **Environment** → **Environment Variables**
3. Click **Add Environment Variable**
4. Enter the key and value
5. Click **Add**
6. Redeploy the service

**Example:**
```
Key: GROQ_API_KEY
Value: gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## API Endpoints

### GET /api/providers

Returns list of available AI providers based on configured keys.

**Response:**
```json
{
  "providers": [
    {
      "id": "groq",
      "name": "Groq Llama 3",
      "type": "free",
      "description": "Fast, open-source LLM via Groq"
    },
    {
      "id": "bazaarlink",
      "name": "BazaarLink (Free)",
      "type": "free",
      "description": "Auto-routing to free models"
    }
  ]
}
```

### POST /api/chat

Sends a message to an AI provider.

**Request Body:**
```json
{
  "message": "Your question here",
  "provider": "groq",
  "mode": "coding"
}
```

**Parameters:**
- `message` (string, required): The user's message
- `provider` (string, required): AI provider ID (groq, gemini, openai, claude, bazaarlink, completions)
- `mode` (string, required): Chat mode (coding, general, personal, predictions, creative)

**Response:**
```json
{
  "response": "AI response text"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

## Local Development

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd joes-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
# Optional: Add your API keys for local testing
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
JSONBIN_BIN_ID=your_bin_id
JSONBIN_MASTER_KEY=your_master_key
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment Steps

### Prerequisites
- Render account (free tier)
- GitHub repository with code
- API keys (optional, for premium providers)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-url>
git push -u origin main
```

### Step 2: Create Render Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `joes-ai`
   - **Environment:** `Node`
   - **Region:** `Oregon` (recommended)
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 3: Add Environment Variables

1. Click **Environment** tab
2. Click **Add Environment Variable**
3. Add variables (optional):
   - `GROQ_API_KEY` - Your Groq key
   - `GEMINI_API_KEY` - Your Gemini key
   - `OPENAI_API_KEY` - Your OpenAI key
   - `ANTHROPIC_API_KEY` - Your Anthropic key
   - `JSONBIN_BIN_ID` - Your JSONBin ID
   - `JSONBIN_MASTER_KEY` - Your JSONBin key

### Step 4: Deploy

1. Click **Create Web Service**
2. Wait for deployment (2-5 minutes)
3. Your app will be available at `https://joes-ai.onrender.com`

### Step 5: Verify Deployment

1. Visit your app URL
2. Open browser console (F12)
3. Check for any errors
4. Test chat functionality

## Free Provider Fallback

The app includes **free providers that require no API keys**:

### BazaarLink
- Auto-routes to free models
- No API key required
- Available out of the box

### Completions.me
- 100% free tier
- No API key required
- Unlimited access

If no premium keys are configured, these free providers will be available in the dropdown.

## Updating the Application

### Automatic Deployment (Auto-Deploy)

When `autoDeploy: true` is set in `render.yaml`:
1. Push changes to GitHub
2. Render automatically detects changes
3. Build runs automatically
4. New version deploys

### Manual Deployment

1. Push changes to GitHub
2. Go to Render dashboard
3. Click **Manual Deploy**
4. Select `main` branch
5. Click **Deploy**

## Monitoring

### Render Dashboard
- View logs: **Logs** tab
- Check status: **Metrics** tab
- Monitor uptime: **Monitoring** tab

### Application Logs
```bash
# View recent logs
npm run logs
```

### Health Check
Visit `https://your-app.onrender.com/api/providers` to verify service is running.

## Troubleshooting

### Issue: "API key not configured"

**Solution:**
1. Go to Render dashboard
2. Navigate to Environment → Environment Variables
3. Add the missing API key
4. Redeploy

### Issue: Deployment fails

**Check:**
1. `package.json` has correct scripts
2. Node version is >= 18.0.0
3. All dependencies are listed
4. Build command is `npm install`

### Issue: Chat not working

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. API keys are configured
4. CORS headers are set (automatically configured)

### Issue: Rate limit exceeded

**Solution:**
- Free tiers have rate limits
- Upgrade to paid plan for higher limits
- Use multiple providers

## Scaling

### Upgrade Plan

1. Go to Render service settings
2. Change **Plan** from Free to Starter ($7/month)
3. Choose instance size
4. Apply changes

### Benefits of Paid Plan
- No sleep mode
- Custom domains
- SSL certificates
- More resources

## Security Best Practices

1. **Never commit API keys** to GitHub
   - Use `.env.local` (in `.gitignore`)
   - Use Render Environment Variables

2. **Use CORS appropriately**
   - Configured in `next.config.js`
   - Restrict origins in production

3. **Validate all inputs**
   - Server-side validation
   - Rate limiting

4. **Monitor usage**
   - Check provider usage dashboards
   - Set up billing alerts

## Cost Management

### Free Tier
- Render: Free (with sleep)
- Providers: Free tiers available
- Storage: Free (GitHub)

### Estimated Costs

| Item | Free Tier | Paid Tier |
|------|-----------|-----------|
| Render Hosting | $0/mo | $7/mo |
| Groq API | $0 (credits) | Pay-as-you-go |
| Gemini API | $0 (free tier) | Pay-as-you-go |
| OpenAI API | $0 (trial) | Pay-as-you-go |
| **Total** | **$0/mo** | **~$7+/mo** |

## Backup and Restore

### Manual Backup
```bash
# Clone your repo
git clone <your-repo-url>
cd joes-ai

# Save environment variables
# Copy from Render dashboard
```

### Restore
```bash
# Create new Render service
# Push code from backup
# Restore environment variables
```

## Support

- [Render Documentation](https://render.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Provider APIs](https://platform.openai.com/docs)

## Environment Variables Reference

```bash
# Required
NODE_ENV=production
PORT=3000

# AI Providers
GROQ_API_KEY=gsk_xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional
JSONBIN_BIN_ID=xxxxx
JSONBIN_MASTER_KEY=xxxxx
BAZAARLINK_API_KEY=sk-bl-xxxxx
COMPLETIONS_API_KEY=sk-cp-xxxxx
```

## Quick Start Script

```bash
# Deploy to Render in 5 commands
git init
git add .
git commit -m "Initial commit"
git remote add origin <repo-url>
git push -u origin main
# Then create service on Render dashboard
```

## Conclusion

Joe's AI is designed for easy deployment on Render with minimal configuration. The application:
- Uses free tier providers by default
- Supports premium providers via environment variables
- Auto-deploys from GitHub
- Requires no database
- Scales automatically

For questions or issues, check the [Render documentation](https://render.com/docs) or provider-specific docs.