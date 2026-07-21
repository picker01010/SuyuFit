# 🚀 SuyuFit Deployment Checklist

Copy this checklist and mark off items as you complete them.

## ✅ Pre-Deployment (Already Done)

- [x] Code pushed to GitHub: https://github.com/picker01010/SuyuFit
- [x] Backend built with Groq API key rotation
- [x] Frontend PWA with AI scanning
- [x] Mobile app (Expo) ready
- [x] All icons and assets copied
- [x] Database schema ready

---

## 📋 Deployment Steps (Do These Now)

### Step 1: Supabase Setup (2 min)
- [ ] Go to https://supabase.com/dashboard
- [ ] Select "picker01010's Project"
- [ ] Click "SQL Editor" in left sidebar
- [ ] Copy contents of `supabase-schema.sql`
- [ ] Paste into SQL editor
- [ ] Click "Run"
- [ ] Go to Settings → API
- [ ] Copy **Project URL**: ________________
- [ ] Copy **anon public key**: ________________

### Step 2: Deploy Backend to Render (5 min)
- [ ] Go to https://dashboard.render.com/
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub → Select "SuyuFit" repo
- [ ] Configure:
  - Name: `suyufit-backend`
  - Root Directory: `backend`
  - Build: `npm install`
  - Start: `npm start`
- [ ] Add Environment Variables:
  ```
  GROQ_API_KEY_1 = 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
  GROQ_API_KEY_2 = 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
  GROQ_API_KEY_3 = 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
  SUPABASE_URL = [paste from Step 1]
  SUPABASE_KEY = [paste from Step 1]
  PORT = 3000
  ```
- [ ] Click "Create Web Service"
- [ ] Wait 3-5 minutes
- [ ] Copy backend URL: ________________
- [ ] Test: Visit `[backend-url]/health` → should show `{"status":"healthy"}`

### Step 3: Update Frontend (1 min)
**CRITICAL: Do this BEFORE deploying to Vercel**

- [ ] Open `frontend/index.html` in editor
- [ ] Find line ~50: `const BACKEND_URL = 'https://suyufit-backend.onrender.com';`
- [ ] Replace with YOUR backend URL from Step 2
- [ ] Save file
- [ ] Run in terminal:
  ```bash
  cd C:\Users\sanka\Downloads\suyufit
  git add frontend/index.html
  git commit -m "Update backend URL for production"
  git push
  ```

### Step 4: Deploy Frontend to Vercel (2 min)
- [ ] Go to https://vercel.com/new
- [ ] Click "Import Git Repository"
- [ ] Select "SuyuFit"
- [ ] Configure:
  - Project Name: `suyufit`
  - Framework: Other
  - Root Directory: `frontend`
  - Leave all build settings empty
- [ ] Click "Deploy"
- [ ] Wait 1-2 minutes
- [ ] Copy frontend URL: ________________
- [ ] Test: Open URL in browser → should load the app

### Step 5: Test Website AI Scan (2 min)
- [ ] Open your frontend URL
- [ ] Click the scan icon (camera)
- [ ] Upload or take photo of nutrition label
- [ ] Verify food is logged with macros
- [ ] If fails, check browser console for errors

### Step 6: UptimeRobot (Keep Backend Awake) (2 min)
- [ ] Go to https://uptimerobot.com/
- [ ] Click "Add New Monitor"
- [ ] Configure:
  - Type: HTTP(s)
  - Name: SuyuFit Backend
  - URL: `[backend-url]/health`
  - Interval: 5 minutes
- [ ] Click "Create Monitor"
- [ ] Done! Backend will stay awake 24/7

### Step 7: Update Mobile App (1 min)
- [ ] Open `mobile/src/screens/FoodScreen.js`
- [ ] Line 9: Change BACKEND_URL to your Render URL
- [ ] Save file
- [ ] Run in terminal:
  ```bash
  cd C:\Users\sanka\Downloads\suyufit
  git add mobile/src/screens/FoodScreen.js
  git commit -m "Update mobile backend URL"
  git push
  ```

