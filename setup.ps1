# Tanzify AI - Quick Setup Script (PowerShell)
# Run this after creating all accounts

Write-Host "🚀 Tanzify AI Setup Script" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Blue

# Check Node.js version
Write-Host "📋 Checking Node.js version..." -ForegroundColor Yellow
node --version

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "❌ .env file missing - copy from DEPLOYMENT-PLAN.md" -ForegroundColor Red
}

# Check if backend exists
if (Test-Path "backend") {
    Write-Host "✅ Backend directory exists" -ForegroundColor Green
    if (Test-Path "backend\.env") {
        Write-Host "✅ Backend .env exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend .env missing - copy from backend\.env.production" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Backend directory missing" -ForegroundColor Red
}

# Install dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update all .env files with real credentials"
Write-Host "2. Test locally: npm run dev"
Write-Host "3. Deploy backend: cd backend; railway up"
Write-Host "4. Deploy frontend: vercel --prod"
Write-Host ""
Write-Host "📖 See DEPLOYMENT-PLAN.md for detailed instructions" -ForegroundColor Magenta