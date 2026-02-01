# Testing Guide - Test Extension Without Loading in Chrome

## Quick Start

### Option 1: Test Popup in Browser (Easiest)

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Open test page:**
   - Open `test/popup-test.html` in your browser
   - Or run: `npm run test:popup` (opens automatically)

3. **Test the popup:**
   - Click "Load Popup Component"
   - Use mock buttons to simulate login and jobs
   - Chrome APIs are already mocked

### Option 2: Unit Tests

1. **Install test dependencies:**
   ```bash
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test              # Run tests in watch mode
   npm run test:ui       # Run with UI
   npm run test:coverage # Run with coverage
   ```

### Option 3: Test Built Popup Directly

1. **Build extension:**
   ```bash
   npm run build
   ```

2. **Open popup HTML:**
   - Open `dist/popup/index.html` in your browser
   - Chrome APIs are mocked in `test/popup-test.html`
   - Copy the mock script section to test the actual popup

## Testing Methods

### 1. Component Testing (Popup UI)

**File:** `test/popup-test.html`

This standalone HTML page:
- ✅ Mocks all Chrome APIs
- ✅ Allows testing popup components
- ✅ No Chrome extension needed
- ✅ Works in any browser

**Usage:**
1. Open `test/popup-test.html` in browser
2. Click "Load Popup Component"
3. Use mock buttons to simulate scenarios

### 2. Unit Tests

**Files:** `test/unit/*.test.ts`

Test individual modules:
- ✅ Job validation
- ✅ Job scraping logic
- ✅ DOM extraction
- ✅ Platform detection

**Run:**
```bash
npm test
```

### 3. Integration Testing

Test how components work together:
- ✅ Login flow
- ✅ Job capture flow
- ✅ Job submission flow

### 4. Manual Testing (Still Needed)

Some things still need Chrome:
- ❌ Content script injection
- ❌ Service worker
- ❌ Actual DOM scraping on job sites
- ❌ Real Chrome storage

## Test Files Structure

```
test/
├── popup-test.html          # Standalone popup test page
├── setup.ts                 # Test configuration
├── helpers/
│   └── chrome-mock.ts       # Chrome API mocks
└── unit/
    ├── job-scraper.test.ts  # Scraper tests
    └── validation.test.ts   # Validation tests
```

## Mock Chrome APIs

The test setup includes mocks for:

- ✅ `chrome.storage.local` - Storage operations
- ✅ `chrome.runtime.sendMessage` - Message passing
- ✅ `chrome.runtime.onMessage` - Message listeners

## Example Test Scenarios

### Test 1: Login Flow

```javascript
// In popup-test.html, click "Mock Login Success"
// Then reload popup component
// Should show staging area with user info
```

### Test 2: Job Validation

```bash
npm test validation.test.ts
```

### Test 3: Job Scraping

```bash
npm test job-scraper.test.ts
```

## Limitations

What you CAN test without Chrome:
- ✅ React components
- ✅ Validation logic
- ✅ Business logic
- ✅ API client (with mocks)
- ✅ UI interactions

What you CANNOT test without Chrome:
- ❌ Content script injection
- ❌ Service worker execution
- ❌ Real DOM scraping on job sites
- ❌ Actual Chrome storage
- ❌ Extension permissions

## Best Practice Workflow

1. **Develop & Test Locally:**
   - Use `test/popup-test.html` for UI testing
   - Use unit tests for logic testing
   - Fast feedback loop

2. **Test in Chrome:**
   - Load extension in Chrome
   - Test on real job sites
   - Verify end-to-end flow

3. **Automate:**
   - Use Puppeteer/Playwright for E2E
   - Run tests in CI/CD

## Quick Commands

```bash
# Run all tests
npm test

# Test with UI
npm run test:ui

# Test with coverage
npm run test:coverage

# Open popup test page
npm run test:popup

# Build and test
npm run build && npm test
```

## Troubleshooting

### Tests not running?
- Make sure dependencies are installed: `npm install`
- Check that `vitest` is in devDependencies

### Chrome mocks not working?
- Check `test/setup.ts` is loaded
- Verify `chromeMock` is imported correctly

### Popup test page not loading?
- Make sure extension is built: `npm run build`
- Check browser console for errors
- Verify Chrome mocks are included in HTML

