# SYSTEM BASELINE DOCUMENTATION
## Internal Recruitment Agency System

**Document Version:** 1.0  
**Baseline Date:** January 2026  
**Codebase Version:** 0.1.0  
**Purpose:** Freeze current system state for reference

---

## TABLE OF CONTENTS

1. [Module Map](#1-module-map)
2. [API Map](#2-api-map)
3. [Database Schema](#3-database-schema)
4. [UI Screen List](#4-ui-screen-list)
5. [Component Library](#5-component-library)
6. [Infrastructure](#6-infrastructure)

---

## 1. MODULE MAP

### 1.1 Backend Modules (`/modules`)

#### Authentication Module (`modules/auth/`)
- **Files:**
  - `schemas.ts` - Zod validation schemas for login
  - `service.ts` - Login business logic, password verification, JWT generation
- **Exports:**
  - `loginUser(input: LoginInput)` - Authenticate user and return JWT token
- **Dependencies:** `@/lib/auth`, `@/lib/db`, `bcryptjs`, `zod`

#### Users Module (`modules/users/`)
- **Files:**
  - `schemas.ts` - Zod validation schemas for user creation
  - `service.ts` - User CRUD operations with RBAC
- **Exports:**
  - `createUser(input: CreateUserInput)` - Create new user
  - `getUserById(userId: string)` - Get user by ID
  - `getUsers(userId: string, userRole: UserRole)` - Get users with role-based filtering
  - `updateUser(input: UpdateUserInput)` - Update user
  - `deleteUser(userId: string)` - Delete user
- **Dependencies:** `@/lib/db`, `@prisma/client`, `zod`

#### Jobs Module (`modules/jobs/`)
- **Files:**
  - `schemas.ts` - Zod validation schemas for job operations
  - `service.ts` - Job CRUD operations with RBAC
- **Exports:**
  - `createJob(input: CreateJobInput)` - Create new job
  - `getJobById(jobId: string)` - Get job by ID
  - `getJobs(userId: string, userRole: UserRole)` - Get jobs with role-based filtering
  - `updateJob(input: UpdateJobInput)` - Update job
  - `deleteJob(jobId: string)` - Delete job
  - `bulkCreateJobs(input: BulkCreateJobsInput)` - Bulk create jobs (for Chrome extension)
- **Dependencies:** `@/lib/db`, `@prisma/client`, `zod`

#### Candidates Module (`modules/candidates/`)
- **Files:**
  - `schemas.ts` - Zod validation schemas for candidate operations
  - `service.ts` - Candidate CRUD operations with RBAC
- **Exports:**
  - `createCandidate(input: CreateCandidateInput)` - Create new candidate
  - `getCandidateById(candidateId: string)` - Get candidate by ID
  - `getCandidates(userId: string, userRole: UserRole)` - Get candidates with role-based filtering
  - `updateCandidate(input: UpdateCandidateInput)` - Update candidate
  - `deleteCandidate(candidateId: string)` - Delete candidate
- **Dependencies:** `@/lib/db`, `@prisma/client`, `zod`

#### Applications Module (`modules/applications/`)
- **Files:**
  - `schemas.ts` - Zod validation schemas for application operations
  - `service.ts` - Application CRUD operations with RBAC
- **Exports:**
  - `createApplication(input: CreateApplicationInput)` - Create new application
  - `getApplicationById(applicationId: string)` - Get application by ID
  - `getApplications(userId: string, userRole: UserRole)` - Get applications with role-based filtering
  - `getApplicationsByStage(stage: ApplicationStage)` - Get applications by stage
  - `updateApplication(input: UpdateApplicationInput)` - Update application (stage, notes, follow-up date)
  - `deleteApplication(applicationId: string)` - Delete application
- **Dependencies:** `@/lib/db`, `@prisma/client`, `zod`

#### Notifications Module (`modules/notifications/`)
- **Files:**
  - `service.ts` - Notification management with Redis caching
  - `types.ts` - TypeScript interfaces for notification data
- **Exports:**
  - `sendNotification(data: NotificationData)` - Create and send notification (WhatsApp/Email stubbed)
  - `getUserNotifications(userId: string, unreadOnly: boolean)` - Get user notifications (cached)
  - `markAsRead(notificationId: string)` - Mark notification as read
  - `getUnreadCount(userId: string)` - Get unread count (cached)
  - `markAllAsRead(userId: string)` - Mark all notifications as read
- **Dependencies:** `@/lib/db`, `@/lib/redis`, `@prisma/client`
- **Status:** WhatsApp and Email sending are stubbed (console.log only)

#### Analytics Module (`modules/analytics/`)
- **Files:**
  - `service.ts` - Analytics calculations with Redis caching
- **Exports:**
  - `getRecruiterMetrics(recruiterId: string, startDate: Date, endDate: Date)` - Get recruiter performance metrics (cached)
  - `getPlatformUsage(startDate: Date, endDate: Date)` - Get platform source distribution (cached)
  - `getFunnelPerformance(startDate: Date, endDate: Date)` - Get application funnel metrics (cached)
- **Dependencies:** `@/lib/db`, `@/lib/redis`
- **Cache TTL:** 5 minutes (300 seconds)

#### AI Module (`modules/ai/`)
- **Files:**
  - `service.ts` - AI service with mocked implementations
  - `schemas.ts` - Zod validation schemas for AI operations
  - `types.ts` - TypeScript interfaces for AI responses
- **Exports:**
  - `analyzeResume(input: AnalyzeResumeInput)` - Analyze resume (returns mock data)
  - `optimizeLinkedIn(input: OptimizeLinkedInInput)` - Optimize LinkedIn profile (returns mock data)
  - `matchJobs(input: MatchJobsInput)` - Match jobs to candidate (returns random scores)
  - `generateMessage(input: GenerateMessageInput)` - Generate message templates (basic string templates)
  - `generateWeeklyPlan(input: GenerateWeeklyPlanInput)` - Generate weekly plan (basic job list)
- **Dependencies:** `@/lib/db`, `zod`
- **Status:** All methods return mock/stub data. No OpenAI/Claude integration.

#### Audit Module (`modules/audit/`)
- **Files:**
  - `service.ts` - Audit logging service
- **Exports:**
  - `log(data: AuditLogData)` - Create audit log entry
  - `getLogs(filters)` - Get audit logs with filtering
- **Dependencies:** `@/lib/db`
- **Status:** Service exists but NOT called anywhere in codebase

#### Files Module (`modules/files/`)
- **Files:**
  - `service.ts` - File management with MinIO integration
- **Exports:**
  - `uploadFile(file: Buffer, originalName: string, fileType: FileType, contentType: string, uploadedBy: string)` - Upload file to MinIO
  - `saveFile(data: FileUploadData)` - Save file record
  - `getFile(fileId: string)` - Get file metadata
  - `deleteFile(fileId: string)` - Delete file from MinIO and database
  - `getSignedUrl(fileId: string, expiresIn: number)` - Get signed URL for file access
  - `downloadFile(fileId: string)` - Download file as buffer
- **Dependencies:** `@/lib/db`, `@/lib/storage`, `@prisma/client`

#### Resumes Module (`modules/resumes/`)
- **Status:** ⚠️ **EMPTY** - Folder exists but contains no files
- **Expected:** Resume versioning, resume-candidate association, resume analysis integration

### 1.2 Library Modules (`/lib`)

#### Authentication Library (`lib/auth.ts`)
- **Exports:**
  - `generateToken(payload: JWTPayload)` - Generate JWT token (Node.js runtime)
  - `verifyToken(token: string)` - Verify JWT token (Edge runtime compatible with jose)
  - `extractTokenFromHeader(authHeader: string | null)` - Extract token from Bearer header
- **Dependencies:** `jsonwebtoken`, `jose`, `@prisma/client`

#### RBAC Library (`lib/rbac.ts`)
- **Exports:**
  - `getAuthContext(authHeader: string | null)` - Get authentication context from token
  - `requireAuth(authContext: AuthContext | null)` - Require authentication (throws if null)
  - `requireRole(authContext: AuthContext, allowedRoles: UserRole[])` - Require specific role
  - `canAccessResource(authContext: AuthContext, resourceRecruiterId: string | null)` - Check resource access
- **Dependencies:** `@/lib/auth`, `@prisma/client`

#### Database Library (`lib/db.ts`)
- **Exports:**
  - `db` - Prisma Client singleton instance
- **Dependencies:** `@prisma/client`

#### Redis Library (`lib/redis.ts`)
- **Exports:**
  - `getRedisClient()` - Get Redis client singleton
  - `cacheService` - Cache service with get/set/delete/deletePattern methods
- **Dependencies:** `ioredis`
- **Configuration:** Environment variables (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)

#### Storage Library (`lib/storage.ts`)
- **Exports:**
  - `getMinioClient()` - Get MinIO client singleton
  - `storageService` - Storage service with upload/getSignedUrl/delete/getFileMetadata/download methods
  - `initializeBuckets()` - Initialize MinIO buckets (resumes, documents, images)
- **Dependencies:** `minio`
- **Configuration:** Environment variables (MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)

#### CORS Library (`lib/cors.ts`)
- **Exports:**
  - `addCorsHeaders(response: NextResponse, origin: string | null)` - Add CORS headers to response
  - `handleCors(request: NextRequest)` - Handle CORS preflight requests
- **Dependencies:** `next/server`

#### API Response Library (`lib/api-response.ts`)
- **Status:** File exists but usage unclear

---

## 2. API MAP

### 2.1 Authentication APIs

#### `POST /api/auth/login`
- **Purpose:** User authentication
- **Auth Required:** No (public endpoint)
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Response:** `200 OK`
  ```typescript
  {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    }
  }
  ```
- **Sets Cookie:** `token` (HttpOnly, Secure)
- **Module:** `modules/auth/service.ts`

#### `GET /api/auth/me`
- **Purpose:** Get current authenticated user
- **Auth Required:** Yes (Bearer token or cookie)
- **Response:** `200 OK`
  ```typescript
  {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }
  ```
- **Module:** Uses `@/lib/rbac` to get user from token

### 2.2 User Management APIs

#### `GET /api/users`
- **Purpose:** Get all users (filtered by role)
- **Auth Required:** Yes
- **Query Parameters:**
  - `role?: UserRole` - Filter by role (optional)
- **Response:** `200 OK` - Array of User objects
- **RBAC:** Admin/Manager see all, Recruiters see only themselves
- **Module:** `modules/users/service.ts`

#### `POST /api/users`
- **Purpose:** Create new user
- **Auth Required:** Yes (Admin only)
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    managerId?: string; // Optional, for RECRUITER role
  }
  ```
- **Response:** `201 Created` - User object
- **Module:** `modules/users/service.ts`

#### `GET /api/users/[id]`
- **Purpose:** Get user by ID
- **Auth Required:** Yes
- **Response:** `200 OK` - User object
- **RBAC:** Admin/Manager can access any, Recruiters only themselves
- **Module:** `modules/users/service.ts`

#### `PATCH /api/users/[id]`
- **Purpose:** Update user
- **Auth Required:** Yes (Admin only)
- **Request Body:** Partial user fields
- **Response:** `200 OK` - Updated user object
- **Module:** `modules/users/service.ts`

#### `DELETE /api/users/[id]`
- **Purpose:** Delete user
- **Auth Required:** Yes (Admin only)
- **Response:** `200 OK`
- **Module:** `modules/users/service.ts`

### 2.3 Job Management APIs

#### `GET /api/jobs`
- **Purpose:** Get all jobs (filtered by role)
- **Auth Required:** Yes
- **Response:** `200 OK` - Array of Job objects with recruiter relation
- **RBAC:** Admin/Manager see all, Recruiters see only their jobs
- **Module:** `modules/jobs/service.ts`

#### `POST /api/jobs`
- **Purpose:** Create new job
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    title: string;
    company: string;
    location: string;
    description: string;
    source: JobSource;
    sourceUrl?: string;
    skills?: string[];
    experienceRequired?: string;
    salaryRange?: string;
    recruiterId: string;
    notes?: string;
  }
  ```
- **Response:** `201 Created` - Job object
- **Module:** `modules/jobs/service.ts`

#### `GET /api/jobs/[id]`
- **Purpose:** Get job by ID
- **Auth Required:** Yes
- **Response:** `200 OK` - Job object with recruiter relation
- **RBAC:** Admin/Manager can access any, Recruiters only their jobs
- **Module:** `modules/jobs/service.ts`

#### `PATCH /api/jobs/[id]`
- **Purpose:** Update job
- **Auth Required:** Yes
- **Request Body:** Partial job fields
- **Response:** `200 OK` - Updated job object
- **RBAC:** Admin can update any, Recruiters only their jobs
- **Module:** `modules/jobs/service.ts`

#### `DELETE /api/jobs/[id]`
- **Purpose:** Delete job
- **Auth Required:** Yes
- **Response:** `200 OK`
- **RBAC:** Admin can delete any, Recruiters only their jobs
- **Module:** `modules/jobs/service.ts`

#### `POST /api/jobs/bulk`
- **Purpose:** Bulk create jobs (for Chrome extension)
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    jobs: Array<CreateJobInput>;
  }
  ```
- **Response:** `201 Created`
  ```typescript
  {
    count: number;
  }
  ```
- **Module:** `modules/jobs/service.ts`

### 2.4 Candidate Management APIs

#### `GET /api/candidates`
- **Purpose:** Get all candidates (filtered by role)
- **Auth Required:** Yes
- **Response:** `200 OK` - Array of Candidate objects with assignedRecruiter relation
- **RBAC:** Admin/Manager see all, Recruiters see only their assigned candidates
- **Module:** `modules/candidates/service.ts`

#### `POST /api/candidates`
- **Purpose:** Create new candidate
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    linkedinUrl?: string;
    tags?: string[];
    assignedRecruiterId: string;
    notes?: string;
  }
  ```
- **Response:** `201 Created` - Candidate object
- **Module:** `modules/candidates/service.ts`

#### `GET /api/candidates/[id]`
- **Purpose:** Get candidate by ID
- **Auth Required:** Yes
- **Response:** `200 OK` - Candidate object with assignedRecruiter relation
- **RBAC:** Admin/Manager can access any, Recruiters only their candidates
- **Module:** `modules/candidates/service.ts`

#### `PATCH /api/candidates/[id]`
- **Purpose:** Update candidate
- **Auth Required:** Yes
- **Request Body:** Partial candidate fields
- **Response:** `200 OK` - Updated candidate object
- **RBAC:** Admin can update any, Recruiters only their candidates
- **Module:** `modules/candidates/service.ts`

#### `DELETE /api/candidates/[id]`
- **Purpose:** Delete candidate
- **Auth Required:** Yes
- **Response:** `200 OK`
- **RBAC:** Admin can delete any, Recruiters only their candidates
- **Module:** `modules/candidates/service.ts`

### 2.5 Application Management APIs

#### `GET /api/applications`
- **Purpose:** Get all applications (filtered by role)
- **Auth Required:** Yes
- **Response:** `200 OK` - Array of Application objects with job, candidate, recruiter relations
- **RBAC:** Admin/Manager see all, Recruiters see only their applications
- **Module:** `modules/applications/service.ts`

#### `POST /api/applications`
- **Purpose:** Create new application
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    jobId: string;
    candidateId: string;
    recruiterId: string;
    stage?: ApplicationStage; // Defaults to IDENTIFIED
    notes?: string;
    followUpDate?: string; // ISO date string
  }
  ```
- **Response:** `201 Created` - Application object
- **Validation:** Prevents duplicate applications (jobId + candidateId unique)
- **Module:** `modules/applications/service.ts`

#### `GET /api/applications/[id]`
- **Purpose:** Get application by ID
- **Auth Required:** Yes
- **Response:** `200 OK` - Application object with job, candidate, recruiter relations
- **RBAC:** Admin/Manager can access any, Recruiters only their applications
- **Module:** `modules/applications/service.ts`

#### `PATCH /api/applications/[id]`
- **Purpose:** Update application (stage, notes, follow-up date)
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    stage?: ApplicationStage;
    notes?: string;
    followUpDate?: string; // ISO date string
  }
  ```
- **Response:** `200 OK` - Updated application object
- **RBAC:** Admin can update any, Recruiters only their applications
- **Module:** `modules/applications/service.ts`

#### `DELETE /api/applications/[id]`
- **Purpose:** Delete application
- **Auth Required:** Yes
- **Response:** `200 OK`
- **RBAC:** Admin can delete any, Recruiters only their applications
- **Module:** `modules/applications/service.ts`

### 2.6 Notification APIs

#### `GET /api/notifications`
- **Purpose:** Get user notifications
- **Auth Required:** Yes
- **Query Parameters:**
  - `unreadOnly?: boolean` - Filter unread only (default: false)
- **Response:** `200 OK` - Array of Notification objects (max 50, cached)
- **Caching:** Redis cache (30 seconds TTL)
- **Module:** `modules/notifications/service.ts`

#### `PATCH /api/notifications/[id]`
- **Purpose:** Mark notification as read
- **Auth Required:** Yes
- **Response:** `200 OK`
- **Cache Invalidation:** Clears notification cache for user
- **Module:** `modules/notifications/service.ts`

#### `POST /api/notifications/mark-all-read`
- **Purpose:** Mark all notifications as read for user
- **Auth Required:** Yes
- **Response:** `200 OK`
- **Cache Invalidation:** Clears notification cache for user
- **Module:** `modules/notifications/service.ts`

### 2.7 Analytics APIs

#### `GET /api/analytics/recruiter-metrics`
- **Purpose:** Get recruiter performance metrics
- **Auth Required:** Yes
- **Query Parameters:**
  - `recruiterId: string` - Recruiter ID
  - `startDate: string` - ISO date string
  - `endDate: string` - ISO date string
- **Response:** `200 OK`
  ```typescript
  {
    recruiterId: string;
    period: { start: Date; end: Date };
    jobsScraped: number;
    candidatesManaged: number;
    applicationsCreated: number;
    conversionRates: {
      identifiedToApplied: number;
      appliedToInterview: number;
      interviewToOffer: number;
    };
    averageTimePerStage: Array<{ stage: string; averageDays: number }>;
  }
  ```
- **Caching:** Redis cache (5 minutes TTL)
- **Module:** `modules/analytics/service.ts`

#### `GET /api/analytics/system-metrics`
- **Purpose:** Get system-wide metrics
- **Auth Required:** Yes (Admin/Manager only)
- **Query Parameters:**
  - `startDate: string` - ISO date string
  - `endDate: string` - ISO date string
- **Response:** `200 OK` - System metrics object
- **Module:** `modules/analytics/service.ts`

### 2.8 AI APIs

#### `POST /api/ai/analyze-resume`
- **Purpose:** Analyze resume and provide ATS score
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    resumeText: string;
    jobDescription?: string;
  }
  ```
- **Response:** `200 OK`
  ```typescript
  {
    atsScore: number;
    skills: string[];
    missingSkills: string[];
    recommendations: string[];
    gapAnalysis: Array<{ skill: string; level: string }>;
  }
  ```
- **Status:** ⚠️ Returns mock data
- **Module:** `modules/ai/service.ts`

#### `POST /api/ai/match-jobs`
- **Purpose:** Match jobs to candidate
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    candidateId: string;
    limit?: number; // Default: 10, Max: 50
  }
  ```
- **Response:** `200 OK` - Array of JobMatch objects
  ```typescript
  Array<{
    jobId: string;
    score: number; // 0-100
    reasons: string[];
    missingSkills: string[];
  }>
  ```
- **Status:** ⚠️ Returns random scores (60-100), no semantic matching
- **Module:** `modules/ai/service.ts`

### 2.9 File Management APIs

#### `POST /api/files/upload`
- **Purpose:** Upload file to MinIO
- **Auth Required:** Yes
- **Request:** `multipart/form-data`
  - `file: File` - File to upload
  - `fileType: string` - One of: "RESUME", "DOCUMENT", "IMAGE"
- **Response:** `201 Created` - File object
  ```typescript
  {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: FileType;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    createdAt: Date;
  }
  ```
- **Module:** `modules/files/service.ts`

#### `GET /api/files/[id]`
- **Purpose:** Get file metadata or signed URL
- **Auth Required:** Yes
- **Response:** `200 OK` - File object or signed URL
- **Module:** `modules/files/service.ts`

#### `DELETE /api/files/[id]`
- **Purpose:** Delete file from MinIO and database
- **Auth Required:** Yes
- **Response:** `200 OK`
- **Module:** `modules/files/service.ts`

#### `GET /api/files/[id]/download`
- **Purpose:** Download file as buffer
- **Auth Required:** Yes
- **Response:** `200 OK` - File buffer with appropriate Content-Type header
- **Module:** `modules/files/service.ts`

### 2.10 System APIs

#### `POST /api/init`
- **Purpose:** Initialize MinIO buckets
- **Auth Required:** Yes (Admin only)
- **Response:** `200 OK`
- **Module:** `@/lib/storage`

### 2.11 API Common Features

- **CORS:** All APIs support CORS with `OPTIONS` preflight handling
- **Authentication:** Supports both `Authorization: Bearer <token>` header and `token` cookie
- **Error Handling:** Consistent error response format: `{ error: string }`
- **Validation:** All inputs validated with Zod schemas
- **RBAC:** Role-based access control enforced in middleware and service layers

---

## 3. DATABASE SCHEMA

### 3.1 Enums

#### `UserRole`
```prisma
enum UserRole {
  ADMIN
  MANAGER
  RECRUITER
}
```

#### `JobSource`
```prisma
enum JobSource {
  LINKEDIN
  INDEED
  NAUKRI
}
```

#### `ApplicationStage`
```prisma
enum ApplicationStage {
  IDENTIFIED
  RESUME_UPDATED
  COLD_MESSAGE_SENT
  CONNECTION_ACCEPTED
  APPLIED
  INTERVIEW_SCHEDULED
  OFFER
  REJECTED
  CLOSED
}
```

#### `JobStatus`
```prisma
enum JobStatus {
  ACTIVE
  CLOSED
  FILLED
}
```

#### `NotificationType`
```prisma
enum NotificationType {
  FOLLOW_UP_REMINDER
  INTERVIEW_ALERT
  OVERDUE_TASK
  AI_INSIGHT
  JOB_SCRAPE_CONFIRMATION
}
```

#### `NotificationChannel`
```prisma
enum NotificationChannel {
  WHATSAPP
  EMAIL
  IN_APP
}
```

#### `FileType`
```prisma
enum FileType {
  RESUME
  DOCUMENT
  IMAGE
}
```

### 3.2 Models

#### `User` (Table: `users`)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      UserRole @default(RECRUITER)
  managerId String?  // For manager-recruiter relationship
  isActive  Boolean  @default(true)
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  jobs              Job[]
  candidates        Candidate[]
  applications      Application[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  managedRecruiters User[]        @relation("ManagerRecruiter")
  manager           User?         @relation("ManagerRecruiter", fields: [managerId], references: [id])
}
```

**Relationships:**
- One-to-Many: `User` → `Job[]` (jobs scraped by user)
- One-to-Many: `User` → `Candidate[]` (candidates assigned to user)
- One-to-Many: `User` → `Application[]` (applications created by user)
- One-to-Many: `User` → `Notification[]` (notifications for user)
- One-to-Many: `User` → `AuditLog[]` (audit logs by user)
- Self-Referential: `User` → `User[]` (manager-recruiter hierarchy)

#### `Job` (Table: `jobs`)
```prisma
model Job {
  id               String     @id @default(cuid())
  title            String
  company          String
  location         String
  description      String     @db.Text
  source           JobSource
  sourceUrl        String?
  skills           String[]   // Array of skills
  experienceRequired String?
  salaryRange      String?
  status           JobStatus  @default(ACTIVE)
  recruiterId      String
  notes            String?    @db.Text
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  // Relations
  recruiter    User          @relation(fields: [recruiterId], references: [id], onDelete: Cascade)
  applications Application[]
}
```

**Relationships:**
- Many-to-One: `Job` → `User` (recruiter who scraped the job)
- One-to-Many: `Job` → `Application[]` (applications for this job)

#### `Candidate` (Table: `candidates`)
```prisma
model Candidate {
  id                  String   @id @default(cuid())
  firstName           String
  lastName            String
  email               String
  phone               String?
  linkedinUrl         String?
  tags                String[] // Array of tags
  notes               String?  @db.Text
  assignedRecruiterId String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Relations
  assignedRecruiter User          @relation(fields: [assignedRecruiterId], references: [id], onDelete: Cascade)
  applications      Application[]
  resumes           Resume[]
}
```

**Relationships:**
- Many-to-One: `Candidate` → `User` (assigned recruiter)
- One-to-Many: `Candidate` → `Application[]` (applications for this candidate)
- One-to-Many: `Candidate` → `Resume[]` (resume versions)

#### `Application` (Table: `applications`)
```prisma
model Application {
  id          String           @id @default(cuid())
  jobId       String
  candidateId String
  stage       ApplicationStage @default(IDENTIFIED)
  recruiterId String
  notes       String?          @db.Text
  followUpDate DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  // Relations
  job      Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidate Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  recruiter User    @relation(fields: [recruiterId], references: [id], onDelete: Cascade)

  @@unique([jobId, candidateId])
}
```

**Relationships:**
- Many-to-One: `Application` → `Job` (job being applied to)
- Many-to-One: `Application` → `Candidate` (candidate applying)
- Many-to-One: `Application` → `User` (recruiter managing application)
- **Unique Constraint:** `jobId + candidateId` (prevents duplicate applications)

#### `Resume` (Table: `resumes`)
```prisma
model Resume {
  id          String   @id @default(cuid())
  candidateId String
  fileUrl     String
  fileName    String
  fileSize    Int      // in bytes
  version     Int      @default(1)
  uploadedBy  String
  uploadedAt  DateTime @default(now())

  // Relations
  candidate Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
}
```

**Relationships:**
- Many-to-One: `Resume` → `Candidate` (candidate who owns the resume)

#### `Notification` (Table: `notifications`)
```prisma
model Notification {
  id        String            @id @default(cuid())
  userId    String
  type      NotificationType
  channel   NotificationChannel
  title     String
  message   String            @db.Text
  read      Boolean           @default(false)
  sent      Boolean           @default(false)
  sentAt    DateTime?
  createdAt DateTime          @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Relationships:**
- Many-to-One: `Notification` → `User` (user who receives the notification)

#### `AuditLog` (Table: `audit_logs`)
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // e.g., "CREATE_JOB", "UPDATE_CANDIDATE"
  entity    String   // e.g., "Job", "Candidate"
  entityId  String?
  details   String?  @db.Text
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Relationships:**
- Many-to-One: `AuditLog` → `User` (user who performed the action)

#### `File` (Table: `files`)
```prisma
model File {
  id        String   @id @default(cuid())
  fileName  String
  fileUrl   String
  fileType  FileType
  fileSize  Int      // in bytes
  mimeType  String
  uploadedBy String
  createdAt DateTime @default(now())
}
```

**Relationships:**
- None (standalone entity, no foreign keys)

### 3.3 Database Relationships Summary

```
User (1) ──< (N) Job
User (1) ──< (N) Candidate
User (1) ──< (N) Application
User (1) ──< (N) Notification
User (1) ──< (N) AuditLog
User (1) ──< (N) User (Manager-Recruiter hierarchy)

Job (1) ──< (N) Application
Candidate (1) ──< (N) Application
Candidate (1) ──< (N) Resume
```

### 3.4 Database Constraints

- **Unique Constraints:**
  - `User.email` - Unique
  - `Application(jobId, candidateId)` - Unique (prevents duplicate applications)

- **Foreign Key Constraints:**
  - All foreign keys have `onDelete: Cascade` (deleting parent deletes children)

- **Default Values:**
  - `User.role` → `RECRUITER`
  - `User.isActive` → `true`
  - `Application.stage` → `IDENTIFIED`
  - `Job.status` → `ACTIVE`
  - `Resume.version` → `1`
  - `Notification.read` → `false`
  - `Notification.sent` → `false`

---

## 4. UI SCREEN LIST

### 4.1 Public Pages

#### `/` (Root Page)
- **File:** `app/page.tsx`
- **Type:** Client Component
- **Purpose:** Redirects authenticated users to `/dashboard`, unauthenticated to `/login`
- **Status:** ✅ Implemented

#### `/login` (Login Page)
- **File:** `app/(auth)/login/page.tsx`
- **Type:** Client Component
- **Purpose:** User authentication
- **Features:**
  - Email/password form
  - Error display
  - Redirects to dashboard on success
  - Supports redirect query parameter
- **Status:** ✅ Implemented

### 4.2 Protected Pages (Require Authentication)

#### `/dashboard` (Dashboard)
- **File:** `app/dashboard/page.tsx`
- **Type:** Client Component
- **Layout:** `DashboardLayout`
- **Purpose:** Main dashboard with stats and recent items
- **Features:**
  - Stats cards (jobs scraped, candidates managed, applications created)
  - Conversion rate metrics
  - Recent jobs list (5 items)
  - Recent candidates list (5 items)
  - Recent applications list (5 items)
  - Role-based data filtering
- **Data Sources:**
  - `/api/analytics/recruiter-metrics`
  - `/api/jobs`
  - `/api/candidates`
  - `/api/applications`
- **Status:** ✅ Implemented

#### `/jobs` (Jobs Management)
- **File:** `app/jobs/page.tsx`
- **Type:** Client Component
- **Layout:** `DashboardLayout`
- **Purpose:** Job listing and management
- **Features:**
  - DataTable with search
  - Create job modal form
  - Edit job modal form
  - Delete job with confirmation
  - Job details display
- **Data Sources:**
  - `GET /api/jobs`
  - `POST /api/jobs`
  - `PATCH /api/jobs/[id]`
  - `DELETE /api/jobs/[id]`
- **Status:** ✅ Implemented

#### `/candidates` (Candidates Management)
- **File:** `app/candidates/page.tsx`
- **Type:** Client Component
- **Layout:** `DashboardLayout`
- **Purpose:** Candidate listing and management
- **Features:**
  - DataTable with search
  - Create candidate modal form
  - Edit candidate modal form
  - Candidate details display
  - LinkedIn URL links
- **Data Sources:**
  - `GET /api/candidates`
  - `POST /api/candidates`
  - `PATCH /api/candidates/[id]`
- **Status:** ✅ Implemented
- **Missing:** Resume upload UI, resume version management

#### `/applications` (Application Pipeline)
- **File:** `app/applications/page.tsx`
- **Type:** Client Component
- **Layout:** `DashboardLayout`
- **Purpose:** Application pipeline management with Kanban board
- **Features:**
  - PipelineBoard component (Kanban view)
  - Stage-based organization (9 stages)
  - Application detail modal
  - Stage transition
  - Follow-up date management
  - Notes field
- **Data Sources:**
  - `GET /api/applications`
  - `POST /api/applications`
  - `PATCH /api/applications/[id]`
  - `DELETE /api/applications/[id]`
- **Status:** ✅ Implemented
- **Missing:** Drag-and-drop functionality (UI component exists but functionality unclear)

#### `/reports` (Reports & Analytics)
- **File:** `app/reports/page.tsx`
- **Type:** Client Component
- **Layout:** `DashboardLayout`
- **Purpose:** System metrics and analytics
- **Features:**
  - System metrics display
  - Platform usage charts
  - Application funnel performance
  - Date range filtering
- **Data Sources:**
  - `GET /api/analytics/system-metrics`
  - `GET /api/analytics/recruiter-metrics`
- **Status:** ✅ Implemented
- **Missing:** CSV/PDF export, advanced filtering

#### `/admin` (Admin Panel)
- **File:** `app/admin/page.tsx`
- **Type:** Client Component
- **Layout:** `DashboardLayout`
- **Purpose:** User management (Admin only)
- **Features:**
  - User list with DataTable
  - Create user modal form
  - Edit user modal form
  - Delete user with confirmation
  - Role filtering
  - Manager assignment (for recruiters)
  - User activation/deactivation
- **Data Sources:**
  - `GET /api/users`
  - `POST /api/users`
  - `PATCH /api/users/[id]`
  - `DELETE /api/users/[id]`
- **Status:** ✅ Implemented
- **Missing:** System configuration UI, audit log viewer

### 4.3 Layout Components

#### Root Layout (`app/layout.tsx`)
- **Type:** Server Component
- **Purpose:** Root HTML structure
- **Features:**
  - Metadata configuration
  - Font loading (Geist Sans, Geist Mono)
  - Global CSS import
  - Children rendering

#### Dashboard Layout (`components/DashboardLayout.tsx`)
- **Type:** Client Component
- **Purpose:** Common layout for all dashboard pages
- **Features:**
  - Navbar integration
  - Sidebar integration
  - User authentication check
  - Sidebar state management (open/closed)
  - Responsive behavior
  - Loading states
- **Dependencies:** `ui/Navbar`, `ui/Sidebar`

---

## 5. COMPONENT LIBRARY

### 5.1 UI Components (`/ui`)

#### `DataTable` (`ui/DataTable.tsx`)
- **Type:** Client Component
- **Purpose:** Reusable data table with search and pagination
- **Props:**
  ```typescript
  {
    data: T[];
    columns: Array<{
      key: string;
      header: string;
      render: (item: T) => React.ReactNode;
    }>;
    searchable?: boolean;
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
  }
  ```
- **Features:**
  - Search functionality
  - Column rendering
  - Row click handling
  - Responsive design
- **Used In:** Jobs, Candidates, Admin pages

#### `Modal` (`ui/Modal.tsx`)
- **Type:** Client Component
- **Purpose:** Reusable modal dialog
- **Props:**
  ```typescript
  {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
  }
  ```
- **Features:**
  - Overlay backdrop
  - Close button
  - Size variants
  - Click outside to close
- **Used In:** All pages with forms

#### `StatsCard` (`ui/StatsCard.tsx`)
- **Type:** Client Component
- **Purpose:** Display metric cards
- **Props:**
  ```typescript
  {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
  }
  ```
- **Features:**
  - Value display
  - Change indicator (positive/negative)
  - Icon support
- **Used In:** Dashboard page

#### `PipelineBoard` (`ui/PipelineBoard.tsx`)
- **Type:** Client Component
- **Purpose:** Kanban board for application pipeline
- **Props:**
  ```typescript
  {
    applications: Application[];
    stages: string[];
    onStageChange: (applicationId: string, newStage: string) => void;
    onApplicationClick?: (application: Application) => void;
  }
  ```
- **Features:**
  - Stage columns
  - Application cards
  - Stage transition
  - Click handling
- **Used In:** Applications page

#### `Sidebar` (`ui/Sidebar.tsx`)
- **Type:** Client Component
- **Purpose:** Navigation sidebar
- **Props:**
  ```typescript
  {
    user: User | null;
    isOpen: boolean;
    onToggle: () => void;
  }
  ```
- **Features:**
  - Collapsible (expanded/collapsed states)
  - Role-based navigation items
  - Active route highlighting
  - Mobile responsive (overlay on mobile)
  - Body scroll lock on mobile
- **Navigation Items:**
  - Dashboard
  - Jobs
  - Candidates
  - Applications
  - Reports (Admin/Manager only)
  - Admin (Admin only)

#### `Navbar` (`ui/Navbar.tsx`)
- **Type:** Client Component
- **Purpose:** Top navigation bar
- **Props:**
  ```typescript
  {
    user: User | null;
    onSidebarToggle: () => void;
    isSidebarOpen: boolean;
  }
  ```
- **Features:**
  - Sidebar toggle button
  - Logo/brand name
  - Notification dropdown
  - User dropdown menu
  - Logout functionality
- **Dependencies:** `ui/NotificationDropdown`

#### `NotificationDropdown` (`ui/NotificationDropdown.tsx`)
- **Type:** Client Component
- **Purpose:** Notification bell with dropdown
- **Props:**
  ```typescript
  {
    user: User | null;
  }
  ```
- **Features:**
  - Unread count badge
  - Notification list
  - Mark as read
  - Mark all as read
  - Auto-refresh (polling)
- **Data Sources:**
  - `GET /api/notifications`
  - `PATCH /api/notifications/[id]`
  - `POST /api/notifications/mark-all-read`

### 5.2 Layout Components (`/components`)

#### `DashboardLayout` (`components/DashboardLayout.tsx`)
- **Type:** Client Component
- **Purpose:** Wrapper layout for all dashboard pages
- **Features:**
  - Authentication check
  - User data fetching
  - Sidebar state management
  - Navbar integration
  - Sidebar integration
  - Responsive layout
  - Loading states
- **Dependencies:** `ui/Navbar`, `ui/Sidebar`

---

## 6. INFRASTRUCTURE

### 6.1 Middleware (`middleware.ts`)

- **Purpose:** Request interception for authentication and authorization
- **Features:**
  - Root path (`/`) redirect handling
  - Public routes whitelist (`/login`, `/api/auth/login`)
  - Authentication check (Bearer token or cookie)
  - Role-based route protection
  - Admin-only routes (`/admin`)
  - Manager/Admin routes (`/reports`, `/analytics`)
  - Automatic redirect to login for unauthenticated users
  - Automatic redirect to dashboard for authenticated users on login page
  - User context injection (x-user-id, x-user-role headers)

### 6.2 Docker Services (`docker-compose.yml`)

#### PostgreSQL
- **Image:** `postgres:16-alpine`
- **Port:** `5433:5432`
- **Database:** `recruitment_os`
- **User:** `recruitment_user`
- **Password:** `recruitment_password`
- **Volume:** `postgres_data`
- **Health Check:** Enabled

#### Redis
- **Image:** `redis:7-alpine`
- **Port:** `6380:6379`
- **Password:** `recruitment_redis_password`
- **Volume:** `redis_data`
- **Persistence:** AOF (append-only file) enabled
- **Health Check:** Enabled

#### MinIO
- **Image:** `minio/minio:latest`
- **Ports:** `9010:9000` (API), `9011:9001` (Console)
- **Access Key:** `recruitment_minio_admin`
- **Secret Key:** `recruitment_minio_password`
- **Volume:** `minio_data`
- **Health Check:** Enabled

**Network:** All services on `recruitment-network` (bridge driver)

### 6.3 Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars recommended)
- `JWT_EXPIRES_IN` - Token expiration (default: "7d")
- `REDIS_HOST` - Redis host (default: "localhost")
- `REDIS_PORT` - Redis port (default: "6380")
- `REDIS_PASSWORD` - Redis password
- `MINIO_ENDPOINT` - MinIO endpoint (default: "localhost")
- `MINIO_PORT` - MinIO port (default: "9010")
- `MINIO_USE_SSL` - MinIO SSL (default: "false")
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key
- `MINIO_PUBLIC_URL` - MinIO public URL

### 6.4 File Structure

```
Master/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   └── login/
│   │       └── page.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── api/                      # API routes
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── applications/
│   │   ├── auth/
│   │   ├── candidates/
│   │   ├── files/
│   │   ├── init/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   └── users/
│   ├── applications/
│   │   └── page.tsx
│   ├── candidates/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── jobs/
│   │   └── page.tsx
│   ├── reports/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/                    # Layout components
│   └── DashboardLayout.tsx
├── lib/                          # Shared libraries
│   ├── api-response.ts
│   ├── auth.ts
│   ├── cors.ts
│   ├── db.ts
│   ├── rbac.ts
│   ├── redis.ts
│   └── storage.ts
├── modules/                      # Business logic modules
│   ├── ai/
│   ├── analytics/
│   ├── applications/
│   ├── audit/
│   ├── auth/
│   ├── candidates/
│   ├── files/
│   ├── jobs/
│   ├── notifications/
│   ├── resumes/                  # Empty folder
│   └── users/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   └── init-storage.ts
├── ui/                           # Reusable UI components
│   ├── DataTable.tsx
│   ├── Modal.tsx
│   ├── Navbar.tsx
│   ├── NotificationDropdown.tsx
│   ├── PipelineBoard.tsx
│   ├── Sidebar.tsx
│   └── StatsCard.tsx
├── docker-compose.yml
├── middleware.ts
├── next.config.ts
└── package.json
```

---

## 7. SYSTEM STATE SUMMARY

### 7.1 Implementation Status

**✅ Fully Implemented:**
- Authentication & Authorization
- User Management
- Job Management
- Candidate Management
- Application Pipeline
- File Upload/Download
- Notifications (in-app)
- Analytics & Reporting
- Dashboard
- Admin Panel

**⚠️ Partially Implemented:**
- Resume Management (schema exists, service missing)
- Notifications (WhatsApp/Email stubbed)
- AI Services (all methods return mock data)
- Application Actions (no timeline model)

**❌ Not Implemented:**
- Background Job System
- Scheduled Tasks
- WhatsApp Integration (stubbed)
- Email Integration (stubbed)
- Audit Logging (service exists but not called)
- Resume Service Module (folder empty)

### 7.2 Technology Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **UI:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL 16 (Prisma 5.19.1)
- **Cache:** Redis 7 (ioredis 5.9.2)
- **Storage:** MinIO (minio 8.0.6)
- **Auth:** JWT (jsonwebtoken 9.0.3, jose 6.1.3)
- **Validation:** Zod 4.3.6
- **Password:** bcryptjs 3.0.3

### 7.3 Architecture Pattern

- **Style:** Modular Monolith
- **Design:** Domain-Driven Design (DDD)
- **API:** RESTful (Next.js API Routes)
- **State Management:** React hooks (useState, useEffect)
- **Data Fetching:** Fetch API with credentials

---

**Document Freeze Date:** January 2026  
**Baseline Version:** 1.0  
**Next Update:** When system state changes significantly

