# 404 TROUBLESHOOTING - STEP BY STEP

## Problem
Frontend shows 404 when trying to reach backend API.

## Root Cause
Environment variable was set, but frontend may not have been redeployed yet, OR the redeploy is still in progress.

## SOLUTION

### Step 1: Check Vercel Deployment Status
1. Go to https://vercel.com/dashboard
2. Click `calendly-clone` project
3. Click **Deployments** tab
4. Look at the latest deployment:
   - ✅ If it shows just a checkmark → Redeployment succeeded
   - 🔄 If it shows building icon → Still deploying (wait)
   - ❌ If it shows X → Deployment failed (click to see logs)

### Step 2: If Not Redeployed Yet
The environment variable change requires a redeploy to take effect:

1. Click on the latest deployment in the list
2. Click the **⋮ (three dots)** menu
3. Click **"Redeploy"**
4. Wait until it shows ✅ READY

### Step 3: Clear Browser Cache & Test
After redeploy shows ✅ READY:

1. Open your frontend URL in browser
2. Press **Ctrl+Shift+Delete** to open cache clearing settings
3. Select:
   - ☑ Cookies and other site data
   - ☑ Cached images and files
4. Click **Clear data**
5. Go back to frontend URL
6. Press **Ctrl+F5** (hard refresh)
7. Check if data now loads

### Step 4: If Still 404
Try the debug page to verify environment variable:

1. Visit: `https://your-vercel-url/debug`
2. Check what NEXT_PUBLIC_API_URL shows
3. Note the backend connection result

If debug page shows:
- **Empty NEXT_PUBLIC_API_URL**: Environment variable not applied. Redeploy again.
- **Wrong URL**: Check Vercel Settings > Environment Variables
- **❌ Backend error**: Check if Render backend is still running

### Step 5: Manual Fix if Needed
If still not working after redeploy:

1. Go to Vercel Settings → Environment Variables
2. Delete the existing NEXT_PUBLIC_API_URL
3. Click **Add New**
4. Fill in:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://calendly-clone-heqv.onrender.com/api`
5. Click **Save**
6. Redeploy again

## CHECKLIST
- [ ] Vercel deployment shows ✅ READY for latest version
- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Hard refreshed (Ctrl+F5)
- [ ] Visited `/debug` page to check environment variable
- [ ] NEXT_PUBLIC_API_URL shows full URL starting with `https://`
- [ ] Backend connection shows ✅ Connected
- [ ] Frontend now loads sample data without 404

## Still Not Working?
Share:
1. Screenshot of `/debug` page showing NEXT_PUBLIC_API_URL value
2. Backend connection status from debug page
3. Vercel deployment status (✅ READY or other?)

Then we can diagnose further.
