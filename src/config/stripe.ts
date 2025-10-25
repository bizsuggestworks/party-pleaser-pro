// Stripe Configuration
export const STRIPE_CONFIG = {
  // For development, disable Stripe to avoid tracking warnings
  publishableKey: import.meta.env.MODE === 'development' ? null : (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"),
  
  // For production, you would use your live publishable key:
  // publishableKey: "pk_live_YOUR_LIVE_KEY_HERE",
  
  // IMPORTANT: Money goes to YOUR Stripe account
  // 1. Create account at https://dashboard.stripe.com/
  // 2. Get your API keys from the dashboard
  // 3. Add your bank account in Stripe settings
  // 4. Replace the placeholder with your actual key
  
  // Stripe Elements styling
  elementsOptions: {
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  },
  
  // Payment method types
  paymentMethodTypes: ['card'] as const,
};

// Instructions for setting up Stripe:
/*
1. Go to https://dashboard.stripe.com/
2. Create a Stripe account
3. Get your publishable key from the dashboard
4. Replace "pk_test_placeholder" with your actual test key
5. For production, use your live publishable key
6. Make sure to set up webhook endpoints for payment confirmation
*/
