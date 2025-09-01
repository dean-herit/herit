# Vercel Deployment Guide

## ⚠️ CRITICAL: Required Environment Variables

**Your deployment WILL FAIL without these environment variables set in Vercel.**

### Required Variables (Build will fail without these)

1. **POSTGRES_URL**

   - PostgreSQL connection string
   - Example: `postgresql://user:password@host:5432/database?sslmode=require`
   - Get from: Neon, Supabase, or Vercel Postgres

2. **SESSION_SECRET**
   - JWT session encryption key (minimum 32 characters)
   - Generate with: `openssl rand -hex 32`
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4`

### How to Set Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `POSTGRES_URL`
   - Value: Your database connection string
   - Environment: ✅ Production, ✅ Preview, ✅ Development
5. Repeat for `SESSION_SECRET`
6. Click **Save**

### Optional Variables (Recommended)

- **REFRESH_SECRET** - Separate refresh token secret (defaults to SESSION_SECRET)
- **GOOGLE_CLIENT_ID** - For Google OAuth login
- **GOOGLE_CLIENT_SECRET** - For Google OAuth login
- **BLOB_READ_WRITE_TOKEN** - For Vercel Blob storage (file uploads)

## Pre-Deployment Checklist

Run this command to check if your project is ready for Vercel:

```bash
npm run vercel:check
```

Or for a comprehensive check:

```bash
node scripts/check-vercel-readiness.js
```

## Common Deployment Issues

### 1. "Invalid environment variables" Error

**Error:**

```
❌ Invalid environment variables: [
  {
    expected: 'string',
    code: 'invalid_type',
    path: [ 'POSTGRES_URL' ],
    message: 'Invalid input'
  }
]
```

**Solution:** Set POSTGRES_URL and SESSION_SECRET in Vercel Dashboard (see above)

### 2. "Cannot find module '@heroui/link'" Error

**Error:**

```
Type error: Cannot find module '@heroui/link' or its corresponding type declarations.
```

**Solution:** Import from `@heroui/react` instead of individual packages:

```typescript
// ❌ Wrong
import { Link } from "@heroui/link";

// ✅ Correct
import { Link } from "@heroui/react";
```

### 3. ES Module Issues

**Error:**

```
module is not defined in ES module scope
```

**Solution:** All `.js` config files must use ES module syntax:

```javascript
// ❌ Wrong
module.exports = config;

// ✅ Correct
export default config;
```

## Local Testing

### Test with Vercel-like Environment

To test your build without environment variables (simulates Vercel):

```bash
# This will fail if env vars are missing (expected)
POSTGRES_URL= SESSION_SECRET= npm run build
```

### Test with Strict Validation

```bash
# Run strict environment checks
VERCEL_ENV_CHECK_STRICT=true npm run vercel:check
```

## Deployment Commands

### Initial Deployment

1. Set environment variables in Vercel Dashboard (see above)
2. Push to GitHub:
   ```bash
   git push origin main
   ```
3. Vercel will automatically deploy

### Manual Deployment

```bash
# If you have Vercel CLI installed
vercel

# Or trigger via git
git push origin main
```

## Post-Deployment

After successful deployment:

1. Check your application at your Vercel URL
2. Test authentication flows
3. Verify database connections
4. Check error logs in Vercel Dashboard

## Troubleshooting

If deployment fails:

1. Check build logs in Vercel Dashboard
2. Verify all required environment variables are set
3. Run `npm run vercel:check` locally
4. Check for TypeScript errors: `npm run typecheck`
5. Test production build locally: `npm run build`

## Support

For deployment issues:

- Check Vercel build logs
- Run `node scripts/check-vercel-readiness.js`
- Ensure environment variables are set correctly
- Review this guide for common issues
