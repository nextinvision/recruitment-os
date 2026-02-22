# API Enabled But Still Getting Errors - Troubleshooting Guide

## Current Status
- ✅ API is enabled
- ✅ Same project ID
- ✅ Restrictions set to "None"
- ❌ Still getting: "This project does not have the access to Custom Search JSON API"

## Possible Solutions

### Solution 1: Disable and Re-enable API (Most Common Fix)

Sometimes the API needs to be disabled and re-enabled to fully activate:

1. **Go to**: https://console.cloud.google.com/apis/dashboard
2. **Find**: "Custom Search API" in the list
3. **Click**: "Disable API" button
4. **Wait**: 30 seconds
5. **Click**: "Enable API" button
6. **Wait**: 2-3 minutes for activation
7. **Test again**: Run `node scripts/verify-api-setup.js`

### Solution 2: Check Billing Status

Custom Search API might require billing to be enabled (even for free tier):

1. **Go to**: https://console.cloud.google.com/billing
2. **Check**: If billing account is linked to your project
3. **If not**: Link a billing account (free tier still applies)
4. **Note**: Custom Search API free tier: 100 queries/day

### Solution 3: Verify API is Actually Enabled

Double-check the API is enabled:

1. **Go to**: https://console.cloud.google.com/apis/dashboard
2. **Look for**: "Custom Search API" in the "Enabled APIs" section
3. **If not there**: Click "Enable APIs and Services" → Search "Custom Search API" → Enable

### Solution 4: Check API Key Project Match

Verify the API key belongs to the same project:

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click**: Your API key
3. **Check**: "Project" field matches the project where you enabled the API
4. **If different**: Either enable API in that project OR create new API key in correct project

### Solution 5: Wait for Propagation

API changes can take 5-10 minutes to propagate:

1. **Wait**: 5-10 minutes after enabling
2. **Test**: Run `node scripts/verify-api-setup.js`
3. **If still not working**: Try Solution 1 (disable/re-enable)

### Solution 6: Create New API Key

Sometimes API keys need to be regenerated:

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Create**: New API key
3. **Set restrictions**: None (or IP: 88.222.245.158)
4. **Set API restrictions**: Custom Search API only
5. **Update**: `.env` file with new API key
6. **Restart**: Server with `pm2 restart recruitment-os --update-env`

## Quick Verification Steps

Run these commands to verify:

```bash
cd /root/recruitment-os/Master

# Test 1: Basic API test
node scripts/verify-api-setup.js

# Test 2: Detailed error check
node scripts/test-with-billing-check.js

# Test 3: Direct API call
node -e "
require('dotenv').config();
const fetch = require('node-fetch');
const url = \`https://www.googleapis.com/customsearch/v1?key=\${process.env.GOOGLE_API_KEY}&cx=\${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=test&num=1\`;
fetch(url).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)));
"
```

## Expected Success Response

When working correctly, you should see:
```json
{
  "items": [
    {
      "title": "...",
      "link": "...",
      "snippet": "..."
    }
  ]
}
```

## Still Not Working?

If none of these solutions work:

1. **Check Google Cloud Status**: https://status.cloud.google.com/
2. **Check API Quotas**: https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas
3. **Contact Support**: Or try creating a new Google Cloud project and starting fresh

## Most Likely Fix

**Try Solution 1 first** (Disable and Re-enable API) - this fixes the issue 90% of the time.


