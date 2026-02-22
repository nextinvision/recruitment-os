# AI Agent (CRA) System - Complete Development Plan
## Careerist Recruiter Assistant

**Based on:** SRS Gap Analysis - AI Agent Section (25% Complete → 100% Target)  
**Date:** January 2026  
**Status:** Planning Phase

---

## 📋 EXECUTIVE SUMMARY

### Current State
- **Completion:** 25% (mostly mocked)
- **Status:** All AI methods return mock/stub data
- **Missing:** Real AI integration, background processing, task queue, vector embeddings

### Target State
- **Completion:** 100% (fully functional)
- **Status:** Real AI integration with OpenAI/Claude, background job processing, complete automation

### Scope
- 8 major feature areas
- 88 functional requirements (FR-AI-001 to FR-AI-088)
- Background job processing system
- Real-time notifications
- Data persistence and caching

---

## 🏗️ SYSTEM ARCHITECTURE

### 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (CRM/Extension)                  │
│  - Trigger AI tasks via API                                 │
│  - Display AI results                                        │
│  - Show task status                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    API Layer                                 │
│  - /api/ai/analyze-resume                                    │
│  - /api/ai/optimize-linkedin                                │
│  - /api/ai/match-jobs                                        │
│  - /api/ai/generate-message                                 │
│  - /api/ai/weekly-plan                                      │
│  - /api/ai/pipeline-analysis                                │
│  - /api/ai/weekly-report                                    │
│  - /api/ai/tasks/[id] (status check)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Queue Tasks
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Background Job Queue (Bull/BullMQ)             │
│  - Task Queue Manager                                        │
│  - Priority Queue (High/Normal/Low)                          │
│  - Retry Logic (3 attempts, exponential backoff)            │
│  - Task Status Tracking                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Process Tasks
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              AI Worker Processes                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Worker 1: Resume Analysis                          │   │
│  │  Worker 2: LinkedIn Optimization                    │   │
│  │  Worker 3: Job Matching                             │   │
│  │  Worker 4: Message Generation                       │   │
│  │  Worker 5: Weekly Planning                          │   │
│  │  Worker 6: Pipeline Analysis                        │   │
│  │  Worker 7: Weekly Reporting                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Call AI Service
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              AI Service Layer                                │
│  - OpenAI API Client                                         │
│  - Anthropic Claude API Client                               │
│  - Vector Embeddings (OpenAI/Anthropic)                     │
│  - Prompt Engineering                                        │
│  - Response Parsing                                          │
│  - Error Handling & Fallbacks                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Store Results
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Database & Cache                                │
│  - PostgreSQL (AI Task results, analysis data)              │
│  - Redis (Caching, vector embeddings)                        │
│  - MinIO (Resume files, generated documents)                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW OVERVIEW

### General AI Task Flow

```
1. User Action/Trigger
   ↓
2. API Endpoint Called
   ↓
3. Validate Input & Create Task Record
   ↓
4. Queue Task (with priority)
   ↓
5. Worker Picks Up Task
   ↓
6. Update Task Status: PROCESSING
   ↓
7. Call AI Service
   ↓
8. Process AI Response
   ↓
9. Store Results in Database
   ↓
10. Update Task Status: COMPLETED
   ↓
11. Send Notification to User
   ↓
12. Update UI (if real-time)
```

### Error Handling Flow

```
AI Service Call Fails
   ↓
Check Retry Count (< 3)
   ↓
Yes → Wait (exponential backoff) → Retry
   ↓
No → Mark Task as FAILED
   ↓
Log Error Details
   ↓
Notify User/Admin
```

---

## 📦 COMPONENT BREAKDOWN

### 1. Task Queue System

**Technology:** Bull/BullMQ with Redis

**Components:**
- **Queue Manager:** Manages all AI task queues
- **Priority Queues:** 
  - `ai-high-priority` (immediate processing)
  - `ai-normal-priority` (within 5 minutes)
  - `ai-low-priority` (within 1 hour)
- **Worker Processes:** Separate workers for each task type
- **Scheduler:** For scheduled tasks (weekly reports, daily pipeline analysis)

