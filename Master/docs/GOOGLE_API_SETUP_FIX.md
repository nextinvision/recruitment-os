# Google API Setup - Fixing "Referer Blocked" Error

## Issue
You're seeing: `Requests from referer <empty> are blocked`

This happens when your Google API key has HTTP referrer restrictions that block server-side requests.

## Solution

### Option 1: Remove Referrer Restrictions (Recommended for Server-Side Use)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your API key
4. Under **Application restrictions**, select **None** (for server-side use)
   - OR select **IP addresses** and add your server IP: `88.222.245.158`
5. Under **API restrictions**, make sure **Custom Search API** is selected
6. Click **Save**

### Option 2: Use IP Address Restrictions

1. In Google Cloud Console → Credentials → Your API Key
2. Under **Application restrictions**, select **IP addresses**
3. Add your server IP: `88.222.245.158`
4. Click **Save**

### Option 3: Create a New API Key for Server Use

1. In Google Cloud Console → Credentials
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Name it: "Server API Key"
4. Set restrictions:
   - **Application restrictions**: **IP addresses** → Add `88.222.245.158`
   - **API restrictions**: **Restrict key** → Select **Custom Search API**
5. Copy the new API key
6. Update `.env` file:
   ```env
   GOOGLE_API_KEY=your_new_api_key_here
   ```
7. Restart the server:
   ```bash
   pm2 restart recruitment-os --update-env
   ```

## Verify Setup

After updating restrictions, test again:

```bash
cd /root/recruitment-os/Master
node scripts/test-google-fetch-api.js
```

## Why This Happens

- **HTTP referrer restrictions** are designed for browser-based requests
- **Server-side requests** (like from Next.js API routes) don't send referrer headers
- The API key needs to allow server-side requests

## Current Status

✅ Credentials are in `.env` file
✅ Server has been restarted
✅ Next.js can access the credentials
⚠️ API key restrictions need to be updated

## Next Steps

1. Update API key restrictions in Google Cloud Console (choose one option above)
2. Wait 1-2 minutes for changes to propagate
3. Test the fetch functionality on the website:
   - Go to `/jobs` page
   - Click "Fetch Jobs" tab
   - Enter a query and click "Fetch"

## Testing on Website

Once restrictions are fixed:

1. Visit: https://careeristpro.cloud/jobs
2. Click the **"Fetch Jobs"** tab
3. Enter search query: `software engineer`
4. Select source: **Google Search**
5. Click **"Fetch from Google Search"**
6. You should see jobs being fetched and stored!

