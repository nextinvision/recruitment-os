# Google Job API Integration - Quick Summary

## 🎯 Your Goal
Fetch jobs from the internet into your database using Google APIs and other job aggregation services.

## ✅ What You Already Have
- Chrome Extension for manual scraping (LinkedIn, Indeed, Naukri)
- Job database schema ready
- API infrastructure in place

## 🚀 Recommended Solutions

### Option 1: **Adzuna API** ⭐ BEST CHOICE
- **Why**: Aggregates from 20+ job sites, simple API, good pricing
- **Cost**: Free tier (1,000/month) or $99/month (10,000 requests)
- **Setup**: Sign up at developer.adzuna.com
- **Status**: ✅ Service created (`modules/jobs/fetch-service.ts`)

### Option 2: **Google Custom Search API** ⭐ FREE OPTION
- **Why**: Official Google API, can search job sites
- **Cost**: Free tier (100 queries/day) or $5 per 1,000 queries
- **Setup**: 
  1. Go to Google Cloud Console
  2. Enable Custom Search API
  3. Create API key
  4. Create Custom Search Engine at cse.google.com
- **Status**: ✅ Service created (`modules/jobs/fetch-service.ts`)

### Option 3: **Jooble API** ⭐ ALTERNATIVE
- **Why**: Aggregates from 140+ job sites, free tier available
- **Cost**: Free tier available, contact for paid plans
- **Setup**: Register at jooble.org/api/about
- **Status**: ✅ Service created (`modules/jobs/fetch-service.ts`)

## 📁 Files Created

1. **`docs/GOOGLE_JOB_API_INTEGRATION.md`** - Complete integration guide
2. **`modules/jobs/fetch-service.ts`** - Job fetching service with all APIs
3. **`app/api/jobs/fetch/route.ts`** - API endpoint to fetch jobs

## 🔧 Quick Start

### Step 1: Get API Keys

**For Adzuna (Recommended)**:
```bash
# Sign up at developer.adzuna.com
# Get your APP_ID and APP_KEY
```

**For Google Custom Search**:
```bash
# Go to console.cloud.google.com
# Enable Custom Search API
# Create API key and Search Engine ID
```

**For Jooble**:
```bash
# Sign up at jooble.org/api/about
# Get your API key
```

### Step 2: Add Environment Variables

Add to `.env`:
```env
# Google Custom Search API
GOOGLE_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# Adzuna API
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here

# Jooble API
JOOBLE_API_KEY=your_api_key_here
```

### Step 3: Test the API

```bash
# Test fetching jobs
curl -X POST https://careeristpro.cloud/api/jobs/fetch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "software engineer",
    "location": "San Francisco",
    "source": "ADZUNA",
    "limit": 50
  }'
```

### Step 4: Use in Frontend

```typescript
// In your React component
const fetchJobs = async () => {
  const response = await fetch('/api/jobs/fetch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'software engineer',
      location: 'San Francisco',
      source: 'ADZUNA', // or 'GOOGLE', 'JOOBLE', 'ALL'
      limit: 50,
    }),
  })
  
  const data = await response.json()
  console.log(`Fetched ${data.fetched} jobs, stored ${data.stored}`)
}
```

## 📊 Comparison Table

| API | Free Tier | Paid Cost | Coverage | Setup Difficulty |
|-----|-----------|-----------|----------|------------------|
| **Adzuna** | 1,000/month | $99/month | 20+ sites | ⭐ Easy |
| **Google Custom Search** | 100/day | $5/1k queries | Unlimited | ⭐⭐ Medium |
| **Jooble** | Available | Contact | 140+ sites | ⭐ Easy |
| **Indeed RSS** | Unlimited | Free | Indeed only | ⭐ Very Easy |

## 🎯 Recommended Implementation Plan

### Phase 1: Start with Adzuna (Week 1)
1. Sign up for Adzuna API
2. Add credentials to `.env`
3. Test API endpoint
4. Fetch 50-100 jobs
5. Verify data quality

### Phase 2: Add Google Custom Search (Week 2)
1. Set up Google Cloud account
2. Enable Custom Search API
3. Create custom search engine
4. Add to fetch service
5. Test integration

### Phase 3: Create Background Worker (Week 3)
1. Create scheduled job
2. Fetch jobs daily/hourly
3. Auto-deduplicate
4. Store in database
5. Send notifications

## 🔍 Next Steps

1. **Choose your API**: Start with Adzuna (best balance)
2. **Get credentials**: Sign up and get API keys
3. **Add to .env**: Add your API credentials
4. **Test endpoint**: Use the `/api/jobs/fetch` endpoint
5. **Build UI**: Create a job fetching interface
6. **Schedule jobs**: Set up automatic fetching

## 📝 Notes

- All APIs respect rate limits
- Jobs are automatically deduplicated
- Extension system continues to work alongside APIs
- You can fetch from multiple sources simultaneously
- All fetched jobs are stored with source tracking

## 🆘 Need Help?

- Check `docs/GOOGLE_JOB_API_INTEGRATION.md` for detailed guide
- Review `modules/jobs/fetch-service.ts` for implementation
- Test with `/api/jobs/fetch` endpoint

## ✅ Status

- ✅ Service created
- ✅ API endpoint created
- ✅ Documentation complete
- ⏳ Waiting for API credentials
- ⏳ Ready to test