**Features:**
- Task status tracking (pending, processing, completed, failed)
- Retry mechanism (up to 3 attempts)
- Exponential backoff (5min, 15min, 1hour)
- Job progress tracking
- Task cancellation
- Queue monitoring dashboard

---

### 2. AI Service Layer

**Technology:** OpenAI SDK / Anthropic SDK

**Components:**
- **AI Client Factory:** Creates appropriate client based on config
- **Prompt Builder:** Constructs prompts for different tasks
- **Response Parser:** Parses and validates AI responses
- **Vector Embeddings Service:** For semantic matching
- **Token Usage Tracker:** Monitor API costs
- **Rate Limiter:** Respect API rate limits
- **Circuit Breaker:** Prevent cascading failures

**Models:**
- **Resume Analysis:** GPT-4 or Claude 3 Opus (high accuracy needed)
- **LinkedIn Optimization:** GPT-4 or Claude 3 Sonnet
- **Job Matching:** GPT-4 with embeddings or Claude 3 Sonnet
- **Message Generation:** GPT-3.5-turbo or Claude 3 Haiku (cost-effective)
- **Weekly Planning:** GPT-4 or Claude 3 Sonnet
- **Pipeline Analysis:** GPT-4 or Claude 3 Sonnet
- **Weekly Reports:** GPT-4 or Claude 3 Sonnet

---

### 3. Database Schema Extensions

**New Tables/Fields:**

1. **AI Task Table** (already exists, needs enhancement)
   - Add: `progress` (0-100), `estimatedCompletion`, `retryCount`, `errorDetails`

2. **Resume Analysis Table** (new)
   - `candidateId`, `resumeId`, `atsScore`, `skills[]`, `experience[]`, `education[]`, `gaps[]`, `recommendations[]`, `analysisDate`

3. **LinkedIn Optimization Table** (new)
   - `candidateId`, `headline`, `aboutSection`, `experienceDescriptions[]`, `suggestedSkills[]`, `keywords[]`, `abVariations[]`, `status`, `completedDate`

4. **Job Match Table** (new)
   - `candidateId`, `jobId`, `matchScore`, `skillMatch[]`, `missingSkills[]`, `experienceMatch`, `locationMatch`, `semanticSimilarity`, `explanation`, `rankedAt`

5. **Message Template Table** (enhance existing)
   - Add: `aiGenerated`, `variations[]`, `tone`, `performanceMetrics`

6. **Weekly Plan Table** (new)
   - `recruiterId`, `weekStartDate`, `recommendedJobs[]`, `dailyActionItems[]`, `targets[]`, `timeline[]`, `generatedAt`

7. **Pipeline Analysis Table** (new)
   - `analysisDate`, `stuckApplications[]`, `bottlenecks[]`, `atRiskApplications[]`, `recommendations[]`, `healthScore`

8. **Weekly Report Table** (new)
   - `recruiterId`, `weekStartDate`, `jobsScraped`, `candidatesAdded`, `applicationsCreated`, `achievements[]`, `challenges[]`, `nextWeekGoals[]`, `generatedAt`

---

## 🎯 FEATURE-BY-FEATURE WORKFLOW

### Feature 1: Resume Analysis (FR-AI-001 to FR-AI-013)

**Trigger:** Resume file uploaded for candidate

**Workflow:**
```
1. User uploads resume → POST /api/candidates/[id]/resumes
2. Backend detects resume upload
3. Create AI Task: type=RESUME_ANALYSIS, priority=NORMAL
4. Queue task
5. Worker picks up task
6. Download resume file from MinIO
7. Extract text from PDF/DOCX (using pdf-parse or mammoth)
8. Build prompt with:
   - Resume text
   - Job description (if provided)
   - Analysis requirements
9. Call AI Service (GPT-4 or Claude 3 Opus)
10. Parse response:
    - ATS score (0-100)
    - Skills (technical, soft, domain-specific)
    - Work experience (company, role, duration, responsibilities)
    - Education (institution, degree, field, year)
    - Career gaps (>6 months)
    - Recommendations (missing sections, keywords, formatting)
11. Store in ResumeAnalysis table
12. Update candidate profile with analysis summary
13. Create notification for recruiter
14. Mark task as COMPLETED
```

