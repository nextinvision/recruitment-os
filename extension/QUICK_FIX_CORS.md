# Quick Fix for CORS Error

## The Problem

When you open `dist/popup/index.html` directly (double-click), you get:
```
Access to script at 'file:///C:/index.js' from origin 'null' has been blocked by CORS policy
```

**Why?** Browsers block ES modules when opened via `file://` protocol for security.

## ✅ Solution 1: Use HTTP Server (Easiest)

### Option A: Test Server (Recommended)

1. **Start the server:**
   ```bash
   npm run test:server
   ```

2. **Open in browser:**
   - `http://localhost:3001/dist/popup/index.html`
   - `http://localhost:3001/test/popup-test.html`

### Option B: Python Server

```bash
cd extension
python -m http.server 8000
# Then open: http://localhost:8000/dist/popup/index.html
```

### Option C: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `dist/popup/index.html`
3. Select "Open with Live Server"

## ✅ Solution 2: Load Extension in Chrome (Best)

This is the **proper way** to test a Chrome extension:

1. **Build:**
   ```bash
   npm run build
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `extension` folder
   - Click the extension icon to open popup

**No CORS errors** because extensions run in `chrome-extension://` protocol!

## ✅ Solution 3: Fixed Build (Already Done)

I've updated the Vite config to use relative paths. Try opening `dist/popup/index.html` again - it might work now!

If it still doesn't work, use Solution 1 or 2.

## 🎯 Recommended Workflow

**For Quick Testing:**
```bash
npm run test:server
# Open: http://localhost:3001/dist/popup/index.html
```

**For Real Extension Testing:**
- Load extension in Chrome (Solution 2)

## Why This Happens

- `file://` protocol = local file system
- Browsers block ES modules from `file://` for security
- Extensions use `chrome-extension://` protocol (no CORS issues)
- HTTP servers use `http://` protocol (no CORS issues)

**The error is normal** - it's browser security working as intended!

