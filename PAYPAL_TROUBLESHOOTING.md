# PayPal Integration Troubleshooting Guide

## 🚨 Common PayPal Errors and Solutions

### Error 422: "Invalid Request"
**Cause**: This error typically occurs when:
- Invalid amount format (must be string with 2 decimal places)
- Missing required fields in the order
- Invalid currency code
- Client ID issues

**Solutions**:
1. **Check Amount Format**: Ensure amounts are formatted as strings with exactly 2 decimal places
   ```javascript
   // ✅ Correct
   value: totalAmount.toFixed(2)
   
   // ❌ Incorrect
   value: totalAmount.toString()
   ```

2. **Validate Required Fields**: Ensure all required fields are present
   ```javascript
   {
     amount: {
       value: "10.00", // Must be string with 2 decimals
       currency_code: "USD" // Must be valid currency
     },
     description: "Product description" // Optional but recommended
   }
   ```

3. **Check Client ID**: Verify your PayPal client ID is correct
   - For sandbox: Use sandbox client ID
   - For production: Use live client ID
   - Ensure the client ID is properly configured

### Error 400: "Bad Request"
**Cause**: Missing or invalid parameters in the request.

**Solutions**:
1. Check that all required parameters are provided
2. Validate that the client ID is correct
3. Ensure the PayPal SDK is properly loaded

### Error 500: "Internal Server Error"
**Cause**: PayPal service issues or invalid configuration.

**Solutions**:
1. Check PayPal service status
2. Verify your PayPal account is properly set up
3. Ensure you're using the correct environment (sandbox vs production)

## 🔧 Configuration Issues

### Mock PayPal Client ID
If you're using the mock client ID (`mock_paypal_client_id`), the PayPal buttons will use a mock implementation. For real PayPal integration:

1. **Get a Real PayPal Client ID**:
   - Go to [developer.paypal.com](https://developer.paypal.com)
   - Create a developer account
   - Create a new app
   - Get your Client ID

2. **Update Configuration**:
   ```typescript
   // In src/config/paypal.ts
   export const PAYPAL_CONFIG = {
     clientId: "YOUR_REAL_PAYPAL_CLIENT_ID", // Replace with real ID
     currency: "USD",
     intent: "capture" as const,
     // ... rest of config
   };
   ```

### Environment Variables
Make sure your environment variables are set correctly:

```env
# For development
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id

# For production
VITE_PAYPAL_CLIENT_ID=your_live_client_id
```

## 🧪 Testing PayPal Integration

### 1. **Sandbox Testing**
- Use PayPal sandbox credentials
- Test with sandbox buyer accounts
- Verify order creation and capture

### 2. **Mock Implementation**
- The app includes a mock PayPal implementation for development
- Use this when you don't have a PayPal developer account yet
- Mock payments are saved to localStorage for testing

### 3. **Production Testing**
- Use real PayPal credentials
- Test with small amounts first
- Monitor PayPal dashboard for transactions

## 🔍 Debugging Tips

### 1. **Enable Debug Mode**
```javascript
// In PayPalScriptProvider options
{
  debug: true, // Enable debug logging
  // ... other options
}
```

### 2. **Check Console Logs**
- Look for PayPal SDK errors in browser console
- Check network requests to PayPal API
- Monitor order creation and capture responses

### 3. **Validate Order Data**
```javascript
// Before creating order, log the data
console.log('Creating PayPal order with:', {
  amount: totalAmount.toFixed(2),
  currency: 'USD',
  description: 'Order description'
});
```

## 🛠️ Common Fixes

### Fix 1: Amount Formatting
```javascript
// ❌ Wrong
value: totalAmount.toString()

// ✅ Correct
value: totalAmount.toFixed(2)
```

### Fix 2: Currency Code
```javascript
// ❌ Wrong
currency_code: "usd"

// ✅ Correct
currency_code: "USD"
```

### Fix 3: Client ID Configuration
```javascript
// ❌ Wrong - using mock ID in production
clientId: "mock_paypal_client_id"

// ✅ Correct - using real PayPal client ID
clientId: "YOUR_REAL_PAYPAL_CLIENT_ID"
```

### Fix 4: Error Handling
```javascript
onError={(err) => {
  console.error('PayPal error:', err);
  
  // Handle specific error types
  if (err.message?.includes('422')) {
    // Handle validation errors
  } else if (err.message?.includes('400')) {
    // Handle bad request errors
  }
}}
```

## 📋 PayPal Setup Checklist

- [ ] PayPal developer account created
- [ ] PayPal app created with Client ID
- [ ] Client ID added to environment variables
- [ ] PayPal SDK properly loaded
- [ ] Order creation working
- [ ] Payment capture working
- [ ] Error handling implemented
- [ ] Testing completed in sandbox
- [ ] Production credentials configured

## 🆘 Still Having Issues?

1. **Check PayPal Documentation**: [PayPal Developer Docs](https://developer.paypal.com/docs/)
2. **Verify Account Status**: Ensure your PayPal account is active
3. **Test with Different Amounts**: Try with various amounts to isolate the issue
4. **Check Network Requests**: Use browser dev tools to monitor API calls
5. **Contact PayPal Support**: For account-specific issues

## 🎯 Quick Fix for Current Error

If you're getting the 422 error right now:

1. **Use Mock Implementation**: The app is configured to use mock PayPal for development
2. **Check Amount**: Ensure `totalAmount` is a valid number > 0
3. **Format Amount**: Use `totalAmount.toFixed(2)` for proper formatting
4. **Test with Small Amount**: Try with amount like 1.00 to test the flow

The mock implementation will work without a real PayPal account and will save orders to localStorage for testing the admin dashboard.
