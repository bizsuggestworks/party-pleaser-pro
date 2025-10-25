# 🎁 Giftify Deployment Script (PowerShell)
# This script helps deploy Giftify to production

Write-Host "🎁 Welcome to Giftify Deployment!" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check for environment variables
Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "📝 Please update .env with your actual API keys" -ForegroundColor Cyan
    } else {
        Write-Host "❌ .env.example not found. Please create .env file manually" -ForegroundColor Red
        exit 1
    }
}

# Build the project
Write-Host "🏗️  Building project for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "🚀 Vercel CLI found. Deploying to Vercel..." -ForegroundColor Green
    vercel --prod
} catch {
    # Check if Netlify CLI is installed
    try {
        $netlifyVersion = netlify --version
        Write-Host "🚀 Netlify CLI found. Deploying to Netlify..." -ForegroundColor Green
        netlify deploy --prod --dir=dist
    } catch {
        Write-Host "📁 Build completed! Files are in the 'dist' folder." -ForegroundColor Cyan
        Write-Host "📤 Upload the 'dist' folder to your hosting provider." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔧 To install deployment tools:" -ForegroundColor Yellow
        Write-Host "   Vercel: npm i -g vercel" -ForegroundColor White
        Write-Host "   Netlify: npm i -g netlify-cli" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "🌐 Don't forget to:" -ForegroundColor Cyan
Write-Host "   1. Configure your domain (giftify.com)" -ForegroundColor White
Write-Host "   2. Set up DNS records" -ForegroundColor White
Write-Host "   3. Test all functionality" -ForegroundColor White
Write-Host "   4. Set up monitoring" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed instructions, see GIFTIFY_HOSTING_GUIDE.md" -ForegroundColor Yellow
