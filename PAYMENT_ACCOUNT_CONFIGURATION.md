# Payment Account Configuration Guide

## 🏦 Where Do Payments Go?

The money from customer payments goes to **YOUR** account, not to any third party. Here's how to configure each payment method:

## 💳 **Stripe Payments**

### How It Works:
- Money goes to **YOUR Stripe account**
- You need to create a Stripe account and get your API keys
- Stripe handles the payment processing and deposits money to your bank account

### Configuration Steps:

#### 1. **Create Stripe Account**
1. Go to [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
2. Sign up for a Stripe account
3. Complete account verification (business details, bank account, etc.)
4. Get your API keys from the dashboard

#### 2. **Get Your Stripe Keys**
- **Test Mode**: Use `pk_test_...` keys for development
- **Live Mode**: Use `pk_live_...` keys for production

#### 3. **Update Configuration**
```typescript
// In src/config/stripe.ts
export const STRIPE_CONFIG = {
  publishableKey: "pk_test_YOUR_ACTUAL_STRIPE_KEY_HERE", // Replace with your key
  // ... rest of config
};
```

#### 4. **Set Environment Variables**
```env
# In your .env file
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_STRIPE_KEY_HERE
```

#### 5. **Update Payment Intent Function**
```typescript
// In supabase/functions/create-payment-intent/index.ts
// Replace the mock implementation with real Stripe integration:

import Stripe from "npm:stripe@^14.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

// Create real payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100), // amount in cents
  currency: 'usd',
  metadata: { order_id: orderId }
});
```

## 💰 **PayPal Payments**

### How It Works:
- Money goes to **YOUR PayPal account**
- You need to create a PayPal Business account
- PayPal handles the payment processing

### Configuration Steps:

#### 1. **Create PayPal Business Account**
1. Go to [https://developer.paypal.com/](https://developer.paypal.com/)
2. Create a PayPal Business account
3. Create a new app in the developer dashboard
4. Get your Client ID

#### 2. **Update PayPal Configuration**
```typescript
// In src/config/paypal.ts
export const PAYPAL_CONFIG = {
  clientId: "YOUR_PAYPAL_CLIENT_ID_HERE", // Replace with your real Client ID
  currency: "USD",
  intent: "capture" as const,
  // ... rest of config
};
```

#### 3. **Set Environment Variables**
```env
# In your .env file
VITE_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
```

## 🏦 **Bank Account Setup**

### For Stripe:
1. **Add Bank Account**: In your Stripe dashboard, go to Settings > Payouts
2. **Add Bank Details**: Enter your business bank account details
3. **Payout Schedule**: Configure how often you want to receive payments (daily, weekly, monthly)
4. **Tax Information**: Complete tax forms for your business

### For PayPal:
1. **Link Bank Account**: In your PayPal account, go to Wallet > Link a bank account
2. **Verify Account**: Complete the verification process
3. **Withdrawal Settings**: Set up automatic transfers to your bank account

## 💼 **Business Setup Requirements**

### Stripe Requirements:
- **Business Registration**: You need a registered business
- **Tax ID**: Business tax identification number
- **Bank Account**: Business bank account
- **Business Address**: Physical business address
- **Phone Number**: Business phone number

### PayPal Requirements:
- **Business Account**: PayPal Business account (not personal)
- **Business Verification**: Complete business verification process
- **Bank Account**: Link business bank account
- **Tax Information**: Provide business tax details

## 🔧 **Production Configuration**

### 1. **Environment Variables**
Create a `.env` file with your real API keys:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_STRIPE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY

# PayPal Configuration  
VITE_PAYPAL_CLIENT_ID=YOUR_LIVE_PAYPAL_CLIENT_ID

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 2. **Update Payment Functions**
Replace mock implementations with real payment processing:

```typescript
// Real Stripe integration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: 'usd',
  metadata: { order_id: orderId }
});
```

### 3. **Webhook Configuration**
Set up webhooks to handle payment confirmations:

- **Stripe Webhooks**: Configure webhook endpoints in Stripe dashboard
- **PayPal Webhooks**: Set up webhook URLs in PayPal developer dashboard

## 📊 **Payment Tracking**

### Where to Monitor Payments:

#### Stripe Dashboard:
- **Payments**: View all successful payments
- **Payouts**: See money transferred to your bank account
- **Analytics**: Payment trends and insights

#### PayPal Dashboard:
- **Activity**: View all PayPal transactions
- **Reports**: Download payment reports
- **Withdrawals**: Track money transferred to bank account

## 🚨 **Important Notes**

### 1. **Test vs Live Mode**
- **Development**: Always use test/sandbox keys
- **Production**: Switch to live keys only when ready
- **Never mix**: Don't use test keys in production

### 2. **Security**
- **Never expose secret keys** in frontend code
- **Use environment variables** for all sensitive data
- **Implement proper webhook verification**

### 3. **Compliance**
- **PCI Compliance**: Required for handling card data
- **GDPR**: If serving EU customers
- **Tax Reporting**: Keep records for tax purposes

## 🎯 **Quick Setup Checklist**

- [ ] Create Stripe account and get API keys
- [ ] Create PayPal Business account and get Client ID
- [ ] Set up business bank account
- [ ] Update configuration files with real keys
- [ ] Set up environment variables
- [ ] Test payments in sandbox mode
- [ ] Configure webhooks
- [ ] Switch to live mode for production
- [ ] Monitor payments in dashboards

## 💡 **Pro Tips**

1. **Start with Test Mode**: Always test thoroughly before going live
2. **Monitor Dashboards**: Regularly check payment status
3. **Keep Records**: Maintain detailed payment records for accounting
4. **Customer Support**: Be ready to handle payment-related customer inquiries
5. **Backup Plans**: Have multiple payment methods for redundancy

---

**Remember**: All payments go to YOUR account once properly configured. The payment processors (Stripe/PayPal) just handle the transaction processing and take a small fee (typically 2.9% + 30¢ per transaction).
