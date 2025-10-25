# Party Pleaser Pro - Setup Guide

## 🎉 Welcome to Party Pleaser Pro!

Your comprehensive return gift recommendation platform is ready to go! This guide will help you set up the application for development and production.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (for authentication and database)
- Stripe account (for payments)
- PayPal account (optional, for additional payment methods)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here

# Stripe Configuration (Required for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# PayPal Configuration (Optional)
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Google OAuth Configuration (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Instagram OAuth Configuration (Optional)
VITE_INSTAGRAM_CLIENT_ID=your_instagram_client_id_here
```

### 3. Supabase Setup

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key to the `.env` file

2. **Enable Authentication:**
   - In your Supabase dashboard, go to Authentication > Settings
   - Enable email authentication
   - Optionally configure Google OAuth (requires Google Cloud Console setup)

3. **Database Tables:**
   The application uses localStorage for order management, but you can extend it to use Supabase tables:
   ```sql
   -- Create orders table (optional)
   CREATE TABLE orders (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     customer_name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     total_amount DECIMAL(10,2) NOT NULL,
     quantity INTEGER NOT NULL,
     status TEXT DEFAULT 'pending',
     personalization JSONB,
     gift_selections JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### 4. Stripe Setup

1. **Create a Stripe Account:**
   - Go to [stripe.com](https://stripe.com)
   - Create an account and get your publishable key
   - Add it to your `.env` file

2. **Configure Webhooks (Production):**
   - Set up webhook endpoints for payment confirmation
   - Update the payment intent creation in `supabase/functions/create-payment-intent/index.ts`

### 5. PayPal Setup (Optional)

1. **Create PayPal Developer Account:**
   - Go to [developer.paypal.com](https://developer.paypal.com)
   - Create an app and get your client ID
   - Add it to your `.env` file

### 6. Run the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

## 🏗️ Project Structure

```
party-pleaser-pro/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── GiftForm.tsx    # Gift recommendation form
│   │   ├── GiftResults.tsx # Results display
│   │   ├── PaymentForm.tsx # Payment processing
│   │   ├── LoginScreen.tsx # Authentication
│   │   └── ChatBot.tsx     # Customer support
│   ├── pages/              # Page components
│   │   ├── Index.tsx       # Landing page
│   │   ├── PaymentSuccess.tsx
│   │   └── AdminDashboard.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── config/             # Configuration files
│   │   ├── stripe.ts       # Stripe configuration
│   │   └── paypal.ts       # PayPal configuration
│   └── integrations/      # External service integrations
│       └── supabase/      # Supabase client and types
├── supabase/
│   └── functions/         # Supabase Edge Functions
│       ├── create-payment-intent/
│       └── generate-gift-recommendations/
└── public/                # Static assets
```

## 🔧 Key Features

### 1. **Gift Recommendation Engine**
- AI-powered gift suggestions based on event type, theme, and budget
- Multiple gift bag options with detailed item lists
- Real-time pricing and availability

### 2. **Payment Processing**
- Stripe integration for credit card payments
- PayPal integration for alternative payments
- Google Pay support (mock implementation)
- Secure payment intent creation

### 3. **Authentication System**
- Email/password authentication via Supabase
- Google OAuth integration
- Instagram OAuth (placeholder for future)
- Admin role management

### 4. **Order Management**
- Comprehensive order tracking
- Personalization options (custom names, messages)
- Admin dashboard for order management
- Status updates and notifications

### 5. **Customer Support**
- Integrated chat bot for customer inquiries
- Real-time order status updates
- Email notifications

## 🎨 Customization

### Themes and Styling
- Tailwind CSS for styling
- Shadcn/ui components for consistent design
- Custom color scheme in `tailwind.config.ts`
- Responsive design for mobile and desktop

### Gift Categories
Update gift recommendations in `supabase/functions/generate-gift-recommendations/index.ts`:
- Add new product categories
- Update pricing and availability
- Modify recommendation algorithms

### Payment Methods
Add new payment providers in `src/components/PaymentForm.tsx`:
- Apple Pay
- Venmo
- Cryptocurrency payments

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify Deployment
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Supabase Edge Functions
Deploy your Edge Functions:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use test keys for development, production keys for live site
3. **CORS**: Configure proper CORS settings for your domain
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: Validate all user inputs

## 📊 Analytics and Monitoring

### Recommended Integrations
- Google Analytics for user behavior tracking
- Sentry for error monitoring
- Stripe Dashboard for payment analytics
- Supabase Dashboard for database monitoring

## 🆘 Troubleshooting

### Common Issues

1. **Build Errors**: Check that all dependencies are installed
2. **Authentication Issues**: Verify Supabase configuration
3. **Payment Failures**: Check Stripe/PayPal configuration
4. **CORS Errors**: Update CORS settings in Supabase

### Support
- Check the console for error messages
- Verify environment variables are set correctly
- Test payment flows in development mode first

## 🎯 Next Steps

1. **Set up your environment variables**
2. **Configure Supabase authentication**
3. **Test the payment flow**
4. **Customize gift recommendations**
5. **Deploy to production**

## 📞 Support

For technical support or questions:
- Check the console for error messages
- Review the Supabase and Stripe documentation
- Test in development mode before deploying

---

**Happy coding! 🎉**

Your Party Pleaser Pro application is ready to help customers find the perfect return gifts for any event!
