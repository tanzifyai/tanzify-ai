# Tanzify AI - Audio Transcription SaaS

A clean, working audio transcription service that converts audio/video to text using AI.

## ✅ **Current Working Stack**
- **Frontend**: React + TypeScript + Vite
- **Authentication**: Firebase Auth *(Supabase migration planned)*
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Payments**: Razorpay (for Indian users)
- **AI Transcription**: OpenAI Whisper API
- **Styling**: Tailwind CSS + shadcn/ui

## 🚀 **5-Minute Setup**

### 1. Clone & Install
```bash
git clone https://github.com/tanzifyai/tanzify-ai.git
cd tanzify-ai
npm install
```

### 2. Environment Variables
Create `.env` file in root:
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI
VITE_OPENAI_API_KEY=sk-your-openai-api-key

# Razorpay (Test Mode)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_here

# Firebase (Current Auth - will migrate to Supabase)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### 3. Database Setup (Supabase)
Run this SQL in Supabase SQL Editor:
```sql
-- Transcripts table
CREATE TABLE transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  transcript TEXT,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transcripts
CREATE POLICY "User can view own transcripts" 
ON transcriptions FOR ALL 
USING (auth.uid() = user_id);
```

### 4. Storage Setup (Supabase)
1. Go to **Storage** in Supabase Dashboard
2. Create bucket named `uploads`
3. Set permissions to public (for now, can restrict later)

### 5. Run Locally
```bash
npm run dev
```
Open: `http://localhost:5173/tanzify-ai/`

## 📱 **Core User Flow**
1. **Signup** → Create account with Firebase
2. **Login** → Access dashboard
3. **Upload** → Audio/Video file to Supabase Storage
4. **Transcribe** → AI processes file via OpenAI Whisper
5. **View** → See transcript in dashboard history

## 🔧 **Development**
```bash
# Dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 **Deployment**
See `DEPLOYMENT-GUIDE.md` for Netlify/GitHub Pages deployment.

## 📂 **Project Structure**
```
src/
├── components/     # Reusable UI components
├── lib/           # Supabase client, utilities
├── pages/         # Login, Dashboard, Upload
├── App.tsx        # Main app routing
└── AuthContext.tsx # Firebase authentication
```

## ⚠️ **Important Notes**
- **Current Auth**: Firebase (working, but will migrate to Supabase)
- **Storage**: Supabase Storage (not AWS S3)
- **Payments**: Razorpay (not Stripe)
- **Backend**: Simple serverless functions for transcription

## 🐛 **Troubleshooting**
| Problem | Solution |
|---------|----------|
| White screen | Check browser console, run `npm run build` |
| Upload fails | Verify Supabase Storage bucket exists |
| Login not working | Check Firebase credentials in `.env` |
| Database errors | Run the SQL above in Supabase |

## 📄 **Migration Plans**
- **Firebase → Supabase Auth**: See `AUTH_MIGRATION_PLAN.md`
- **Phase 2 Features**: Email notifications, advanced analytics

## 📞 **Support**
For issues: Check browser console errors and share with support.