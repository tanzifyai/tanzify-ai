# Tanzify AI - Complete Deployment Plan
# Generated: January 16, 2026

## 🚀 DEPLOYMENT TIMELINE (48 Hours)

### **HOUR 1-4: Account Setup & Configuration**
- [ ] Create all required accounts (see Account List below)
- [ ] Configure Firebase project
- [ ] Set up Supabase database
- [ ] Configure Stripe & Razorpay accounts
- [ ] Set up AWS S3 bucket

### **HOUR 5-8: Environment & Database Setup**
- [ ] Update all .env files with real credentials
- [ ] Create Supabase database tables
- [ ] Configure Row Level Security policies
- [ ] Test database connections

### **HOUR 9-12: Backend Deployment**
- [ ] Deploy backend to Railway/Render
- [ ] Configure backend environment variables
- [ ] Test backend API endpoints
- [ ] Set up domain for backend API

### **HOUR 13-16: Frontend Deployment**
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Configure frontend environment variables
- [ ] Set up custom domain
- [ ] Configure SSL certificate

### **HOUR 17-20: Payment Integration Testing**
- [ ] Test Stripe payment flow
- [ ] Test Razorpay payment flow
- [ ] Configure webhooks
- [ ] Test subscription management

### **HOUR 21-24: File Storage & AI Integration**
- [ ] Configure AWS S3 permissions
- [ ] Test file upload functionality
- [ ] Verify OpenAI API integration
- [ ] Test transcription workflow

### **HOUR 25-32: Email & Notification Setup**
- [ ] Configure email service (Gmail/SendGrid)
- [ ] Test email notifications
- [ ] Set up welcome emails
- [ ] Configure payment confirmation emails

### **HOUR 33-40: Security & Monitoring**
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Set up uptime monitoring
- [ ] Configure firewall rules

### **HOUR 41-48: Final Testing & Launch**
- [ ] Run complete testing script
- [ ] Performance optimization
- [ ] SEO configuration
- [ ] Final security audit

---

## 📋 REQUIRED ACCOUNTS & LINKS

### **1. Firebase (Authentication)**
- **Link**: https://console.firebase.google.com/
- **Cost**: Free tier available
- **Setup Time**: 15 minutes
- **Required**: Authentication, Hosting (optional)

### **2. Supabase (Database)**
- **Link**: https://supabase.com/
- **Cost**: Free tier (500MB), Paid plans available
- **Setup Time**: 20 minutes
- **Required**: PostgreSQL database, Real-time subscriptions

### **3. Stripe (International Payments)**
- **Link**: https://stripe.com/
- **Cost**: 2.9% + 30¢ per transaction
- **Setup Time**: 30 minutes
- **Required**: Payment processing, Subscriptions

### **4. Razorpay (Indian Payments)**
- **Link**: https://razorpay.com/
- **Cost**: 2% per transaction (INR)
- **Setup Time**: 30 minutes
- **Required**: Indian payment processing

### **5. AWS (File Storage)**
- **Link**: https://aws.amazon.com/
- **Cost**: ~$0.023/GB/month for S3
- **Setup Time**: 25 minutes
- **Required**: S3 bucket for file storage

### **6. OpenAI (AI Transcription)**
- **Link**: https://platform.openai.com/
- **Cost**: $0.006/minute for Whisper
- **Setup Time**: 10 minutes
- **Required**: Whisper API for transcription

### **7. Railway/Render (Backend Hosting)**
- **Railway**: https://railway.app/ (Recommended)
- **Render**: https://render.com/
- **Cost**: $5-10/month
- **Setup Time**: 15 minutes

### **8. Vercel/Netlify (Frontend Hosting)**
- **Vercel**: https://vercel.com/ (Recommended)
- **Netlify**: https://netlify.com/
- **Cost**: Free tier available
- **Setup Time**: 10 minutes

