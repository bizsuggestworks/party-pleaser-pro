// PayPal Configuration
export const PAYPAL_CONFIG = {
  // For development/testing, use a mock PayPal flow
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "mock_paypal_client_id", // Mock client ID for development
  
  // For production, you would use your real PayPal client ID:
  // clientId: "YOUR_PAYPAL_CLIENT_ID_HERE",
  
  // IMPORTANT: Money goes to YOUR PayPal account
  // 1. Create PayPal Business account at https://developer.paypal.com/
  // 2. Create a new app and get your Client ID
  // 3. Link your business bank account in PayPal
  // 4. Replace the mock client ID with your actual Client ID
  
  currency: "USD",
  intent: "capture" as const,
  
  // PayPal button styling
  buttonStyle: {
    layout: "vertical" as const,
    color: "blue" as const,
    shape: "rect" as const,
    label: "paypal" as const
  },
  
  // PayPal SDK options
  sdkOptions: {
    "enable-funding": "venmo,paylater",
    "disable-funding": "",
    "data-sdk-integration-source": "integrationbuilder_ac"
  }
};

// Instructions for setting up PayPal:
/*
1. Go to https://developer.paypal.com/
2. Create a developer account
3. Create a new app
4. Get your Client ID
5. Replace "sb" with your actual Client ID
6. For production, use your live Client ID
*/