**AI Prompt Structure:**
```
Analyze this resume and provide:
1. ATS compatibility score (0-100) with breakdown
2. All skills mentioned (categorized)
3. Work experience details
4. Education details
5. Career gaps exceeding 6 months
6. Improvement recommendations

Resume Text: [resume content]
Job Description: [optional job description]
```

**Output Schema:**
```json
{
  "atsScore": 85,
  "atsBreakdown": {
    "keywords": 90,
    "formatting": 80,
    "sections": 90,
    "experience": 85
  },
  "skills": {
    "technical": ["JavaScript", "React", "Node.js"],
    "soft": ["Communication", "Leadership"],
    "domain": ["E-commerce", "FinTech"]
  },
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Senior Developer",
      "duration": "2020-2023",
      "responsibilities": ["..."]
    }
  ],
  "education": [...],
  "gaps": [
    {
      "start": "2019-01",
      "end": "2020-06",
      "duration": "18 months"
    }
  ],
  "recommendations": [
    "Add skills section",
    "Include quantifiable achievements",
    "Optimize for ATS keywords: 'React', 'Node.js'"
  ]
}
```

---

### Feature 2: LinkedIn Optimization (FR-AI-014 to FR-AI-025)

**Trigger:** Recruiter requests LinkedIn optimization for candidate

**Workflow:**
```
1. Recruiter clicks "Optimize LinkedIn" → POST /api/ai/optimize-linkedin
2. Fetch candidate data:
   - Resume analysis (if available)
   - Current LinkedIn profile (if URL provided)
   - Candidate skills and experience
3. Create AI Task: type=LINKEDIN_OPTIMIZATION, priority=NORMAL
4. Queue task
5. Worker processes:
   - Build comprehensive prompt with candidate data
   - Call AI Service (GPT-4 or Claude 3 Sonnet)
   - Generate:
     * Optimized headline (max 120 chars)
     * Optimized About section (max 2000 chars)
     * Experience descriptions for each role
     * Suggested skills
     * Relevant keywords
     * A/B testing variations (2-3 options)
6. Store in LinkedInOptimization table
7. Set status: IN_PROGRESS (recruiter needs to implement)
8. Create notification with suggestions
9. Mark task as COMPLETED
```

**AI Prompt Structure:**
```
Optimize this candidate's LinkedIn profile:
- Current Profile: [if available]
- Resume Data: [from resume analysis]
- Target Roles: [from candidate's job preferences]

Generate:
1. Headline (max 120 chars, 2-3 variations)
2. About section (max 2000 chars, 2-3 variations)
3. Experience descriptions (action verbs, quantifiable achievements)
4. Suggested skills (top 10)
5. Keywords for natural integration
```

**Output Schema:**
```json
{
  "headline": {
    "primary": "Senior Software Engineer | React & Node.js Expert | 8+ Years",
    "variations": [
      "Full-Stack Developer | Building Scalable Web Apps | React & Node.js",
      "Tech Lead | React Specialist | 8+ Years Experience"
    ]
  },
  "aboutSection": {
    "primary": "...",
    "variations": ["...", "..."]
  },
  "experience": [
    {
      "role": "Senior Developer",
      "optimizedDescription": "Led development of e-commerce platform serving 1M+ users..."
    }
  ],
  "suggestedSkills": ["React", "Node.js", "TypeScript", ...],
  "keywords": ["full-stack", "scalable", "microservices", ...]
}
```

---

### Feature 3: Job-Candidate Matching (FR-AI-026 to FR-AI-036)

**Trigger:** 
- Manual: Recruiter requests matches for candidate
- Automatic: Weekly job recommendations

**Workflow:**
```
1. Trigger: POST /api/ai/match-jobs or scheduled weekly
2. For each candidate:
   a. Get candidate data:
      - Resume analysis (skills, experience)
      - LinkedIn optimization data
      - Location preferences
   b. Get active jobs (or all jobs if manual)
   c. Create AI Task: type=JOB_MATCHING, priority=NORMAL
   d. Queue task
3. Worker processes:
   a. Generate vector embeddings for:
      - Candidate profile (skills, experience, description)
      - Each job description
   b. Calculate semantic similarity (cosine similarity)
   c. Call AI Service for detailed matching:
      - Skill match analysis
      - Experience level match
      - Location match
      - Missing skills identification
      - Match explanation
   d. Calculate final match score (0-100):
      - Skill match: 40%
      - Experience match: 30%
      - Location match: 10%
      - Semantic similarity: 20%
   e. Rank jobs by match score
   f. Store top matches in JobMatch table
4. For weekly recommendations:
   - Store top 5 jobs per candidate
   - Create notifications
5. Mark tasks as COMPLETED
```

