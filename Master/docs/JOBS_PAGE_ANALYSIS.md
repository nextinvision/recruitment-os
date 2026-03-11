# Jobs Page – Codebase Analysis

## 1. Job page structure and features

| Feature | Location | Status |
|--------|----------|--------|
| **Tabs** | All Jobs, Fetch Jobs, 🔍 Google Fetch, LinkedIn, Indeed, Naukri, Other Sources | All wired and functional. Source tabs filter list by `source`; Fetch/Google show panels. |
| **List + filters** | `loadJobs()` → `GET /api/jobs?…` | Functional. Filters (source, status, recruiter, dates, search, title, company, location, job type, skills, CTC, experience, duplicates) are passed and applied in `modules/jobs/service.ts` `getJobs()`. |
| **Pagination** | `Pagination` component, `page` / `pageSize` state | Functional. |
| **Add Job** | Modal + `JobForm` → `POST /api/jobs` or `PATCH /api/jobs/[id]` | Functional. |
| **Edit Job** | Same modal with `selectedJob` | Functional. |
| **Assign Job** | `JobAssignmentModal` → `POST /api/jobs/assign` | Functional. |
| **Export CSV** | `handleExportJobs()` → `GET /api/jobs/export?…` | Functional (ADMIN/MANAGER). |
| **View Duplicates** | `loadDuplicates()` → `GET /api/jobs/duplicates` | Functional (ADMIN/MANAGER). Resolve → `POST /api/jobs/duplicates`. |
| **Fetch Jobs** | `JobFetchPanel` → `POST /api/jobs/fetch` (ALL, JOBSPY, GOOGLE, ADZUNA, JOOBLE, INDEED_RSS) | Functional. |
| **Google Fetch** | `GoogleFetchPanel` → `POST /api/jobs/fetch` (source: SERPAPI) | Functional (Python backend). |
| **Recruiters dropdown** | `loadRecruiters()` → `GET /api/users?role=RECRUITER` | Functional (for filters + assignment). |

## 2. Unused / removable (jobs page only)

- **Unused imports on `app/jobs/page.tsx`**: `Input`, `Textarea`, `Select`, `Alert`, `FormActions` are imported from `@/ui` but never used in the page (they are used inside `JobForm` and `DuplicateResolutionModal`, which import their own). Safe to remove from the jobs page import list.

No other features on the job page are dead or non-functional. The duplicate modal shows only the first group (`duplicateGroups[0]`); after resolving, `loadDuplicates()` runs again so the next group can be shown. That is a one-at-a-time flow, not broken.

## 3. Job fetches across the app

| Caller | Endpoint | Purpose |
|--------|----------|--------|
| **Jobs page** | `GET /api/jobs?source=…&status=…&page=…&…` | Main list with filters, sort, pagination. |
| **Job detail** | `GET /api/jobs/[id]` | Single job. |
| **Applications page** | `GET /api/jobs?pageSize=25&search=…` | Job search for linking application to job. |
| **Resume builder** | `GET /api/jobs?pageSize=100&status=ACTIVE` | Active jobs for matching. |
| **Companies page** | `GET /api/jobs?search=…&pageSize=10` and `GET /api/jobs/[id]` | Search jobs and load one job. |
| **JobFetchPanel / GoogleFetchPanel** | `POST /api/jobs/fetch` | Ingest jobs from external sources (not a “list” fetch). |

All list requests already go to the same **GET /api/jobs** route; only query params differ. Single-job and export/duplicates use their own routes as intended.

## 4. Should you “integrate all job fetches”?

**Recommendation: keep the current design.**

- **List jobs**: One endpoint `GET /api/jobs` already serves every list use (jobs page, applications, resume builder, companies). Callers pass different filters/pagination; no need to merge these into a single “super” request.
- **Single job**: `GET /api/jobs/[id]` is the right REST shape; combining list + single into one endpoint would hurt caching and clarity.
- **Ingest**: `POST /api/jobs/fetch` is a separate action (fetch from external APIs and store); it should stay separate.

Optional improvement: introduce a shared **frontend hook** (e.g. `useJobsList(filters, pagination)`) used by jobs page, applications, resume builder, and companies so all list calls share the same logic and error handling. That would be a consistency refactor, not a requirement for “integrating” fetches. Backend-wise, no further integration is needed.

## 5. Summary

- **Remove**: Unused imports (`Input`, `Textarea`, `Select`, `Alert`, `FormActions`) from `app/jobs/page.tsx`.
- **Keep**: All tabs, filters, modals, fetch panels, export, duplicates. They are used and working.
- **Job fetches**: Keep as is; one list endpoint is enough; no need to merge list/single/ingest into one.
