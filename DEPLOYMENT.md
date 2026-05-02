# Deployment Guide - Joe's AI on Render

This guide walks you through deploying Joe's AI Interface to Render, a modern cloud platform that handles Node.js applications perfectly.

## Prerequisites

1. **GitHub Account** - Your code must be pushed to a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **API Keys** (optional) - For premium AI providers like Groq, Gemini, or OpenAI

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Render Account

1. Visit [render.com](https://render.com)
2. Click "Sign Up"
3. Connect your GitHub account
4. Authorize Render to access your repositories

### 3. Create a New Web Service

1. Click the **+ New** button in the top-right
2. Select **Web Service**
3. Search for your `joes-ai` repository
4. Select it and click **Connect**

### 4. Configure the Web Service

Fill in the deployment settings:

| Setting | Value |
|---------|-------|
| **Name** | `joes-ai` (or your preferred name) |
| **Environment** | `Node` |
| **Region** | Select the closest region to you |
| **Branch** | `main` (or your main branch) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` (or upgrade for better performance) |

### 5. Add Environment Variables

Click **Advanced** and add environment variables under "Env Vars":

```
NODE_ENV=production
FRONTEND_URL=https://joes-ai.onrender.com
```

Replace `joes-ai` with your actual service name.

#### Optional: Add API Keys

Add your API keys for premium providers:

```
GROQ_API_KEY=your_actual_key_here
GEMINI_API_KEY=your_actual_key_here
OPENAI_API_KEY=your_actual_key_here
ANTHROPIC_API_KEY=your_actual_key_here
```

**Security Note**: Never commit API keys to GitHub. Always set them in Render's environment variables.

### 6. Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy your application
3. Wait for the build to complete (usually 2-3 minutes)
4. Once deployed, you'll see "Available" with a live URL

### 7. Access Your App

Your app will be available at: `https://joes-ai.onrender.com`

(Replace `joes-ai` with your actual service name)

## Troubleshooting

### Build Fails

Check the build logs in Render dashboard:
- Click your service
- Go to "Logs" tab
- Look for error messages

Common issues:
- Missing dependencies: Check `package.json`
- Node version mismatch: Ensure Node 18+ is available
- Port conflicts: Make sure PORT is configurable

### App Runs but No Response

Check runtime logs:
- Go to "Logs" tab
- Look for connection errors
- Verify environment variables are set correctly

### API Keys Not Working

1. Verify keys are set in Render environment variables
2. Check they're correctly formatted
3. Test each provider individually
4. Use free providers (BazaarLink, Completions.me) as fallback

## Performance Tips

### Free Plan Optimization

- The free plan spins down after 15 minutes of inactivity
- First request will be slow (cold start)
- For consistent performance, upgrade to Starter plan

### Environment Variables Optimization

Set these for better performance:

```
NODE_ENV=production
NPM_DEFAULT_VERSION=10
```

## Updating Your App

To push updates to your deployed app:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render automatically rebuilds and redeploys when it detects changes.

## Monitoring & Logs

Monitor your deployment:

1. Go to your service in Render dashboard
2. Click **Logs** to view real-time logs
3. Click **Metrics** to see resource usage
4. Click **Health** to check service status

## Support

For issues with:
- **Render deployment**: Check [Render docs](https://render.com/docs)
- **API providers**: Check respective documentation
- **App issues**: Check logs in Render dashboard

## Cost

- **Free Plan**: 750 hours/month (one service running continuously)
- **Starter Plan**: $7/month, unlimited hours
- **All plans**: Include SSL/HTTPS, custom domains, automatic backups