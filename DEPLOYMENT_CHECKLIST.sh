#!/bin/bash
# Vercel Deployment Checklist - Run this to verify everything is configured correctly

echo "🔍 Calendly Clone - Vercel Deployment Verification"
echo "=================================================="
echo ""

# Check 1: Backend accessibility
echo "✓ Step 1: Checking backend..."
BACKEND_URL="https://calendly-clone-heqv.onrender.com"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")

if [ "$HEALTH_RESPONSE" = '{"status":"ok"}' ]; then
    echo "✅ Backend is accessible and healthy"
    echo "   URL: $BACKEND_URL"
else
    echo "❌ Backend is not responding correctly"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi

echo ""
echo "✓ Step 2: Environment Variable Configuration"
echo "=================================================="
echo ""
echo "REQUIRED in Vercel Settings → Environment Variables:"
echo ""
echo "Name:  NEXT_PUBLIC_API_URL"
echo "Value: https://calendly-clone-heqv.onrender.com/api"
echo "Envs:  ☑ Production, ☑ Preview, ☑ Development"
echo ""
echo "⚠️  If not set, follow these steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'calendly-clone' project"
echo "3. Go to Settings → Environment Variables"
echo "4. Click 'Add New'"
echo "5. Fill in Name and Value as shown above"
echo "6. Check all three environments"
echo "7. Click Save"
echo ""

echo "✓ Step 3: Redeploy Frontend"
echo "=================================================="
echo ""
echo "After setting environment variable:"
echo "1. Go to Deployments tab"
echo "2. Click on latest deployment"
echo "3. Click ⋮ (three dots) → Redeploy"
echo "4. Wait for green ✅ checkmark (~2 minutes)"
echo ""

echo "✓ Step 4: Verify in Browser"
echo "=================================================="
echo ""
echo "After redeploy completes:"
echo "1. Open your frontend URL"
echo "2. Press F12 to open Developer Tools"
echo "3. Go to Network tab"
echo "4. Refresh page"
echo "5. Look for API requests - they should go to:"
echo "   https://calendly-clone-heqv.onrender.com/api/..."
echo ""
echo "If requests still show 404 or wrong URL:"
echo "   - Clear browser cache (Ctrl+Shift+Delete)"
echo "   - Do hard refresh (Ctrl+F5)"
echo "   - Check that NEXT_PUBLIC_API_URL was actually saved in Vercel"
echo ""
