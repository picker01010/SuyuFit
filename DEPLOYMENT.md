# SuyuFit - Complete Deployment Guide

A modern fitness tracking PWA with AI-powered nutrition label scanning.

## Features
- 📸 AI nutrition label scanner (Gemini vision)
- 🍽️ Food logging with macro tracking
- 💪 Gym workout logger with progressive overload coaching
- 📊 Body composition tracking (weight, measurements, photos)
- 🎯 Goal setting and progress monitoring
- 👥 Multi-profile support (up to 10 profiles)
- 📱 PWA with offline support

---

## Prerequisites

You'll need accounts for:
1. **Google AI Studio** - For AI label scanning (free tier: 15 requests/min)
2. **Vercel** - Frontend hosting (free tier)
3. **Render** - Backend hosting (free tier)
4. **Supabase** (optional) - For cross-device sync

---

## Step 1: Get API Keys

### Google Gemini API Keys (4 keys recommended)
1. Go to https://aistudio.google.com/apikey
2. Click "Create API key"
3. Copy the key (starts with `AIza...` or `AQ.`)
4. Repeat 3 more times for backup keys

---

## Step 2: Deploy Backend (Render)

### 2.1: Create Render Account
1. Go to https://render.com/
2. Sign up with GitHub

### 2.2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Settings:
   - **Name**: `suyufit-backend` (or your choice)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

### 2.3: Add Environment Variables
In Render dashboard → Environment tab:

```
GEMINI_KEY = your_first_gemini_key
GEMINI_KEY_2 = your_second_gemini_key
GEMINI_KEY_3 = your_third_gemini_key
GEMINI_KEY_4 = your_fourth_gemini_key
PORT = 3001
```

Optional (for cross-device sync):
```
SUPABASE_URL = your_supabase_url
SUPABASE_SERVICE_KEY = your_supabase_service_key
```

### 2.4: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Copy your backend URL (e.g., `https://suyufit-backend.onrender.com`)

---

## Step 3: Deploy Frontend (Vercel)

### 3.1: Update Backend URL
Edit `frontend/index.html`, line ~943:
```javascript
const BACKEND_URL="https://YOUR-BACKEND-URL.onrender.com";
```

### 3.2: Create Vercel Account
1. Go to https://vercel.com/
2. Sign up with GitHub

### 3.3: Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Settings:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: (leave empty)
   - **Output Directory**: `.`

### 3.4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Your app is live! (e.g., `https://suyufit.vercel.app`)

---

## Step 4: Set Up PWA (Optional)

On mobile:
1. Open your Vercel URL in Chrome
2. Tap menu ⋮ → "Add to Home screen"
3. App installs like a native app!

---

## Step 5: Supabase Setup (Optional - for cross-device sync)

### 5.1: Create Supabase Project
1. Go to https://supabase.com/
2. Sign up and create new project
3. Wait for database to initialize

### 5.2: Create Sync Table
Go to SQL Editor and run:

```sql
create table sync (
  user_id text primary key,
  state jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table sync enable row level security;
```

### 5.3: Get Credentials
Project Settings → API:
- Copy **Project URL** → Add to Render as `SUPABASE_URL`
- Copy **service_role key** → Add to Render as `SUPABASE_SERVICE_KEY`

---

## Costs

**100% FREE** if you stay within these limits:
- **Gemini**: 15 requests/min, 1500/day (free tier)
- **Render**: 750 hours/month (free tier - one service runs continuously)
- **Vercel**: Unlimited bandwidth (free hobby plan)
- **Supabase**: 500MB database, 2GB bandwidth/month (free tier)

---

## Architecture

```
┌─────────────────┐
│   Vercel PWA    │  ← User opens in browser
│  (Frontend)     │
└────────┬────────┘
         │
         │ API calls
         ▼
┌─────────────────┐
│  Render Server  │  ← Node.js Express backend
│   (Backend)     │
└────────┬────────┘
         │
         ├──→ Google Gemini API (vision AI)
         │
         └──→ Supabase (optional sync)
```

---

## File Structure

```
suyufit/
├── frontend/
│   ├── index.html          # Main PWA (all-in-one file)
│   ├── manifest.webmanifest
│   ├── sw.js              # Service worker for offline
│   └── icon-*.png         # App icons
├── backend/
│   ├── server.js          # Express API
│   ├── package.json
│   └── .env.example
└── mobile/                # React Native (optional)
```

---

## API Endpoints

### POST /api/scan
Scan nutrition label with AI
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

### POST /api/sync
Save user data (optional)
```json
{
  "userId": "user123",
  "state": { ... }
}
```

### GET /api/sync/:userId
Load user data (optional)

### GET /health
Health check endpoint

---

## Development

### Local Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your keys
node server.js
```

### Local Frontend
```bash
cd frontend
python -m http.server 8000
# Open http://localhost:8000
```

---

## Troubleshooting

### AI Scan Not Working
1. Check Render logs: Dashboard → Logs tab
2. Verify all 4 Gemini keys are added
3. Check backend URL in frontend code
4. Test endpoint: `https://your-backend.onrender.com/health`

### "Render service sleeping"
Free tier sleeps after 15 min idle. First request takes 30-60s to wake.

### PWA Not Installing
1. Must be HTTPS (Vercel provides this)
2. Chrome only on mobile
3. Check manifest.webmanifest path

---

## Customization

### Change Colors
Edit CSS variables in `frontend/index.html` (~line 25):
```css
:root{
  --gold:#B49AFC;  /* Primary accent */
  --bg:#000000;    /* Background */
  --ink:#EFEBFA;   /* Text color */
}
```

### Change Targets
Default profile uses recomp formula (slight deficit, high protein).
Edit `calcTargets()` function in frontend.

---

## Credits

Built with:
- Google Gemini 2.5 Flash (vision AI)
- Express.js (backend)
- Vanilla JS (frontend - no framework!)
- Supabase (optional sync)

---

## License

MIT - Use however you want, just don't blame me if your gains disappear 💪

---

## Support

Issues? Check:
1. Render logs for backend errors
2. Browser console (F12) for frontend errors
3. All API keys are valid and added to Render

---

**That's it! You now have a fully functional AI-powered fitness tracker.**
