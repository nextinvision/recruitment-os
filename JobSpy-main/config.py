"""
Load .env and expose JobSpy-related settings for use in scripts.
"""
import os

def _load_dotenv():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

_load_dotenv()

def get_search_term():
    return os.getenv("JOBSPY_SEARCH_TERM", "software engineer")

def get_location():
    return os.getenv("JOBSPY_LOCATION", "San Francisco, CA")

def get_country():
    return os.getenv("JOBSPY_COUNTRY", "USA")

def get_results_wanted():
    try:
        return int(os.getenv("JOBSPY_RESULTS_WANTED", "15"))
    except ValueError:
        return 15

def get_proxies():
    raw = os.getenv("JOBSPY_PROXIES", "").strip()
    if not raw:
        return None
    return [p.strip() for p in raw.split(",") if p.strip()]

def get_verbose():
    try:
        return int(os.getenv("JOBSPY_VERBOSE", "2"))
    except ValueError:
        return 2

def get_sites():
    raw = os.getenv("JOBSPY_SITES", "indeed").strip().lower()
    if not raw:
        return ["indeed"]
    return [s.strip() for s in raw.split(",") if s.strip()]

def get_hours_old():
    """Only return jobs posted in the last N hours (e.g. 24, 72, 168). None = no filter (can include older/expired)."""
    raw = os.getenv("JOBSPY_HOURS_OLD", "").strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None
