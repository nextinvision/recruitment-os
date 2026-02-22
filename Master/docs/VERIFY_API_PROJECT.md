# Verify API Key Project - Step by Step Guide

## Issue
The API key exists, but Custom Search API is not enabled for the project it belongs to.

## Solution: Find the Correct Project

### Step 1: Find Which Project Your API Key Belongs To

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Look at the top bar** - note the current project name (e.g., "My Project")
3. **Find your API key** in the list: `AIzaSyBhbbaSKU6Klh7eelAaF-YlDa_kaokB8sg`
4. **Click on the API key** to open details
5. **Check the "Project" field** - this tells you which project it belongs to
6. **Note the project name/ID**

### Step 2: Enable Custom Search API in THAT Project

1. **Make sure you're in the CORRECT project**:
   - Look at the top bar dropdown
   - Select the project that your API key belongs to

2. **Go to Custom Search API**:
   - Navigate to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
   - OR: APIs & Services → Library → Search "Custom Search API"

3. **Enable the API**:
   - Click "Enable" button
   - Wait for confirmation (takes a few seconds)
   - You should see "API enabled" message

### Step 3: Verify API Restrictions

1. **Go back to**: https://console.cloud.google.com/apis/credentials
2. **Click your API key**
3. **Check "Application restrictions"**:
   - Should be "None" OR "IP addresses" with your server IP
4. **Check "API restrictions"**:
   - Should have "Custom Search API" selected
5. **Click "Save"**

### Step 4: Wait and Test

1. **Wait 2-3 minutes** for changes to propagate
2. **Test again**:
   ```bash
   cd /root/recruitment-os/Master
   node scripts/verify-api-setup.js
   ```

## Quick Check: Is API Enabled?

To quickly check if Custom Search API is enabled in your current project:

1. Go to: https://console.cloud.google.com/apis/dashboard
2. Look for "Custom Search API" in the list
3. If it's not there, it's not enabled
4. If it shows "Enabled", then it's enabled for that project

## Common Issues

### Issue 1: API Enabled in Wrong Project
- **Symptom**: API key works but says "not enabled"
- **Solution**: Enable API in the project the API key belongs to

### Issue 2: Multiple Projects
- **Symptom**: Confusion about which project to use
- **Solution**: Always check which project your API key belongs to first

### Issue 3: Propagation Delay
- **Symptom**: Enabled API but still getting errors
- **Solution**: Wait 2-3 minutes after enabling

## Verification Commands

After enabling, test with:
```bash
cd /root/recruitment-os/Master
node scripts/verify-api-setup.js
```

Expected output if working:
```
✅ SUCCESS! API is working correctly!
```