**AI Prompt Structure:**
```
Match this candidate to these jobs:

Candidate:
- Skills: [skills from resume]
- Experience: [years, roles]
- Location: [preferred location]
- Profile: [resume summary]

Jobs: [list of job descriptions]

For each job, provide:
1. Match score (0-100)
2. Matching skills
3. Missing skills
4. Experience level match
5. Location match
6. Explanation of match
```

**Vector Embeddings:**
- Use OpenAI `text-embedding-3-large` or Anthropic embeddings
- Store embeddings in Redis (with TTL) or PostgreSQL
- Calculate cosine similarity for semantic matching

**Output Schema:**
```json
{
  "candidateId": "candidate-123",
  "matches": [
    {
      "jobId": "job-456",
      "matchScore": 87,
      "breakdown": {
        "skillMatch": 90,
        "experienceMatch": 85,
        "locationMatch": 100,
        "semanticSimilarity": 0.92
      },
      "matchingSkills": ["React", "Node.js", "TypeScript"],
      "missingSkills": ["AWS", "Docker"],
      "experienceMatch": "Candidate has 8 years, job requires 5-7 years",
      "locationMatch": "Both prefer Remote",
      "explanation": "Strong match due to core skills alignment..."
    }
  ],
  "rankedAt": "2026-01-15T10:00:00Z"
}
```

---

### Feature 4: Message Generation (FR-AI-037 to FR-AI-047)

**Trigger:** Recruiter requests message for candidate/job

**Workflow:**
```
1. Recruiter clicks "Generate Message" → POST /api/ai/generate-message
2. Input:
   - Candidate data
   - Job data (if job sharing)
   - Message type (cold outreach, follow-up, job sharing)
   - Tone (professional, friendly, casual)
   - Context (previous messages if follow-up)
3. Create AI Task: type=MESSAGE_GENERATION, priority=HIGH
4. Queue task (high priority for immediate use)
5. Worker processes:
   a. Build prompt with:
      - Candidate name, role, experience
      - Job details (if applicable)
      - Message type and tone
      - Context (conversation history)
   b. Call AI Service (GPT-3.5-turbo or Claude 3 Haiku - cost-effective)
   c. Generate:
      - Primary message (max 300 chars for LinkedIn)
      - 2-3 variations for A/B testing
      - Suggested subject line (if email)
   d. Store in MessageTemplate table (aiGenerated=true)
6. Return to recruiter for review/approval
7. Recruiter can:
   - Approve and send
   - Edit and send
   - Regenerate with different tone
8. Mark task as COMPLETED
```

**AI Prompt Structure:**
```
Generate a [message_type] message for this candidate:

Candidate: [name, role, experience]
Job: [title, company, highlights] (if job sharing)
Tone: [professional/friendly/casual]
Context: [previous messages if follow-up]

Requirements:
- Max 300 characters (for LinkedIn)
- Personalized with candidate name
- Include relevant experience/role
- Professional but engaging
- Clear call-to-action

Generate 3 variations for A/B testing.
```

**Output Schema:**
```json
{
  "messageType": "COLD_OUTREACH",
  "tone": "professional",
  "messages": [
    {
      "primary": true,
      "content": "Hi [Name], I noticed your experience in React...",
      "characterCount": 287
    },
    {
      "primary": false,
      "content": "Hello [Name], Your background in full-stack...",
      "characterCount": 295
    },
    {
      "primary": false,
      "content": "[Name], I came across your profile and...",
      "characterCount": 290
    }
  ],
  "subjectLine": "Exciting Opportunity: Senior React Developer",
  "suggestedActions": ["Connect on LinkedIn", "Reply to this message"]
}
```

---

