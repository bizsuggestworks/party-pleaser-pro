# Environment Setup Guide

## 🏦 **Where Payments Go**

**All payments go to YOUR accounts!** Here's how to configure where the money goes:

## 💳 **Stripe Payments → Your Bank Account**

### Step 1: Create Stripe Account
1. Go to [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
2. Sign up for a Stripe account
3. Complete business verification
4. Add your bank account details

### Step 2: Get Your Stripe Keys
1. In Stripe dashboard, go to "Developers" → "API keys"
2. Copy your **Publishable key** (starts with `pk_test_` for testing)
3. Copy your **Secret key** (starts with `sk_test_` for testing)

### Step 3: Configure Environment
Create a `.env` file in your project root:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_STRIPE_KEY_HERE
```

### Step 4: Update Supabase Function
In `supabase/functions/create-payment-intent/index.ts`, add your secret key:

```typescript
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});
```

## 💰 **PayPal Payments → Your PayPal Account**

### Step 1: Create PayPal Business Account
1. Go to [https://developer.paypal.com/](https://developer.paypal.com/)
2. Create a PayPal Business account
3. Complete business verification
4. Link your bank account

### Step 2: Get PayPal Client ID
1. In PayPal Developer Dashboard, create a new app
2. Copy your **Client ID**
3. Note: Use sandbox Client ID for testing

### Step 3: Configure Environment
Add to your `.env` file:

```env
# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
```

## 🏦 **Bank Account Setup**

### For Stripe:
1. **Stripe Dashboard** → Settings → Payouts
2. **Add Bank Account**: Enter your business bank account
3. **Payout Schedule**: Choose daily, weekly, or monthly payouts
4. **Tax Forms**: Complete required tax information

### For PayPal:
1. **PayPal Account** → Wallet → Link a bank account
2. **Verify Account**: Complete verification process
3. **Withdrawal Settings**: Set up automatic transfers

## 🔧 **Complete Environment File**

Create a `.env` file with all your keys:

```env
# ===========================================
# SUPABASE CONFIGURATION (Required)
# ===========================================
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here

# ===========================================
# STRIPE CONFIGURATION (Required for payments)
# ===========================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# ===========================================
# PAYPAL CONFIGURATION (Optional)
# ===========================================
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# ===========================================
# GOOGLE OAUTH (Optional)
# ===========================================
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🚨 **Important Security Notes**

### 1. **Never Expose Secret Keys**
- ✅ **Safe**: Publishable keys in frontend (VITE_*)
- ❌ **Dangerous**: Secret keys in frontend
- 🔒 **Secure**: Secret keys only in server/backend

### 2. **Test vs Live Mode**
- **Development**: Use test keys (`pk_test_`, `sk_test_`)
- **Production**: Use live keys (`pk_live_`, `sk_live_`)
- **Never mix**: Don't use test keys in production

### 3. **Environment Variables**
- **Frontend**: Only `VITE_*` variables are accessible
- **Backend**: All environment variables are accessible
- **Security**: Keep sensitive keys in backend only

## 📊 **Payment Flow**

### How Money Moves:
1. **Customer pays** → Stripe/PayPal processes payment
2. **Payment processor** → Takes small fee (2.9% + 30¢)
3. **Your account** → Receives the remaining money
4. **Your bank** → Money transferred to your business bank account

### Fee Structure:
- **Stripe**: 2.9% + 30¢ per successful transaction
- **PayPal**: 2.9% + fixed fee per transaction
- **International**: Additional fees may apply

## 🎯 **Quick Setup Checklist**

### Stripe Setup:
- [ ] Create Stripe account
- [ ] Complete business verification
- [ ] Add bank account details
- [ ] Get API keys from dashboard
- [ ] Add keys to `.env` file
- [ ] Test payments in sandbox mode

### PayPal Setup:
- [ ] Create PayPal Business account
- [ ] Complete business verification
- [ ] Link bank account
- [ ] Create app in developer dashboard
- [ ] Get Client ID
- [ ] Add Client ID to `.env` file
- [ ] Test payments in sandbox mode

### Production Setup:
- [ ] Switch to live API keys
- [ ] Set up webhook endpoints
- [ ] Configure proper security
- [ ] Test with small amounts first
- [ ] Monitor payment dashboards

## 💡 **Pro Tips**

1. **Start Small**: Test with small amounts first
2. **Monitor Dashboards**: Check Stripe/PayPal dashboards regularly
3. **Keep Records**: Maintain detailed payment records for accounting
4. **Customer Support**: Be ready to handle payment issues
5. **Backup Plans**: Have multiple payment methods

## 🆘 **Troubleshooting**

### Common Issues:
- **"Invalid API key"**: Check that your keys are correct
- **"Payment failed"**: Verify your account is properly set up
- **"Webhook errors"**: Check webhook URL configuration
- **"Payout issues"**: Verify bank account is linked correctly

### Support Resources:
- **Stripe**: [Stripe Support](https://support.stripe.com/)
- **PayPal**: [PayPal Developer Support](https://developer.paypal.com/support/)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)

---

**Remember**: All payments go to YOUR accounts once properly configured. The payment processors just handle the transaction processing and take a small fee.
