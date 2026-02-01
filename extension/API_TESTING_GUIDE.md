# API Testing Guide

## 🧪 Built-in API Test Suite

The extension now includes a comprehensive API test suite that you can run directly from the popup!

## 📋 How to Use

### Step 1: Open Extension Popup
1. Click the extension icon in Chrome toolbar
2. You should see the login screen

### Step 2: Access Test Panel
1. Click the **"Test APIs"** button at the top of the popup
2. The test panel will appear

### Step 3: Run Tests
1. Click **"Run All Tests"** button
2. Watch as all APIs are tested automatically
3. Results will appear in real-time

## ✅ APIs Tested

The test suite automatically tests:

1. **POST /api/auth/login** ✅
   - Tests login with admin credentials
   - Extracts JWT token for subsequent tests

2. **GET /api/jobs** ✅
   - Tests fetching all jobs (requires auth)
   - Verifies JWT token works

3. **POST /api/jobs** ✅
   - Tests creating a single job (requires auth)
   - Creates a test job entry

4. **POST /api/jobs/bulk** ✅
   - Tests bulk job creation (requires auth)
   - Creates multiple jobs at once

5. **GET /api/candidates** ✅
   - Tests fetching all candidates (requires auth)

6. **POST /api/candidates** ✅
   - Tests creating a candidate (requires auth)
   - Creates a test candidate entry

7. **GET /api/applications** ✅
   - Tests fetching all applications (requires auth)

## 📊 Test Results

Each test shows:
- ✅ **Pass** - API call succeeded
- ❌ **Fail** - API call failed (with error message)
- ⏭️ **Skip** - Test skipped (usually due to missing auth)

Results include:
- HTTP status code
- Response duration (ms)
- Error messages (if any)

## 🎯 Test Credentials

The test suite uses:
- **Email:** `admin@recruitment.com`
- **Password:** `admin123`

These are the default admin credentials from the seed script.

## 🔍 What Gets Tested

### Authentication Flow
1. Login API is tested first
2. If login succeeds, JWT token is extracted
3. Token is used for all subsequent authenticated requests

### Data Operations
- **Read operations:** GET requests to fetch data
- **Write operations:** POST requests to create data
- **Bulk operations:** Multiple items created at once

### Error Handling
- Network errors (server not running)
- Authentication errors (invalid token)
- Validation errors (invalid data)
- Authorization errors (insufficient permissions)

## 🐛 Troubleshooting

### All Tests Fail
**Possible causes:**
1. Backend not running
   - Solution: Start backend with `cd Master && npm run dev`
2. Wrong backend URL
   - Check `extension/src/shared/constants.ts`
   - Should be `http://localhost:3000`
3. CORS issues
   - Backend should have CORS enabled (already implemented)

### Login Test Fails
**Possible causes:**
1. Wrong credentials
   - Default: `admin@recruitment.com` / `admin123`
2. Database not seeded
   - Run: `cd Master && npm run db:seed`
3. Backend not running
   - Start: `cd Master && npm run dev`

### Authenticated Tests Skip
**Possible causes:**
1. Login test failed
   - Fix login first
2. Token not stored
   - Check browser console for errors
   - Check extension storage

## 📝 Test Output Example

```
✅ POST /api/auth/login - Success
   Status: 200 | Duration: 45ms

✅ GET /api/jobs - Success
   Status: 200 | Duration: 23ms

✅ POST /api/jobs - Success
   Status: 201 | Duration: 67ms

✅ POST /api/jobs/bulk - Success
   Status: 201 | Duration: 89ms

✅ GET /api/candidates - Success
   Status: 200 | Duration: 31ms

✅ POST /api/candidates - Success
   Status: 201 | Duration: 52ms

✅ GET /api/applications - Success
   Status: 200 | Duration: 28ms
```

## 🔧 Customizing Tests

### Change Test Data
Edit `extension/src/shared/api-tester.ts`:
- Modify test job data in `testCreateJob()`
- Modify test candidate data in `testCreateCandidate()`
- Modify bulk job data in `testBulkJobs()`

### Add More Tests
Add new test methods to `ApiTester` class:
```typescript
async testGetJobById(id: string): Promise<TestResult> {
  return this.makeRequest(`/api/jobs/${id}`, 'GET')
}
```

### Change Backend URL
Edit `extension/src/shared/constants.ts`:
```typescript
export function getBackendUrl(): string {
  return 'http://your-backend-url:3000'
}
```

## 🎉 Benefits

- **Quick verification** - Test all APIs in seconds
- **Visual feedback** - See pass/fail status immediately
- **No external tools** - Everything built into the extension
- **Real requests** - Tests actual API endpoints
- **Error details** - See exact error messages

## 📌 Next Steps

1. **Reload extension** in Chrome
2. **Open popup** and click "Test APIs"
3. **Run tests** and verify all APIs work
4. **Check results** for any failures
5. **Fix issues** if any tests fail

Happy testing! 🚀