### Feature 5: Weekly Planning (FR-AI-048 to FR-AI-057)

**Trigger:** Scheduled every Sunday evening (cron job)

**Workflow:**
```
1. Scheduler triggers: Every Sunday 6:00 PM
2. For each active recruiter:
   a. Gather data:
      - Historical performance (last 4 weeks)
      - Current pipeline (applications by stage)
      - Available jobs (active, not assigned)
      - Candidate pool (assigned candidates)
      - Pending follow-ups
   b. Create AI Task: type=WEEKLY_PLAN, priority=LOW
   c. Queue task
3. Worker processes:
   a. Call AI Service (GPT-4 or Claude 3 Sonnet):
      - Analyze historical performance
      - Identify patterns and trends
      - Recommend jobs to assign (prioritized by match score)
      - Generate daily action items
      - Set weekly targets (based on historical + 10% growth)
      - Create timeline for activities
   b. Store in WeeklyPlan table
   c. Create notification for recruiter
4. Mark tasks as COMPLETED
```

**AI Prompt Structure:**
```
Create a weekly plan for this recruiter:

Historical Performance (Last 4 Weeks):
- Jobs Scraped: [avg per week]
- Candidates Added: [avg per week]
- Applications Created: [avg per week]
- Conversion Rates: [by stage]

Current State:
- Active Applications: [count by stage]
- Available Jobs: [list of top matches]
- Assigned Candidates: [count]
- Pending Follow-ups: [count]

Generate:
1. Recommended jobs to assign (top 10, prioritized)
2. Daily action items (Monday-Sunday)
3. Weekly targets (realistic, based on history + growth)
4. Timeline for completing activities
5. Focus areas for the week
```

**Output Schema:**
```json
{
  "recruiterId": "recruiter-123",
  "weekStartDate": "2026-01-20",
  "recommendedJobs": [
    {
      "jobId": "job-456",
      "priority": 1,
      "reason": "High match score with 3 candidates",
      "candidatesToAssign": ["candidate-1", "candidate-2", "candidate-3"]
    }
  ],
  "dailyActionItems": {
    "Monday": [
      {
        "time": "9:00 AM",
        "action": "Follow up with 5 candidates in INTERVIEW stage",
        "candidates": ["candidate-1", "candidate-2", ...]
      },
      {
        "time": "2:00 PM",
        "action": "Assign top 3 jobs to matched candidates",
        "jobs": ["job-1", "job-2", "job-3"]
      }
    ],
    "Tuesday": [...],
    ...
  },
  "targets": {
    "jobsScraped": 25,
    "candidatesAdded": 10,
    "applicationsCreated": 15,
    "interviewsScheduled": 5
  },
  "timeline": [
    {
      "day": "Monday",
      "focus": "Follow-ups and job assignments",
      "estimatedHours": 4
    },
    ...
  ],
  "generatedAt": "2026-01-19T18:00:00Z"
}
```

---

### Feature 6: Pipeline Analysis (FR-AI-058 to FR-AI-067)

**Trigger:** Scheduled daily at 8:00 AM (cron job)

**Workflow:**
```
1. Scheduler triggers: Daily 8:00 AM
2. Gather pipeline data:
   - All applications by stage
   - Days in current stage for each
   - Stage transition history
   - Historical conversion rates
3. Create AI Task: type=PIPELINE_ANALYSIS, priority=NORMAL
4. Queue task
5. Worker processes:
   a. Identify stuck applications (>7 days in same stage)
   b. Calculate bottlenecks (stages with most delays)
   c. Predict success probability (using historical data + AI)
   d. Identify at-risk applications (low success probability)
   e. Call AI Service for recommendations:
      - Actions to move stuck applications
      - Strategies to reduce bottlenecks
      - Interventions for at-risk applications
   f. Calculate pipeline health score (0-100)
   g. Store in PipelineAnalysis table
6. Create notifications:
   - For recruiters: Stuck applications, at-risk applications
   - For managers: Pipeline health report
7. Mark task as COMPLETED
```

