# Google OAuth Setup for Joe's AI

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it "Joe's AI" and click Create
4. Wait for the project to be created, then select it

## Step 2: Enable Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. You may need to configure the OAuth consent screen first:
   - Click "Configure Consent Screen"
   - Choose "External"
   - Fill in:
     - App name: "Joe's AI"
     - User support email: your email
     - Developer contact: your email
   - Save and continue through scopes (don't need to add any)
   - Add your test email as a test user
   - Review and create

4. After consent screen is set up, create the OAuth client:
   - Application type: **Web application**
   - Name: "Joe's AI Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://joes-ai.onrender.com` (your Render domain)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://joes-ai.onrender.com/api/auth/callback/google`
   - Click Create

## Step 4: Copy Your Credentials

You'll see a popup with your credentials. Copy:
- **Client ID**
- **Client Secret**

## Step 5: Add to .env.local

Create or update `.env.local` with:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# For production on Render:
# NEXTAUTH_URL=https://joes-ai.onrender.com
```

## Step 6: Generate NEXTAUTH_SECRET

Run this in your terminal:
```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET` value.

## Step 7: Install Dependencies

```bash
npm install next-auth
```

## Done!

Your app now supports Google login. Users can:
- Use the app without logging in
- Click "Sign in with Google" to save their profile to the cloud
- Access their chat history across devices once signed in
