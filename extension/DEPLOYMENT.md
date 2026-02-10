# Deployment Guide - Recruitment OS

This guide explains how to deploy the Recruitment OS project to Hostinger VPS and configure the Chrome extension to work with it.

## Overview

The project consists of two parts:
1. **Master** - Next.js backend/API (deployed to VPS)
2. **Extension** - Chrome extension (installed in users' browsers)

## Part 1: Deploy Master (Backend) to Hostinger VPS

### Prerequisites
- Hostinger VPS with Node.js 18+ installed
- Domain name pointing to your VPS (e.g., `api.yourdomain.com`)
- SSH access to your VPS

### Step 1: Prepare Your VPS

```bash
# Connect to your VPS via SSH
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+ (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx (for reverse proxy)
apt install -y nginx
```

### Step 2: Upload Master Directory

```bash
# On your local machine, create a deployment package
cd Master
tar -czf ../master-deploy.tar.gz .

# Upload to VPS (use SCP or SFTP)
scp master-deploy.tar.gz root@your-vps-ip:/opt/recruitment-os/

# On VPS, extract
ssh root@your-vps-ip
cd /opt/recruitment-os
tar -xzf master-deploy.tar.gz
```

### Step 3: Configure Environment Variables

```bash
# On VPS, create .env file
cd /opt/recruitment-os/Master
nano .env
```

Add your production environment variables:
```env
NODE_ENV=production
DATABASE_URL=your_database_url
JWT_SECRET=your_secure_jwt_secret
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
PORT=3000
```

### Step 4: Install Dependencies and Build

```bash
cd /opt/recruitment-os/Master
npm install
npm run build
```

### Step 5: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/recruitment-os
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificate (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers for extension
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Client-Type" always;

    # Handle preflight requests
    if ($request_method = OPTIONS) {
        return 204;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/recruitment-os /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 6: Install SSL Certificate (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

### Step 7: Start Application with PM2

```bash
cd /opt/recruitment-os/Master
pm2 start npm --name "recruitment-os" -- start
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

### Step 8: Verify Deployment

```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs recruitment-os

# Test API endpoint
curl https://api.yourdomain.com/api/auth/login
```

## Part 2: Build Extension for Production

### Step 1: Update API URL in Extension

You have two options:

#### Option A: Build-time Configuration (Recommended)

Edit `extension/src/shared/constants.ts` and update the default URL:

```typescript
export async function getBackendUrl(): Promise<string> {
  // ... existing code ...
  
  // Change this line:
  const buildTimeUrl = 'https://api.yourdomain.com'  // Your VPS URL
  
  return buildTimeUrl
}
```

#### Option B: Build with Environment Variable

Create a build script that sets the API URL:

```bash
# In extension directory
VITE_API_URL=https://api.yourdomain.com npm run build
```

Or create `extension/.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com
```

### Step 2: Build the Extension

```bash
cd extension
npm install
npm run build
```

This creates the `dist/` directory with all compiled files.

### Step 3: Package the Extension

```bash
# Create a zip file for distribution
cd extension
zip -r recruitment-os-extension.zip dist/ manifest.json icons/
```

## Part 3: Distribute Extension to Users

### Option A: Chrome Web Store (Recommended for Public Distribution)

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create a new item
3. Upload the `recruitment-os-extension.zip` file
4. Fill in store listing details
5. Submit for review

### Option B: Manual Installation (For Internal/Testing)

1. Share the `recruitment-os-extension.zip` file with users
2. Users extract the zip file
3. Users open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the extracted `dist` folder (or the folder containing `manifest.json`)

### Option C: Enterprise Distribution (For Organizations)

1. Package as `.crx` file
2. Distribute via Chrome Enterprise Policy
3. Or host on internal server and provide installation link

## Part 4: User Configuration (Optional)

If you want users to be able to configure the API URL themselves:

1. Add a settings page in the extension popup
2. Store the URL in `chrome.storage.local` with key `backend_url`
3. The extension will automatically use the stored URL

Example settings UI:
```typescript
// In popup settings component
const [apiUrl, setApiUrl] = useState('')

const saveApiUrl = async () => {
  await chrome.storage.local.set({ backend_url: apiUrl })
  alert('API URL updated. Please reload the extension.')
}
```

## Part 5: Verify Everything Works

### Test Checklist

1. ✅ Backend API is accessible at `https://api.yourdomain.com`
2. ✅ Extension builds successfully
3. ✅ Extension loads in Chrome
4. ✅ Extension can connect to API (test connection button)
5. ✅ Login works from extension
6. ✅ Job capture works
7. ✅ Job submission works

### Troubleshooting

#### Extension can't connect to API
- Check CORS settings in Nginx config
- Verify API URL is correct in extension
- Check browser console for errors
- Ensure HTTPS is used (Chrome requires HTTPS for extensions)

#### CORS Errors
- Ensure Nginx config includes proper CORS headers
- Check that `X-Client-Type: extension` header is allowed
- Verify `Access-Control-Allow-Origin` includes your extension origin

#### SSL Certificate Issues
- Ensure Let's Encrypt certificate is valid
- Check certificate expiration: `certbot certificates`
- Renew if needed: `certbot renew`

#### Extension Context Invalidated
- This happens when extension is reloaded
- Users should refresh the page after extension updates
- See the fix in `content-script.ts` for better error handling

## Security Considerations

1. **HTTPS Only**: Always use HTTPS for production API
2. **JWT Security**: Use strong JWT secrets
3. **CORS**: Restrict CORS origins if possible (currently allows all for extension)
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: Backend validates all inputs (already implemented)
6. **Token Storage**: Tokens stored securely in `chrome.storage.local`

## Maintenance

### Updating Backend
```bash
# On VPS
cd /opt/recruitment-os/Master
git pull  # or upload new files
npm install
npm run build
pm2 restart recruitment-os
```

### Updating Extension
1. Update code
2. Update version in `manifest.json`
3. Rebuild: `npm run build`
4. Repackage and redistribute
5. Users need to reload extension or reinstall

## Support

For issues:
1. Check PM2 logs: `pm2 logs recruitment-os`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check browser console in extension popup
4. Check network tab for API requests

