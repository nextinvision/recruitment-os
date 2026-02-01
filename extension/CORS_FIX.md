# CORS Error Fix - Understanding and Solutions

## 🔴 The Error

```
Access to script at 'file:///C:/index.js' from origin 'null' has been blocked by CORS policy
```

## 📖 Why This Happens

When you open an HTML file directly from your computer (`file://` protocol), browsers block ES module imports for security reasons. This is a **browser security feature**, not a bug in your code.

**The Problem:**
- HTML file opened via `file:///C:/path/to/file.html`
- HTML tries to load: `<script type="module" src="./index.js">`
- Browser blocks it because `file://` doesn't allow cross-origin module loading

## ✅ Solutions

### Solution 1: Use HTTP Server (Recommended)

**Option A: Use the Test Server**

1. **Start the test server:**
   ```bash
   npm run test:server
   ```

2. **Open in browser:**
   - `http://localhost:3001/test/popup-test.html`
   - `http://localhost:3001/dist/popup/index.html`

**Option B: Use Python (if installed)**

```bash
# Python 3
cd extension
python -m http.server 8000

# Then open: http://localhost:8000/dist/popup/index.html
```

**Option C: Use VS Code Live Server**

1. Install "Live Server" extension in VS Code
2. Right-click `dist/popup/index.html`
3. Select "Open with Live Server"

### Solution 2: Load Extension in Chrome (Best for Real Testing)

Instead of opening the HTML file directly, **load the extension in Chrome**:

1. Build: `npm run build`
2. Open `chrome://extensions/`
3. Enable Developer mode
4. Click "Load unpacked"
5. Select the `extension` folder
6. Click the extension icon to open popup

This is the **proper way** to test a Chrome extension!

### Solution 3: Use Inline Script (Not Recommended)

You could inline the script, but this makes the file huge and is not practical for production.

## 🎯 Recommended Workflow

### For Development Testing:

1. **Use the test server:**
   ```bash
   npm run test:server
   ```
   Then open: `http://localhost:3001/dist/popup/index.html`

### For Real Extension Testing:

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked → Select `extension` folder
   - Click extension icon

## 🔧 Quick Fix Commands

```bash
# Start test server
npm run test:server

# Or use Python
python -m http.server 8000

# Or use npx serve (if installed)
npx serve extension
```

## 📝 Why This Matters

- **Security**: Browsers prevent `file://` from loading modules to protect your computer
- **Extension Context**: Chrome extensions run in a special context (`chrome-extension://`)
- **Best Practice**: Always test extensions by loading them in Chrome, not opening HTML files directly

## ✅ Summary

**Don't:** Open `dist/popup/index.html` directly (double-click)
**Do:** Either:
1. Use HTTP server: `npm run test:server`
2. Load extension in Chrome (proper way)

The CORS error is **expected behavior** - it's the browser protecting you!

