# Vercel Deployment - Environment Variable Setup

## Problem
Frontend shows 404 error when accessing backend API.

## Solution
Set the `NEXT_PUBLIC_API_URL` environment variable in Vercel to point to your Render backend.

## Steps

### 1. Get Your Render Backend URL
- Go to https://render.com/dashboard
- Click your `calendly-backend` Web Service
- Copy the URL at the top (e.g., `https://calendly-backend-xxxx.onrender.com`)
- Test it: `https://your-backend-url/api/health` should return `{"status":"ok"}`

### 2. Set Environment Variable in Vercel
1. Go to https://vercel.com/dashboard
2. Click your `calendly-clone` project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Fill in:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-url/api` (replace with actual Render URL)
   - **Environments:** Select Production, Preview, Development
6. Click **"Save"**

### 3. Redeploy Frontend
1. Go to **Deployments** tab
2. Click the latest deployment's **⋮ menu**
3. Click **"Redeploy"** 
4. Wait for deployment to complete (green checkmark)

### 4. Test
- Open your frontend URL
- You should see the admin dashboard load
- Check browser console (F12) for any errors

## Example Values
- Render Backend URL: `https://calendly-backend-abcd1234.onrender.com`
- NEXT_PUBLIC_API_URL: `https://calendly-backend-abcd1234.onrender.com/api`

## Troubleshooting
- If still 404: Check that NEXT_PUBLIC_API_URL exactly matches your Render URL + `/api`
- If CORS error: Backend already has `cors()` middleware enabled
- If timeout: Backend may be cold-starting on Render (free tier), wait 30 seconds and refresh
