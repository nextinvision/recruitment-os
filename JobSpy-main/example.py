"""
JobSpy example – run this to verify your setup.
Uses .env if present (see .env.example), otherwise defaults.
"""
import csv
from jobspy import scrape_jobs

# Optional: load settings from .env (pip install python-dotenv)
try:
    from config import (
        get_search_term,
        get_location,
        get_country,
        get_results_wanted,
        get_proxies,
        get_verbose,
        get_sites,
        get_hours_old,
    )
except ImportError:
    def get_search_term(): return "software engineer"
    def get_location(): return "San Francisco, CA"
    def get_country(): return "USA"
    def get_results_wanted(): return 5
    def get_proxies(): return None
    def get_verbose(): return 2
    def get_sites(): return ["indeed"]
    def get_hours_old(): return None

if __name__ == "__main__":
    search_term = get_search_term()
    location = get_location()
    country = get_country()
    results_wanted = get_results_wanted()
    proxies = get_proxies()
    verbose = get_verbose()
    sites = get_sites()
    hours_old = get_hours_old()

    print(f"JobSpy: scraping jobs ({', '.join(sites)}, {results_wanted} results)...")
    if hours_old:
        print(f"Filter: only jobs posted in the last {hours_old} hours.")
    jobs = scrape_jobs(
        site_name=sites,
        search_term=search_term,
        location=location,
        results_wanted=results_wanted,
        country_indeed=country,
        proxies=proxies,
        verbose=verbose,
        hours_old=hours_old,
    )
    print(f"\nFound {len(jobs)} jobs")
    if len(jobs) > 0:
        cols = ["title", "company", "location", "job_url"]
        print(jobs[[c for c in cols if c in jobs.columns]].to_string())
        jobs.to_csv(
            "jobs.csv",
            quoting=csv.QUOTE_NONNUMERIC,
            escapechar="\\",
            index=False,
        )
        print("\nSaved to jobs.csv")
    else:
        print("No jobs returned (rate limit or network may apply).")
