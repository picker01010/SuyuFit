# SuyuFit

Full-stack fitness tracking app with AI-powered nutrition label scanning.

## Structure

- **frontend/** - Web PWA (Vercel)
- **backend/** - Node/Express API (Render)
- **mobile/** - Expo React Native app

## Features

- 🔍 AI label scanning (Groq Vision API with key rotation)
- 🍽️ Food tracking with macro breakdown
- 💪 Workout logging
- 📊 Daily macro targets & progress
- 📱 Cross-platform (web + mobile)
- 🔄 Data sync via backend

## Tech Stack

- Frontend: Vanilla JS PWA
- Backend: Node.js, Express, Groq AI
- Mobile: React Native (Expo)
- Database: Supabase (PostgreSQL)
- Hosting: Vercel (frontend), Render (backend)

## Setup

### Backend
```bash
cd backend
npm install
# Add .env with Groq keys and Supabase URL
npm start
```

### Frontend
```bash
cd frontend
# Update BACKEND_URL in index.html
# Deploy to Vercel or serve locally
```

### Mobile
```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go app
```

## Deployment

### Backend (Render)
1. Create new Web Service
2. Connect this repo
3. Root directory: `backend`
4. Build: `npm install`
5. Start: `npm start`
6. Add environment variables from `.env`

### Frontend (Vercel)
1. Import project
2. Root directory: `frontend`
3. Framework preset: Other
4. No build command needed
5. Deploy

### Mobile (Expo)
```bash
cd mobile
eas build --platform android
# or
eas build --platform ios
```

## Environment Variables

Backend needs:
- `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3`
- `SUPABASE_URL`, `SUPABASE_KEY`
- `PORT` (defaults to 3000)

## Uptime

Use UptimeRobot to ping backend every 5 minutes to prevent Render sleep:
- Monitor: `https://suyufit-backend.onrender.com/health`
- Interval: 5 minutes
