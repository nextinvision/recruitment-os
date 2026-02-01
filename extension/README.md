# Recruitment OS Chrome Extension

A Chrome Extension for manual job scraping from LinkedIn, Indeed, and Naukri that integrates with the Recruitment OS backend.

## Features

- ✅ Manual job scraping (human-in-the-loop, no automation)
- ✅ Support for LinkedIn, Indeed, and Naukri
- ✅ JWT authentication with backend
- ✅ Staging area for reviewing and editing scraped jobs
- ✅ Bulk job submission
- ✅ Real-time validation
- ✅ Chrome Extension Manifest V3

## Setup

### 1. Install Dependencies

```bash
cd extension
npm install
```

### 2. Configure Backend URL

Update `src/shared/constants.ts` to set your backend URL, or set the `BACKEND_URL` environment variable.

Default: `http://localhost:3000`

### 3. Build the Extension

```bash
npm run build
```

This will:
- Build the React popup UI
- Compile TypeScript for background and content scripts
- Output everything to the `dist/` directory

### 4. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` directory (not the `dist` directory)
5. The extension should now appear in your extensions list

## Development

### Watch Mode

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Type Checking

```bash
npm run type-check
```

## Project Structure

```
extension/
├── src/
│   ├── background/
│   │   ├── service-worker.ts    # Background service worker
│   │   └── api-client.ts         # API client for backend
│   ├── content/
│   │   ├── content-script.ts     # Content script injected into pages
│   │   ├── job-detector.ts       # Detects platform and job pages
│   │   ├── job-scraper.ts        # Scrapes jobs from DOM
│   │   ├── dom-extractor.ts      # DOM extraction utilities
│   │   └── selectors/
│   │       ├── linkedin.ts       # LinkedIn DOM selectors
│   │       ├── indeed.ts          # Indeed DOM selectors
│   │       └── naukri.ts         # Naukri DOM selectors
│   ├── popup/
│   │   ├── App.tsx               # Main popup component
│   │   ├── LoginForm.tsx         # Login UI
│   │   ├── JobStaging.tsx        # Staging area UI
│   │   ├── JobEditor.tsx         # Job editing UI
│   │   ├── BulkSelector.tsx      # Bulk selection UI
│   │   └── index.tsx            # Popup entry point
│   └── shared/
│       ├── types.ts              # TypeScript types
│       ├── validation.ts         # Zod validation schemas
│       └── constants.ts         # Constants and config
├── popup/
│   └── index.html               # Popup HTML
├── manifest.json                # Chrome extension manifest
└── package.json
```

## Usage

### 1. Login

1. Click the extension icon
2. Enter your Recruitment OS credentials
3. Click "Login"

### 2. Capture Jobs

1. Navigate to a job listing page on LinkedIn, Indeed, or Naukri
2. Click the "Capture Jobs" button that appears on the page
3. Jobs will be extracted and added to the staging area

### 3. Review and Edit

1. Open the extension popup
2. Review captured jobs in the staging area
3. Edit jobs by clicking "Edit"
4. Delete invalid jobs
5. Select jobs to submit

### 4. Submit Jobs

1. Select the jobs you want to submit
2. Click "Submit X Job(s)"
3. Jobs will be sent to the backend API

## API Integration

The extension communicates with the Recruitment OS backend:

- `POST /api/auth/login` - Authentication
- `POST /api/jobs/bulk` - Bulk job submission

### Job Payload Format

```typescript
{
  jobs: [
    {
      title: string
      company: string
      location: string
      description: string
      source: "LINKEDIN" | "INDEED" | "NAUKRI"
    }
  ]
}
```

## Icons

Place icon files in the `icons/` directory:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use placeholder icons for development.

## Troubleshooting

### Extension Not Loading

- Make sure you've run `npm run build`
- Check that `dist/` directory contains compiled files
- Verify manifest.json paths are correct

### Jobs Not Capturing

- Ensure you're on a supported platform (LinkedIn, Indeed, Naukri)
- Check that you're on a job listing or detail page
- Open browser console to see any errors
- DOM selectors may need updating if the platform changed their structure

### Authentication Issues

- Verify backend URL is correct in `constants.ts`
- Check that backend is running and accessible
- Ensure CORS is properly configured on the backend

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version compatibility
- Verify all import paths are correct

## Security Notes

- JWT tokens are stored in `chrome.storage.local`
- Tokens are sent with all API requests
- No sensitive data is stored permanently
- All communication is over HTTPS (in production)

## License

Internal use only - Recruitment OS

