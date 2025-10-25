# 🎁 Giftify.com Hosting & Deployment Guide

## 🌟 Overview
This guide will help you deploy Giftify to the giftify.com domain with professional hosting and optimal performance.

## 🚀 Recommended Hosting Options

### 1. **Vercel (Recommended - Best for React Apps)**
- **Cost**: Free tier available, Pro at $20/month
- **Features**: Automatic deployments, CDN, SSL, custom domains
- **Perfect for**: React/Next.js applications

#### Setup Steps:
1. **Sign up at [vercel.com](https://vercel.com)**
2. **Connect your GitHub repository**
3. **Configure domain**:
   - Go to Project Settings → Domains
   - Add `giftify.com` and `www.giftify.com`
   - Update DNS records as instructed

#### Environment Variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### 2. **Netlify (Great Alternative)**
- **Cost**: Free tier available, Pro at $19/month
- **Features**: Form handling, serverless functions, CDN

#### Setup Steps:
1. **Sign up at [netlify.com](https://netlify.com)**
2. **Connect repository**
3. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Add custom domain**: `giftify.com`

### 3. **AWS Amplify (Enterprise Grade)**
- **Cost**: Pay-as-you-use, ~$15-50/month
- **Features**: Full AWS integration, advanced security

## 🌐 Domain Setup (giftify.com)

### Step 1: Purchase Domain
- **Recommended**: Namecheap, GoDaddy, or Google Domains
- **Cost**: ~$10-15/year for .com domain

### Step 2: Configure DNS
Once you choose your hosting provider, update these DNS records:

#### For Vercel:
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### For Netlify:
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: giftify.netlify.app
```

## 🔧 Pre-Deployment Checklist

### 1. **Update Configuration Files**
```bash
# Update vite.config.ts for production
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure this is correct for your domain
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
  }
})
```

### 2. **Environment Variables**
Create `.env.production` file:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
VITE_PAYPAL_CLIENT_ID=your_live_paypal_client_id
```

### 3. **Update API Endpoints**
Ensure all API calls use HTTPS in production:
```typescript
// In your Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

## 🚀 Deployment Steps

### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add custom domain
vercel domains add giftify.com
```

### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist

# Add custom domain
netlify sites:create --name giftify
```

### Option C: Manual Build & Upload
```bash
# Build for production
npm run build

# Upload dist/ folder to your hosting provider
```

## 🔒 SSL Certificate & Security

### Automatic SSL (Recommended)
- **Vercel/Netlify**: SSL certificates are automatically provisioned
- **Custom servers**: Use Let's Encrypt or Cloudflare

### Security Headers
Add to your hosting configuration:
```javascript
// Security headers for production
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://api.paypal.com https://your-project.supabase.co"
}
```

## 📊 Performance Optimization

### 1. **Image Optimization**
```typescript
// Use optimized images
<img 
  src="https://images.unsplash.com/photo-xxx?w=400&h=300&fit=crop&auto=format&q=80"
  alt="Gift image"
  loading="lazy"
  className="w-full h-full object-cover"
/>
```

### 2. **Code Splitting**
```typescript
// Lazy load components
const GiftForm = lazy(() => import('./components/GiftForm'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
```

### 3. **CDN Configuration**
- **Vercel**: Automatic global CDN
- **Netlify**: Automatic global CDN
- **Custom**: Use Cloudflare or AWS CloudFront

## 🎯 SEO Optimization

### 1. **Meta Tags** (Already implemented)
```html
<title>Giftify - Perfect Return Gifts for Every Event | Create Magical Moments</title>
<meta name="description" content="Giftify helps you create perfect return gifts for birthdays, weddings, and special events." />
```

### 2. **Sitemap**
Create `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://giftify.com</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://giftify.com/admin</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>0.5</priority>
  </url>
</urlset>
```

### 3. **Google Analytics**
Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📱 Mobile Optimization

### 1. **Responsive Design** (Already implemented)
- Mobile-first approach
- Touch-friendly buttons
- Optimized images

### 2. **PWA Features** (Optional)
Add `public/manifest.json`:
```json
{
  "name": "Giftify - Perfect Return Gifts",
  "short_name": "Giftify",
  "description": "Create magical moments with perfect return gifts",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8b5cf6",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

## 🎉 Post-Deployment

### 1. **Test Everything**
- [ ] Homepage loads correctly
- [ ] Gift form works
- [ ] Payment processing works
- [ ] Admin dashboard accessible
- [ ] Mobile responsive
- [ ] SSL certificate active

### 2. **Monitor Performance**
- Use Google PageSpeed Insights
- Monitor with Vercel Analytics or Netlify Analytics
- Set up error tracking (Sentry)

### 3. **Marketing Setup**
- Google Search Console
- Google Analytics
- Social media sharing
- Email marketing integration

## 💰 Cost Breakdown

### Monthly Costs:
- **Domain**: $1-2/month (giftify.com)
- **Hosting**: $0-20/month (Vercel free tier or Pro)
- **Supabase**: $0-25/month (free tier or Pro)
- **Stripe**: 2.9% + 30¢ per transaction
- **PayPal**: 2.9% + 30¢ per transaction

### Total: ~$5-50/month depending on usage

## 🆘 Troubleshooting

### Common Issues:
1. **Domain not resolving**: Check DNS propagation (24-48 hours)
2. **SSL errors**: Ensure proper certificate configuration
3. **Build failures**: Check environment variables
4. **Payment issues**: Verify API keys are correct

### Support:
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Netlify: [docs.netlify.com](https://docs.netlify.com)
- Supabase: [supabase.com/docs](https://supabase.com/docs)

---

## 🎯 Quick Start Checklist

- [ ] Choose hosting provider (Vercel recommended)
- [ ] Purchase giftify.com domain
- [ ] Set up environment variables
- [ ] Configure DNS records
- [ ] Deploy application
- [ ] Test all functionality
- [ ] Set up monitoring
- [ ] Launch! 🚀

**Your Giftify.com will be live and ready to create magical moments!** ✨
