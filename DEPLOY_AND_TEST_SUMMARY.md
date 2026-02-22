# JobSpy Scraper – Deploy & Test Summary

## What was done

### 1. Installed and deployed
- **Python 3.10 venv** in `/root/recruitment-os/JobSpy-main/venv` with JobSpy + FastAPI + uvicorn.
- **PM2** runs two apps:
  - **recruitment-os** (Next.js) on port 3000.
  - **jobspy-scraper** (FastAPI) via `run_api.sh` on port 8000.
- **Master** was rebuilt (`npm run build`) and restarted so the JOBSPY fetch route is active.

### 2. Tests run (all passed)

| Test | Result |
|------|--------|
| JobSpy `GET /health` | `{"status":"ok","service":"jobspy-scraper"}` |
| JobSpy `POST /scrape` (2 results, India, Indeed) | Returns jobs array with title, company, location, description, etc. |
| Master `POST /api/jobs/fetch` with `source: "JOBSPY"` | 3 jobs fetched, 3 stored; response includes job previews with source INDEED, notes JSON. |
| Master `GET /api/jobs` | Returns stored jobs (e.g. Software Engineer II – Philips, Full Stack Developer – Unikwork, Guidewire Developer – Tatwa). |

### 3. Frontend test (manual)

1. Open the app in your browser (e.g. `http://<your-vps-ip>:3000` or your domain).
2. Log in (e.g. `admin@careerist.com` / `password123` if seed was run).
3. Go to **Jobs** in the sidebar.
4. Open the **Fetch Jobs** tab.
5. Select **JobSpy Scraper** (card “Indeed, LinkedIn, Naukri, Glassdoor (scraper API)”).
6. Optionally set **Country** (e.g. `india`) and **Sites** (e.g. `indeed, linkedin, naukri`).
7. Click **Fetch from JobSpy Scraper**.
8. Wait for the success toast (e.g. “Successfully fetched N jobs… X new jobs stored”).
9. Confirm new jobs appear in the **All Jobs** list (or refresh the list).

---

## Useful commands

```bash
# PM2 status and logs
pm2 status
pm2 logs recruitment-os
pm2 logs jobspy-scraper

# Restart after code or .env changes
pm2 restart recruitment-os --update-env
pm2 restart jobspy-scraper

# Quick health checks
curl http://127.0.0.1:8000/health
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/
```

---

## If you need to reseed the DB (e.g. for login)

```bash
cd /root/recruitment-os/Master
npx prisma db seed
# Then login with admin@careerist.com / password123
```
