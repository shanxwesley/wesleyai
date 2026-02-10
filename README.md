# Wesley AI Chatbot 🤖

Your friendly AI companion with voice features!

## 🚀 Quick Setup

### Step 1: Deploy the Backend (Free!)

Your API key needs to be hidden on a server. Choose one:

#### Option A: Deploy to Render (Recommended - Free)
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Set these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variable:
   - Key: `OPENROUTER_API_KEY`
   - Value: `your_actual_api_key_here`
6. Click "Create Web Service"
7. Copy your service URL (e.g., `https://wesley-backend.onrender.com`)

#### Option B: Deploy to Railway (Also Free)
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project" → "Deploy from GitHub"
3. Select your repo
4. Add environment variable `OPENROUTER_API_KEY`
5. Deploy and copy your URL

#### Option C: Deploy to Vercel
Use this serverless function instead of server.js:

Create `api/chat.js`:
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': req.headers.referer || 'https://your-site.com',
        'X-Title': 'Wesley AI Chatbot'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get response' });
  }
}
```

### Step 2: Update Your Frontend

In `script.js`, change line 19:
```javascript
this.API_ENDPOINT = 'YOUR_BACKEND_URL/api/chat';
// Example: 'https://wesley-backend.onrender.com/api/chat'
```

### Step 3: Deploy Frontend to GitHub Pages

1. Push your code to GitHub
2. Go to repo Settings → Pages
3. Source: Deploy from branch `main`
4. Your site will be live at `https://yourusername.github.io/repo-name`

## 📁 Project Structure

```
wesley-ai/
├── index.html          # Frontend UI
├── script.js          # Frontend logic (updated to use backend)
├── style.css          # Styling
├── server.js          # Backend proxy (hides your API key)
├── package.json       # Backend dependencies
├── .env              # Your API key (DON'T commit this!)
├── .gitignore        # Protects .env from being uploaded
└── README.md         # This file
```

## 🔒 Security Notes

- ✅ Your API key is stored in `.env` (never committed to GitHub)
- ✅ Backend server proxies requests to hide your key
- ✅ Frontend only talks to YOUR backend
- ✅ Users can't steal or see your API key

## 🎯 Features

- 💬 AI-powered conversations using OpenRouter
- 🎤 Voice input (speech-to-text)
- 🔊 Voice output (text-to-speech with British accent)
- 📝 Conversation history
- ⚙️ Customizable settings
- 📱 Responsive design

## 🆘 Troubleshooting

**"API Error" messages?**
- Make sure your backend is running
- Check that `API_ENDPOINT` in script.js matches your deployed backend URL
- Verify your API key is correct in Render/Railway environment variables

**Voice not working?**
- Use Chrome, Edge, or Safari (best browser support)
- Allow microphone permissions when prompted

## 📝 License

MIT - Feel free to use and modify!
