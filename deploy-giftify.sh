#!/bin/bash

# 🎁 Giftify Deployment Script
# This script helps deploy Giftify to production

echo "🎁 Welcome to Giftify Deployment!"
echo "================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for environment variables
echo "🔍 Checking environment variables..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please update .env with your actual API keys"
    else
        echo "❌ .env.example not found. Please create .env file manually"
        exit 1
    fi
fi

# Build the project
echo "🏗️  Building project for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "🚀 Vercel CLI found. Deploying to Vercel..."
    vercel --prod
elif command -v netlify &> /dev/null; then
    echo "🚀 Netlify CLI found. Deploying to Netlify..."
    netlify deploy --prod --dir=dist
else
    echo "📁 Build completed! Files are in the 'dist' folder."
    echo "📤 Upload the 'dist' folder to your hosting provider."
    echo ""
    echo "🔧 To install deployment tools:"
    echo "   Vercel: npm i -g vercel"
    echo "   Netlify: npm i -g netlify-cli"
fi

echo ""
echo "🎉 Deployment process completed!"
echo "🌐 Don't forget to:"
echo "   1. Configure your domain (giftify.com)"
echo "   2. Set up DNS records"
echo "   3. Test all functionality"
echo "   4. Set up monitoring"
echo ""
echo "📚 For detailed instructions, see GIFTIFY_HOSTING_GUIDE.md"
