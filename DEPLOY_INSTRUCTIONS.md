# Deploy send-evites Function to Supabase

## Method 1: Via Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/deymtgmazorjfpinfisx/functions

2. **Deploy the function:**
   - Click on **"send-evites"** function (or create it if it doesn't exist)
   - Click **"Deploy"** or **"Edit"** button
   - Copy and paste the contents of `supabase/functions/send-evites/index.ts`
   - Click **"Deploy"** or **"Save"**

3. **Verify deployment:**
   - Check that the function shows as "Active" or "Deployed"
   - Check the logs to ensure no errors

---

## Method 2: Via Supabase CLI (If you have it installed)

### Step 1: Login to Supabase
```powershell
npx supabase login
```
This will open a browser window for you to authenticate.

### Step 2: Deploy the function
```powershell
cd "C:\Users\venne\OneDrive\Desktop\ReturnGifts\party-pleaser-pro"
npx supabase functions deploy send-evites --project-ref deymtgmazorjfpinfisx
```

---

## After Deployment

1. **Verify secrets are set:**
   - Go to: Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Ensure these are set:
     - `SMTP_HOST`
     - `SMTP_PORT`
     - `SMTP_USER`
     - `SMTP_PASS`
     - `SMTP_FROM`
     - `BREVO_API_KEY` (if using Brevo API)
     - `SITE_URL`

2. **Test the function:**
   - Go to your app and try sending an invite
   - Check function logs in Supabase Dashboard
   - Check Brevo dashboard for email delivery status

---

## Quick Deploy Command (If CLI is set up)

```powershell
npx supabase login
npx supabase functions deploy send-evites --project-ref deymtgmazorjfpinfisx
```

