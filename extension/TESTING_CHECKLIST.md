# Extension Testing Checklist

## ✅ Extension Loaded Successfully!

Now let's test all the features:

## Step 1: Test the Popup

1. **Find the extension icon** in Chrome toolbar (top-right)
2. **Click the icon** - popup should open
3. **You should see:** Login form

## Step 2: Test Login

1. **In the popup, enter:**
   - Email: `admin@recruitment.com`
   - Password: `admin123`

2. **Click "Login"**

3. **Expected result:**
   - ✅ Login successful
   - ✅ Popup shows staging area
   - ✅ Your name/email displayed at top

**If login fails:**
- Check backend is running: `cd Master && npm run dev`
- Verify backend URL in `src/shared/constants.ts` is `http://localhost:3000`
- Check browser console (right-click popup → Inspect popup)

## Step 3: Test Job Capture (LinkedIn)

1. **Open a new tab**
2. **Go to:** `https://www.linkedin.com/jobs/`
3. **Search for jobs** or browse listings
4. **Look for:** "Capture Jobs" button (top-right of page)
5. **Click "Capture Jobs"**
6. **Expected:**
   - Button shows "✓ Captured X job(s)"
   - Jobs are added to staging

## Step 4: Test Job Capture (Indeed)

1. **Go to:** `https://www.indeed.com/`
2. **Search for jobs**
3. **Click "Capture Jobs" button**
4. **Verify jobs captured**

## Step 5: Test Job Capture (Naukri)

1. **Go to:** `https://www.naukri.com/`
2. **Search for jobs**
3. **Click "Capture Jobs" button**
4. **Verify jobs captured**

## Step 6: Review Staging Area

1. **Open extension popup**
2. **You should see:**
   - Captured jobs listed
   - Each job shows: title, company, location
   - Checkboxes to select jobs
   - Edit and Delete buttons

## Step 7: Test Job Editing

1. **Click "Edit" on a job**
2. **Modify fields** (title, company, location, description)
3. **Click "Save"**
4. **Verify changes saved**

## Step 8: Test Job Selection

1. **Select/deselect jobs** using checkboxes
2. **Use "Select All" / "Deselect All"** buttons
3. **Verify selection count updates**

## Step 9: Test Job Submission

1. **Select some jobs** (checkboxes)
2. **Click "Submit X Job(s)" button**
3. **Expected:**
   - Success message
   - Jobs removed from staging
   - Jobs appear in backend database

## Step 10: Verify in Backend

1. **Check backend database:**
   ```bash
   cd Master
   npm run db:studio
   ```
2. **Or check via API:**
   - Use the token from login
   - Call `GET /api/jobs` with Authorization header

## Troubleshooting

### Popup Not Opening?
- Check extension is enabled in `chrome://extensions/`
- Look for errors in extension details
- Try reloading extension (click ↻ icon)

### "Capture Jobs" Button Not Appearing?
- Make sure you're on a job listing page
- Check URL matches: `/jobs/` for LinkedIn
- Open browser console (F12) for errors
- Verify content script loaded (check `chrome://extensions/` → service worker)

### Login Fails?
- **Backend running?** `cd Master && npm run dev`
- **Backend URL correct?** Check `src/shared/constants.ts`
- **CORS configured?** Backend should allow requests from extension
- **Check network tab** in popup DevTools

### Jobs Not Capturing?
- Check browser console on job page (F12)
- Verify DOM selectors match current page structure
- Platform may have changed their HTML

### Jobs Not Submitting?
- Verify you're logged in (check popup shows user info)
- Check backend is accessible
- Look for errors in popup console

## Quick Test Flow

```
1. Click extension icon → Popup opens
2. Login → See staging area
3. Go to LinkedIn jobs → Click "Capture Jobs"
4. Open popup → See captured jobs
5. Select jobs → Click "Submit"
6. Verify in backend → Jobs created ✅
```

## Success Indicators

✅ Extension icon visible in toolbar
✅ Popup opens when clicking icon
✅ Login works
✅ "Capture Jobs" button appears on job pages
✅ Jobs are captured
✅ Jobs appear in staging area
✅ Jobs can be edited
✅ Jobs can be submitted
✅ Jobs appear in backend

## Next Steps

Once everything works:
- Test on all three platforms (LinkedIn, Indeed, Naukri)
- Test with different user roles
- Test error scenarios
- Add custom icons (optional)
- Prepare for production deployment

