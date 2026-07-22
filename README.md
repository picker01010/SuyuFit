# SuyuFit 💪

A modern, AI-powered fitness tracking progressive web app (PWA) with nutrition label scanning, workout logging, and body composition tracking.

## Quick Start

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## Features

### 🍽️ Food Tracking
- AI nutrition label scanner (take photo → auto-fill macros)
- Extensive food database (Indian + Western foods)
- Create custom foods
- Save meal combos for quick logging
- Macro targets based on TDEE calculation

### 💪 Gym Tracking
- Pre-built workout plans (Push/Pull/Legs)
- Progressive overload coaching (auto-suggests weight increases)
- Rest timer with notifications
- Exercise history and charts
- 1RM estimation

### 📊 Progress Tracking
- Weight logging with trend analysis
- Body measurements (waist, chest, arms)
- Progress photos (stored locally)
- Goal setting with smart calorie adjustment
- Weekly reports

### 👥 Multi-Profile
- Up to 10 profiles per device
- Netflix-style profile switcher
- Separate data per profile

### 📱 PWA Features
- Install as app on mobile
- Offline capable
- Push notifications for rest timer

## Tech Stack

- **Frontend**: Vanilla JavaScript (no framework!), PWA
- **Backend**: Node.js + Express
- **AI**: Google Gemini 2.5 Flash (vision)
- **Hosting**: Vercel (frontend) + Render (backend)
- **Storage**: localStorage (local) + Supabase (optional sync)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup guide.

**Quick version:**
1. Get 4 Google Gemini API keys
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Done!

## Development

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
node server.js

# Frontend (in another terminal)
cd frontend
python -m http.server 8000
```

Open http://localhost:8000

## License

MIT

## Screenshots

(Screenshots would go here if sharing publicly)
