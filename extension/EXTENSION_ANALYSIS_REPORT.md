# Recruitment OS: Complete Codebase & Extension Analysis Report

## 1. Global Codebase Architecture
The **Recruitment OS** is a sophisticated, multi-module ecosystem designed for AI-driven recruitment. It follows a modern, distributed architecture:

### A. Main Application (`/Master`)
- **Type**: Next.js (Full-stack)
- **Role**: The central command center. Handles User Authentication (RBAC), Client Management, Job Pipelines, and UI Dashboards.
- **Tech**: React, TypeScript, Prisma (PostgreSQL), Next.js App Router.
- **Key Modules**: `clients`, `jobs`, `resumes`, `revenues`.

### B. AI Engine (`/backend`)
- **Type**: FastAPI (Python)
- **Role**: The "Brain" of the system.
- **Tech**: Python 3.10+, Google Gemini API, Sentence Transformers (MiniLM), FastAPI.
- **Engines**: 
    - `ats_analyzer`: Scores resumes against industry standards.
    - `gemini_matcher`: Semantic matching between candidates and jobs.
    - `rag_engine`: Retrieval-Augmented Generation for intelligent search.

### C. Browser Extension (`/extension`)
- **Type**: Chrome Extension (Manifest v3)
- **Role**: Data Acquisition.
- **Tech**: Vite, React, TypeScript.
- **Purpose**: Real-time job scraping from any website.

### D. Utility & Scraping (`/JobSpy-main`)
- **Role**: Likely a customized integration of the JobSpy library for automated background fetching of jobs from external APIs.

---

## 2. Browser Extension: Purpose and Status
The **Recruitment OS Job Scraper** is a Chrome extension designed to automate the extraction of job listings from various websites and integrate them into the Recruitment OS ecosystem. It acts as a bridge between job boards and the central dashboard, allowing recruitment teams to quickly populate their pipeline with high-quality job data.

### Architecture
- **Framework**: React with TypeScript.
- **Build Tool**: Vite.
- **Manifest**: Version 3 (Service Worker based).
- **Primary Goal**: Scrape jobs from LinkedIn, Indeed, Naukri, and provide a "Universal" fallback for other career sites.

---

## 2. Current Development Status (What is Done)

### A. Specific Platform Scraping
The extension includes optimized, high-fidelity scrapers for the most popular job platforms:
- **LinkedIn**: Custom selectors for job search and detail pages.
- **Indeed**: Selective data extraction for job listings.
- **Naukri**: Specialized logic for Indian market job board structure.

### B. Universal Scraping Engine (Heuristics-Based)
Implemented a sophisticated system to handle "unknown" websites:
- **`universal-detector.ts`**: Uses 15+ heuristics and **Structural Fingerprinting** to identify job listing pages (URL patterns, keyword clusters, DOM signature analysis).
- **`universal-extractor.ts`**: Extracts job titles, companies, locations, and descriptions using a multi-strategy approach (Structured Cards, List items, Article sections).
- **Auto-Pagination**: Now supports multi-page "Deep Scrape" by identifying and clicking "Next" buttons.
- **Confidence Scoring**: Each scraped job is assigned a score (0-1). Results below 0.4 are filtered out to maintain data quality.

### C. Manual Selection & Mapping (IDS Parity)
For maximum accuracy, a manual mode has been implemented:
- **Manual Mapper**: Users can enter "Manual Mode" and click on elements (Title, Company, Location, Description) to map them directly.
- **Instant Data Scraper Style**: Mimics the ease of use of popular scrapers but tailored for recruitment data.

### D. Extension UI & Experience
The popup is a full-featured micro-application:
- **Dashboard**: Quick overview of captured jobs and user status.
- **Job Staging Area**: A review bucket where scraped jobs "sit" before being committed to the database.
- **Visual Editor**: Users can edit, fix, or delete jobs in the staging area.
- **Auth System**: Full Login/Logout flow integrated with the main Next.js backend.
- **Injection UI**: A persistent "Capture/Scrape" button injected directly into the active tab's DOM.

### D. Technical Infrastructure
- **Message Passing**: Robust communication between Content Scripts, Service Worker, and Popup.
- **Storage**: Uses `chrome.storage.local` for persistence of staging data and tokens.
- **Backend Sync**: Bulk API integration (`/api/jobs/bulk`) with JWT authentication.
- **Validation**: Schema-based validation ensure data integrity before submission.

---

## 3. Directory Analysis

| Directory | Purpose | Key Files |
| :--- | :--- | :--- |
| `src/content` | Logic injected into web pages | `content-script.ts`, `universal-detector.ts`, `selectors/` |
| `src/popup` | The UI window users see | `App.tsx`, `JobStaging.tsx`, `JobEditor.tsx`, `Dashboard.tsx` |
| `src/background` | Long-running tasks & API calls | `service-worker.ts`, `api-client.ts` |
| `src/shared` | Cross-component utilities | `types.ts`, `validation.ts`, `constants.ts` |

---

## 4. Further Development Needed (Roadmap)

While the extension is functionally complete for basic use, the following enhancements would move it from a "utility" to an "enterprise tool":

### High Priority
1.  **Site-Specific Selectors Expansion**:
    - Only 3 sites have specific logic.
    - **Development**: Add dedicated support for Glassdoor, ZipRecruiter, Monster, and Dice for 100% accuracy on those platforms.
2.  **Batch Search Scraping**:
    - The ability to scrape an entire search results page (25+ jobs) vs. just the selected job.
    - **Development**: Refine `JobScraper` to handle list-detail views where data is split across elements.
3.  **Resume-to-Job Match Preview**:
    - Show the "Match Score" directly in the extension before even saving the job.
    - **Development**: Integration with the Backend's `/api/match-jobs` endpoint using the user's default resume.

### Medium Priority
4.  **Duplicate Detection**:
    - Prevent the same job from being added twice from different sources.
    - **Development**: Implement hashing logic based on Company + Title + Location.

### Low Priority
7.  **Machine Learning Enrichment**:
    - Using a small LLM model (like Gemini Nano in Chrome) to better parse messy descriptions.
8.  **Offline Support**:
    - Buffering captures when the backend is unreachable and syncing later.

---

## 5. Conclusion
The Recruitment OS Extension is currently in a **Beta-Ready** state (v1.0.0). It successfully achieves "Universal Scraping" which is a complex technical challenge. The core "Happy Path" (Capture -> Stage -> Edit -> Submit) works flawlessly. The immediate next step should be the **Manual Selection Tool** to handle edge cases where the universal heuristics are insufficient.
