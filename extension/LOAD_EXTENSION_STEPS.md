# Step-by-Step: Load Extension in Chrome

## ✅ Correct Page to Use

**NOT:** `developer.chrome.com/docs/extensions` (documentation)
**YES:** `chrome://extensions/` (extensions management page)

## 📋 Exact Steps

### Step 1: Open Extensions Page

In Chrome's address bar, type:
```
chrome://extensions/
```

Then press Enter.

**OR** navigate via menu:
- Click the three dots (⋮) in top-right
- Go to: **Extensions** → **Manage Extensions**

### Step 2: Enable Developer Mode

1. Look at the **top-right corner** of the extensions page
2. Find the toggle switch labeled **"Developer mode"**
3. **Turn it ON** (toggle to the right)

### Step 3: Load Your Extension

1. After enabling Developer mode, you'll see new buttons:
   - **"Load unpacked"** button will appear
2. Click **"Load unpacked"**
3. Navigate to your extension folder:
   ```
   C:\Users\anand\Documents\NEXTIN VISION\Recruitment-os\extension
   ```
4. **Select the `extension` folder** (NOT the `dist` folder)
5. Click **"Select Folder"**

### Step 4: Verify Extension Loaded

You should see:
- ✅ "Recruitment OS Job Scraper" in the extensions list
- ✅ Extension icon in Chrome toolbar (top-right)
- ✅ No red error messages

### Step 5: Test the Extension

1. **Click the extension icon** in Chrome toolbar
2. Popup should open
3. Try logging in with:
   - Email: `admin@recruitment.com`
   - Password: `admin123`

## 🎯 Visual Guide

**Extensions Page Should Look Like:**
```
┌─────────────────────────────────────────┐
│  Extensions                    [Developer mode: ON] │
├─────────────────────────────────────────┤
│                                         │
│  [Load unpacked]  [Pack extension]     │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Recruitment OS Job Scraper      │  │
│  │ [Toggle] [Details] [Remove]     │  │
│  └─────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## ❌ Common Mistakes

1. **Wrong page:** Using documentation site instead of `chrome://extensions/`
2. **Wrong folder:** Selecting `dist` instead of `extension` folder
3. **Developer mode off:** Forgetting to enable Developer mode first
4. **Not built:** Forgetting to run `npm run build` first

## ✅ Quick Checklist

- [ ] Opened `chrome://extensions/` (not docs site)
- [ ] Enabled Developer mode
- [ ] Built extension: `npm run build`
- [ ] Clicked "Load unpacked"
- [ ] Selected `extension` folder (not `dist`)
- [ ] Extension appears in list
- [ ] Extension icon visible in toolbar

## 🔧 If Extension Doesn't Load

1. **Check for errors:**
   - Look for red error messages on extensions page
   - Click "Errors" button if visible

2. **Verify build:**
   ```bash
   cd extension
   npm run build
   ```

3. **Check manifest:**
   - Verify `manifest.json` exists
   - Check file paths in manifest are correct

4. **Reload extension:**
   - Click the reload icon (↻) on the extension card

## 📝 Next Steps After Loading

1. **Test popup:** Click extension icon
2. **Test login:** Use test credentials
3. **Test job capture:** Go to LinkedIn/Indeed/Naukri
4. **Check console:** Right-click extension icon → Inspect popup