### **9. Domain Registrar**
- **Namecheap**: https://namecheap.com/
- **GoDaddy**: https://godaddy.com/
- **Cost**: $10-15/year
- **Setup Time**: 10 minutes

### **10. Email Service (Optional)**
- **SendGrid**: https://sendgrid.com/
- **Mailgun**: https://mailgun.com/
- **Cost**: Free tier available
- **Setup Time**: 15 minutes

---

## ⚙️ CONFIGURATION FILES

### **1. Frontend .env.production**
```env
# Production Environment Variables for Frontend

# OpenAI API Key for Whisper transcription
VITE_OPENAI_API_KEY=sk-your-actual-openai-key

# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY=your-production-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Supabase Configuration (Production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe Configuration (Production)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# Razorpay Configuration (Production)
VITE_RAZORPAY_KEY_ID=rzp_live_your-razorpay-key

# Backend API URL (Production)
VITE_API_BASE_URL=https://your-backend-api.com
```

### **2. Backend .env.production**
```env
# Production Environment Variables for Backend

# Server Configuration
PORT=3000
NODE_ENV=production

# OpenAI API Key
OPENAI_API_KEY=sk-your-actual-openai-key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

### **3. Supabase Database Schema**
```sql
-- Tanzify AI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER DEFAULT 30,
  minutes_used INTEGER DEFAULT 0,
  subscription_plan TEXT,
  stripe_customer_id TEXT,
  razorpay_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE transcriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  razorpay_subscription_id TEXT UNIQUE,
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
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can view own transcriptions" ON transcriptions
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE firebase_uid = auth.uid()::text
  ));

-- Create indexes for better performance
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

### **4. Vercel Configuration (vercel.json)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-api.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://your-backend-api.com"
  }
}
```

### **5. Railway Configuration (railway.toml)**
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[build.env]
NODE_ENV = "production"

[deploy.env]
NODE_ENV = "production"
```

---

## 📝 STEP-BY-STEP DEPLOYMENT CHECKLIST

### **PHASE 1: Prerequisites (Hour 1-4)**

#### **Step 1.1: Create All Required Accounts**
```bash
# Open these links and create accounts:
# 1. https://console.firebase.google.com/
# 2. https://supabase.com/
# 3. https://stripe.com/
# 4. https://razorpay.com/
# 5. https://aws.amazon.com/
# 6. https://platform.openai.com/
# 7. https://railway.app/
# 8. https://vercel.com/
# 9. https://namecheap.com/ (for domain)
```

#### **Step 1.2: Configure Firebase**
1. Go to Firebase Console
2. Create new project: "tanzify-ai-prod"
3. Enable Authentication with Email/Password
4. Get API keys from Project Settings

#### **Step 1.3: Configure Supabase**
1. Create new project on Supabase
2. Note down project URL and anon key
3. Go to SQL Editor and run the schema above

#### **Step 1.4: Configure Stripe**
1. Create Stripe account
2. Get publishable key and secret key
3. Create products for your plans:
   - Starter Monthly: ₹599
   - Pro Monthly: ₹1499
   - Team Monthly: ₹3999

#### **Step 1.5: Configure Razorpay**
1. Create Razorpay account
2. Get API Key ID and Secret
3. Set up for INR transactions

#### **Step 1.6: Configure AWS S3**
1. Create AWS account
2. Go to S3 service
3. Create bucket: "tanzify-ai-uploads-prod"
4. Create IAM user with S3 permissions
5. Get access key and secret key

### **PHASE 2: Environment Setup (Hour 5-8)**

#### **Step 2.1: Update Frontend .env**
```bash
# Copy the .env.production content above to your .env file
# Replace all placeholder values with real credentials
```

#### **Step 2.2: Update Backend .env**
```bash
# In backend/ directory, create .env file with production values
# Use the backend .env.production template above
```

#### **Step 2.3: Test Database Connection**
```bash
# Test Supabase connection
cd backend
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
console.log('Supabase connected');
"
```

