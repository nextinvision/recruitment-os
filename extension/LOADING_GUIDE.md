# Chrome Extension Loading & Testing Guide

## Step 1: Build the Extension

First, ensure the extension is built:

```bash
cd extension
npm run build
```

This should create the `dist/` directory with all compiled files.

## Step 2: Load Extension in Chrome

### Method 1: Load Unpacked Extension

1. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - OR go to Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner
   - This enables loading unpacked extensions

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `extension` folder (NOT the `dist` folder)
   - Select the `extension` directory and click "Select Folder"
   - The extension should appear in your extensions list

4. **Verify Extension Loaded**
   - You should see "Recruitment OS Job Scraper" in the extensions list
   - Check for any errors (red error messages)
   - The extension icon should appear in the Chrome toolbar

## Step 3: Test the Extension

### Test 1: Check Extension Icon

1. Look for the extension icon in the Chrome toolbar (top-right)
2. Click the icon to open the popup
3. You should see the login form

### Test 2: Login Functionality

1. **Open the Extension Popup**
   - Click the extension icon in the toolbar
   - The popup should open showing the login form

2. **Test Login**
   - Enter credentials:
     - Email: `admin@recruitment.com`
     - Password: `admin123`
   - Click "Login"
   - You should see the staging area after successful login

3. **Verify Backend Connection**
   - Make sure your backend is running on `http://localhost:3000`
   - If using a different URL, update `src/shared/constants.ts`:
     ```typescript
     export function getBackendUrl(): string {
       return 'http://your-backend-url:3000'
     }
     ```
   - Rebuild: `npm run build`

### Test 3: Job Capture on LinkedIn

1. **Navigate to LinkedIn Jobs**
   - Go to `https://www.linkedin.com/jobs/`
   - Search for jobs or browse job listings

2. **Capture Jobs**
   - You should see a "Capture Jobs" button in the top-right of the page
   - Click the button
   - Jobs should be captured and added to staging

3. **Check Staging Area**
   - Open the extension popup
   - You should see captured jobs in the staging area
   - Jobs should be editable and selectable

### Test 4: Job Capture on Indeed

1. Navigate to `https://www.indeed.com/`
2. Search for jobs
3. Click "Capture Jobs" button
4. Verify jobs appear in staging area

### Test 5: Job Capture on Naukri

1. Navigate to `https://www.naukri.com/`
2. Search for jobs
3. Click "Capture Jobs" button
4. Verify jobs appear in staging area

### Test 6: Submit Jobs

1. **Select Jobs**
   - In the staging area, select jobs you want to submit
   - Use checkboxes or "Select All"

2. **Submit**
   - Click "Submit X Job(s)" button
   - You should see a success message
   - Jobs should be removed from staging

3. **Verify in Backend**
   - Check your backend database
   - Jobs should be created in the `jobs` table

## Step 4: Debugging

### Check Extension Console

1. **Open Extension Popup DevTools**
   - Right-click the extension icon
   - Select "Inspect popup"
   - This opens DevTools for the popup

2. **Check Background Service Worker**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click "service worker" link (or "Inspect views: service worker")
   - This opens DevTools for the background script

3. **Check Content Script Console**
   - Go to a job listing page (LinkedIn, Indeed, or Naukri)
   - Open regular page DevTools (F12)
   - Check Console tab for any errors

### Common Issues & Solutions

#### Issue 1: Extension Not Loading

**Symptoms**: Error when loading unpacked extension

**Solutions**:
- Make sure you selected the `extension` folder (not `dist`)
- Check that `dist/` folder exists and has files
- Run `npm run build` again
- Check `manifest.json` for syntax errors

#### Issue 2: Popup Not Opening

**Symptoms**: Clicking extension icon does nothing

**Solutions**:
- Check browser console for errors
- Verify `dist/popup/index.html` exists
- Check manifest.json `default_popup` path is correct
- Rebuild: `npm run build`

#### Issue 3: "Capture Jobs" Button Not Appearing

**Symptoms**: No button on job listing pages

**Solutions**:
- Check that you're on a supported platform (LinkedIn, Indeed, Naukri)
- Verify you're on a job listing or detail page
- Open page DevTools (F12) and check Console for errors
- Check content script is loaded: Look for errors in `chrome://extensions/` → service worker

#### Issue 4: Login Fails

**Symptoms**: Login button shows error

**Solutions**:
- Verify backend is running: `http://localhost:3000`
- Check backend URL in `src/shared/constants.ts`
- Rebuild after changing constants: `npm run build`
- Check network tab in popup DevTools for API errors
- Verify CORS is configured on backend

#### Issue 5: Jobs Not Capturing

**Symptoms**: Click "Capture Jobs" but nothing happens

**Solutions**:
- Check browser console on the job page
- Verify DOM selectors match current page structure
- Check if platform changed their HTML structure
- Look for errors in content script console

#### Issue 6: Jobs Not Submitting

**Symptoms**: Submit button doesn't work or shows error

**Solutions**:
- Verify you're logged in (check popup shows user info)
- Check backend is running and accessible
- Verify JWT token is valid (check storage in DevTools)
- Check network tab for API errors

### Check Extension Storage

1. Open popup DevTools (right-click extension icon → Inspect popup)
2. Go to Application tab → Storage → Local Storage
3. Check for:
   - `auth_token` - JWT token
   - `user_data` - User information
   - `staging_jobs` - Captured jobs

### View Extension Logs

1. **Background Script Logs**
   - Go to `chrome://extensions/`
   - Click "service worker" link
   - Check Console tab

2. **Popup Logs**
   - Right-click extension icon → Inspect popup
   - Check Console tab

3. **Content Script Logs**
   - Open job page DevTools (F12)
   - Check Console tab

## Step 5: Reload Extension After Changes

After making code changes:

1. **Rebuild**
   ```bash
   npm run build
   ```

2. **Reload Extension**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click the reload icon (↻)
   - OR toggle the extension off and on

3. **Test Again**
   - Refresh job pages if testing content scripts
   - Reopen popup if testing popup changes

## Quick Test Checklist

- [ ] Extension loads without errors
- [ ] Extension icon appears in toolbar
- [ ] Popup opens when clicking icon
- [ ] Login form displays correctly
- [ ] Login works with valid credentials
- [ ] Staging area shows after login
- [ ] "Capture Jobs" button appears on job pages
- [ ] Jobs are captured successfully
- [ ] Jobs appear in staging area
- [ ] Jobs can be edited
- [ ] Jobs can be selected
- [ ] Jobs can be submitted
- [ ] Submitted jobs appear in backend

## Production Checklist

Before deploying:

- [ ] Update backend URL in `src/shared/constants.ts`
- [ ] Create proper icon files (see `ICONS_README.md`)
- [ ] Test on all three platforms (LinkedIn, Indeed, Naukri)
- [ ] Test with different user roles (Admin, Manager, Recruiter)
- [ ] Verify error handling works
- [ ] Check that sensitive data is not logged
- [ ] Test on different browsers (if needed)
- [ ] Update version in `manifest.json`

## Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Verify all build steps completed successfully
3. Ensure backend is running and accessible
4. Check that you're using the correct backend URL
5. Review the error messages in DevTools

