# Quick Deployment Guide

## TL;DR - Quick Steps

### 1. Deploy Backend to VPS
```bash
# On VPS
cd /opt/recruitment-os/Master
npm install
npm run build
pm2 start npm --name "recruitment-os" -- start
```

### 2. Build Extension with Production URL
```bash
# On your local machine
cd extension

# Windows:
build-production.bat https://api.yourdomain.com

# Linux/Mac:
chmod +x build-production.sh
./build-production.sh https://api.yourdomain.com
```

### 3. Package Extension
```bash
# Create zip file
zip -r recruitment-os-extension.zip dist/ manifest.json icons/
```

### 4. Distribute Extension
- **Chrome Web Store**: Upload zip to developer dashboard
- **Manual**: Share zip, users extract and load unpacked in Chrome
- **Enterprise**: Use Chrome Enterprise policies

## How It Works

### Architecture
```
┌─────────────────┐         HTTPS          ┌──────────────────┐
│  Chrome Browser │ ◄────────────────────► │  Hostinger VPS   │
│                 │                         │                  │
│  Extension      │    API Requests        │  Next.js API     │
│  (User's PC)    │    (Login, Jobs)        │  (Master/)       │
└─────────────────┘                         └──────────────────┘
```

### Extension Installation Flow
1. User installs extension (Chrome Web Store or manual)
2. Extension loads with production API URL
3. User clicks extension icon → popup opens
4. User logs in → extension sends request to VPS API
5. User browses job sites → extension captures jobs
6. User submits jobs → extension sends to VPS API

### Key Points
- **Extension runs in user's browser** - No server needed for extension
- **Extension communicates with VPS API** - All data goes to your VPS
- **Extension is installed once** - Users keep it in their Chrome
- **Updates require reinstall** - Or use Chrome Web Store auto-updates

## Configuration

### Backend API URL
The extension needs to know where your API is. Three ways to set it:

1. **Build-time** (Recommended): Update `src/shared/constants.ts` before building
2. **Environment variable**: Set `VITE_API_URL` during build
3. **Runtime** (Advanced): Store in `chrome.storage.local` with key `backend_url`

### Current Default
- Development: `http://localhost:3000`
- Production: Update in `constants.ts` or use build script

## Testing After Deployment

1. **Test API directly**:
   ```bash
   curl https://api.yourdomain.com/api/auth/login
   ```

2. **Test from extension**:
   - Open extension popup
   - Click "Test Connection" button
   - Should show "Connected"

3. **Test login**:
   - Enter credentials
   - Should authenticate successfully

4. **Test job capture**:
   - Visit LinkedIn/Indeed job page
   - Click "Capture Jobs" button
   - Jobs should appear in staging area

## Common Issues

### Extension can't connect
- ✅ Check API URL is correct (HTTPS required)
- ✅ Check CORS headers in Nginx
- ✅ Check API is running: `pm2 status`

### CORS errors
- ✅ Add CORS headers in Nginx config
- ✅ Allow `X-Client-Type: extension` header

### SSL errors
- ✅ Ensure valid SSL certificate
- ✅ Use HTTPS (not HTTP) for production

## Next Steps

See `DEPLOYMENT.md` for detailed instructions.