### **PHASE 3: Backend Deployment (Hour 9-12)**

#### **Step 3.1: Deploy to Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd backend
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=your-supabase-url
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-key
# ... set all other variables

# Deploy
railway up
```

#### **Step 3.2: Get Backend URL**
```bash
# Get the deployed URL
railway domain
# Note: https://your-project.railway.app
```

#### **Step 3.3: Test Backend API**
```bash
# Test health endpoint
curl https://your-backend.railway.app/health
```

### **PHASE 4: Frontend Deployment (Hour 13-16)**

#### **Step 4.1: Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd /path/to/frontend
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all frontend env vars
```

#### **Step 4.2: Configure Custom Domain**
```bash
# Add domain to Vercel
vercel domains add yourdomain.com

# Configure DNS (in Namecheap/GoDaddy)
# Add CNAME record: www.yourdomain.com -> cname.vercel-dns.com
# Add A record: yourdomain.com -> 76.76.21.21
```

### **PHASE 5: Payment Integration (Hour 17-20)**

#### **Step 5.1: Configure Stripe Webhooks**
```bash
# In Stripe Dashboard
# 1. Go to Webhooks
# 2. Add endpoint: https://your-backend.railway.app/api/webhooks/stripe
# 3. Select events: checkout.session.completed, invoice.payment_succeeded
# 4. Copy webhook secret to backend .env
```

#### **Step 5.2: Configure Razorpay Webhooks**
```bash
# In Razorpay Dashboard
# 1. Go to Settings > Webhooks
# 2. Add webhook URL: https://your-backend.railway.app/api/webhooks/razorpay
# 3. Select events: payment.captured, subscription.completed
```

#### **Step 5.3: Test Payment Flow**
```bash
# Use test cards:
# Stripe: 4242 4242 4242 4242
# Razorpay: Use test mode credentials
```

### **PHASE 6: File Storage & AI (Hour 21-24)**

#### **Step 6.1: Configure S3 CORS**
```json
// In AWS S3 Bucket > Permissions > CORS
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

#### **Step 6.2: Test OpenAI Integration**
```bash
# Test API key
curl -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  https://api.openai.com/v1/models
```

### **PHASE 7: Email Setup (Hour 25-32)**

#### **Step 7.1: Configure Gmail App Password**
```bash
# 1. Go to Google Account Settings
# 2. Security > 2-Step Verification > App passwords
# 3. Generate password for "Mail"
# 4. Use this password in EMAIL_PASS
```

#### **Step 7.2: Test Email Sending**
```bash
# Test from backend
curl -X POST https://your-backend.railway.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### **PHASE 8: Security & Monitoring (Hour 33-40)**

#### **Step 8.1: Set up Error Monitoring**
```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Configure in both frontend and backend
```

#### **Step 8.2: Set up Analytics**
```bash
# Add Google Analytics to index.html
# Or use Vercel Analytics (built-in)
```

### **PHASE 9: Final Testing & Launch (Hour 41-48)**

#### **Step 9.1: Run Testing Script**
```bash
# See testing script below
```

#### **Step 9.2: Performance Optimization**
```bash
# Enable Vercel compression
# Optimize images
# Set up CDN
```

#### **Step 9.3: SEO Configuration**
```bash
# Update meta tags in index.html
# Submit sitemap to Google Search Console
```

---

## 🧪 TESTING SCRIPT (test-deployment.js)

