# Quick Start Guide

## ✅ What's Been Done

- ✅ Code pushed to GitHub: https://github.com/picker01010/SuyuFit
- ✅ Backend with Groq AI (3 keys with rotation)
- ✅ Frontend PWA with AI scanning
- ✅ Mobile app (Expo) with all features
- ✅ Supabase schema ready

## 🚀 Next Steps (In Order)

### 1. Set Up Supabase (2 minutes)

1. Go to: https://supabase.com/dashboard/project/_/editor
2. Click "SQL Editor" (left sidebar)
3. Click "New Query"
4. Open `supabase-schema.sql` from the repo
5. Copy all contents and paste into Supabase SQL editor
6. Click "Run" (bottom right)
7. Go to Settings > API and copy:
   - **Project URL** (starts with https://)
   - **anon public key** (long string)

### 2. Deploy Backend to Render (5 minutes)

1. Go to: https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Click "Build and deploy from a Git repository" → Next
4. Connect GitHub → Select "SuyuFit" repo
5. Fill in:
   - **Name**: `suyufit-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click "Advanced" → Add Environment Variables:
   ```
   GROQ_API_KEY_1 = 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
   GROQ_API_KEY_2 = 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
   GROQ_API_KEY_3 = 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
   SUPABASE_URL = [paste from step 1]
   SUPABASE_KEY = [paste from step 1]
   PORT = 3000
   ```
7. Click "Create Web Service"
8. Wait 3-5 minutes for deployment
9. **COPY YOUR BACKEND URL** (e.g., `https://suyufit-backend.onrender.com`)

### 3. Update Frontend with Backend URL (1 minute)

**BEFORE deploying to Vercel:**

1. Open `frontend/index.html`
2. Find line ~50: `const BACKEND_URL = 'https://suyufit-backend.onrender.com';`
3. Replace with YOUR backend URL from step 2
4. Save and commit:
   ```bash
   git add frontend/index.html
   git commit -m "Update backend URL"
   git push
   ```

### 4. Deploy Frontend to Vercel (2 minutes)

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select "SuyuFit" from your GitHub
4. Configure:
   - **Project Name**: `suyufit`
   - **Framework**: Other
   - **Root Directory**: `frontend`
   - Leave build settings empty
5. Click "Deploy"
6. Wait 1-2 minutes
7. Visit your site! (e.g., `https://suyufit.vercel.app`)

### 5. Set Up UptimeRobot (2 minutes)

1. Go to: https://uptimerobot.com/
2. Click "Add New Monitor"
3. Fill in:
   - **Type**: HTTP(s)
   - **Name**: SuyuFit Backend
   - **URL**: `[your-backend-url]/health` (e.g., `https://suyufit-backend.onrender.com/health`)
   - **Interval**: 5 minutes
4. Click "Create Monitor"
5. Done! Backend will stay awake 24/7

### 6. Update Mobile App Backend URL (1 minute)

1. Open `mobile/src/screens/FoodScreen.js`
2. Line 9: Change `BACKEND_URL` to your Render backend URL
3. Save

### 7. Test Mobile App (2 minutes)

**Option A: Quick test with Expo Go**
```bash
cd mobile
npm install
npx expo start
```
Scan QR with Expo Go app (download from App Store/Play Store)

**Option B: Build production APK**
```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
Download and install APK on phone

## 🎉 You're Done!

- **Website**: https://suyufit.vercel.app
- **Backend**: https://suyufit-backend.onrender.com
- **Mobile**: Scan QR or install APK
- **Uptime**: Monitored by UptimeRobot

## 🧪 Test the AI Scanning

1. Open website or mobile app
2. Click the scan icon (camera)
3. Take a photo of any nutrition label
4. Should automatically log the food with macros!

## 📊 Monitor Your Services

- **Render Dashboard**: https://dashboard.render.com/ (backend logs)
- **Vercel Dashboard**: https://vercel.com/dashboard (frontend analytics)
- **Supabase Dashboard**: https://supabase.com/dashboard (database data)
- **UptimeRobot Dashboard**: https://uptimerobot.com/dashboard (uptime stats)

## 🔧 Common Issues

**Q: Backend returns 503 or times out**  
A: First request after sleep takes 30-60 seconds on Render free tier. UptimeRobot keeps it awake.

**Q: AI scan fails**  
A: Check Groq API limits at https://console.groq.com/. Keys auto-rotate, wait 1 min if all exhausted.

**Q: Frontend can't connect to backend**  
A: Double-check BACKEND_URL in `frontend/index.html` matches your Render URL exactly.

**Q: Mobile app won't scan**  
A: Grant camera permissions in phone settings. Check BACKEND_URL in `mobile/src/screens/FoodScreen.js`.

## 💰 Costs

Everything is **FREE**:
- ✅ Render: Free tier (backend)
- ✅ Vercel: Free tier (frontend)
- ✅ Supabase: Free tier (database)
- ✅ Groq: Free tier (AI)
- ✅ UptimeRobot: Free tier (monitoring)
- ✅ GitHub: Free (private repo)
- ✅ Expo: Free (app builds)

Should stay free for years unless you get massive traffic.

## 📝 Notes

- Keep the GitHub repo **private** (it already is)
- Groq keys in `.env` are never exposed to frontend
- UptimeRobot prevents Render from sleeping
- All data syncs between web and mobile via Supabase
- No authentication needed (just you + gf)
