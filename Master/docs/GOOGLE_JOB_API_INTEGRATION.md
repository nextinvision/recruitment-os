# Google Job API Integration Guide

## Overview
This document outlines strategies for fetching jobs from the internet into the recruitment database, focusing on Google APIs and alternative solutions.

## Current System Analysis

### Existing Extension System
- **Location**: `/root/recruitment-os/extension/`
- **Supported Sources**: LinkedIn, Indeed, Naukri
- **Method**: Manual scraping via Chrome extension
- **Workflow**: Recruiter-initiated, manual approval required

### Database Schema
- **Job Model**: Supports `JobSource` enum (LINKEDIN, INDEED, NAUKRI, OTHER)
- **Fields**: title, company, location, description, source, sourceUrl, skills, experienceRequired, salaryRange

## Google API Options

### 1. Google Custom Search API ⭐ RECOMMENDED

**What it is**: Allows you to search the web programmatically, including job listings.

**Advantages**:
- Official Google API
- Can search across multiple job sites
- Returns structured JSON data
- Free tier: 100 queries/day
- Paid: $5 per 1,000 queries

**Limitations**:
- Rate limits on free tier
- Requires API key
- May not return structured job data (needs parsing)

**Implementation**:
```typescript
// Example: Google Custom Search API
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID

async function searchGoogleJobs(query: string, location: string) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query + ' jobs ' + location)}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  // Parse results and extract job information
  return data.items.map(item => ({
    title: item.title,
    company: extractCompany(item.title),
    location: location,
    description: item.snippet,
    source: 'GOOGLE',
    sourceUrl: item.link,
  }))
}
```

**Setup Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Custom Search API
3. Create API key
4. Create Custom Search Engine at [cse.google.com](https://cse.google.com/)
5. Configure to search job sites (indeed.com, linkedin.com/jobs, etc.)

### 2. Google for Jobs Structured Data

**What it is**: Google's structured data format for job postings (not a direct API).

**How it works**:
- Websites publish jobs using JSON-LD structured data
- Google indexes these jobs
- You can scrape websites that use this format

**Advantages**:
- Standardized format
- Rich job data (salary, location, requirements)
- Used by major job sites

**Implementation**:
```typescript
// Scrape websites with Google for Jobs structured data
async function fetchJobsFromStructuredData(url: string) {
  const response = await fetch(url)
  const html = await response.text()
  
  // Extract JSON-LD structured data
  const jsonLdRegex = /<script type="application\/ld\+json">(.*?)<\/script>/gs
  const matches = html.match(jsonLdRegex)
  
  if (matches) {
    const jobData = JSON.parse(matches[0])
    if (jobData['@type'] === 'JobPosting') {
      return {
        title: jobData.title,
        company: jobData.hiringOrganization.name,
        location: jobData.jobLocation.address.addressLocality,
        description: jobData.description,
        salaryRange: jobData.baseSalary?.value?.maxValue,
        source: 'GOOGLE_STRUCTURED',
        sourceUrl: url,
      }
    }
  }
}
```

### 3. Google Jobs Search (Indirect)

**What it is**: Google aggregates jobs from various sources but doesn't provide a direct public API.

**Workaround**:
- Use Google Custom Search API to search "site:google.com/search?q=jobs"
- Scrape Google Jobs results (requires careful parsing)
- Use browser automation (Puppeteer/Playwright) to extract results

**Note**: This approach may violate Google's Terms of Service. Use with caution.

## Alternative Job APIs (Better Options)

### 1. Indeed API ⭐ BEST ALTERNATIVE

**What it is**: Official API from Indeed for job listings.

**Advantages**:
- Official API with proper documentation
- Structured job data
- High-quality results
- Free tier available

**Implementation**:
```typescript
// Indeed Publisher API (requires partnership)
// Or use Indeed RSS feeds
async function fetchIndeedJobs(query: string, location: string) {
  const rssUrl = `https://www.indeed.com/rss?q=${query}&l=${location}`
  const response = await fetch(rssUrl)
  const xml = await response.text()
  
  // Parse RSS feed
  // Extract job data
}
```

**Setup**: Contact Indeed for API access or use RSS feeds.

### 2. LinkedIn Jobs API

**What it is**: LinkedIn's official API for job postings.

**Advantages**:
- High-quality job data
- Professional network integration
- Structured data

**Limitations**:
- Requires LinkedIn partnership
- Strict approval process
- May require paid subscription

**Setup**: Apply through [LinkedIn Partner Program](https://business.linkedin.com/talent-solutions)

### 3. Adzuna API ⭐ RECOMMENDED FOR AGGREGATION

**What it is**: Job search API that aggregates from multiple sources.

**Advantages**:
- Aggregates from 20+ job sites
- Free tier: 1,000 requests/month
- Paid: $99/month for 10,000 requests
- Simple REST API
- Good documentation

**Implementation**:
```typescript
async function fetchAdzunaJobs(query: string, location: string) {
  const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID
  const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY
  
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  return data.results.map(job => ({
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    description: job.description,
    salaryRange: job.salary_min && job.salary_max 
      ? `${job.salary_min}-${job.salary_max}` 
      : undefined,
    source: 'ADZUNA',
    sourceUrl: job.redirect_url,
    skills: extractSkills(job.description),
  }))
}
```

**Setup**: Sign up at [developer.adzuna.com](https://developer.adzuna.com/)

### 4. Jooble API

**What it is**: Job search API aggregating from multiple sources.

**Advantages**:
- Free tier available
- Aggregates from 140+ job sites
- Simple API
- Good coverage

**Setup**: Register at [jooble.org/api/about](https://jooble.org/api/about)

### 5. RapidAPI Job APIs

**What it is**: Marketplace with multiple job APIs.

**Available APIs**:
- LinkedIn Jobs API
- Indeed Jobs API
- Glassdoor Jobs API
- ZipRecruiter API
- And more...

**Advantages**:
- Multiple providers in one place
- Pay-per-use model
- Easy integration

**Setup**: Sign up at [rapidapi.com](https://rapidapi.com/) and browse job APIs

## Recommended Implementation Strategy

### Phase 1: Google Custom Search API (Quick Start)
1. Set up Google Custom Search API
2. Create custom search engine targeting job sites
3. Build API endpoint to fetch jobs
4. Parse and store in database

### Phase 2: Adzuna API (Better Coverage)
1. Sign up for Adzuna API
2. Integrate Adzuna API for job aggregation
3. Add as additional source alongside extension

### Phase 3: Hybrid Approach (Best Solution)
1. **Extension**: Continue manual scraping (LinkedIn, Indeed, Naukri)
2. **Google Custom Search**: Automated background job discovery
3. **Adzuna API**: Bulk job fetching for specific queries
4. **Deduplication**: Merge all sources, remove duplicates

## Implementation Plan

### Step 1: Create Job Fetching Service

**File**: `modules/jobs/fetch-service.ts`

```typescript
import { JobSource } from '@prisma/client'

