# Dual Login System Architecture

## Overview

The system supports two independent login mechanisms:

1. **Web Dashboard Login** - For browser-based access
2. **Chrome Extension Login** - For extension popup access

Both use the same API endpoint but have different authentication storage mechanisms.

## Authentication Flow

### Web Dashboard Login

**Storage:**
- `localStorage` - For client-side API calls
- HTTP Cookie - For middleware/server-side authentication

**Flow:**
1. User submits credentials on `/login` page
2. API validates and returns JWT token
3. API sets token in HTTP cookie (for middleware)
4. Client stores token in `localStorage` (for API calls)
5. Client redirects to `/dashboard`
6. Middleware reads cookie and allows access

**Files:**
- `Master/app/(auth)/login/page.tsx` - Login UI
- `Master/app/api/auth/login/route.ts` - Login API (sets cookie for web)
- `Master/middleware.ts` - Reads cookie for authentication

### Chrome Extension Login

**Storage:**
- `chrome.storage.local` - Extension-specific storage
- Bearer token in `Authorization` header for API calls

**Flow:**
1. User submits credentials in extension popup
2. Extension sends request with `X-Client-Type: extension` header
3. API validates and returns JWT token (NO cookie set)
4. Extension stores token in `chrome.storage.local`
5. Extension uses token in `Authorization: Bearer <token>` header for all API calls
6. Extension stays in popup (no redirect)

**Files:**
- `extension/src/popup/App.tsx` - Extension login UI
- `extension/src/background/api-client.ts` - Extension API client
- `Master/app/api/auth/login/route.ts` - Login API (detects extension, skips cookie)

## API Detection Logic

The login API detects the client type using:

```typescript
const isExtension = 
  request.headers.get('x-client-type') === 'extension' || 
  userAgent.includes('chrome-extension://') ||
  request.headers.get('origin')?.includes('chrome-extension://')
```

**If Extension:**
- Returns token in JSON response
- Does NOT set cookie
- Extension stores in `chrome.storage.local`

**If Web:**
- Returns token in JSON response
- Sets HTTP cookie for middleware
- Web client stores in `localStorage`

## Authentication Headers

### Web Dashboard API Calls
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

### Extension API Calls
```javascript
headers: {
  'Authorization': `Bearer ${token}`, // from chrome.storage.local
  'Content-Type': 'application/json',
  'X-Client-Type': 'extension'
}
```

## Middleware Behavior

The middleware checks authentication in this order:

1. `Authorization` header (Bearer token)
2. Cookie (`token`)
3. If neither found, redirects to `/login`

**For Web:**
- Middleware reads cookie
- Allows access to protected routes

**For Extension:**
- Extension API calls include `Authorization` header
- Middleware allows API routes (they handle auth internally)
- Extension doesn't navigate to web routes, so middleware doesn't interfere

## No Conflicts

✅ **Separate Storage:**
- Web: `localStorage` + Cookies
- Extension: `chrome.storage.local`

✅ **Separate Contexts:**
- Web: Browser tabs/windows
- Extension: Popup/background scripts

✅ **API Detection:**
- Extension sends `X-Client-Type: extension` header
- API skips cookie setting for extensions

✅ **Independent Sessions:**
- Web login doesn't affect extension
- Extension login doesn't affect web
- Both can be logged in simultaneously with same credentials

## Testing

### Test Web Login:
1. Navigate to `http://localhost:3000/login`
2. Enter credentials
3. Should redirect to `/dashboard`
4. Check browser cookies - should have `token` cookie
5. Check `localStorage` - should have `token` and `user`

### Test Extension Login:
1. Open extension popup
2. Enter credentials
3. Should show dashboard in popup
4. Check `chrome.storage.local` - should have token
5. Check browser cookies - should NOT have `token` cookie

## Security Notes

- Extension tokens are stored in `chrome.storage.local` (isolated from web)
- Web tokens are in `localStorage` + cookies (same-origin only)
- Both use same JWT secret and validation
- API endpoints validate tokens the same way for both clients

