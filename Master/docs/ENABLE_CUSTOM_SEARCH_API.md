# Enable Custom Search API - Quick Guide

## Issue
You're seeing: "This project does not have the access to Custom Search JSON API"

This means the Custom Search API is not enabled for your Google Cloud project.

## Solution

### Step 1: Enable Custom Search API

1. **Go to**: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
   - Or navigate: Google Cloud Console → APIs & Services → Library → Search "Custom Search API"

2. **Click**: The "Custom Search API" card

3. **Click**: The blue **"Enable"** button

4. **Wait**: It takes a few seconds to enable

5. **Verify**: You should see "API enabled" message

### Step 2: Verify API Key Restrictions

1. **Go to**: https://console.cloud.google.com/apis/credentials

2. **Click**: Your API key

3. **Check "Application restrictions"**:
   - Should be set to **"None"** (for server-side use)
   - OR **"IP addresses"** with your server IP: `88.222.245.158`

4. **Check "API restrictions"**:
   - Should be set to **"Restrict key"**
   - Should have **"Custom Search API"** selected/checked

5. **Click**: **"Save"**

### Step 3: Wait for Propagation

- Changes can take **2-3 minutes** to propagate
- Wait a few minutes before testing again

### Step 4: Test Again

Run the test script:
```bash
cd /root/recruitment-os/Master
node scripts/test-api-detailed.js
```

## Quick Links

- **Enable API**: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
- **API Credentials**: https://console.cloud.google.com/apis/credentials
- **API Dashboard**: https://console.cloud.google.com/apis/dashboard

## Verification Checklist

- [ ] Custom Search API is enabled
- [ ] API key restrictions set to "None" or IP address
- [ ] Custom Search API is selected in API restrictions
- [ ] Changes saved
- [ ] Waited 2-3 minutes for propagation
- [ ] Test script runs successfully