**AI Prompt Structure:**
```
Analyze this recruitment pipeline:

Pipeline State:
- Applications by Stage: [counts]
- Stuck Applications (>7 days): [list with days]
- Bottlenecks: [stages with most delays]
- Historical Conversion Rates: [by stage]

Predict:
1. Success probability for each application
2. At-risk applications (low probability)
3. Bottleneck causes
4. Recommended actions for each stuck application
5. Overall pipeline health score
```

**Output Schema:**
```json
{
  "analysisDate": "2026-01-15",
  "pipelineHealthScore": 72,
  "stuckApplications": [
    {
      "applicationId": "app-123",
      "currentStage": "APPLIED",
      "daysInStage": 12,
      "recommendedAction": "Follow up with candidate to check application status",
      "priority": "HIGH"
    }
  ],
  "bottlenecks": [
    {
      "stage": "APPLIED",
      "averageDays": 10,
      "count": 15,
      "cause": "Lack of follow-up after application",
      "recommendation": "Automate follow-up reminders after 3 days"
    }
  ],
  "atRiskApplications": [
    {
      "applicationId": "app-456",
      "successProbability": 25,
      "reasons": ["Low skill match", "Long time in stage"],
      "recommendedIntervention": "Consider alternative job match"
    }
  ],
  "recommendations": [
    "Focus on moving 5 applications from APPLIED to INTERVIEW",
    "Schedule follow-ups for all applications stuck >7 days",
    "Review at-risk applications for alternative matches"
  ]
}
```

---

### Feature 7: Weekly Reporting (FR-AI-068 to FR-AI-078)

**Trigger:** Scheduled every Saturday evening (cron job)

**Workflow:**
```
1. Scheduler triggers: Every Saturday 6:00 PM
2. For each active recruiter:
   a. Gather week's data:
      - Jobs scraped
      - Candidates added
      - Applications created
      - Status progressions
      - Conversion metrics
      - Previous week comparison
   b. Create AI Task: type=WEEKLY_REPORT, priority=LOW
   c. Queue task
3. Worker processes:
   a. Calculate metrics:
      - Activity counts
      - Conversion rates by stage
      - Time per stage averages
      - Comparison to previous week
   b. Call AI Service (GPT-4 or Claude 3 Sonnet):
      - Summarize achievements
      - Identify challenges and blockers
      - Highlight milestones
      - Generate next week preview
      - Set goals for upcoming week
   c. Format report (markdown/HTML)
   d. Store in WeeklyReport table
   e. Generate PDF (optional)
   f. Send via:
      - WhatsApp (if configured)
      - Email (if configured)
      - In-app notification
4. Mark tasks as COMPLETED
```

**AI Prompt Structure:**
```
Generate a weekly performance report for this recruiter:

This Week's Activities:
- Jobs Scraped: [count]
- Candidates Added: [count]
- Applications Created: [count]
- Status Progressions: [counts by stage]

Conversion Metrics:
- Identified → Applied: [rate]
- Applied → Interview: [rate]
- Interview → Offer: [rate]

Previous Week Comparison:
- Jobs Scraped: [previous] → [current] ([change]%)
- Candidates: [previous] → [current] ([change]%)
- Applications: [previous] → [current] ([change]%)

Generate:
1. Executive summary
2. Key achievements and milestones
3. Challenges and blockers faced
4. Conversion analysis
5. Next week preview and goals
6. Action items for improvement
```

**Output Schema:**
```json
{
  "recruiterId": "recruiter-123",
  "weekStartDate": "2026-01-13",
  "weekEndDate": "2026-01-19",
  "summary": {
    "jobsScraped": 28,
    "candidatesAdded": 12,
    "applicationsCreated": 18,
    "interviewsScheduled": 5,
    "offers": 2
  },
  "achievements": [
    "Exceeded weekly target for applications created (18 vs 15)",
    "Achieved 40% conversion rate from Applied to Interview",
    "Successfully placed 2 candidates"
  ],
  "challenges": [
    "3 applications stuck in APPLIED stage for >10 days",
    "Lower candidate quality this week (avg match score: 65)"
  ],
  "conversionMetrics": {
    "identifiedToApplied": 0.60,
    "appliedToInterview": 0.40,
    "interviewToOffer": 0.40
  },
  "previousWeekComparison": {
    "jobsScraped": { "previous": 25, "current": 28, "change": "+12%" },
    "candidatesAdded": { "previous": 10, "current": 12, "change": "+20%" },
    "applicationsCreated": { "previous": 15, "current": 18, "change": "+20%" }
  },
  "nextWeekGoals": {
    "jobsScraped": 30,
    "candidatesAdded": 15,
    "applicationsCreated": 20,
    "focusAreas": ["Reduce stuck applications", "Improve candidate quality"]
  },
  "generatedAt": "2026-01-19T18:00:00Z"
}
```

