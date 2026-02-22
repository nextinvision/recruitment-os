"""
JobSpy FastAPI server – exposes scrape_jobs as HTTP POST /scrape.
Used by Recruitment OS (Master) to fetch jobs and store in DB.
Run: uvicorn api:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import os
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load .env before importing jobspy (uses config)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from jobspy import scrape_jobs


# --- Request/Response models ---

class ScrapeRequest(BaseModel):
    search_term: str = Field(default="software engineer", description="Job search query")
    location: str | None = Field(default=None, description="Location filter")
    country: str = Field(default="usa", description="Country (e.g. usa, india, uk)")
    results_wanted: int = Field(default=15, ge=1, le=100, description="Max results per site")
    sites: list[str] | None = Field(
        default=None,
        description="Sites to scrape: linkedin, indeed, naukri, glassdoor, zip_recruiter, google, bayt, bdjobs. None = indeed only."
    )
    hours_old: int | None = Field(default=None, description="Only jobs posted in last N hours")
    verbose: int = Field(default=0, ge=0, le=2, description="Log verbosity 0-2")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # shutdown if needed


app = FastAPI(
    title="JobSpy Scraper API",
    description="Scrapes job boards for Recruitment OS",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "jobspy-scraper"}


@app.post("/scrape")
def scrape(scrape_req: ScrapeRequest):
    """
    Run JobSpy scrape_jobs and return results as JSON (list of records).
    """
    site_list = scrape_req.sites if scrape_req.sites and len(scrape_req.sites) > 0 else ["indeed"]
    try:
        df = scrape_jobs(
            site_name=site_list,
            search_term=scrape_req.search_term or "software engineer",
            location=scrape_req.location,
            country_indeed=scrape_req.country,
            results_wanted=scrape_req.results_wanted,
            hours_old=scrape_req.hours_old,
            verbose=scrape_req.verbose,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {str(e)}")

    if df is None or df.empty:
        return {"jobs": [], "count": 0}

    # Replace NaN/NaT for JSON
    df = df.fillna("")
    # Convert any non-serializable types
    records = []
    for _, row in df.iterrows():
        rec = row.to_dict()
        for k, v in rec.items():
            if hasattr(v, "item"):  # numpy scalar
                try:
                    rec[k] = v.item()
                except (ValueError, AttributeError):
                    rec[k] = str(v)
            elif hasattr(v, "isoformat"):  # datetime
                rec[k] = v.isoformat() if v else ""
        records.append(rec)

    return {"jobs": records, "count": len(records)}
