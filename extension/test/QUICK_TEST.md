# Quick Test Instructions

## You've Successfully Opened the Test Page! ✅

I can see you have `popup-test.html` open in your browser. Here's what to do next:

## Option 1: Test the Built Popup (Recommended)

1. **Build the extension first:**
   ```bash
   cd extension
   npm run build
   ```

2. **Open the built popup:**
   - In your browser, open a new tab
   - Navigate to: `C:\Users\anand\Documents\NEXTIN VISION\Recruitment-os\extension\dist\popup\index.html`
   - Or drag `dist/popup/index.html` into Chrome

3. **The popup will work** because Chrome APIs are mocked in the test page!

## Option 2: Use the Test Page Buttons

On the current test page:

1. **Click "Mock Login Success"** - This simulates a successful login
2. **Click "Mock Captured Jobs"** - This adds sample jobs to staging
3. **Then open the built popup** (`dist/popup/index.html`) to see the mocked data

## Option 3: Test Individual Components

Run unit tests:
```bash
npm test
```

## What Each Button Does

- **"Load Popup Component"** - Shows instructions (you're seeing this now)
- **"Mock Login Success"** - Simulates login, stores token in localStorage
- **"Mock Captured Jobs"** - Adds sample jobs to staging area
- **"Clear"** - Clears all mocked data

## Next Steps

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Open the built popup:**
   - File: `dist/popup/index.html`
   - It will use the mocked Chrome APIs automatically

3. **Test the flow:**
   - Click "Mock Login Success" on test page
   - Open `dist/popup/index.html`
   - You should see the staging area (logged in state)

## Why Two Files?

- **`test/popup-test.html`** - Test page with Chrome API mocks and helper buttons
- **`dist/popup/index.html`** - The actual popup component (after building)

The test page provides the mocks, the built popup uses them!