---

### Feature 8: AI Task Queue Management (FR-AI-079 to FR-AI-088)

**System Components:**

1. **Queue Manager**
   - Create queues for each task type
   - Set priority levels
   - Configure retry policies
   - Monitor queue health

2. **Worker Processes**
   - Separate workers for each task type
   - Auto-scaling based on queue length
   - Health checks and restart on failure
   - Progress reporting

3. **Task Status Tracking**
   - Real-time status updates
   - Progress percentage (0-100)
   - Estimated completion time
   - Error logging

4. **Retry Logic**
   - Max 3 retries
   - Exponential backoff: 5min, 15min, 1hour
   - Permanent failure logging
   - Admin notification on permanent failure

5. **Task Monitoring Dashboard**
   - Queue lengths
   - Processing times
   - Success/failure rates
   - Worker status

---

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Technology Stack

**Background Processing:**
- **Bull/BullMQ:** Job queue with Redis
- **Node.js Workers:** Separate processes for each task type
- **PM2:** Process management

**AI Integration:**
- **OpenAI SDK:** `openai` npm package
- **Anthropic SDK:** `@anthropic-ai/sdk` npm package
- **Vector Embeddings:** OpenAI `text-embedding-3-large` or Anthropic embeddings

**File Processing:**
- **PDF Parsing:** `pdf-parse` or `pdfjs-dist`
- **DOCX Parsing:** `mammoth` or `docx`

**Scheduling:**
- **node-cron:** For scheduled tasks
- **Bull Scheduler:** For complex scheduling

**Caching:**
- **Redis:** For embeddings, task results, rate limiting

---

### Database Migrations Needed

1. **ResumeAnalysis Table**
2. **LinkedInOptimization Table**
3. **JobMatch Table**
4. **WeeklyPlan Table**
5. **PipelineAnalysis Table**
6. **WeeklyReport Table**
7. **AI Task Table Enhancements**

---

### Environment Variables

```env
# AI Service
AI_PROVIDER=openai|anthropic
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_RESUME_ANALYSIS=gpt-4|claude-3-opus
AI_MODEL_LINKEDIN=gpt-4|claude-3-sonnet
AI_MODEL_MATCHING=gpt-4|claude-3-sonnet
AI_MODEL_MESSAGES=gpt-3.5-turbo|claude-3-haiku
AI_MODEL_PLANNING=gpt-4|claude-3-sonnet
AI_MODEL_ANALYSIS=gpt-4|claude-3-sonnet
AI_MODEL_REPORTS=gpt-4|claude-3-sonnet

# Vector Embeddings
EMBEDDINGS_PROVIDER=openai|anthropic
EMBEDDINGS_MODEL=text-embedding-3-large

# Job Queue
REDIS_URL=redis://localhost:6380
QUEUE_CONCURRENCY=5

# Rate Limiting
AI_RATE_LIMIT_PER_MINUTE=60
AI_MAX_RETRIES=3

# Scheduling
WEEKLY_PLAN_CRON=0 18 * * 0  # Sunday 6 PM
PIPELINE_ANALYSIS_CRON=0 8 * * *  # Daily 8 AM
WEEKLY_REPORT_CRON=0 18 * * 6  # Saturday 6 PM
```

---

## 📊 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up infrastructure

1. **Task Queue System**
   - Install Bull/BullMQ
   - Set up Redis connection
   - Create queue manager
   - Implement basic workers

2. **AI Service Layer**
   - Set up OpenAI/Anthropic clients
   - Create prompt builder
   - Implement response parser
   - Add error handling

3. **Database Schema**
   - Create new tables
   - Add indexes
   - Migration scripts

4. **Basic Task Processing**
   - Create task endpoint
   - Queue task
   - Process task
   - Store results

