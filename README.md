# Tanzify AI - Instant Audio Transcription SaaS

A production-ready AI-powered audio transcription service built with React, TypeScript, and modern cloud services.

## 🚀 Features

- **AI-Powered Transcription**: OpenAI Whisper API integration
- **User Authentication**: Firebase Authentication
- **Database**: Supabase (PostgreSQL)
- **File Storage**: AWS S3
- **Payments**: Stripe integration
- **Email Notifications**: Automated emails
- **Real-time Dashboard**: Transcription history and analytics

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Supabase
- **File Storage**: AWS S3
- **Payments**: Stripe
- **AI**: OpenAI Whisper API
- **Email**: Nodemailer

## 📋 Prerequisites

Before running this application, you'll need:

1. **OpenAI API Key** - For Whisper transcription
2. **Firebase Project** - For authentication
3. **Supabase Project** - For database
4. **AWS Account** - For S3 file storage
5. **Stripe Account** - For payments
6. **Email Service** - Gmail or other SMTP provider

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd tanzify-ai-instant-audio-transcription-main
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI API Key for Whisper transcription
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password provider
3. Get your Firebase config from Project Settings
4. Update the `.env` file with your Firebase credentials

### 4. Supabase Setup

1. Create a Supabase project at https://supabase.com/
2. Go to Settings > API to get your URL and anon key
3. Create the following tables in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER DEFAULT 30,
  subscription_plan TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  duration DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid()::text = firebase_uid);
CREATE POLICY "Users can view own transcriptions" ON transcriptions FOR ALL USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR ALL USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
```

### 5. AWS S3 Setup

1. Create an AWS account and go to S3 service
2. Create a new bucket for file storage
3. Create an IAM user with S3 permissions
4. Get your access keys and update `.env`
5. Configure CORS on your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:8080", "https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

### 6. Razorpay Setup

1. **Create a Razorpay account** at https://razorpay.com/
2. **Get your API Key ID** from Dashboard > Settings > API Keys
3. **Update `.env`** with your test key:
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
   ```
4. **Test the integration** with Razorpay test cards/UPI

### 7. Email Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use your Gmail address and App Password in `.env`

## 🚀 Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

## 📧 API Endpoints (Backend Required)

For full production deployment, you'll need a backend server with these endpoints:

- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/create-portal-session` - Create Stripe customer portal session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## 🔒 Security Notes

- Never expose secret keys in client-side code
- Use environment variables for all sensitive data
- Implement proper CORS policies
- Use HTTPS in production
- Regularly rotate API keys

## 📈 Deployment

This is a frontend-only application. For production:

1. Build the app: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred hosting
3. Set up environment variables in your hosting platform
4. Configure your domain and SSL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
