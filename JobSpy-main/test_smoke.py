"""
Smoke test for JobSpy - minimal scrape to verify the library works.
Run: python test_smoke.py
"""
from jobspy import scrape_jobs

def test_indeed_smoke():
    """Scrape a few Indeed jobs (least rate-limited site)."""
    jobs = scrape_jobs(
        site_name="indeed",
        search_term="developer",
        results_wanted=3,
        country_indeed="USA",
        verbose=0,
    )
    assert len(jobs) >= 1, "Expected at least 1 job from Indeed"
    assert "title" in jobs.columns and "company" in jobs.columns
    assert "job_url" in jobs.columns
    print(f"OK: Got {len(jobs)} job(s) from Indeed")
    return jobs

if __name__ == "__main__":
    print("Running JobSpy smoke test (Indeed, 3 results)...")
    test_indeed_smoke()
    print("Smoke test passed.")