```javascript
// test-deployment.js - Comprehensive Testing Script
// Run with: node test-deployment.js

const https = require('https');
const http = require('http');

const FRONTEND_URL = 'https://yourdomain.com';
const BACKEND_URL = 'https://your-backend.railway.app';

console.log('🚀 Starting Tanzify AI Deployment Tests...\n');

// Test 1: Frontend Loading
function testFrontend() {
  return new Promise((resolve) => {
    https.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('Tanzify AI')) {
          console.log('✅ Frontend: PASS - App loads successfully');
          resolve(true);
        } else {
          console.log('❌ Frontend: FAIL - App not loading');
          resolve(false);
        }
      });
    }).on('error', () => {
      console.log('❌ Frontend: FAIL - Cannot connect');
      resolve(false);
    });
  });
}

// Test 2: Backend Health
function testBackend() {
  return new Promise((resolve) => {
    https.get(`${BACKEND_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Backend: PASS - Health check OK');
        resolve(true);
      } else {
        console.log('❌ Backend: FAIL - Health check failed');
        resolve(false);
      }
    }).on('error', () => {
      console.log('❌ Backend: FAIL - Cannot connect');
      resolve(false);
    });
  });
}

// Test 3: API Endpoints
async function testAPI() {
  const endpoints = [
    '/api/health',
    '/api/test-db',
    '/api/test-email'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`);
      if (response.ok) {
        console.log(`✅ API ${endpoint}: PASS`);
      } else {
        console.log(`❌ API ${endpoint}: FAIL - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API ${endpoint}: FAIL - ${error.message}`);
    }
  }
}

// Test 4: Database Connection
function testDatabase() {
  return new Promise((resolve) => {
    https.get(`${BACKEND_URL}/api/test-db`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Database: PASS - Connection OK');
        resolve(true);
      } else {
        console.log('❌ Database: FAIL - Connection failed');
        resolve(false);
      }
    }).on('error', () => {
      console.log('❌ Database: FAIL - Cannot connect');
      resolve(false);
    });
  });
}

// Test 5: Payment Integration (Basic)
function testPayments() {
  console.log('⚠️  Payment Testing: Manual testing required');
  console.log('   - Test Stripe: Use card 4242 4242 4242 4242');
  console.log('   - Test Razorpay: Use test credentials');
  console.log('   - Verify webhooks are firing');
}

// Test 6: File Upload (Basic)
function testFileUpload() {
  console.log('⚠️  File Upload: Manual testing required');
  console.log('   - Try uploading a small audio file');
  console.log('   - Check if file appears in S3 bucket');
  console.log('   - Verify transcription starts');
}

// Test 7: Email Service
function testEmail() {
  console.log('⚠️  Email Testing: Manual testing required');
  console.log('   - Test registration email');
  console.log('   - Test payment confirmation email');
  console.log('   - Check spam folder');
}

// Run all tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 TANZIFY AI DEPLOYMENT TEST SUITE');
  console.log('='.repeat(50));

  await testFrontend();
  await testBackend();
  await testDatabase();
  await testAPI();

  console.log('\n📋 MANUAL TESTS REQUIRED:');
  testPayments();
  testFileUpload();
  testEmail();

  console.log('\n' + '='.repeat(50));
  console.log('✅ AUTOMATED TESTS COMPLETE');
  console.log('📝 Review manual test results above');
  console.log('🎯 If all tests pass, your app is ready for launch!');
  console.log('='.repeat(50));
}

runTests().catch(console.error);
```

---

## 🎯 FIRST STEP RIGHT NOW

**START HERE - RIGHT NOW:**

1. **Open your browser and create accounts in this order:**
   - https://supabase.com/ (Database - 5 minutes)
   - https://console.firebase.google.com/ (Auth - 5 minutes)
   - https://vercel.com/ (Frontend hosting - 3 minutes)
   - https://railway.app/ (Backend hosting - 3 minutes)

2. **Run this command to check your current setup:**
```bash
cd "c:\Users\Fatima Communication\Desktop\saas-pro\tanzify-ai-instant-audio-transcription-main"
ls -la
cat .env
```

3. **Tell me when you've created the accounts above, and I'll guide you through the next steps!**

**⏰ TIME ESTIMATE:** 15 minutes for account creation, then we can proceed with configuration.

**💡 PRO TIP:** Keep all account credentials in a secure password manager as you create them.