# Google Programmable Search Engine Setup Guide

## Step-by-Step Setup Instructions

### Step 1: Add Job Sites to Search Engine

In the "Select sites or pages to search" section, add the following job sites one by one:

#### Major Job Boards (Add these first):
```
www.linkedin.com/jobs/*
www.indeed.com/jobs/*
www.naukri.com/jobs/*
www.glassdoor.com/Job/*
www.monster.com/jobs/*
www.ziprecruiter.com/jobs/*
www.simplyhired.com/jobs/*
www.careerbuilder.com/jobs/*
www.dice.com/jobs/*
www.reed.co.uk/jobs/*
```

#### Tech-Specific Job Boards:
```
www.stackoverflow.com/jobs/*
www.angel.co/jobs/*
www.hired.com/jobs/*
www.toptal.com/careers/*
www.remote.co/remote-jobs/*
www.remotely.works/jobs/*
www.weworkremotely.com/categories/remote-programming-jobs
```

#### Regional Job Boards (Add based on your needs):
```
www.seek.com.au/jobs/*          (Australia)
www.workopolis.com/jobs/*        (Canada)
www.jobstreet.com.sg/jobs/*      (Singapore)
www.naukri.com/jobs/*            (India)
www.stepstone.de/jobs/*          (Germany)
www.indeed.fr/jobs/*             (France)
```

#### Company Career Pages (Optional - for direct company listings):
```
careers.google.com/jobs/*
jobs.apple.com/jobs/*
careers.microsoft.com/us/en/search-results
www.amazon.jobs/en/jobs/*
careers.facebook.com/jobs/*
```

### Step 2: Configuration Settings

#### Search Engine Name:
- Keep: `careerist` (or change to `careerist-job-search`)

#### Search Settings:
- **Image search**: Turn OFF (we only need job listings)
- **SafeSearch**: Turn OFF (to get all job results)

### Step 3: Create the Search Engine

1. Check the "I'm not a robot" reCAPTCHA checkbox
2. Click "Create" button
3. Note down your **Search Engine ID** (you'll see it after creation)

### Step 4: Get Your Search Engine ID

After creation:
1. Go to "Control Panel" → "Setup" → "Basics"
2. Find "Search engine ID" - copy this value
3. It will look like: `012345678901234567890:abcdefghijk`

### Step 5: Enable Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" → "Library"
4. Search for "Custom Search API"
5. Click "Enable"
6. Go to "APIs & Services" → "Credentials"
7. Click "Create Credentials" → "API Key"
8. Copy your API key
9. (Optional) Restrict the API key to "Custom Search API" only

### Step 6: Configure Search Engine Settings

After creating the search engine:

1. **Go to "Setup" → "Basics"**:
   - Set language: English (or your preferred language)
   - Set region: Your target region

2. **Go to "Setup" → "Advanced"**:
   - Enable "Search the entire web" (if you want broader results)
   - Or keep it restricted to your added sites only

3. **Go to "Setup" → "Features"**:
   - Enable "Web Search"
   - Disable "Image Search" (unless needed)
   - Configure other features as needed

### Step 7: Test Your Search Engine

1. Go to "Control Panel" → "Test"
2. Enter a test query like: "software engineer jobs"
3. Verify results are coming from job sites
4. Check that results are relevant

### Step 8: Add to Your Application

Add these to your `.env` file:

```env
# Google Custom Search API
GOOGLE_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### Step 9: Advanced Configuration (Optional)

#### To search the entire web (not just added sites):
1. Go to "Setup" → "Advanced"
2. Enable "Search the entire web"
3. This will search Google's entire index, not just your specified sites

#### To refine search results:
1. Go to "Setup" → "Refinements"
2. Add custom refinements for:
   - Job type (full-time, part-time, contract)
   - Location
   - Salary range
   - Experience level

## Quick Reference: Sites to Add

Copy and paste these one by one into the "Enter a site or pages" field:

```
www.linkedin.com/jobs/*
www.indeed.com/jobs/*
www.naukri.com/jobs/*
www.glassdoor.com/Job/*
www.monster.com/jobs/*
www.ziprecruiter.com/jobs/*
www.simplyhired.com/jobs/*
www.careerbuilder.com/jobs/*
www.dice.com/jobs/*
www.stackoverflow.com/jobs/*
www.angel.co/jobs/*
www.hired.com/jobs/*
www.remote.co/remote-jobs/*
www.weworkremotely.com/categories/remote-programming-jobs
www.reed.co.uk/jobs/*
```

**Note**: Google allows up to 50 distinct domains. Start with the most important ones first.

## Troubleshooting

### Issue: "Cannot add more than 50 domains"
**Solution**: Focus on the top 50 most important job sites. You can create multiple search engines for different categories.

### Issue: "Site pattern not allowed"
**Solution**: Make sure you're using the correct format:
- ✅ `www.example.com/jobs/*` (correct)
- ❌ `*.example.com` (not allowed for public suffixes)
- ❌ `example.com/*` (may not work, use www.example.com)

### Issue: No results showing
**Solution**:
1. Check that sites are indexed by Google
2. Try searching directly on Google first
3. Enable "Search the entire web" in Advanced settings
4. Verify your search query format

## Next Steps

After setup:
1. Test the search engine manually
2. Add credentials to `.env`
3. Test the API endpoint: `POST /api/jobs/fetch`
4. Monitor results and refine site list
5. Set up scheduled job fetching