### Step 8: Test Mobile App (2 min)

**Option A: Quick test with Expo Go**
- [ ] Install "Expo Go" app on phone (App Store / Play Store)
- [ ] Run in terminal:
  ```bash
  cd C:\Users\sanka\Downloads\suyufit\mobile
  npm install
  npx expo start
  ```
- [ ] Scan QR code with Expo Go app
- [ ] Test all 4 tabs
- [ ] Test AI scanning
- [ ] Test manual food entry

**Option B: Build production APK (Optional)**
- [ ] Run in terminal:
  ```bash
  cd C:\Users\sanka\Downloads\suyufit\mobile
  npm install -g eas-cli
  eas login
  eas build --platform android --profile preview
  ```
- [ ] Wait 10-15 minutes for build
- [ ] Download APK from Expo dashboard
- [ ] Install on Android phone

---

## ✅ Post-Deployment Verification

### Website Checklist
- [ ] Opens without errors
- [ ] All 4 tabs work (Food, Gym, Plan, Me)
- [ ] AI scan works (camera icon)
- [ ] Manual food entry works
- [ ] Search food works
- [ ] Workout logging works
- [ ] Plan editing works
- [ ] Profile editing works
- [ ] Data persists after refresh

### Mobile App Checklist
- [ ] All 4 tabs work
- [ ] UI matches website design
- [ ] AI scan works (camera)
- [ ] Manual food entry works
- [ ] Search food works
- [ ] Workout logging works
- [ ] Plan editing works
- [ ] Profile editing works
- [ ] Data persists after app restart

### Backend Checklist
- [ ] `/health` endpoint returns healthy status
- [ ] AI scan endpoint works (test via website/app)
- [ ] Groq keys rotating correctly (check logs if needed)
- [ ] UptimeRobot keeping it awake (check after 20 min)

---

## 📊 URLs Summary

Fill these in as you deploy:

| Service | URL |
|---------|-----|
| GitHub Repo | https://github.com/picker01010/SuyuFit |
| Backend (Render) | ________________ |
| Frontend (Vercel) | ________________ |
| Supabase Dashboard | https://supabase.com/dashboard |
| UptimeRobot Dashboard | https://uptimerobot.com/dashboard |
| Expo Project | https://expo.dev/accounts/picker123123s-team/projects/suyu-fit |

---

## 🎉 Success Criteria

You're done when:

- ✅ Website loads and AI scan works
- ✅ Mobile app works on phone
- ✅ Backend stays awake (monitored by UptimeRobot)
- ✅ All data saves properly
- ✅ Everything runs on free tier

---

## 🆘 Troubleshooting

**Backend returns 503:**
→ First request after sleep takes 30-60 seconds. UptimeRobot fixes this.

**Frontend can't connect:**
→ Double-check BACKEND_URL in `frontend/index.html` matches Render URL exactly

**AI scan fails:**
→ Check Groq API keys at https://console.groq.com/ (should auto-rotate)

**Mobile app won't build:**
→ Make sure you're logged into Expo: `eas login`

**Can't push to GitHub:**
→ Make sure you authenticated when Git prompted earlier

---

## ⏱️ Total Time: ~15 minutes

**Estimated breakdown:**
- Supabase: 2 min
- Render: 5 min
- Frontend update: 1 min
- Vercel: 2 min
- UptimeRobot: 2 min
- Mobile update: 1 min
- Testing: 2 min

---

## 🔄 After Everything Works

1. Share frontend URL with your gf
2. Install mobile app on both phones
3. Use daily!
4. All data syncs automatically

---

## 📝 Notes

- Keep all URLs/passwords safe
- Backend sleeps after 15 min without UptimeRobot
- All services are free tier (should last years)
- GitHub repo is private (keep it that way)
- Groq keys are secure (backend only)

---

**Ready? Let's go! Start with Step 1 (Supabase) 🚀**
