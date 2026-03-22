# Application Process: Root-Level Analysis

This document maps your **13-step application process** to the current codebase and identifies what is implemented vs. what is missing.

---

## Your 13-Step Process (Target)

| # | Step |
|---|------|
| 1 | Job Sourced by Job Search Specialist |
| 2 | Sent to Client for Approval |
| 3 | Approved by Client |
| 4 | Application Submitted |
| 5 | Recruiter Contacted |
| 6 | Follow-up 1 |
| 7 | Follow-up 2 |
| 8 | Final Follow-up |
| 9 | No Response |
| 10 | Interview Scheduled |
| 11 | Interview Preparation |
| 12 | Reject |
| 13 | Offer Stage |

---

## Current System: Stages and Flow

### Application stages (Prisma `ApplicationStage`)

- **PENDING_CLIENT_APPROVAL** – Sent to client for approval  
- **IDENTIFIED** – Client approved / identified for role  
- **RESUME_UPDATED** – Resume updated for role  
- **COLD_MESSAGE_SENT** – Outreach sent (e.g. LinkedIn)  
- **CONNECTION_ACCEPTED** – Recruiter at company responded  
- **APPLIED** – Application submitted  
- **INTERVIEW_SCHEDULED** – Interview scheduled  
- **OFFER** – Offer stage  
- **REJECTED** – Rejected  
- **CLOSED** – Closed (terminal)

### Stage lifecycle (allowed transitions)

Defined in `modules/applications/service.ts` (`STAGE_LIFECYCLE`). Examples:

- **PENDING_CLIENT_APPROVAL** → IDENTIFIED, REJECTED  
- **IDENTIFIED** → PENDING_CLIENT_APPROVAL, RESUME_UPDATED, COLD_MESSAGE_SENT  
- **COLD_MESSAGE_SENT** → CONNECTION_ACCEPTED, APPLIED  
- **CONNECTION_ACCEPTED** → APPLIED  
- **APPLIED** → INTERVIEW_SCHEDULED, REJECTED, CLOSED  
- **INTERVIEW_SCHEDULED** → OFFER, REJECTED, CLOSED  
- **OFFER** → REJECTED, CLOSED  
- **REJECTED** → CLOSED  
- **CLOSED** → (terminal)

### Action types (timeline / “Log Action”)

- APPLIED, OUTREACH, FOLLOW_UP, INTERVIEW, OFFER, REJECTION, NOTE  

Used for the **Action Timeline** and “Log Action” on the application; they do **not** change the application stage by default (stage is changed separately in the UI or via pipeline).

### Follow-ups

- One **followUpDate** per application (no “Follow-up 1 / 2 / Final” as separate stages).  
- **Cron** (`/api/cron/application-followups`, `workers/application-followup-reminder.ts`) creates notifications for overdue/upcoming application follow-ups.  
- “Log Action” with type **FOLLOW_UP** records a follow-up in the timeline but does not represent distinct follow-up rounds.

---

## Step-by-Step Mapping and Gap Analysis

| # | Your step | Current implementation | Status | Notes |
|---|-----------|------------------------|--------|------|
| **1** | Job Sourced by Job Search Specialist | Creating an application (jobs + client). Default initial stage is **IDENTIFIED**; user can choose **PENDING_CLIENT_APPROVAL** to send to client. “Sourcing” = creating the application and linking job(s) to the client. | ✅ Implemented | No separate “Job Sourced” stage; creation + IDENTIFIED (or PENDING_CLIENT_APPROVAL) covers this. |
| **2** | Sent to Client for Approval | **PENDING_CLIENT_APPROVAL** stage. Moving an application to this stage (create or update) generates an approval token and sends email (and optionally WhatsApp) with link to public approval page. | ✅ Implemented | Logic in `modules/applications/service.ts` (create + update). |
| **3** | Approved by Client | Public page `/public/approvals/[token]`: client can **Approve** → application moves to **IDENTIFIED**; **Reject** → **REJECTED**. Token is invalidated after use. | ✅ Implemented | `app/public/approvals/[token]/page.tsx` + `app/api/public/approvals/[token]/route.ts`. |
| **4** | Application Submitted | **APPLIED** stage. User can move application to APPLIED from pipeline/list or detail modal. | ✅ Implemented | |
| **5** | Recruiter Contacted | **CONNECTION_ACCEPTED** stage (company recruiter contacted). | ✅ Implemented | |
| **6** | Follow-up 1 | Single **followUpDate** + “Log Action” type **FOLLOW_UP**. No concept of “Follow-up 1” as a stage or sequence. | ⚠️ Partial | Follow-up exists; **no distinct “Follow-up 1”**. |
| **7** | Follow-up 2 | Same as above. | ⚠️ Partial | **No distinct “Follow-up 2”**. |
| **8** | Final Follow-up | Same as above. | ⚠️ Partial | **No distinct “Final Follow-up”**. |
| **9** | No Response | No stage and no dedicated action type for “No Response”. Could be logged as NOTE or REJECTION with description. | ❌ Gap | **No “No Response” stage or first-class action.** |
| **10** | Interview Scheduled | **INTERVIEW_SCHEDULED** stage. | ✅ Implemented | |
| **11** | Interview Preparation | No separate stage. Only **INTERVIEW_SCHEDULED** exists. | ❌ Gap | **No “Interview Preparation” stage.** |
| **12** | Reject | **REJECTED** stage. Available from pipeline, list dropdown, and detail modal. Public approval can set REJECTED. | ✅ Implemented | |
| **13** | Offer Stage | **OFFER** stage. | ✅ Implemented | |