interface JobFetchOptions {
  query?: string
  location?: string
  source: 'GOOGLE' | 'ADZUNA' | 'JOOBLE' | 'INDEED_RSS'
  limit?: number
}

export class JobFetchService {
  async fetchFromGoogle(options: JobFetchOptions) {
    // Google Custom Search API implementation
  }
  
  async fetchFromAdzuna(options: JobFetchOptions) {
    // Adzuna API implementation
  }
  
  async fetchFromJooble(options: JobFetchOptions) {
    // Jooble API implementation
  }
  
  async fetchAll(options: JobFetchOptions) {
    // Fetch from multiple sources and merge
  }
}
```

### Step 2: Create API Endpoint

**File**: `app/api/jobs/fetch/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Authenticate user
  // Parse request body (query, location, source)
  // Call JobFetchService
  // Store jobs in database
  // Return results
}
```

### Step 3: Create Background Worker

**File**: `workers/job-fetcher.ts`

```typescript
// Scheduled job to fetch jobs automatically
// Runs daily/hourly based on configuration
// Fetches from multiple sources
// Deduplicates and stores
```

### Step 4: Update Extension

**File**: `extension/src/content/job-scraper.ts`

```typescript
// Add Google Jobs scraping support
// Add support for structured data extraction
```

## Environment Variables Needed

```env
# Google Custom Search API
GOOGLE_API_KEY=your_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Adzuna API
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key

# Jooble API
JOOBLE_API_KEY=your_api_key

# Rate Limiting
JOB_FETCH_RATE_LIMIT=100  # jobs per hour
```

## Database Updates Needed

### Add New Job Source
```prisma
enum JobSource {
  LINKEDIN
  INDEED
  NAUKRI
  GOOGLE        // Add this
  ADZUNA        // Add this
  JOOBLE        // Add this
  OTHER
}
```

### Add Fetch Metadata
```prisma
model Job {
  // ... existing fields
  fetchedAt      DateTime?   // When job was fetched via API
  fetchSource   String?      // API source (google, adzuna, etc.)
  fetchQuery    String?      // Query used to fetch
  autoFetched   Boolean     @default(false) // Auto vs manual
}
```

## Cost Analysis

### Google Custom Search API
- Free: 100 queries/day
- Paid: $5 per 1,000 queries
- **Monthly cost (10,000 queries)**: ~$50

### Adzuna API
- Free: 1,000 requests/month
- Paid: $99/month for 10,000 requests
- **Monthly cost**: $99

### Jooble API
- Free tier available
- Paid: Contact for pricing
- **Monthly cost**: Varies

## Recommendations

### Best Overall Solution: **Adzuna API**
- ✅ Best coverage (20+ sources)
- ✅ Reasonable pricing
- ✅ Good documentation
- ✅ Reliable service

### Best Free Solution: **Google Custom Search API**
- ✅ Free tier available
- ✅ Can search multiple sites
- ⚠️ Requires parsing
- ⚠️ Rate limits

### Best Hybrid: **Extension + Adzuna + Google**
- ✅ Manual control (extension)
- ✅ Automated discovery (Adzuna)
- ✅ Web search fallback (Google)
- ✅ Maximum coverage

## Next Steps

1. **Choose API**: Start with Adzuna API (best balance)
2. **Set up credentials**: Get API keys
3. **Implement service**: Create `JobFetchService`
4. **Create endpoint**: Build `/api/jobs/fetch`
5. **Add worker**: Schedule automatic fetching
6. **Test**: Verify job quality and deduplication
7. **Deploy**: Roll out to production

## Security Considerations

- Store API keys securely in environment variables
- Implement rate limiting
- Add authentication to fetch endpoints
- Log all API calls for monitoring
- Handle API failures gracefully
- Respect rate limits to avoid bans

## Monitoring & Analytics

- Track jobs fetched per source
- Monitor API usage and costs
- Track duplicate detection rate
- Monitor job quality metrics
- Alert on API failures

