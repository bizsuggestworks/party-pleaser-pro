# Quick SMTP Setup Guide

## Method 1: Supabase Dashboard (Easiest - No CLI needed)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/deymtgmazorjfpinfisx
   - Or navigate: Dashboard → Your Project → Settings → Edge Functions → Secrets

2. **Add these secrets one by one:**
   Click "Add secret" for each of these:

   - **Name:** `SMTP_HOST`  
     **Value:** `smtp.gmail.com` (or your SMTP provider's host)

   - **Name:** `SMTP_PORT`  
     **Value:** `465` (or `587` for STARTTLS)

   - **Name:** `SMTP_USER`  
     **Value:** Your email address (e.g., `your-email@gmail.com`)

   - **Name:** `SMTP_PASS`  
     **Value:** Your SMTP password or App Password (for Gmail, use App Password)

   - **Name:** `SMTP_FROM`  
     **Value:** `Party67 <your-email@gmail.com>` (or your preferred sender name)

   - **Name:** `SITE_URL`  
     **Value:** `http://localhost:8080` (for local dev) or your production URL

3. **Restart the function:**
   - Go to Edge Functions → `send-evites` → Click "Restart" or redeploy

---

## Method 2: Using Supabase CLI

If you have Supabase CLI installed, run these commands (replace values with your actual credentials):

```powershell
# Navigate to project
cd "C:\Users\venne\OneDrive\Desktop\ReturnGifts\party-pleaser-pro"

# Set all secrets at once
supabase functions secrets set `
  SMTP_HOST=smtp.gmail.com `
  SMTP_PORT=465 `
  SMTP_USER=your-email@gmail.com `
  SMTP_PASS=your-app-password `
  SMTP_FROM="Party67 <your-email@gmail.com>" `
  SITE_URL=http://localhost:8080 `
  --project-ref deymtgmazorjfpinfisx
```

---

## Brevo Setup (Recommended)

1. **Sign up/Login to Brevo:**
   - Go to: https://www.brevo.com/
   - Create account or login

2. **Get your SMTP credentials:**
   - Go to: Settings → SMTP & API → SMTP
   - Copy your **SMTP Server**: `smtp-relay.brevo.com`
   - Copy your **SMTP Login** (usually your email)
   - Copy your **SMTP Key** (this is your password, not your account password!)

3. **Verify your sender email:**
   - Go to: Senders → Add a sender
   - Verify the email address you want to send from
   - This email will be used in `SMTP_FROM`

4. **Use these values:**
   - `SMTP_HOST`: `smtp-relay.brevo.com`
   - `SMTP_PORT`: `587` (or `465` for SSL)
   - `SMTP_USER`: Your Brevo SMTP login
   - `SMTP_PASS`: Your Brevo SMTP key
   - `SMTP_FROM`: `Your Name <verified-email@yourdomain.com>`

## Gmail Setup (Alternative)

1. **Enable 2-Factor Authentication** on your Google account
2. **Create an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Supabase E-vites"
   - Copy the 16-character password
3. **Use these values:**
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `465`
   - `SMTP_USER`: Your Gmail address
   - `SMTP_PASS`: The 16-character App Password (not your regular password!)
   - `SMTP_FROM`: `Your Name <your-email@gmail.com>`

---

## Mailtrap (For Testing - Doesn't Send Real Emails)

1. Sign up at https://mailtrap.io (free tier available)
2. Go to Inboxes → SMTP Settings
3. Use these values:
   - `SMTP_HOST`: `smtp.mailtrap.io`
   - `SMTP_PORT`: `2525`
   - `SMTP_USER`: Your Mailtrap username
   - `SMTP_PASS`: Your Mailtrap password
   - `SMTP_FROM`: `Test <test@example.com>`

---

## Verify Setup

After setting secrets, try sending an invite again. The error message should change from "SMTP not configured" to either:
- Success: "Sent X invites"
- Or a specific error (like authentication failed) which will help debug further

---

## Troubleshooting

- **"SMTP not configured"** → Secrets not set or function not restarted
- **"Authentication failed"** → Wrong SMTP_USER or SMTP_PASS
- **"Connection timeout"** → Wrong SMTP_HOST or SMTP_PORT
- **"Function not found"** → Deploy the function: `supabase functions deploy send-evites`

