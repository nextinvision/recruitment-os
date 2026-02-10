# Deployment Summary - Recruitment OS

## Quick Answer to Your Question

**Q: How will the extension work in Chrome after deploying Master to Hostinger VPS?**

**A:** The extension is a **client-side application** that runs in users' Chrome browsers. Here's how it works:

1. **Extension is installed in Chrome** (once per user)
2. **Extension connects to your VPS API** (via HTTPS)
3. **All data flows: Browser → VPS API** (not the other way around)
4. **Users keep the extension** in their Chrome after installation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S CHROME BROWSER                    │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Extension  │    │   LinkedIn   │    │    Indeed    │ │
│  │   Popup UI   │    │   Job Page   │    │  Job Page    │ │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘ │
│         │                    │                   │         │
│         └────────────────────┴───────────────────┘         │
│                            │                               │
│                    Content Script                          │
│                    (Captures Jobs)                         │
└────────────────────────────┼───────────────────────────────┘
                             │
                             │ HTTPS API Requests
                             │ (Login, Submit Jobs)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  HOSTINGER VPS SERVER                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Nginx (Reverse Proxy)                    │ │
│  │  - SSL/TLS Termination                                 │ │
│  │  - CORS Headers                                        │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │         Next.js API (Master/)                         │ │
│  │  - /api/auth/login                                    │ │
│  │  - /api/jobs/bulk                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Database (PostgreSQL)                    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Process

### Step 1: Deploy Master to VPS ✅
- Upload `Master/` directory to Hostinger VPS
- Configure environment variables
- Set up Nginx with SSL
- Start with PM2
- **Result:** API accessible at `https://api.yourdomain.com`

### Step 2: Build Extension for Production ✅
- Update API URL to point to your VPS
- Build extension: `npm run build`
- **Result:** `dist/` folder ready

### Step 3: Distribute Extension 📦
- Package: `zip -r extension.zip dist/ manifest.json icons/`
- Distribute via:
  - Chrome Web Store (recommended)
  - Manual installation (for testing)
  - Enterprise distribution (for organizations)

### Step 4: Users Install Extension 👥
- Users install extension in their Chrome
- Extension connects to your VPS API
- Users can now capture and submit jobs

## Key Files Created

1. **`extension/DEPLOYMENT.md`** - Complete deployment guide
2. **`extension/QUICK_DEPLOY.md`** - Quick reference
3. **`extension/build-production.sh`** - Linux/Mac build script
4. **`extension/build-production.bat`** - Windows build script

## How to Use

### For Production Build (Windows):
```bash
cd extension
build-production.bat https://api.yourdomain.com
```

### For Production Build (Linux/Mac):
```bash
cd extension
chmod +x build-production.sh
./build-production.sh https://api.yourdomain.com
```

### Manual Method:
1. Edit `extension/src/shared/constants.ts`
2. Change `'http://localhost:3000'` to `'https://api.yourdomain.com'`
3. Run `npm run build`

## Important Points

1. **Extension is client-side** - No server needed for extension itself
2. **HTTPS required** - Chrome extensions require HTTPS for API calls
3. **CORS must be configured** - Nginx must allow extension origins
4. **One-time installation** - Users install once, keep using it
5. **Updates require rebuild** - Update extension when API changes

## Testing Checklist

After deployment, test:
- [ ] API is accessible: `curl https://api.yourdomain.com/api/auth/login`
- [ ] Extension builds successfully
- [ ] Extension loads in Chrome
- [ ] Extension connects to API (test connection button)
- [ ] Login works
- [ ] Job capture works
- [ ] Job submission works

## Support

See `extension/DEPLOYMENT.md` for detailed troubleshooting and configuration.

