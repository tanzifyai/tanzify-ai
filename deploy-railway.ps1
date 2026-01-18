# Tanzify AI - Railway Deployment Script
# Run this from the backend directory

Write-Host "🚂 Tanzify AI - Railway Backend Deployment" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if Railway CLI is installed
try {
    $railwayVersion = railway --version 2>$null
    Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Login to Railway (user needs to do this manually)
Write-Host "`n🔐 Please login to Railway:" -ForegroundColor Yellow
Write-Host "railway login" -ForegroundColor Cyan
Write-Host "(Follow the browser login process)" -ForegroundColor Gray

# Create project
Write-Host "`n🏗️  Creating Railway project..." -ForegroundColor Yellow
railway init tanzify-ai-backend

# Set environment variables
Write-Host "`n🔧 Setting environment variables..." -ForegroundColor Yellow

# Supabase
railway variables set SUPABASE_URL="https://gifcauimoiiiimsdjlz.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="sb_secret_KOosf50IV4ArCfhVgEDNRA_I93lLoYw"

# Server config
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://thetanzify.com"

# Razorpay (user needs to add real keys)
railway variables set RAZORPAY_KEY_ID="rzp_live_your_razorpay_key"
railway variables set RAZORPAY_KEY_SECRET="your_razorpay_secret"

# Stripe (optional - user can add later)
railway variables set STRIPE_SECRET_KEY="sk_live_your_stripe_key"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email (user needs to configure)
railway variables set EMAIL_HOST="smtp.gmail.com"
railway variables set EMAIL_PORT="587"
railway variables set EMAIL_USER="your-email@gmail.com"
railway variables set EMAIL_PASS="your-app-password"

# AWS S3 (user needs to configure)
railway variables set AWS_ACCESS_KEY_ID="your-aws-key"
railway variables set AWS_SECRET_ACCESS_KEY="your-aws-secret"
railway variables set AWS_REGION="us-east-1"
railway variables set AWS_S3_BUCKET="tanzify-ai-uploads"

# Deploy
Write-Host "`n🚀 Deploying to Railway..." -ForegroundColor Yellow
railway up

# Get deployment URL
Write-Host "`n🌐 Getting deployment URL..." -ForegroundColor Yellow
railway domain

Write-Host "`n✅ Backend deployment complete!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update frontend .env with backend URL" -ForegroundColor White
Write-Host "2. Test API endpoints" -ForegroundColor White
Write-Host "3. Set up domain (thetanzify.com)" -ForegroundColor White