#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting deployment to production..."

# Run type checking and build validation first
echo "🔍 Running type checks..."
npm run typecheck

echo "📦 Building application..."
npm run build

echo "🚀 Deploying to Vercel..."
# Deploy and capture the deployment URL
DEPLOYMENT_URL=$(vercel --prod --yes | grep -E "https://.*\.vercel\.app" | tail -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ Failed to get deployment URL"
    exit 1
fi

echo "✅ Deployed to: $DEPLOYMENT_URL"

echo "🔗 Setting up alias to herit.vercel.app..."
vercel alias set "$DEPLOYMENT_URL" herit.vercel.app

echo ""
echo "🎉 Deployment complete!"
echo "📱 Production URL: https://herit.vercel.app"
echo "🔗 Direct URL: $DEPLOYMENT_URL"
echo ""