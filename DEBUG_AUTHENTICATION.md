# 🔍 Debug Authentication Issues

## 🎯 **Debug Steps**

### **Step 1: Check Button Clicks**
1. **Open browser console** (F12 → Console tab)
2. **Click "Sign In" button**
3. **Look for**: "Sign in button clicked" in console
4. **Click "Demo" button**
5. **Look for**: "Demo button clicked" in console

### **Step 2: Check Authentication State**
1. **In console, run**:
```javascript
console.log('Current user:', window.user);
console.log('Current loading:', window.loading);
console.log('Current isAdmin:', window.isAdmin);
```

### **Step 3: Check Demo Login**
1. **Click "Demo" button**
2. **Look for these console messages**:
   - "Demo button clicked"
   - "Starting demo sign-in..."
   - "Current user before: [user object]"
   - "Demo user signed in successfully: [user object]"
   - "User state set to: [user object]"
   - "Admin status: true"

### **Step 4: Check UI Updates**
1. **After clicking "Demo"**, check if:
   - "Welcome, demo@gifityy.com" appears
   - "Admin Dashboard" button appears
   - "Sign Out" button appears

## 🆘 **Common Issues**

### **Issue 1: "Sign in button clicked" not showing**
**Solution:**
- Button click handler not working
- Check if button is properly rendered
- Try refreshing the page

### **Issue 2: "Demo button clicked" not showing**
**Solution:**
- Demo button click handler not working
- Check if signInDemo function is available
- Check console for errors

### **Issue 3: Demo login not working**
**Solution:**
- Check if all console messages appear
- Check if user state is being set
- Check if admin status is being set

### **Issue 4: UI not updating after login**
**Solution:**
- Check if React state is updating
- Check if component is re-rendering
- Check for React errors in console

## 🔧 **Manual Test Commands**

### **Test Authentication State:**
```javascript
// In browser console
console.log('Auth state:', {
  user: window.user,
  loading: window.loading,
  isAdmin: window.isAdmin
});
```

### **Test Demo Login Manually:**
```javascript
// In browser console (if needed)
localStorage.setItem('demo-session', JSON.stringify({
  user: { id: 'demo-user-123', email: 'demo@gifityy.com' },
  session: { access_token: 'demo-token' },
  timestamp: Date.now()
}));
location.reload();
```

## ✅ **Expected Console Output**

### **When Demo Button Clicked:**
```
Demo button clicked
Starting demo sign-in...
Current user before: null
Current loading state: false
Demo user signed in successfully: {id: "demo-user-123", email: "demo@gifityy.com", ...}
User state set to: {id: "demo-user-123", email: "demo@gifityy.com", ...}
Admin status: true
```

### **When Sign In Button Clicked:**
```
Sign in button clicked
```

## 🎯 **Quick Test**

1. **Open browser console**
2. **Click "Demo" button**
3. **Check console output**
4. **Verify UI updates**
5. **Check if admin button appears**

**Follow these debug steps to identify the exact issue!** 🔍