---

## Summary: What’s Implemented vs. Missing

### Fully aligned (9 steps)

- Job Sourced (via application creation + IDENTIFIED / PENDING_CLIENT_APPROVAL)  
- Sent to Client for Approval (PENDING_CLIENT_APPROVAL + email/link)  
- Approved by Client (public approval → IDENTIFIED)  
- Application Submitted (APPLIED)  
- Recruiter Contacted (CONNECTION_ACCEPTED)  
- Interview Scheduled (INTERVIEW_SCHEDULED)  
- Reject (REJECTED)  
- Offer Stage (OFFER)  

### Partially aligned (1 area = 3 steps)

- **Follow-up 1 / 2 / Final Follow-up**  
  - Implemented: one follow-up date per application, follow-up reminders (cron), and “Log Action” with FOLLOW_UP.  
  - Missing: no separate stages or sequence (e.g. “Follow-up 1”, “Follow-up 2”, “Final Follow-up”) and no automatic progression between them.

### Gaps (2 steps)

- **No Response**  
  - No dedicated stage or action type.  
  - Workaround: use REJECTION or NOTE with description “No response”.

- **Interview Preparation**  
  - No stage between “application submitted / recruiter contacted” and “interview scheduled”.  
  - Workaround: use INTERVIEW_SCHEDULED and optionally “Log Action” type INTERVIEW with description “Preparation” or similar.

---

## Recommendations (Root-Level Options)

1. **Follow-up 1 / 2 / Final (optional)**  
   - **Option A:** Keep current model (single `followUpDate` + FOLLOW_UP actions) and treat “Follow-up 1/2/Final” as labels in the UI (e.g. first/second/third FOLLOW_UP action).  
   - **Option B:** Add stages (e.g. `FOLLOW_UP_1`, `FOLLOW_UP_2`, `FINAL_FOLLOW_UP`) and update `STAGE_LIFECYCLE` and UI so pipeline/list reflect the 3 follow-up steps.

2. **No Response**  
   - Add an **ApplicationActionType** (e.g. `NO_RESPONSE`) and/or a stage (e.g. `NO_RESPONSE`) if you want to filter and report on “no response” separately from REJECTED/CLOSED.

3. **Interview Preparation**  
   - Add a stage (e.g. `INTERVIEW_PREPARATION`) between APPLIED/CONNECTION_ACCEPTED and INTERVIEW_SCHEDULED, and allow transitions: e.g. APPLIED/CONNECTION_ACCEPTED → INTERVIEW_PREPARATION → INTERVIEW_SCHEDULED.

---

## Files Reference

| Area | Location |
|------|----------|
| Application stages enum | `prisma/schema.prisma` – `ApplicationStage` |
| Action types enum | `prisma/schema.prisma` – `ApplicationActionType` |
| Stage lifecycle & validation | `modules/applications/service.ts` – `STAGE_LIFECYCLE`, `validateStageTransition` |
| Create application (incl. PENDING_CLIENT_APPROVAL + email) | `modules/applications/service.ts` – `createApplication` |
| Update application (incl. move to PENDING_CLIENT_APPROVAL + email) | `modules/applications/service.ts` – `updateApplication` |
| Public client approval | `app/public/approvals/[token]/page.tsx`, `app/api/public/approvals/[token]/route.ts` |
| Applications list & pipeline UI | `app/applications/page.tsx` |
| Stage labels (UI) | `app/applications/page.tsx` – `STAGES`, `STAGE_LABELS` |
| Log Action form | `ui/ApplicationActionForm.tsx` |
| Application follow-up reminders | `workers/application-followup-reminder.ts`, `app/api/cron/application-followups/route.ts` |

---

**Conclusion:** The system is largely aligned with your process. The main gaps are: (1) no distinct “Follow-up 1 / 2 / Final” stages (only a single follow-up date and FOLLOW_UP actions), (2) no “No Response” stage/action, and (3) no “Interview Preparation” stage. The rest (job sourced, sent to client, approved by client, application submitted, recruiter contacted, interview scheduled, reject, offer) are implemented at the data and flow level.
