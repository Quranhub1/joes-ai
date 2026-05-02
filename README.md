# Joe's AI - Full Stack Next.js Application

A unified AI interface with multiple AI providers, ready for deployment on Render.

## ✅ Features

- **Multiple AI Modes:**
  - 💻 Coding Assistant
  - ❓ General Q&A
  - 🧘 Personal Advice
  - 🖼️ Image Prompts
  - ⚽ Football Predictions

- **AI Providers:**
  - Groq Llama 3 (Free)
  - Google Gemini (Free)

- **Additional Features:**
  - Chat history sync with JSONBin.io
  - Terminal-style UI with CRT effects
  - Light/Dark mode toggle
  - Export chat conversations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd joes-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```
   GROQ_API_KEY=your_groq_key_here
   GEMINI_API_KEY=your_gemini_key_here
   JSONBIN_BIN_ID=your_bin_id_here
   JSONBIN_MASTER_KEY=your_master_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🌐 Deployment on Render

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** joes-ai
   - **Environment:** Node
   - **Region:** Oregon (or closest to you)
   - **Branch:** main
   - **Root Directory:** (leave blank)
   - **Runtime:** Node 18
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. **Add Environment Variables:**
   - Click **"Environment"** tab
   - Add these variables:
     ```
     GROQ_API_KEY = your_groq_key
     GEMINI_API_KEY = your_gemini_key
     JSONBIN_BIN_ID = your_bin_id
     JSONBIN_MASTER_KEY = your_master_key
     NODE_ENV = production
     ```

6. Click **"Create Web Service"**

### 3. Access Your App
Once deployed, your app will be available at `https://joes-ai.onrender.com` (or your custom domain).

## 📁 Project Structure

```
joes-ai/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts      # Main chat API endpoint
│   │   └── providers/
│   │       └── route.ts      # Available AI providers
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main UI component
├── public/
│   └── logo.png
├── .env.example              # Environment template
├── .gitignore
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
├── render.yaml               # Render deployment config
├── tsconfig.json             # TypeScript config
└── README.md
```

## 🔧 API Routes

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

**Response:**
```json
{
  "response": "AI response here"
}
```

### GET /api/providers
Returns available AI providers.

**Response:**
```json
{
  "providers": [
    {
      "id": "groq",
      "name": "Groq Llama 3",
      "type": "free"
    },
    {
      "id": "gemini",
      "name": "Google Gemini",
      "type": "free"
    }
  ]
}
```

## 🔒 Security

- ✅ All API keys stored server-side only
- ✅ CORS headers configured
- ✅ Input validation on all endpoints
- ✅ Error handling and logging

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Deployment:** Render
- **AI Providers:** Groq, Google Gemini
- **Data Storage:** JSONBin.io (optional)

## 📝 Getting API Keys

### Groq (Free)
1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up/Login
3. Create a new API key

### Google Gemini (Free)
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with Google account
3. Create an API key

### JSONBin.io (Optional - for chat sync)
1. Visit [JSONBin.io](https://jsonbin.io)
2. Sign up and create a new bin
3. Get your Bin ID and Master Key from the dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation

---

**Built with ❤️ by Joes AI Team**