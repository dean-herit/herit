#!/bin/bash

echo "🧹 Cleaning up corrupted environment variables..."

# Remove corrupted variables
echo "Removing corrupted variables..."
printf 'y\n' | vercel env rm SESSION_SECRET production 2>/dev/null || true
printf 'y\n' | vercel env rm GOOGLE_CLIENT_ID production 2>/dev/null || true  
printf 'y\n' | vercel env rm GOOGLE_CLIENT_SECRET production 2>/dev/null || true
printf 'y\n' | vercel env rm GOOGLE_REDIRECT_URI production 2>/dev/null || true

echo "Waiting for deletions to propagate..."
sleep 10

# Add clean variables without newlines
echo "Adding clean environment variables..."

printf 'dac0f1aaa2389587bf983faec492e7b746ef148555bef5b8351584b0dd25b88f' | vercel env add SESSION_SECRET production
printf '62753751660-do7t6uqpngmd3463mspv6mj8vh4j9vqi.apps.googleusercontent.com' | vercel env add GOOGLE_CLIENT_ID production  
printf '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' | vercel env add GOOGLE_CLIENT_SECRET production
printf 'https://herit.vercel.app/api/auth/google/callback' | vercel env add GOOGLE_REDIRECT_URI production

echo "✅ Environment variables cleaned and re-added!"
echo "🚀 Ready to deploy..."