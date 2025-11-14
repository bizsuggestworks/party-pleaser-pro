# Email Delivery Troubleshooting Guide

If the function reports "Email sent" but you don't see it in your inbox, follow these steps:

## 1. Check Spam/Junk Folder
- **Most common issue**: Emails often land in spam/junk folders
- Check your spam folder thoroughly
- If found, mark as "Not Spam" to improve future delivery

## 2. Check Brevo Dashboard (If using Brevo API)
1. Go to: https://app.brevo.com/
2. Navigate to: **Statistics** → **Email Activity**
3. Look for your sent email and check its status:
   - ✅ **Delivered**: Email reached the recipient's server
   - ⏳ **Queued**: Email is waiting to be sent
   - ❌ **Bounced**: Email was rejected (check reason)
   - ⚠️ **Blocked**: Email was blocked (sender not verified)

## 3. Verify Sender Email in Brevo
- Go to: **Senders** → **Add a sender**
- Make sure the email in `SMTP_FROM` is **verified** in Brevo
- Unverified senders will cause emails to be blocked

## 4. Check Function Logs in Supabase
1. Go to: Supabase Dashboard → **Edge Functions** → `send-evites`
2. Click on **Logs** tab
3. Look for:
   - `Sending email via Brevo API to: [email]`
   - `Email sent successfully via Brevo. Message ID: [id]`
   - Any error messages

## 5. Common Issues & Solutions

### Issue: Email shows as "sent" but not delivered
**Possible causes:**
- Email is in spam folder
- Sender email not verified in Brevo
- Recipient email address is invalid
- Email provider is blocking the email

**Solutions:**
- Check spam folder
- Verify sender email in Brevo dashboard
- Check Brevo email activity for delivery status
- Try sending to a different email address

### Issue: Brevo API returns success but email not received
**Check:**
- Brevo dashboard → Email Activity → Look for the message ID
- If status is "Delivered" but not in inbox → Check spam
- If status is "Bounced" → Check bounce reason in Brevo

### Issue: SMTP connection works but email not received
**Check:**
- SMTP logs in function logs
- Verify `SMTP_FROM` email is correct
- Check if recipient email is valid
- Some SMTP providers have delays (wait 5-10 minutes)

## 6. Test Email Delivery

### Quick Test:
1. Send an email to yourself first
2. Check both inbox and spam
3. If you receive it, the setup is working
4. If not, check Brevo dashboard for delivery status

### Check Email Address:
- Make sure the recipient email is correct (no typos)
- Try a different email provider (Gmail, Outlook, etc.)
- Some corporate emails block external emails

## 7. Brevo Account Limits
- Free tier: 300 emails/day
- Check if you've hit the limit: Brevo Dashboard → Statistics
- Upgrade plan if needed

## 8. Email Format Issues
- Make sure `SMTP_FROM` format is: `Name <email@domain.com>`
- Or just: `email@domain.com`
- The email must be verified in Brevo

## 9. Check Function Response
The function now returns more details:
- `sent`: Number of emails successfully queued
- `failed`: Array of failed emails with error messages
- `details`: Additional info about successful sends

Check the browser console (F12) for detailed logs.

## 10. Still Not Working?
1. **Check Supabase Function Logs** for detailed error messages
2. **Check Brevo Dashboard** → Email Activity for delivery status
3. **Verify all secrets are set correctly** in Supabase
4. **Try sending to a different email** to rule out recipient issues
5. **Wait 5-10 minutes** - some providers have delivery delays

---

## Quick Checklist:
- [ ] Checked spam/junk folder
- [ ] Verified sender email in Brevo
- [ ] Checked Brevo Email Activity dashboard
- [ ] Checked Supabase function logs
- [ ] Verified recipient email is correct
- [ ] Tried sending to a different email
- [ ] Waited 5-10 minutes for delivery
- [ ] Checked Brevo account limits

