# Google Search Engine Setup - Complete Guide

## ✅ What You Need to Do Right Now

### Step 1: Add Job Sites to Your Search Engine

On the page you're currently viewing (Google Programmable Search Engine creation page):

1. **In the "Enter a site or pages" field**, add these sites one by one:

**Start with these 10 most important sites:**
```
www.linkedin.com/jobs/*
www.indeed.com/jobs/*
www.glassdoor.com/Job/*
www.monster.com/jobs/*
www.ziprecruiter.com/jobs/*
www.simplyhired.com/jobs/*
www.careerbuilder.com/jobs/*
www.dice.com/jobs/*
www.stackoverflow.com/jobs/*
www.naukri.com/jobs/*
```

**How to add:**
- Copy the first line: `www.linkedin.com/jobs/*`
- Paste it into the "Enter a site or pages" field
- Click the blue "Add" button
- Repeat for each site

2. **Search Settings:**
   - **Image search**: Keep it OFF (toggle should be grey/off)
   - **SafeSearch**: Keep it OFF (toggle should be grey/off)

3. **Complete the form:**
   - Check the "I'm not a robot" checkbox
   - Click "Create" button at the bottom

### Step 2: Get Your Search Engine ID

After clicking "Create":
1. You'll be redirected to the Control Panel
2. Go to "Setup" → "Basics"
3. Find "Search engine ID" - it looks like: `012345678901234567890:abcdefghijk`
4. **Copy this ID** - you'll need it!

### Step 3: Enable Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Click the hamburger menu (☰) → "APIs & Services" → "Library"
4. Search for "Custom Search API"
5. Click on "Custom Search API"
6. Click "Enable" button
7. Wait for it to enable (takes a few seconds)

### Step 4: Create API Key

1. Still in Google Cloud Console
2. Go to "APIs & Services" → "Credentials"
3. Click "+ CREATE CREDENTIALS" at the top
4. Select "API key"
5. Copy your API key (looks like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz`)
6. (Optional but recommended) Click "Restrict key"
   - Under "API restrictions", select "Restrict key"
   - Check "Custom Search API"
   - Click "Save"

### Step 5: Add Credentials to Your Application

1. Open your `.env` file in `/root/recruitment-os/Master/.env`
2. Add these lines:

```env
# Google Custom Search API
GOOGLE_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

3. Replace `your_api_key_here` with your actual API key
4. Replace `your_search_engine_id_here` with your Search Engine ID

### Step 6: Test Your Setup

Run the setup checker script:

```bash
cd /root/recruitment-os/Master
./scripts/setup-google-search.sh
```

Or test manually via API:

```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=software+engineer+jobs&num=5"
```

### Step 7: Test in Your Application

Once credentials are added:

1. Restart your application:
   ```bash
   pm2 restart recruitment-os --update-env
   ```

2. Test the fetch endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/jobs/fetch \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "software engineer",
       "location": "San Francisco",
       "source": "GOOGLE",
       "limit": 10
     }'
   ```

## 📋 Complete Site List (Add More Later)

After setting up the basic 10 sites, you can add more. See `docs/JOB_SITES_LIST.md` for a complete list of 50+ job sites.

**Priority order:**
1. ✅ Add the 10 sites above first (Tier 1)
2. Then add tech-specific sites (Tier 2)
3. Then add regional sites (Tier 3)
4. Maximum: 50 domains per search engine

## 🔧 Advanced Configuration (After Creation)

### Enable "Search the entire web" (Optional)

This allows searching beyond just your added sites:

1. Go to your Search Engine Control Panel
2. Click "Setup" → "Advanced"
3. Enable "Search the entire web"
4. This gives broader results but may include non-job sites

### Refine Search Results

1. Go to "Setup" → "Refinements"
2. Add custom refinements for:
   - Job type (full-time, part-time, contract)
   - Location filters
   - Salary ranges

## 📊 Expected Results

After setup, you should be able to:
- ✅ Fetch jobs from LinkedIn, Indeed, Glassdoor, etc.
- ✅ Get 10-50 jobs per query
- ✅ See jobs from multiple sources
- ✅ Store them in your database

## 🚨 Troubleshooting

### "API key not valid"
- Check that Custom Search API is enabled
- Verify API key is correct
- Check if API key restrictions are blocking requests

### "Search engine ID not found"
- Verify the ID is correct (starts with numbers, has colon)
- Check that search engine was created successfully

### "No results returned"
- Test the search engine manually in Control Panel → Test
- Verify sites are indexed by Google
- Try enabling "Search the entire web"

### "Rate limit exceeded"
- Google free tier: 100 queries/day
- Wait 24 hours or upgrade to paid plan
- Implement request throttling

## 📚 Documentation Files

- `docs/GOOGLE_SEARCH_ENGINE_SETUP.md` - Detailed setup guide
- `docs/GOOGLE_JOB_API_INTEGRATION.md` - Complete integration guide
- `docs/JOB_SITES_LIST.md` - Complete list of job sites
- `GOOGLE_JOB_API_SUMMARY.md` - Quick reference

## ✅ Checklist

- [ ] Added 10 job sites to search engine
- [ ] Created search engine successfully
- [ ] Copied Search Engine ID
- [ ] Enabled Custom Search API
- [ ] Created API key
- [ ] Added credentials to .env
- [ ] Tested API connection
- [ ] Tested fetch endpoint
- [ ] Verified jobs are being stored

## 🎯 Next Steps After Setup

1. **Test fetching**: Use `/api/jobs/fetch` endpoint
2. **Build UI**: Create a job fetching interface
3. **Schedule jobs**: Set up automatic daily/hourly fetching
4. **Monitor**: Track API usage and costs
5. **Expand**: Add more job sites as needed

## 💡 Pro Tips

1. **Start small**: Test with 10 sites first, then expand
2. **Monitor costs**: Google free tier is 100 queries/day
3. **Use multiple engines**: Create separate engines for different regions/categories
4. **Combine sources**: Use Google + Adzuna + Jooble for maximum coverage
5. **Deduplicate**: The service automatically removes duplicate jobs

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review `docs/GOOGLE_SEARCH_ENGINE_SETUP.md`
3. Test API connection with the setup script
4. Check Google Cloud Console for API errors

---

**Status**: Ready to set up! Follow the steps above to get started.

