# SMS Setup Guide for E-Vite Invites

## Overview
The send-evites function now supports sending SMS invites in addition to emails. When a guest has a phone number, they'll receive both email and SMS.

## Supported Providers

### Option 1: Twilio (Recommended)

1. **Sign up for Twilio:**
   - Go to: https://www.twilio.com/
   - Create a free account (includes trial credits)

2. **Get your credentials:**
   - Go to: Twilio Console → Account → API Keys & Tokens
   - Copy your **Account SID**
   - Copy your **Auth Token**
   - Get a **Phone Number** from: Phone Numbers → Buy a Number

3. **Set Supabase Function Secrets:**
   - Go to: Supabase Dashboard → Project Settings → Functions → Secrets
   - Add these secrets:
     - `TWILIO_ACCOUNT_SID` = your Account SID
     - `TWILIO_AUTH_TOKEN` = your Auth Token
     - `TWILIO_PHONE_NUMBER` = your Twilio phone number (e.g., +1234567890)

4. **Restart the function:**
   - Go to Edge Functions → `send-evites` → Restart

---

### Option 2: Brevo SMS (If using Brevo for emails)

1. **Enable SMS in Brevo:**
   - Go to: https://app.brevo.com/
   - Navigate to: SMS → Settings
   - Enable SMS API

2. **Get API Key:**
   - Same API key used for emails (from Settings → SMTP & API)

3. **Set Supabase Function Secrets:**
   - `BREVO_API_KEY` = your Brevo API key (already set if using Brevo for emails)
   - `SMS_SENDER_NAME` = your sender name (e.g., "Party67")

4. **Restart the function**

---

## How It Works

1. **Host adds guest with phone number:**
   - When creating an event, add guest's phone number (optional)
   - Phone number format: +1234567890 (with country code)

2. **Sending invites:**
   - When host clicks "Submit & Send E-Vite"
   - System sends:
     - Email to guest's email address
     - SMS to guest's phone number (if provided)

3. **SMS Content:**
   - Event title
   - Date and time
   - Location
   - RSVP link
   - Host name

---

## Phone Number Format

**Important:** Phone numbers must include country code:
- ✅ `+1234567890` (US)
- ✅ `+919876543210` (India)
- ✅ `+447911123456` (UK)
- ❌ `1234567890` (missing country code)

---

## Cost Information

### Twilio:
- **Trial:** Free credits for testing
- **After trial:** ~$0.0075 per SMS (US), varies by country
- **Free tier:** $15.50 credit for new accounts

### Brevo SMS:
- Check Brevo pricing: https://www.brevo.com/pricing/

---

## Testing

1. **Add a test guest:**
   - Name: Test User
   - Email: your-email@example.com
   - Phone: +1234567890 (your phone number with country code)

2. **Send invite:**
   - Click "Submit & Send E-Vite"
   - Check your phone for SMS
   - Check your email for email

3. **Verify:**
   - SMS should arrive within seconds
   - Email should arrive within minutes

---

## Troubleshooting

### SMS not sending:
- Check phone number format (must include country code)
- Verify API credentials are set correctly
- Check function logs in Supabase Dashboard
- Ensure you have credits/balance in Twilio/Brevo

### "SMS not configured" error:
- Add Twilio or Brevo credentials to Supabase Function Secrets
- Restart the function after adding secrets

### SMS sent but not received:
- Check phone number is correct
- Verify carrier supports SMS
- Check spam/blocked messages
- Some carriers block automated SMS

---

## Quick Setup Checklist

- [ ] Sign up for Twilio or enable Brevo SMS
- [ ] Get API credentials (Account SID, Auth Token, Phone Number)
- [ ] Add secrets to Supabase: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- [ ] Restart `send-evites` function
- [ ] Test by adding a guest with phone number
- [ ] Send invite and verify SMS is received

---

## Security Notes

- ⚠️ **Never commit API keys to Git**
- ✅ Store credentials in Supabase Function Secrets only
- ✅ Use environment variables
- ✅ Monitor usage in Twilio/Brevo dashboard

---

## Support

- Twilio Docs: https://www.twilio.com/docs/sms
- Brevo SMS Docs: https://developers.brevo.com/docs/send-sms

