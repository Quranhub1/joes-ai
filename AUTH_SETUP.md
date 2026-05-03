# Authentication Setup Guide

Google OAuth and NextAuth.js have been integrated into Joe's AI. This guide walks you through the setup process.

## Features

✅ Optional Google Sign-In (app works without it)
✅ Cloud sync when signed in
✅ Cross-device access to chat history
✅ Secure session management
✅ Sign out anytime

## Setup Steps

### Step 1: Install Dependencies

Run this command in your project directory:

```bash
npm install
```

This will install `next-auth` along with other dependencies.

### Step 2: Get Google OAuth Credentials

Follow the detailed guide in [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) to:
1. Create a Google Cloud project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Get your Client ID and Client Secret

### Step 3: Set Environment Variables

Create or update `.env.local` in your project root:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

**To generate NEXTAUTH_SECRET**, run:
```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

### Step 4: Run the App

```bash
npm run dev
```

Visit `http://localhost:3000` and you should see a "Sign In" button in the header.

## How It Works

### For Users NOT Signed In
- ✅ Full chat access
- ✅ Chat stored in browser only
- ✅ Profile remembered locally
- ❌ Can't access chat on other devices
- ❌ Chat lost if browser data cleared

### For Users SIGNED IN with Google
- ✅ Full chat access
- ✅ Chat synced to JSONBin cloud
- ✅ Profile synced to cloud
- ✅ Access chat from any device/browser
- ✅ Chat persists even if browser data cleared
- ✅ User name and info displayed in header

## File Structure

New files created:
```
app/
├── api/auth/[...nextauth]/route.ts    - NextAuth configuration
├── auth/
│   ├── signin/page.tsx                - Sign in page
│   └── error/page.tsx                 - Auth error page
├── providers.tsx                       - Session provider wrapper
└── page.tsx                           - Updated with Sign In button

GOOGLE_OAUTH_SETUP.md                   - Detailed OAuth setup guide
```

## Troubleshooting

### "Sign In" button doesn't work
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`
- Make sure `NEXTAUTH_URL` matches your domain
- For localhost, use `http://localhost:3000`
- For production on Render, use `https://joes-ai.onrender.com`

### Credentials not being saved
- Ensure `JSONBIN_BIN_ID` and `JSONBIN_MASTER_KEY` are also configured
- Sign in works without JSONBin, but won't sync to cloud
- Check browser console for sync errors

### Session expires
- NextAuth sessions expire after 30 days by default
- Users can sign in again
- Local data is preserved even if session expires

## Deployment on Render

1. Add these environment variables in Render Dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=https://your-app.onrender.com`
   - `JSONBIN_BIN_ID` (optional)
   - `JSONBIN_MASTER_KEY` (optional)

2. Update your Google OAuth redirect URIs to include:
   - `https://your-app.onrender.com/api/auth/callback/google`

3. Deploy as usual:
   ```bash
   git push # pushes to Render
   ```

## API Routes

- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

## Next Steps

After setup:
1. Test sign in on `http://localhost:3000`
2. Configure JSONBin for cloud sync (optional)
3. Deploy to Render
4. Test cross-device sync

Questions? Check the [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) file for detailed OAuth setup instructions.
