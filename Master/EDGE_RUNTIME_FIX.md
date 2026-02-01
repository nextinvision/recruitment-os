# Edge Runtime Fix - JWT Verification

## Root Cause

**Error**: `The edge runtime does not support Node.js 'crypto' module`

**Problem**: Next.js middleware runs in **Edge Runtime**, which doesn't support Node.js modules like `crypto`. The `jsonwebtoken` library uses Node.js `crypto` internally, causing the error.

## Solution

### Dual JWT Library Approach

1. **Token Generation** (API routes - Node.js runtime):
   - Uses `jsonwebtoken` library
   - Works in Node.js runtime (API routes)

2. **Token Verification** (Middleware - Edge runtime):
   - Uses `jose` library (Edge Runtime compatible)
   - Uses Web Crypto API instead of Node.js crypto

### Changes Made

1. **Installed `jose` library**:
   ```bash
   npm install jose
   ```

2. **Updated `lib/auth.ts`**:
   - `generateToken()`: Still uses `jsonwebtoken` (for API routes)
   - `verifyToken()`: Now uses `jose` (for Edge Runtime middleware)
   - Made `verifyToken()` async (required by `jose`)

3. **Updated `lib/rbac.ts`**:
   - `getAuthContext()`: Now awaits `verifyToken()` (since it's async)

### Compatibility

Both libraries use **HS256** algorithm, so tokens generated with `jsonwebtoken` can be verified with `jose` and vice versa.

## Testing

After this fix:
1. Restart Next.js dev server
2. Try logging in
3. Check terminal logs - should see:
   ```
   [verifyToken] ✅ Token verified successfully
   [Middleware] ✅ Authenticated - allowing access to: /dashboard
   ```

## Why This Works

- **API Routes** (Node.js runtime): Can use `jsonwebtoken` with Node.js `crypto`
- **Middleware** (Edge runtime): Uses `jose` with Web Crypto API
- Both generate/verify compatible HS256 tokens

