# Party Pleaser Pro - Deployment Guide

## 🚀 Deploy the Edge Function to Supabase

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/sacsgmcnfthtogxxetrb
2. Login with your Supabase account

### Step 2: Create/Update Edge Function
1. In the left sidebar, click **"Edge Functions"**
2. Click **"Create a new function"** (or update existing one)
3. **Function name**: `generate-gift-recommendations`
4. **Copy the entire code** from: `supabase/functions/generate-gift-recommendations/index.ts`
5. **Paste it** into the function editor
6. Click **"Deploy"**

### Step 3: Test the Function
Once deployed, your app will work with:
- ✅ Mock theme generation
- ✅ Mock gift recommendations  
- ✅ Realistic pricing and images
- ✅ No external dependencies

### Step 4: Access Your App
- **Local URL**: http://localhost:8080/ (or 8081 if 8080 is busy)
- **Network URL**: http://192.168.4.85:8080/

## 🎯 What the App Does Now

### Theme Generation
- Returns age-appropriate themes like:
  - "LEGO & Building Blocks"
  - "Art & Crafts" 
  - "Sports & Outdoor"
  - "Educational Toys"
  - "Board Games"

### Gift Recommendations
- Creates 3 different bag options:
  - **Colorful Party Bags** - Basic option
  - **Premium Gift Bags** - High-quality option  
  - **Eco-Friendly Bags** - Sustainable option
- Each bag includes multiple items with realistic pricing
- Amazon search links for easy purchasing
- Placeholder images from Unsplash

### Features
- ✅ No Lovable dependency
- ✅ Works offline
- ✅ Realistic mock data
- ✅ Proper budget calculations
- ✅ CORS headers for web requests

## 🔧 Troubleshooting

If you get CORS errors:
1. Make sure the Edge Function is deployed
2. Check that the function name is exactly `generate-gift-recommendations`
3. Verify your Supabase URL and API key in `.env`

If the app doesn't load:
1. Check the browser console for errors
2. Verify the development server is running on the correct port
3. Make sure all dependencies are installed with `npm install`
