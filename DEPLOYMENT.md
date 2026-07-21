# Deployment Instructions

## 1. Supabase Database Setup

1. Go to your Supabase project: https://supabase.com/dashboard/project/_/editor
2. Open SQL Editor
3. Copy the entire contents of `supabase-schema.sql`
4. Run the SQL script
5. Get your credentials:
   - Project URL: Settings > API > Project URL
   - Anon/Public Key: Settings > API > Project API keys > anon public

## 2. Backend Deployment (Render)

1. Go to https://dashboard.render.com/
2. Click "New +" > "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub account and select "SuyuFit" repo
5. Configure:
   - **Name**: `suyufit-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. Add Environment Variables:
   ```
   GROQ_API_KEY_1=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
   GROQ_API_KEY_2=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
   GROQ_API_KEY_3=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
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_KEY=<your-supabase-anon-key>
   PORT=3000
   ```

7. Click "Create Web Service"
8. Wait for deployment (3-5 minutes)
9. Copy your backend URL (e.g., `https://suyufit-backend.onrender.com`)

## 3. Frontend Deployment (Vercel)

1. Go to https://vercel.com/new
2. Import Git Repository > Select "SuyuFit"
3. Configure:
   - **Project Name**: `suyufit`
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: (leave empty)

4. **IMPORTANT**: Before deploying, update `frontend/index.html`
   - Find line: `const BACKEND_URL = 'https://suyufit-backend.onrender.com';`
   - Replace with your actual Render backend URL

5. Click "Deploy"
6. Wait for deployment (1-2 minutes)
7. Visit your site at `https://suyufit.vercel.app` (or your custom domain)

## 4. UptimeRobot Setup (Keep Backend Awake)

1. Go to https://uptimerobot.com/
2. Click "Add New Monitor"
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: SuyuFit Backend
   - **URL**: `https://suyufit-backend.onrender.com/health`
   - **Monitoring Interval**: 5 minutes

4. Click "Create Monitor"
5. This will ping your backend every 5 minutes to prevent Render from sleeping

## 5. Mobile App Setup (Expo)

### For Testing with Expo Go:

1. Install Expo Go app on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Update backend URL in mobile app:
   - Open `mobile/src/screens/FoodScreen.js`
   - Line 9: Change `BACKEND_URL` to your Render backend URL

3. Start the dev server:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

4. Scan the QR code with Expo Go

### For Production Build (Android):

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```
   (Use your picker123123 account)

3. Configure the project:
   ```bash
   cd mobile
   eas build:configure
   ```

4. Build APK:
   ```bash
   eas build --platform android --profile preview
   ```

5. Download and install the APK on your phone

## 6. Testing Everything

1. **Backend**: Visit `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"healthy"}`

2. **Frontend**: Open your Vercel URL
   - Click scan icon
   - Take photo of nutrition label
   - Should log the food

3. **Mobile**: Open Expo Go app
   - Test all 4 tabs
   - Test AI scanning
   - Test manual food/workout entry

## Troubleshooting

### Backend not responding:
- Check Render logs: Dashboard > Your Service > Logs
- Verify environment variables are set correctly
- Make sure Supabase credentials are correct

### Frontend can't connect to backend:
- Verify BACKEND_URL in frontend/index.html matches your Render URL
- Check browser console for CORS errors
- Redeploy frontend after changing BACKEND_URL

### Mobile app can't scan:
- Check camera permissions on phone
- Verify BACKEND_URL in FoodScreen.js
- Check that backend is awake (not sleeping)

### Groq API errors:
- Check Groq API key limits: https://console.groq.com/
- Keys rotate automatically, but if all 3 are rate-limited, wait 1 minute

## Repository Structure

```
SuyuFit/
├── backend/           → Deployed to Render
├── frontend/          → Deployed to Vercel
├── mobile/           → Built with Expo EAS
├── supabase-schema.sql
└── README.md
```

## Maintenance

- **Render Free Tier**: Sleeps after 15 min inactivity (UptimeRobot keeps it awake)
- **Vercel Free Tier**: 100GB bandwidth/month (plenty for this use case)
- **Supabase Free Tier**: 500MB storage, 2GB data transfer/month
- **Groq API**: 14,400 requests/day per key (43,200/day total with 3 keys)

All services should remain free unless traffic grows significantly.
