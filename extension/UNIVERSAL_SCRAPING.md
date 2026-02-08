# Universal Job Scraping Implementation

## Overview
The extension now supports scraping jobs from **ANY website**, not just LinkedIn, Indeed, and Naukri. This is achieved through intelligent heuristics and universal DOM extraction.

## Features Implemented

### 1. Universal Job Detector (`universal-detector.ts`)
- **Intelligent Detection**: Uses multiple heuristics to detect job listings:
  - URL patterns (`/jobs`, `/careers`, `/opportunities`, etc.)
  - Page title patterns
  - Body text analysis
  - DOM element analysis (job-related classes/IDs)
- **Confidence Scoring**: Each detected job gets a confidence score (0-1)
- **Multiple Strategies**: 
  - Structured job cards (common patterns)
  - List items analysis
  - Article/section elements

### 2. Universal DOM Extractor (`universal-extractor.ts`)
- **Heuristic-based Extraction**: Extracts job data using intelligent patterns:
  - Title: Looks in headings, bold text, first line
  - Company: Searches for company-related classes, links
  - Location: Pattern matching for cities, states, remote/hybrid
  - Description: Finds description containers or uses full text
- **Fallback Mechanisms**: Multiple extraction strategies with confidence scoring
- **Detail Page Support**: Can extract single job from detail pages

### 3. Updated Content Script
- **Always-On Button**: Capture button appears on any website
  - Blue button for known platforms (LinkedIn, Indeed, Naukri)
  - Green button for unknown websites (universal scraping)
- **Dual Mode**: 
  - Uses platform-specific scrapers for known sites (more accurate)
  - Falls back to universal scraper for unknown sites
- **Better Error Handling**: Clear error messages and fallback options

### 4. Updated Validation
- **New Source Type**: Added `'other'` as a valid job source
- **Backend Compatibility**: Jobs with `source: 'other'` are sent as `'OTHER'` to backend

### 5. Enhanced Manifest
- **Universal Content Script**: Added content script for all URLs (excluding known platforms to avoid duplicates)
- **Wide Permissions**: Can now run on any website

## How It Works

### For Known Platforms (LinkedIn, Indeed, Naukri)
1. Uses platform-specific selectors (more accurate)
2. Blue "Capture Jobs" button
3. Optimized extraction logic

### For Unknown Websites
1. Universal detector analyzes page structure
2. Finds potential job elements using heuristics
3. Extracts data with confidence scoring
4. Green "Scrape Jobs" button
5. Filters low-confidence results (< 0.4)

## Usage

### Basic Usage
1. Navigate to any job listing website
2. Click the "Scrape Jobs" button (green for unknown sites, blue for known)
3. Jobs are captured and sent to staging area
4. Review and edit jobs in the extension popup
5. Submit to dashboard via API

### Tips for Best Results
- **Job Listing Pages**: Works best on pages with multiple job listings
- **Detail Pages**: Can extract single job from detail pages
- **Page Structure**: Works better on well-structured pages with semantic HTML
- **Review Before Submit**: Always review scraped jobs as heuristics may miss some fields

## Technical Details

### Confidence Scoring
- **0.4-0.6**: Low confidence (may need manual editing)
- **0.6-0.8**: Medium confidence (usually good)
- **0.8-1.0**: High confidence (very reliable)

### Extraction Strategies
1. **Structured Cards**: Looks for common job card patterns
2. **List Items**: Analyzes `<li>` and list-like elements
3. **Articles/Sections**: Examines semantic HTML elements
4. **Detail Pages**: Extracts from main content areas

### Limitations
- **Dynamic Content**: May struggle with heavily JavaScript-rendered content
- **Custom Structures**: Very custom page structures may need manual selection (future feature)
- **Accuracy**: Universal scraping is less accurate than platform-specific scrapers
- **Validation**: All jobs are validated before submission (invalid jobs can't be submitted)

## API Integration

Jobs are submitted to the backend via:
- **Endpoint**: `POST /api/jobs/bulk`
- **Authentication**: Requires valid JWT token
- **Format**: Array of `JobInput` objects
- **Source Mapping**: `'other'` → `'OTHER'` (backend enum)

## Future Enhancements

1. **Manual Element Selection**: Allow users to manually select job elements
2. **Custom Selectors**: Save custom selectors for frequently scraped sites
3. **Machine Learning**: Improve detection accuracy with ML models
4. **Batch Processing**: Scrape multiple pages automatically
5. **Preview Mode**: Show what will be extracted before capturing

## Files Modified/Created

### New Files
- `src/content/universal-detector.ts` - Universal job detection logic
- `src/content/universal-extractor.ts` - Universal DOM extraction

### Modified Files
- `src/content/content-script.ts` - Updated to support universal scraping
- `src/shared/types.ts` - Added `'other'` to `JobSource` type
- `src/shared/validation.ts` - Updated validation schema
- `src/popup/App.tsx` - Updated submission to support 'OTHER' source
- `manifest.json` - Added universal content script

## Testing

To test universal scraping:
1. Build the extension: `npm run build`
2. Load in Chrome
3. Navigate to any job website (e.g., company careers page)
4. Click "Scrape Jobs" button
5. Verify jobs are captured correctly
6. Submit to dashboard and verify in backend

