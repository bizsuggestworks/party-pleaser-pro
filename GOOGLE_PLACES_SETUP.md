# Google Places Autocomplete Setup

## Overview
The location field in the event creation form now uses Google Places Autocomplete to provide address suggestions as users type.

## Setup Instructions

### Step 1: Get Google Maps API Key

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project:**
   - Create a new project or select an existing one

3. **Enable APIs:**
   - Go to **APIs & Services** → **Library**
   - Search for "Places API"
   - Click **Enable**
   - Also enable "Maps JavaScript API" (if not already enabled)

4. **Create API Key:**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy your API key

5. **Restrict API Key (Recommended for Production):**
   - Click on your API key to edit it
   - Under **API restrictions**, select:
     - ✅ Places API
     - ✅ Maps JavaScript API
   - Under **Application restrictions**, you can restrict by:
     - HTTP referrers (for web apps)
     - IP addresses (for server-side)

### Step 2: Add API Key to Environment Variables

#### For Local Development:
Create or update `.env.local` file:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

#### For Vercel Deployment:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** Your Google Maps API key
   - **Environments:** Production, Preview, Development
3. **Redeploy** your project

### Step 3: Test

1. Go to `/evite` page
2. Click "Create" tab
3. Start typing in the Location field (e.g., "10731")
4. You should see address suggestions appear
5. Select an address from the dropdown

## Features

- ✅ **Address Autocomplete:** Suggestions appear as you type
- ✅ **Formatted Addresses:** Selected addresses are properly formatted
- ✅ **Multiple Countries:** Supports US, India, Canada, UK, Australia (can be extended)
- ✅ **Fallback:** Works without API key (manual entry still possible)

## Cost Information

Google Places API has a free tier:
- **Free:** $200 credit per month (covers ~40,000 autocomplete requests)
- **After free tier:** $2.83 per 1,000 requests

For most small to medium events, the free tier should be sufficient.

## Troubleshooting

### Autocomplete not working:
1. Check browser console for errors
2. Verify API key is set in environment variables
3. Ensure Places API is enabled in Google Cloud Console
4. Check API key restrictions aren't blocking your domain

### "API key not found" message:
- Add `VITE_GOOGLE_MAPS_API_KEY` to your `.env.local` file
- Restart your dev server after adding the key
- For Vercel, add it in Environment Variables and redeploy

### Addresses not showing:
- Check that Places API is enabled in Google Cloud Console
- Verify your API key has Places API access
- Check browser console for API errors

## Security Notes

- ⚠️ **Never commit API keys to Git**
- ✅ Use environment variables
- ✅ Restrict API keys in Google Cloud Console
- ✅ Monitor usage in Google Cloud Console

## Support

- Google Maps Platform Docs: https://developers.google.com/maps/documentation
- Places API Docs: https://developers.google.com/maps/documentation/places/web-service

