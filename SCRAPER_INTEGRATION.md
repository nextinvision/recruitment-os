# JobSpy Scraper Integration (Recruitment OS)

This document describes how the **JobSpy** Python scraper is integrated with the **Master** (Next.js) app and how to deploy both on the Hostinger VPS.

## Architecture

- **JobSpy** (`JobSpy-main/`): Python library that scrapes job boards (Indeed, LinkedIn, Naukri, Glassdoor, etc.). It is exposed as an HTTP API via **FastAPI** (`api.py`).
- **Master** (`Master/`): Next.js app. The Jobs page has a “Fetch Jobs” tab. When the user selects **JobSpy Scraper** and clicks Fetch, the frontend calls `POST /api/jobs/fetch` with `source: 'JOBSPY'`. The backend calls the JobSpy API, maps results to the internal job model, and stores them in PostgreSQL (same as other sources).

```
[Browser] → Master (Next.js :3000) → POST /api/jobs/fetch (source=JOBSPY)
                → fetch-service.fetchFromJobSpy() → HTTP POST to JOBSPY_API_URL/scrape
                → JobSpy (FastAPI :8000) → scrape_jobs() → returns JSON
                → storeJobs() → Prisma → PostgreSQL
```

## Deployment on VPS

### 1. Python and JobSpy API

On the VPS (e.g. `/root/recruitment-os/`):

```bash
cd /root/recruitment-os/JobSpy-main

# Option A: virtualenv (recommended)
sudo apt install -y python3-venv python3-pip
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Option B: system packages
pip3 install --user -r requirements.txt

# Run API (or use PM2 with ecosystem.config.js from Master/)
./run_api.sh
# Or: python3 -m uvicorn api:app --host 0.0.0.0 --port 8000
```

The scraper API listens on port **8000**. It does not need to be exposed publicly; Master calls it on `127.0.0.1:8000` by default.

### 2. PM2 (both apps)

The repo’s `Master/ecosystem.config.js` defines two apps:

- **recruitment-os**: Next.js (`npm start`), cwd `Master`, port 3000.
- **jobspy-scraper**: FastAPI (`python3 -m uvicorn api:app --host 0.0.0.0 --port 8000`), cwd `JobSpy-main`.

From the **Master** directory (so ecosystem path is correct):

```bash
cd /root/recruitment-os/Master
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # if not already done
```

To use a virtualenv for JobSpy, either:

- Set in ecosystem `script` to the venv’s `uvicorn` and `cwd` to `JobSpy-main`, or  
- Use `interpreter: '/root/recruitment-os/JobSpy-main/venv/bin/python3'` and keep `script: 'python3'` and `args: ['-m', 'uvicorn', ...]` (with that interpreter pointing to venv python).

### 3. Environment variables

**Master (`.env` in `Master/`):**

- `JOBSPY_API_URL` – URL of the JobSpy API. On the same server use `http://127.0.0.1:8000`. If you put the scraper behind Nginx or another port, set this accordingly.

**JobSpy (`JobSpy-main/.env`):**

- Optional: `JOBSPY_SEARCH_TERM`, `JOBSPY_LOCATION`, `JOBSPY_COUNTRY`, `JOBSPY_SITES`, `JOBSPY_RESULTS_WANTED`, `JOBSPY_HOURS_OLD`, etc. The **API** ignores these and uses the JSON body of `POST /scrape` (search_term, location, country, results_wanted, sites). The .env is still used if you run `example.py` or other scripts.

### 4. Nginx (optional)

Nginx currently proxies to Next.js (port 3000). The JobSpy API (8000) does not need to be in Nginx unless you want to expose it (e.g. for debugging). If you do:

- Add a `location /jobspy/` that proxies to `http://127.0.0.1:8000/`.
- In Master set `JOBSPY_API_URL` to that internal or public URL.

## What gets stored in the database

For each scraped job, Master maps JobSpy fields to the **Job** model:

- **title**, **company**, **location**, **description**, **source** (LINKEDIN / INDEED / NAUKRI / OTHER), **sourceUrl**
- **skills** (array), **experienceRequired**, **salaryRange**
- **notes**: JSON with extra details (job_type, date_posted, is_remote, job_level, company_industry, company_url, company_rating, salary_interval, listing_type, etc.)

Duplicate detection is the same as for other sources: same title + company + location + source → skip.

## Frontend

On the Jobs page, **Fetch Jobs** tab:

- **Select Source** includes **JobSpy Scraper**.
- When selected, optional **JobSpy options** appear: **Country** (e.g. usa, india, uk) and **Sites** (comma-separated: indeed, linkedin, naukri, glassdoor, zip_recruiter, google).
- **Fetch from JobSpy Scraper** sends `POST /api/jobs/fetch` with `source: 'JOBSPY'`, plus `country` and `sites` when provided. Fetched jobs are stored and the list refreshes.

## Quick checks

```bash
# Scraper health
curl http://127.0.0.1:8000/health

# Scrape (test)
curl -X POST http://127.0.0.1:8000/scrape -H "Content-Type: application/json" -d '{"search_term":"developer","results_wanted":2,"sites":["indeed"]}'

# PM2
pm2 status
pm2 logs jobspy-scraper
pm2 logs recruitment-os
```
