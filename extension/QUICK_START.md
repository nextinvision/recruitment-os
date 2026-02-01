# Quick Start Guide

## 1. Build Extension

```bash
cd extension
npm install  # If not already done
npm run build
```

## 2. Load in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension` folder (NOT `dist` folder)
5. Extension should appear in list

## 3. Test Login

1. Click extension icon in toolbar
2. Login with:
   - Email: `admin@recruitment.com`
   - Password: `admin123`
3. Should see staging area after login

## 4. Test Job Capture

1. Go to `https://www.linkedin.com/jobs/`
2. Look for "Capture Jobs" button (top-right)
3. Click it
4. Open extension popup to see captured jobs

## 5. Submit Jobs

1. Select jobs in staging area
2. Click "Submit X Job(s)"
3. Jobs should be sent to backend

## Troubleshooting

- **Backend not running?** Start it: `cd Master && npm run dev`
- **Extension not loading?** Make sure you selected `extension` folder, not `dist`
- **Button not appearing?** Check you're on a job listing page
- **Login fails?** Verify backend URL in `src/shared/constants.ts` and rebuild

For detailed guide, see `LOADING_GUIDE.md`