---

### Phase 2: Core Features (Week 3-4)
**Goal:** Implement main AI features

1. **Resume Analysis**
   - PDF/DOCX parsing
   - AI integration
   - Result storage
   - Notification

2. **LinkedIn Optimization**
   - Profile data gathering
   - AI generation
   - Variation creation
   - Status tracking

3. **Job Matching**
   - Vector embeddings
   - Semantic matching
   - Score calculation
   - Ranking

4. **Message Generation**
   - Context gathering
   - AI generation
   - Variation creation
   - Approval workflow

---

### Phase 3: Automation Features (Week 5-6)
**Goal:** Scheduled and automated features

1. **Weekly Planning**
   - Data aggregation
   - AI generation
   - Action item creation
   - Target setting

2. **Pipeline Analysis**
   - Stuck application detection
   - Bottleneck identification
   - Risk assessment
   - Recommendation generation

3. **Weekly Reporting**
   - Metric calculation
   - AI report generation
   - Multi-channel delivery
   - PDF generation

---

### Phase 4: Optimization & Polish (Week 7-8)
**Goal:** Performance and UX improvements

1. **Performance Optimization**
   - Caching strategies
   - Batch processing
   - Rate limiting
   - Cost optimization

2. **Monitoring & Analytics**
   - Task monitoring dashboard
   - Performance metrics
   - Error tracking
   - Cost tracking

3. **User Experience**
   - Real-time updates
   - Progress indicators
   - Error messages
   - Success notifications

4. **Testing & Documentation**
   - Unit tests
   - Integration tests
   - API documentation
   - User guides

---

## 🎯 SUCCESS METRICS

### Performance Metrics
- **Task Processing Time:**
  - Resume Analysis: < 2 minutes
  - LinkedIn Optimization: < 1 minute
  - Job Matching: < 30 seconds per candidate
  - Message Generation: < 10 seconds
  - Weekly Planning: < 5 minutes per recruiter
  - Pipeline Analysis: < 2 minutes
  - Weekly Report: < 3 minutes per recruiter

- **Queue Metrics:**
  - High priority: Processed immediately
  - Normal priority: < 5 minutes
  - Low priority: < 1 hour

- **Success Rate:**
  - Task completion: > 95%
  - Retry success: > 80%
  - Permanent failure: < 5%

### Cost Metrics
- **API Cost Tracking:**
  - Cost per resume analysis
  - Cost per job match
  - Monthly AI costs
  - Cost optimization opportunities

### User Satisfaction
- **Adoption Rate:**
  - % of recruiters using AI features
  - Frequency of use
  - Feature popularity

- **Quality Metrics:**
  - ATS score accuracy
  - Match score accuracy
  - Message approval rate
  - Plan implementation rate

---

## 🚨 RISK MITIGATION

### Technical Risks

1. **AI API Rate Limits**
   - **Risk:** Exceeding API rate limits
   - **Mitigation:** Implement rate limiting, queue prioritization, caching

2. **AI API Costs**
   - **Risk:** Unexpected high costs
   - **Mitigation:** Cost tracking, budget alerts, model selection optimization

3. **AI API Downtime**
   - **Risk:** AI service unavailable
   - **Mitigation:** Circuit breaker, fallback responses, retry logic

4. **Processing Failures**
   - **Risk:** Tasks failing permanently
   - **Mitigation:** Comprehensive error handling, retry logic, admin notifications

### Business Risks

1. **Low Adoption**
   - **Risk:** Recruiters don't use AI features
   - **Mitigation:** User training, clear value proposition, easy-to-use UI

2. **Quality Concerns**
   - **Risk:** AI suggestions not accurate
   - **Mitigation:** Human review, feedback loop, continuous improvement

---

## 📝 NEXT STEPS

### Immediate Actions
1. **Review and approve this plan**
2. **Obtain AI API credentials** (OpenAI or Anthropic)
3. **Set up development environment**
4. **Create project structure**

### Development Start
1. **Phase 1:** Foundation setup (Week 1-2)
2. **Phase 2:** Core features (Week 3-4)
3. **Phase 3:** Automation (Week 5-6)
4. **Phase 4:** Polish (Week 7-8)

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Implementation

