# 🚀 Vercel Deployment Guide for party67.com

## Step 1: Connect Git Repository to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Make sure you're logged in

2. **Import Your Project:**
   - Click **"Add New..."** → **"Project"**
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Find and select your repository: `party-pleaser-pro`
   - Click **"Import"**

3. **Configure Project Settings:**
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Click "Deploy"**

---

## Step 2: Set Environment Variables

After the first deployment, go to **Settings** → **Environment Variables** and add:

### Required Variables:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Optional Variables (if using):
```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

**Important:** 
- Add these for **Production**, **Preview**, and **Development** environments
- After adding variables, **redeploy** the project

---

## Step 3: Configure Custom Domain (party67.com)

1. **In Vercel Dashboard:**
   - Go to your project → **Settings** → **Domains**

2. **Add Domain:**
   - Enter: `party67.com`
   - Click **"Add"**
   - Also add: `www.party67.com` (optional, for www subdomain)

3. **Configure DNS:**
   - Vercel will show you DNS records to add
   - Go to your domain registrar (where you bought party67.com)
   - Add these DNS records:
     - **Type**: `A` or `CNAME`
     - **Name**: `@` (or root)
     - **Value**: Vercel's IP address or CNAME (shown in Vercel dashboard)
   - For `www.party67.com`:
     - **Type**: `CNAME`
     - **Name**: `www`
     - **Value**: `cname.vercel-dns.com` (or what Vercel shows)

4. **Wait for DNS Propagation:**
   - DNS changes can take 24-48 hours (usually faster)
   - Vercel will show "Valid Configuration" when ready

---

## Step 4: Update Supabase SITE_URL

Since your app is now at `party67.com`, update the Supabase secret:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/deymtgmazorjfpinfisx/settings/functions/secrets

2. **Update SITE_URL:**
   - Find `SITE_URL` secret
   - Update value to: `https://party67.com`
   - Save

This ensures evite invite links use the correct domain.

---

## Step 5: Verify Deployment

1. **Check Build Logs:**
   - In Vercel Dashboard → **Deployments**
   - Click on the latest deployment
   - Check that build completed successfully

2. **Test Your Site:**
   - Visit: `https://party67.com`
   - Test all features:
     - Homepage loads
     - Authentication works
     - E-vite creation works
     - Email sending works

3. **Check Function Logs:**
   - Supabase Dashboard → Edge Functions → `send-evites` → Logs
   - Make sure emails are being sent correctly

---

## Step 6: Enable Automatic Deployments

Vercel automatically deploys when you push to your main branch:

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Vercel will automatically:**
   - Detect the push
   - Build the project
   - Deploy to production

---

## Troubleshooting

### Build Fails:
- Check build logs in Vercel
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors

### Environment Variables Not Working:
- Make sure variables start with `VITE_` prefix
- Redeploy after adding variables
- Check variable names match exactly

### Domain Not Working:
- Wait for DNS propagation (up to 48 hours)
- Check DNS records are correct
- Verify domain is added in Vercel

### Supabase Connection Issues:
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
- Check Supabase project is active
- Test Supabase connection in browser console

---

## Quick Checklist:

- [ ] Repository connected to Vercel
- [ ] Project deployed successfully
- [ ] Environment variables set (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
- [ ] Custom domain `party67.com` added
- [ ] DNS records configured at domain registrar
- [ ] Domain verified in Vercel
- [ ] `SITE_URL` updated in Supabase to `https://party67.com`
- [ ] Site tested and working
- [ ] Automatic deployments enabled

---

## Next Steps After Deployment:

1. **Update any hardcoded URLs** in your code to use `party67.com`
2. **Test email sending** with the new domain
3. **Set up SSL/HTTPS** (Vercel does this automatically)
4. **Monitor deployments** in Vercel dashboard
5. **Set up analytics** if needed (Vercel Analytics)

---

## Support:

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

