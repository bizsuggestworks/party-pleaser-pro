# 🔍 Order Debug Guide

## 🎯 **How to Debug Order Lookup**

### **Step 1: Check Available Orders**
1. Open the chatbot
2. Type: **"Show available orders"** or **"debug"**
3. This will list all orders in the system
4. Note the exact order IDs

### **Step 2: Test Order Lookup**
1. Use the exact order ID from step 1
2. Type the full order ID (e.g., `paypal_1761371022997_daj70i7rm`)
3. Chatbot should find and display order details

### **Step 3: Check Console Logs**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Type order ID in chatbot
4. Look for debug logs showing:
   - "Searching for order: [your query]"
   - "Available orders: [list]"
   - "Found order: [order details]"

## 🔧 **Common Issues & Solutions**

### **Issue 1: "No orders found"**
**Solution:**
- Make sure you've completed a test order
- Check if orders are saved in localStorage
- Try "Show available orders" to see what's stored

### **Issue 2: "Order not found"**
**Solution:**
- Use exact order ID (case-sensitive)
- Try partial order ID (e.g., just "paypal_1761371022997")
- Check console logs for available orders

### **Issue 3: "Chatbot not responding"**
**Solution:**
- Refresh the page
- Check browser console for errors
- Try typing "debug" to test chatbot

## 🚀 **Quick Test Commands**

### **In Chatbot, try these:**
```
"Show available orders"     # List all orders
"debug"                     # Same as above
"paypal_1761371022997_daj70i7rm"  # Your specific order ID
"paypal_1761371022997"      # Partial order ID
```

### **Check Browser Console:**
```javascript
// In browser console, run:
console.log('Orders:', localStorage.getItem('party-pleaser-orders'));
```

## 🎯 **Expected Behavior**

### **When Order Found:**
- ✅ **Order Details**: Shows complete order information
- ✅ **Customer Info**: Name, email, phone
- ✅ **Order Status**: Current status
- ✅ **Gift Details**: Theme, items, personalization
- ✅ **Chat History**: Previous conversations (if any)

### **When Order Not Found:**
- ❌ **Error Message**: "I couldn't find an order with that information"
- ❌ **Suggestion**: "Please check your order number or email address"
- ❌ **Help**: "You can also contact our support team for assistance"

## 🔍 **Debug Steps for Your Order**

### **For Order: `paypal_1761371022997_daj70i7rm`**

1. **Open Chatbot**
2. **Type: "Show available orders"**
3. **Look for your order in the list**
4. **If found, use the exact ID shown**
5. **If not found, check if order was saved properly**

### **Alternative: Check Browser Storage**
1. **Open Developer Tools (F12)**
2. **Go to Application tab**
3. **Click Local Storage**
4. **Look for `party-pleaser-orders`**
5. **Check if your order is there**

## ✅ **Success Indicators**

### **Order Lookup Working:**
- ✅ **Orders Listed**: "Show available orders" shows your order
- ✅ **Order Found**: Chatbot finds your specific order
- ✅ **Details Shown**: Complete order information displayed
- ✅ **Console Logs**: Debug information in browser console

### **If Still Not Working:**
- Check if order was actually saved
- Verify order ID format
- Try different search terms
- Check browser console for errors

**Try the debug commands now to see what orders are available!** 🔍
