# Root Cause: JWT_SECRET Mismatch

## Problem Identified

The terminal test revealed:
- ✅ Login API generates token successfully
- ✅ Cookie is set correctly
- ✅ Cookie is received by middleware
- ❌ **Token verification fails with "invalid signature"**

## Root Cause

**JWT_SECRET mismatch between token generation and verification:**

1. **Token Generation** (in login API): Uses `JWT_SECRET` from `.env` file
2. **Token Verification** (in middleware): Uses different `JWT_SECRET` (possibly default fallback)

The test script showed:
- `.env` file has JWT_SECRET with length 78
- But when test runs without dotenv, it uses default (length 36)
- This causes "invalid signature" error

## Solution

### Option 1: Restart Next.js Dev Server (Recommended)

Next.js loads `.env` files when the server starts. If you changed `.env` after starting the server:

1. **Stop the dev server** (Ctrl+C)
2. **Restart it**: `npm run dev`
3. **Try login again**

### Option 2: Verify .env Location

Ensure `.env` is in the `Master` directory (same level as `package.json`):

```
Master/
  ├── .env          ← Must be here
  ├── package.json
  ├── next.config.js
  └── ...
```

### Option 3: Check .env Format

Ensure `.env` has correct format (no quotes around values in some cases):

```env
JWT_SECRET=recruitment-os-super-secret-jwt-key-change-in-production-min-32-chars-required
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://...
```

### Option 4: Hardcode for Testing (Temporary)

If `.env` still doesn't load, temporarily hardcode in `lib/auth.ts`:

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'recruitment-os-super-secret-jwt-key-change-in-production-min-32-chars-required'
```

**⚠️ Remove hardcoding before production!**

## Verification

After fixing, run the test again:

```bash
node test-login.js
```

You should see:
```
✅ Token verified successfully!
```

## Why This Happens

Next.js loads environment variables:
- At **server startup** (for server-side code)
- At **build time** (for client-side code)

If you:
1. Start server
2. Change `.env`
3. Don't restart server

The server still uses the old environment variables!

## Next Steps

1. **Restart the Next.js dev server**
2. **Try login again**
3. **Check terminal logs** - should see token verification succeed
4. **If still fails**, check that `.env` JWT_SECRET matches what's being used

