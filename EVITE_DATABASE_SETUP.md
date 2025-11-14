# 🔧 Fix: Evite Invite Links Not Working

## Problem
When users click invite links in emails, they see "This invite link is invalid or the event was removed" because events were stored in **localStorage**, which is browser/device-specific.

## Solution
Events are now stored in **Supabase database**, making them accessible from any device/browser.

---

## Step 1: Create the Database Table

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/deymtgmazorjfpinfisx/sql/new

2. **Run the SQL:**
   - Open `SUPABASE_TABLE_SETUP.sql` file
   - Copy all the SQL code
   - Paste it into the SQL Editor in Supabase
   - Click **"Run"**

This creates:
- `evite_events` table
- Public read/write access (for invite links)
- Indexes for performance

---

## Step 2: Verify the Table

1. **Check Table Exists:**
   - Go to: Supabase Dashboard → **Table Editor**
   - You should see `evite_events` table

2. **Verify Permissions:**
   - Go to: **Authentication** → **Policies**
   - Check that `evite_events` has public read/insert/update policies

---

## Step 3: Test the Fix

1. **Create a new event:**
   - Go to `/evite` page
   - Create a new event
   - Add a guest
   - Send invites

2. **Test invite link:**
   - Open the invite link in a **different browser** or **incognito mode**
   - The event should load correctly
   - You should be able to RSVP

---

## How It Works Now

### Before (Broken):
- Events stored in `localStorage` (browser-specific)
- Guest clicks link → event not found → "invalid" error

### After (Fixed):
- Events stored in Supabase database
- Guest clicks link → loads from database → works from any device!

### Fallback:
- If Supabase fails, it falls back to localStorage
- Ensures backward compatibility

---

## Migration Notes

- **Existing events:** Events in localStorage will still work
- **New events:** Automatically saved to Supabase
- **RSVPs:** Now saved to database, visible to host from any device

---

## Troubleshooting

### "Table doesn't exist" error:
- Run the SQL from `SUPABASE_TABLE_SETUP.sql` again

### "Permission denied" error:
- Check RLS policies are set correctly
- Ensure public read/insert/update policies exist

### Events not loading:
- Check browser console for errors
- Verify Supabase connection in `.env` variables
- Check Supabase dashboard → Table Editor → see if events are being saved

---

## Files Changed

1. ✅ `src/utils/eviteStorage.ts` - New storage utility (Supabase + localStorage)
2. ✅ `src/pages/Evite.tsx` - Updated to use new storage
3. ✅ `src/pages/EviteInvite.tsx` - Updated to use new storage
4. ✅ `SUPABASE_TABLE_SETUP.sql` - SQL to create table

---

## Next Steps

1. ✅ Run the SQL to create the table
2. ✅ Test creating a new event
3. ✅ Test invite link from different browser
4. ✅ Verify RSVPs are saved correctly

Your invite links should now work from any device! 🎉

