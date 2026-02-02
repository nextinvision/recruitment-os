Software Requirements Specification (SRS)
Internal Recruitment Agency System
Version: 1.0
Date: January 27, 2026
Status: Final
1. INTRODUCTION
1.1 Purpose
This Software Requirements Specification document provides a complete description of the
Internal Recruitment Agency System. The document details all functional and non-functional
requirements for the system, which consolidates job discovery, candidate management,
application tracking, AI-powered automation, and communication workflows into a unified
internal platform.
This document is intended for developers, testers, project managers, system administrators,
and stakeholders involved in the development and deployment of the system.
1.2 Scope
The Internal Recruitment Agency System is a comprehensive recruitment operations
platform designed exclusively for internal use by recruitment agencies. The system
encompasses:
Chrome Extension - A browser-based tool that enables recruiters to manually capture job
postings from various job portals including LinkedIn, Indeed, Naukri, and other career
websites. The extension provides a staging area for reviewing and editing captured data
before submission.
Internal CRM Web Application - A full-featured web application that serves as the central
hub for managing candidates, jobs, applications, and team performance. The CRM provides
dashboards, search capabilities, lifecycle tracking, and comprehensive reporting.
Backend Services - A microservices-based backend architecture providing RESTful APIs
for authentication, job processing, candidate management, application tracking, and
integration services.
AI Agent (CRA) - The Careerist Recruiter Assistant that automates repetitive tasks including
resume analysis, LinkedIn optimization, job-candidate matching, message generation, and
performance reporting.
WhatsApp Integration - Real-time communication system using Meta WhatsApp Cloud API
for sending reminders, alerts, and notifications to recruiters and optionally to candidates.
Admin Panel - System administration interface for user management, role assignment,
system configuration, and operational monitoring.
The system strictly enforces internal-only access with no external candidate-facing
interfaces. All job scraping is manual and requires explicit recruiter approval. The agency
maintains complete ownership of all data with no third-party sharing.
1.3 Definitions, Acronyms, and Abbreviations
CRA - Careerist Recruiter Assistant, the AI agent component of the system
CRM - Customer Relationship Management, in this context refers to the internal candidate
and job management application
API - Application Programming Interface
REST - Representational State Transfer, architectural style for web services
JWT - JSON Web Token, token-based authentication standard
RBAC - Role-Based Access Control, authorization model based on user roles
ATS - Applicant Tracking System, system for tracking job applications
DOM - Document Object Model, programming interface for HTML documents
MVP - Minimum Viable Product
PII - Personally Identifiable Information
GDPR - General Data Protection Regulation
RTO - Recovery Time Objective, maximum acceptable downtime
RPO - Recovery Point Objective, maximum acceptable data loss
HTTPS - Hypertext Transfer Protocol Secure
SQL - Structured Query Language
JSON - JavaScript Object Notation
CSV - Comma-Separated Values
PDF - Portable Document Format
1.4 References
● Meta WhatsApp Cloud API Documentation
● OpenAI GPT-4 API Documentation
● Chrome Extension Manifest V3 Specification
● PostgreSQL Documentation
● GDPR Compliance Guidelines
● OWASP Security Best Practices
1.5 Overview
This SRS document is organized into the following sections:
Section 2 provides an overall description of the system including product perspective, user
characteristics, constraints, and assumptions.
Section 3 details all functional requirements organized by system component.
Section 4 specifies non-functional requirements including performance, security, reliability,
and maintainability requirements.
Section 5 describes external interface requirements for user interfaces, hardware interfaces,
software interfaces, and communications interfaces.
Section 6 covers system features and use cases.
Section 7 addresses data requirements including data models, data integrity, and data
retention.
2. OVERALL DESCRIPTION
2.1 Product Perspective
The Internal Recruitment Agency System is a standalone, self-contained system designed
specifically for internal recruitment agency operations. The system replaces fragmented
tools and manual processes with an integrated platform that provides end-to-end recruitment
workflow management.
The system interfaces with external job portals only through manual recruiter-initiated
scraping. It integrates with Meta WhatsApp Cloud API for messaging and optionally with
OpenAI or Anthropic APIs for AI-powered features. The system does not interface with any
applicant tracking systems or external recruitment platforms.
The architecture follows a client-server model with multiple client applications (Chrome
Extension, Web CRM, Admin Panel) communicating with a centralized backend through
RESTful APIs. All data is stored in agency-owned infrastructure with no external data
sharing.
2.2 Product Functions
The major functions of the system include:
Job Discovery and Management - Recruiters manually capture job postings from external
portals using the Chrome Extension. Jobs are validated, deduplicated, and stored in a
centralized job pool. Recruiters can assign jobs to candidates, track job status, and filter jobs
by multiple criteria.
Candidate Management - Complete candidate profile management including contact
information, resume versions, LinkedIn optimization status, recruiter assignment, notes, and
tags. Candidates are internal records with no system access.
Application Lifecycle Tracking - Track candidate applications through predefined stages
from identification to final outcome. Each status transition is logged with timestamp and
recruiter attribution. Visual pipeline view shows applications across all stages.
AI-Powered Automation - The CRA AI agent provides resume analysis, LinkedIn
optimization suggestions, job-candidate matching, personalized message generation, weekly
planning, pipeline analysis, and automated reporting.
Communication and Notifications - WhatsApp integration sends reminders, alerts, daily
summaries, and AI-generated insights to recruiters. Optional candidate messaging for job
sharing and interview coordination.
Performance Analytics - Comprehensive dashboards showing recruiter metrics, platform
performance, conversion funnels, team activity, and time-based analytics with export
capabilities.
User and Access Management - Role-based access control with admin, manager, and
recruiter roles. Complete audit logging of all system activities.
2.3 User Characteristics
Administrators are technical users responsible for system governance. They have
advanced technical knowledge and understand system configuration, user management,
and operational monitoring. Administrators use the system daily for oversight but do not
perform recruitment activities.
Managers are recruitment team leaders with intermediate technical skills. They monitor
team performance, review reports, and make strategic decisions. Managers use the system
daily for analytics and team management.
Recruiters are the primary end users with varying technical proficiency. They perform all
recruitment activities including job scraping, candidate management, and application
tracking. Recruiters use the system continuously throughout their workday.
AI Agent (CRA) is a system component, not a human user, with restricted programmatic
access to perform automated analysis and generate recommendations.
2.4 Constraints
Regulatory Constraints - The system must comply with GDPR data protection regulations
including data minimization, right to access, right to deletion, and data portability. All
personal data must be encrypted and access must be audited.
Technical Constraints - The Chrome Extension must comply with Chrome Extension
Manifest V3 specifications. WhatsApp messaging must use only pre-approved templates as
required by Meta WhatsApp Cloud API. All API communications must use HTTPS.
Business Constraints - Job scraping must be manual and recruiter-initiated, no automated
crawling is permitted. The system is strictly internal with no external candidate access. All
data must remain agency-owned with no third-party sharing.
Security Constraints - All authentication must use token-based mechanisms with
expiration. All sensitive data must be encrypted at rest and in transit. Role-based access
control must be enforced on all operations.
Operational Constraints - The system must support a minimum of 100 concurrent users.
Maximum 50 jobs can be captured per scraping session. API response time must be under
200 milliseconds for standard operations.
2.5 Assumptions and Dependencies
Assumptions
● Recruiters have access to Chrome browser for using the extension
● Agency has infrastructure for hosting the backend services and database
● Users have stable internet connectivity
● Recruiters have valid accounts on job portals they wish to scrape
● WhatsApp Cloud API access is available and configured
● AI service providers maintain their API availability
Dependencies
● Chrome browser support for Manifest V3 extensions
● Meta WhatsApp Cloud API continued availability
● OpenAI or Anthropic API availability for AI features
● PostgreSQL database system
● Redis cache system
● AWS S3 or equivalent file storage for resumes
● HTTPS certificate for secure communications
3. FUNCTIONAL REQUIREMENTS
3.1 Chrome Extension Requirements
3.1.1 User Authentication
FR-CE-001 The extension shall provide a login interface for recruiters to authenticate using
agency credentials.
FR-CE-002 The extension shall store authentication tokens securely in Chrome storage.
FR-CE-003 The extension shall automatically attach authentication tokens to all API
requests.
FR-CE-004 The extension shall handle token expiration and provide token refresh capability.
FR-CE-005 The extension shall provide a logout function that clears all stored credentials.
FR-CE-006 The extension shall display the logged-in recruiter's name and role.
3.1.2 Job Portal Detection
FR-CE-007 The extension shall automatically detect when a recruiter navigates to a
supported job portal.
FR-CE-008 The extension shall support the following job portals: LinkedIn, Indeed, Naukri,
and generic career websites.
FR-CE-009 The extension shall identify job listing pages versus job detail pages.
FR-CE-010 The extension shall display a "Capture Jobs" button when on a supported job
page.
FR-CE-011 The extension shall disable the capture button on unsupported pages.
3.1.3 Manual Job Scraping
FR-CE-012 The extension shall extract job data only when the recruiter explicitly clicks the
"Capture Jobs" button.
FR-CE-013 The extension shall extract the following fields from job listings: job title,
company name, location, job description, experience required, skills required, salary range
(if available), and source URL.
FR-CE-014 The extension shall extract data from the currently visible DOM only, not from
dynamic loading or pagination.
FR-CE-015 For job listing pages, the extension shall provide checkboxes for selecting
individual jobs.
FR-CE-016 The extension shall support capturing a maximum of 50 jobs per scraping
session.
FR-CE-017 The extension shall provide an option to deep-scrape job detail pages for
selected jobs.
FR-CE-018 The extension shall handle missing or optional fields gracefully without failing the
scrape.
FR-CE-019 The extension shall tag each scraped job with the source platform identifier.
FR-CE-020 The extension shall timestamp each scraped job with the capture time.
FR-CE-021 The extension shall associate each scraped job with the logged-in recruiter's ID.
3.1.4 Staging Area
FR-CE-022 The extension shall display all scraped jobs in a local staging area before
submission.
FR-CE-023 The staging area shall store jobs temporarily in Chrome storage.
FR-CE-024 The staging area shall allow recruiters to edit all job fields.
FR-CE-025 The staging area shall provide field validation with error messages.
FR-CE-026 The staging area shall allow recruiters to delete individual jobs.
FR-CE-027 The staging area shall provide a "Select All" checkbox for bulk selection.
FR-CE-028 The staging area shall provide filtering options by company, location, and title
keywords.
FR-CE-029 The staging area shall display a preview of each job with expandable details.
FR-CE-030 The staging area shall indicate mandatory fields that must be completed.
3.1.5 Job Submission
FR-CE-031 The extension shall provide a "Save to CRM" button to submit selected jobs.
FR-CE-032 The extension shall validate all mandatory fields before submission.
FR-CE-033 The extension shall send jobs to the backend API with recruiter metadata.
FR-CE-034 The extension shall display a progress indicator during submission.
FR-CE-035 The extension shall handle submission errors with appropriate error messages.
FR-CE-036 The extension shall provide retry capability for failed submissions.
FR-CE-037 Upon successful submission, the extension shall clear submitted jobs from
staging.
FR-CE-038 The extension shall display a success notification with count of jobs saved.
FR-CE-039 The extension shall log all submission attempts for debugging.
3.1.6 Data Validation
FR-CE-040 The extension shall validate that job title is not empty and is less than 255
characters.
FR-CE-041 The extension shall validate that company name is not empty and is less than
255 characters.
FR-CE-042 The extension shall validate that source URL is a valid URL format.
FR-CE-043 The extension shall validate that location is less than 255 characters.
FR-CE-044 The extension shall sanitize all input data to prevent XSS attacks.
FR-CE-045 The extension shall normalize text data by removing excessive whitespace.
3.2 Internal CRM Web Application Requirements
3.2.1 User Authentication and Authorization
FR-CRM-001 The CRM shall provide a login page requiring email and password.
FR-CRM-002 The CRM shall validate credentials against the backend authentication
service.
FR-CRM-003 The CRM shall store JWT tokens securely in browser storage.
FR-CRM-004 The CRM shall automatically refresh tokens before expiration.
FR-CRM-005 The CRM shall redirect to login page when tokens expire.
FR-CRM-006 The CRM shall provide a logout function that clears all stored data.
FR-CRM-007 The CRM shall display different navigation menus based on user role.
FR-CRM-008 The CRM shall restrict access to admin features for non-admin users.
FR-CRM-009 The CRM shall restrict access to manager features for recruiter users.
FR-CRM-010 The CRM shall allow recruiters to access only their assigned data.
3.2.2 Dashboard
FR-CRM-011 The CRM shall display a personalized dashboard upon login.
FR-CRM-012 The recruiter dashboard shall show assigned jobs count.
FR-CRM-013 The recruiter dashboard shall show managed candidates count.
FR-CRM-014 The recruiter dashboard shall show active applications count.
FR-CRM-015 The recruiter dashboard shall display pending follow-ups.
FR-CRM-016 The recruiter dashboard shall display overdue tasks.
FR-CRM-017 The recruiter dashboard shall show daily to-do list.
FR-CRM-018 The recruiter dashboard shall display AI recommendations.
FR-CRM-019 The recruiter dashboard shall show recent activity timeline.
FR-CRM-020 The admin dashboard shall display system-wide metrics.
FR-CRM-021 The admin dashboard shall show recruiter performance comparison.
FR-CRM-022 The admin dashboard shall display platform source analytics.
FR-CRM-023 The admin dashboard shall show application funnel metrics.
FR-CRM-024 All dashboard metrics shall be refreshable without page reload.
3.2.3 Job Management
FR-CRM-025 The CRM shall display all jobs in a centralized job pool.
FR-CRM-026 The job pool shall support pagination with configurable page size.
FR-CRM-027 The job pool shall provide sorting by date, title, company, and source.
FR-CRM-028 The job pool shall provide filtering by source platform, date range, recruiter,
status, and keywords.
FR-CRM-029 The CRM shall display full job details including title, company, location,
description, experience, skills, salary, source, source URL, scraped by, scraped date, and
status.
FR-CRM-030 The CRM shall allow editing of job details by the recruiter who scraped it.
FR-CRM-031 The CRM shall allow admins to edit any job details.
FR-CRM-032 The CRM shall provide a job assignment interface to assign jobs to
candidates.
FR-CRM-033 The CRM shall support bulk job assignment to multiple candidates.
FR-CRM-034 The CRM shall allow marking jobs as filled, closed, or active.
FR-CRM-035 The CRM shall flag duplicate jobs automatically.
FR-CRM-036 The CRM shall provide a duplicate resolution interface to merge or delete
duplicates.
FR-CRM-037 The CRM shall display job assignment history.
FR-CRM-038 The CRM shall provide job export functionality in CSV format.
FR-CRM-039 The CRM shall allow adding internal notes to jobs.
FR-CRM-040 The CRM shall display the application count for each job.
3.2.4 Candidate Management
FR-CRM-041 The CRM shall display all candidates in a searchable list.
FR-CRM-042 The candidate list shall support pagination with configurable page size.
FR-CRM-043 The candidate list shall provide sorting by name, date added, and assigned
recruiter.
FR-CRM-044 The candidate list shall provide filtering by recruiter, tags, and keywords.
FR-CRM-045 The CRM shall provide a candidate creation form with fields for first name, last
name, email, phone, LinkedIn URL, and tags.
FR-CRM-046 The CRM shall validate email format when provided.
FR-CRM-047 The CRM shall validate phone format when provided.
FR-CRM-048 The CRM shall validate LinkedIn URL format when provided.
FR-CRM-049 The CRM shall allow adding multiple tags to candidates.
FR-CRM-050 The CRM shall provide autocomplete for existing tags.
FR-CRM-051 The CRM shall display complete candidate profile including contact
information, assigned recruiter, tags, LinkedIn optimization status, and internal notes.
FR-CRM-052 The CRM shall allow editing candidate profile by assigned recruiter.
FR-CRM-053 The CRM shall allow admins to edit any candidate profile.
FR-CRM-054 The CRM shall provide candidate assignment interface to assign recruiters.
FR-CRM-055 The CRM shall support bulk candidate assignment to recruiters.
FR-CRM-056 The CRM shall allow adding internal notes to candidates.
FR-CRM-057 The CRM shall display all applications associated with the candidate.
FR-CRM-058 The CRM shall display candidate activity timeline.
FR-CRM-059 The CRM shall provide candidate export functionality in CSV format.
3.2.5 Resume Management
FR-CRM-060 The CRM shall allow uploading resume files for candidates.
FR-CRM-061 The CRM shall support resume file formats: PDF, DOCX, DOC.
FR-CRM-062 The CRM shall enforce maximum resume file size of 10 MB.
FR-CRM-063 The CRM shall maintain multiple resume versions for each candidate.
FR-CRM-064 The CRM shall automatically increment version numbers for new resumes.
FR-CRM-065 The CRM shall display all resume versions with upload date and uploader.
FR-CRM-066 The CRM shall allow downloading any resume version.
FR-CRM-067 The CRM shall allow deleting resume versions except the latest.
FR-CRM-068 The CRM shall mark the latest resume as current.
FR-CRM-069 The CRM shall display resume file name, size, and type.
FR-CRM-070 The CRM shall trigger AI resume analysis upon upload.
3.2.6 LinkedIn Optimization Tracking
FR-CRM-071 The CRM shall display LinkedIn optimization status for each candidate.
FR-CRM-072 The CRM shall support optimization statuses: Not Started, In Progress,
Completed.
FR-CRM-073 The CRM shall allow recruiters to update optimization status.
FR-CRM-074 The CRM shall display AI-generated LinkedIn optimization suggestions.
FR-CRM-075 The CRM shall allow marking optimization suggestions as implemented.
FR-CRM-076 The CRM shall track optimization completion date.
FR-CRM-077 The CRM shall trigger AI LinkedIn optimization analysis when requested.
3.2.7 Application Management
FR-CRM-078 The CRM shall display all applications in a pipeline view.
FR-CRM-079 The pipeline view shall organize applications by current stage.
FR-CRM-080 The pipeline shall support the following stages: Identified, Resume Updated,
Cold Message Sent, Connection Accepted, Applied, Interview Scheduled, Offer, Rejected,
Closed.
FR-CRM-081 The CRM shall allow drag-and-drop to move applications between stages.
FR-CRM-082 The CRM shall display application card with candidate name, job title,
company, and days in current stage.
FR-CRM-083 The CRM shall provide application detail view with complete information.
FR-CRM-084 The application detail shall show candidate profile, job details, current status,
and action timeline.
FR-CRM-085 The CRM shall allow adding actions to applications with action type and
description.
FR-CRM-086 The CRM shall support action types: Applied, Outreach, Follow-up, Interview,
Offer, Rejection, Note.
FR-CRM-087 The CRM shall timestamp all actions automatically.
FR-CRM-088 The CRM shall associate all actions with the performing recruiter.
FR-CRM-089 The CRM shall display complete action timeline in chronological order.
FR-CRM-090 The CRM shall allow setting next follow-up date for applications.
FR-CRM-091 The CRM shall send reminders for approaching follow-up dates.
FR-CRM-092 The CRM shall highlight overdue follow-ups in red.
FR-CRM-093 The CRM shall allow adding internal notes to applications.
FR-CRM-094 The CRM shall provide application filtering by status, recruiter, date range, and
keywords.
FR-CRM-095 The CRM shall calculate and display days in current stage for each
application.
FR-CRM-096 The CRM shall calculate and display total days since application creation.
FR-CRM-097 The CRM shall provide application export functionality in CSV format.
FR-CRM-098 The CRM shall allow deleting applications with confirmation.
3.2.8 Performance Analytics
FR-CRM-099 The CRM shall provide a performance dashboard accessible to admins and
managers.
FR-CRM-100 The performance dashboard shall display jobs scraped per recruiter.
FR-CRM-101 The performance dashboard shall display candidates managed per recruiter.
FR-CRM-102 The performance dashboard shall display applications created per recruiter.
FR-CRM-103 The performance dashboard shall display application conversion rates per
recruiter.
FR-CRM-104 The performance dashboard shall show platform source distribution.
FR-CRM-105 The performance dashboard shall display conversion funnel across all stages.
FR-CRM-106 The performance dashboard shall show average time per stage.
FR-CRM-107 The performance dashboard shall provide date range filtering.
FR-CRM-108 The performance dashboard shall support daily, weekly, and monthly views.
FR-CRM-109 The performance dashboard shall display team activity feed in real-time.
FR-CRM-110 The performance dashboard shall provide export functionality for all reports in
CSV and PDF formats.
FR-CRM-111 The performance dashboard shall display charts and graphs for visual
representation.
FR-CRM-112 The performance dashboard shall allow drilling down into individual recruiter
metrics.
3.2.9 Search Functionality
FR-CRM-113 The CRM shall provide global search across jobs, candidates, and
applications.
FR-CRM-114 The search shall support keyword matching in all text fields.
FR-CRM-115 The search shall provide autocomplete suggestions.
FR-CRM-116 The search shall display results grouped by entity type.
FR-CRM-117 The search results shall be clickable to navigate to detail pages.
FR-CRM-118 The search shall support advanced filtering options.
3.2.10 Notifications
FR-CRM-119 The CRM shall display in-app notifications for important events.
FR-CRM-120 The CRM shall notify recruiters of approaching follow-up dates.
FR-CRM-121 The CRM shall notify recruiters of overdue tasks.
FR-CRM-122 The CRM shall notify recruiters of AI-generated recommendations.
FR-CRM-123 The CRM shall notify recruiters when job scraping completes.
FR-CRM-124 The CRM shall display notification count badge in header.
FR-CRM-125 The CRM shall mark notifications as read when clicked.
FR-CRM-126 The CRM shall provide notification history.
FR-CRM-127 The CRM shall allow dismissing notifications.
3.3 Backend Services Requirements
3.3.1 Authentication Service
FR-BE-001 The authentication service shall validate user credentials against the database.
FR-BE-002 The authentication service shall hash passwords using bcrypt with minimum 12
salt rounds.
FR-BE-003 The authentication service shall generate JWT tokens upon successful
authentication.
FR-BE-004 JWT tokens shall include user ID, email, role, and agency ID.
FR-BE-005 Access tokens shall expire after 15 minutes.
FR-BE-006 Refresh tokens shall expire after 7 days.
FR-BE-007 The authentication service shall provide token refresh endpoint.
FR-BE-008 The authentication service shall validate tokens on every authenticated request.
FR-BE-009 The authentication service shall provide password change functionality.
FR-BE-010 Password changes shall require current password verification.
FR-BE-011 The authentication service shall log all authentication events.
FR-BE-012 The authentication service shall lock accounts after 5 failed login attempts.
FR-BE-013 Account locks shall automatically expire after 30 minutes.
FR-BE-014 The authentication service shall provide account unlock functionality for admins.
3.3.2 Job Service
FR-BE-015 The job service shall accept job data from the Chrome Extension.
FR-BE-016 The job service shall validate all mandatory job fields before saving.
FR-BE-017 The job service shall normalize job data by trimming whitespace and
standardizing formats.
FR-BE-018 The job service shall tag each job with source platform identifier.
FR-BE-019 The job service shall associate each job with the submitting recruiter ID.
FR-BE-020 The job service shall timestamp each job with creation time.
FR-BE-021 The job service shall perform duplicate detection based on job title, company
name, location, and source URL.
FR-BE-022 The job service shall calculate similarity score for potential duplicates.
FR-BE-023 Jobs with similarity score above 90 percent shall be flagged as duplicates.
FR-BE-024 The job service shall store duplicate relationships in the database.
FR-BE-025 The job service shall provide endpoints for job CRUD operations.
FR-BE-026 The job service shall support bulk job creation with transaction rollback on
failure.
FR-BE-027 The job service shall provide job search with filtering and pagination.
FR-BE-028 The job service shall enforce authorization rules for job access.
FR-BE-029 Recruiters shall only access jobs they scraped or are assigned to.
FR-BE-030 Admins and managers shall access all jobs.
FR-BE-031 The job service shall provide job assignment functionality.
FR-BE-032 The job service shall validate that target candidates exist before assignment.
FR-BE-033 The job service shall create application records upon job assignment.
FR-BE-034 The job service shall log all job modifications.
3.3.3 Candidate Service
FR-BE-035 The candidate service shall provide endpoints for candidate CRUD operations.
FR-BE-036 The candidate service shall validate email format when provided.
FR-BE-037 The candidate service shall validate phone format when provided.
FR-BE-038 The candidate service shall validate LinkedIn URL format when provided.
FR-BE-039 The candidate service shall enforce unique email constraint.
FR-BE-040 The candidate service shall associate each candidate with creating recruiter.
FR-BE-041 The candidate service shall timestamp each candidate with creation time.
FR-BE-042 The candidate service shall provide candidate search with filtering and
pagination.
FR-BE-043 The candidate service shall enforce authorization rules for candidate access.
FR-BE-044 Recruiters shall only access candidates assigned to them.
FR-BE-045 Admins and managers shall access all candidates.
FR-BE-046 The candidate service shall provide recruiter assignment functionality.
FR-BE-047 The candidate service shall validate that target recruiters exist before
assignment.
FR-BE-048 The candidate service shall log all candidate modifications.
FR-BE-049 The candidate service shall handle resume file uploads.
FR-BE-050 The candidate service shall store resume files in file storage system.
FR-BE-051 The candidate service shall generate unique file names to prevent collisions.
FR-BE-052 The candidate service shall validate resume file types.
FR-BE-053 The candidate service shall validate resume file size.
FR-BE-054 The candidate service shall create resume records in database with file
metadata.
FR-BE-055 The candidate service shall provide resume download functionality.
FR-BE-056 The candidate service shall generate signed URLs for secure file access.
FR-BE-057 The candidate service shall manage resume versions automatically.
FR-BE-058 The candidate service shall update LinkedIn optimization status.
FR-BE-059 The candidate service shall trigger AI analysis when resume is uploaded.
FR-BE-060 The candidate service shall trigger AI LinkedIn optimization when requested.
3.3.4 Application Service
FR-BE-061 The application service shall provide endpoints for application CRUD operations.
FR-BE-062 The application service shall validate that candidate and job exist before creating
application.
FR-BE-063 The application service shall set initial status to "Identified".
FR-BE-064 The application service shall associate each application with creating recruiter.
FR-BE-065 The application service shall timestamp each application with creation time.
FR-BE-066 The application service shall provide status update functionality.
FR-BE-067 The application service shall validate status transitions.
FR-BE-068 Status transitions shall only move forward in the defined lifecycle.
FR-BE-069 The application service shall log each status change with timestamp and
recruiter.
FR-BE-070 The application service shall provide action logging functionality.
FR-BE-071 The application service shall validate action types.
FR-BE-072 The application service shall timestamp each action automatically.
FR-BE-073 The application service shall associate each action with performing recruiter.
FR-BE-074 The application service shall provide timeline retrieval showing all actions
chronologically.
FR-BE-075 The application service shall provide pipeline view aggregating applications by
status.
FR-BE-076 The application service shall calculate days in current stage.
FR-BE-077 The application service shall calculate total days since creation.
FR-BE-078 The application service shall provide search with filtering and pagination.
FR-BE-079 The application service shall enforce authorization rules for application access.
FR-BE-080 Recruiters shall only access applications they created or are assigned to.
FR-BE-081 Admins and managers shall access all applications.
FR-BE-082 The application service shall support setting follow-up dates.
FR-BE-083 The application service shall trigger follow-up reminders when dates approach.
FR-BE-084 The application service shall log all application modifications.
3.3.5 Notification Service
FR-BE-085 The notification service shall create notifications for follow-up reminders.
FR-BE-086 The notification service shall create notifications for overdue tasks.
FR-BE-087 The notification service shall create notifications for interview reminders.
FR-BE-088 The notification service shall create notifications for AI-generated insights.
FR-BE-089 The notification service shall create notifications for job scraping completion.
FR-BE-090 The notification service shall store notifications in database.
FR-BE-091 The notification service shall provide endpoints to retrieve user notifications.
FR-BE-092 The notification service shall support marking notifications as read.
FR-BE-093 The notification service shall support dismissing notifications.
FR-BE-094 The notification service shall trigger WhatsApp messages for critical
notifications.
FR-BE-095 The notification service shall provide real-time notification delivery via
WebSocket.
3.3.6 Analytics Service
FR-BE-096 The analytics service shall calculate jobs scraped per recruiter.
FR-BE-097 The analytics service shall calculate candidates managed per recruiter.
FR-BE-098 The analytics service shall calculate applications created per recruiter.
FR-BE-099 The analytics service shall calculate conversion rates per stage.
FR-BE-100 The analytics service shall calculate average time per stage.
FR-BE-101 The analytics service shall aggregate data by date range.
FR-BE-102 The analytics service shall support daily, weekly, and monthly aggregations.
FR-BE-103 The analytics service shall calculate platform source distribution.
FR-BE-104 The analytics service shall provide funnel analysis across all stages.
FR-BE-105 The analytics service shall cache computed metrics in Redis.
FR-BE-106 Cache shall expire after 1 hour for frequently updated metrics.
FR-BE-107 The analytics service shall provide export functionality generating CSV and PDF
reports.
3.3.7 API Gateway
FR-BE-108 The API gateway shall validate JWT tokens on all authenticated requests.
FR-BE-109 The API gateway shall extract user information from tokens.
FR-BE-110 The API gateway shall route requests to appropriate backend services.
FR-BE-111 The API gateway shall implement rate limiting per user.
FR-BE-112 Rate limit shall be 100 requests per minute per user.
FR-BE-113 The API gateway shall implement rate limiting per IP address.
FR-BE-114 Rate limit shall be 1000 requests per minute per IP.
FR-BE-115 The API gateway shall return appropriate HTTP status codes.
FR-BE-116 The API gateway shall log all requests with timestamp, user, endpoint, and
response code.
FR-BE-117 The API gateway shall implement CORS policies.
FR-BE-118 The API gateway shall validate request payload against schemas.
FR-BE-119 The API gateway shall sanitize all input data.
FR-BE-120 The API gateway shall handle service errors gracefully.
FR-BE-121 The API gateway shall implement circuit breaker pattern for service failures.
FR-BE-122 The API gateway shall provide health check endpoints.
3.4 AI Agent (CRA) Requirements
3.4.1 Resume Analysis
FR-AI-001 The AI agent shall extract text from PDF and DOCX resume files.
FR-AI-002 The AI agent shall parse resume into structured sections: contact information,
work experience, education, skills, certifications.
FR-AI-003 The AI agent shall calculate ATS compatibility score on scale of 0 to 100.
FR-AI-004 ATS score shall consider keyword presence, formatting, section completeness,
and experience relevance.
FR-AI-005 The AI agent shall extract all skills mentioned in resume.
FR-AI-006 The AI agent shall categorize skills as technical, soft, or domain-specific.
FR-AI-007 The AI agent shall extract work experience with company, role, duration, and
responsibilities.
FR-AI-008 The AI agent shall extract education with institution, degree, field, and graduation
year.
FR-AI-009 The AI agent shall identify career gaps exceeding 6 months.
FR-AI-010 The AI agent shall generate improvement recommendations for resume.
FR-AI-011 Recommendations shall include missing sections, keyword suggestions,
formatting improvements, and content enhancements.
FR-AI-012 The AI agent shall store analysis results in database.
FR-AI-013 The AI agent shall notify recruiter when analysis completes.
3.4.2 LinkedIn Optimization
FR-AI-014 The AI agent shall analyze candidate profile for LinkedIn optimization.
FR-AI-015 The AI agent shall generate optimized LinkedIn headline incorporating role and
key skills.
FR-AI-016 Headline shall be maximum 120 characters.
FR-AI-017 The AI agent shall generate optimized About section highlighting achievements
and expertise.
FR-AI-018 About section shall be maximum 2000 characters.
FR-AI-019 The AI agent shall generate optimized experience descriptions for each role.
FR-AI-020 Experience descriptions shall incorporate action verbs and quantifiable
achievements.
FR-AI-021 The AI agent shall suggest relevant skills to add to LinkedIn profile.
FR-AI-022 The AI agent shall suggest relevant keywords for natural integration.
FR-AI-023 The AI agent shall provide A/B testing variations for headline and about section.
FR-AI-024 The AI agent shall store optimization suggestions in database.
FR-AI-025 The AI agent shall notify recruiter when optimization completes.
3.4.3 Job-Candidate Matching
FR-AI-026 The AI agent shall calculate match score between candidate and job on scale of
0 to 100.
FR-AI-027 Match score shall consider skill match, experience match, location match, and
semantic similarity.
FR-AI-028 The AI agent shall use vector embeddings for semantic similarity calculation.
FR-AI-029 The AI agent shall identify matching skills between candidate and job
requirements.
FR-AI-030 The AI agent shall identify missing skills in candidate profile.
FR-AI-031 The AI agent shall calculate experience level match based on years required
versus candidate experience.
FR-AI-032 The AI agent shall consider location preferences in matching.
FR-AI-033 The AI agent shall generate match explanation describing why score was
assigned.
FR-AI-034 The AI agent shall rank all jobs for a candidate by match score.
FR-AI-035 The AI agent shall recommend top 5 jobs per candidate weekly.
FR-AI-036 The AI agent shall store match results in database.
3.4.4 Message Generation
FR-AI-037 The AI agent shall generate personalized cold outreach messages for
candidates.
FR-AI-038 Messages shall incorporate candidate name, role, and relevant experience.
FR-AI-039 Messages shall be maximum 300 characters for LinkedIn connection requests.
FR-AI-040 The AI agent shall generate follow-up messages based on conversation context.
FR-AI-041 The AI agent shall generate job sharing messages with job highlights.
FR-AI-042 The AI agent shall support tone customization: professional, friendly, casual.
FR-AI-043 The AI agent shall generate multiple message variations for A/B testing.
FR-AI-044 The AI agent shall maintain message templates library.
FR-AI-045 Recruiters shall be able to customize and save templates.
FR-AI-046 The AI agent shall store generated messages in database.
FR-AI-047 Generated messages shall require recruiter approval before sending.
3.4.5 Weekly Planning
FR-AI-048 The AI agent shall generate weekly job plan for each recruiter.
FR-AI-049 Weekly plan shall include recommended jobs to assign to candidates.
FR-AI-050 Weekly plan shall prioritize jobs by match score and deadline.
FR-AI-051 Weekly plan shall include daily action items.
FR-AI-052 Action items shall specify candidate, job, and recommended action.
FR-AI-053 The AI agent shall set weekly targets based on historical performance.
FR-AI-054 The AI agent shall generate timeline for completing weekly activities.
FR-AI-055 The AI agent shall store weekly plans in database.
FR-AI-056 The AI agent shall notify recruiter when weekly plan is ready.
FR-AI-057 Weekly plans shall be generated every Sunday evening.
3.4.6 Pipeline Analysis
FR-AI-058 The AI agent shall analyze application pipeline daily.
FR-AI-059 The AI agent shall identify applications stuck in same stage exceeding 7 days.
FR-AI-060 The AI agent shall identify pipeline bottlenecks by stage.
FR-AI-061 The AI agent shall predict application success probability based on historical
data.
FR-AI-062 The AI agent shall identify at-risk applications with low success probability.
FR-AI-063 The AI agent shall generate recommendations for moving stuck applications
forward.
FR-AI-064 Recommendations shall include specific actions recruiter should take.
FR-AI-065 The AI agent shall store pipeline analysis results in database.
FR-AI-066 The AI agent shall notify recruiters of stuck applications.
FR-AI-067 The AI agent shall generate pipeline health report weekly.
3.4.7 Weekly Reporting
FR-AI-068 The AI agent shall generate weekly performance report for each recruiter.
FR-AI-069 Report shall summarize jobs scraped, candidates added, applications created,
and stage progressions.
FR-AI-070 Report shall highlight achievements and completed goals.
FR-AI-071 Report shall identify challenges and blockers faced during the week.
FR-AI-072 Report shall provide comparison to previous week performance.
FR-AI-073 Report shall include conversion metrics per stage.
FR-AI-074 Report shall preview upcoming week goals and targets.
FR-AI-075 The AI agent shall generate reports every Saturday evening.
FR-AI-076 The AI agent shall store reports in database.
FR-AI-077 The AI agent shall send reports via WhatsApp to recruiters.
FR-AI-078 Reports shall also be accessible in CRM dashboard.
3.4.8 AI Task Queue
FR-AI-079 All AI tasks shall be queued for asynchronous processing.
FR-AI-080 Task queue shall support priority levels: high, normal, low.
FR-AI-081 High priority tasks shall be processed immediately.
FR-AI-082 Normal priority tasks shall be processed within 5 minutes.
FR-AI-083 Low priority tasks shall be processed within 1 hour.
FR-AI-084 Failed tasks shall be retried up to 3 times with exponential backoff.
FR-AI-085 Permanently failed tasks shall be logged with error details.
FR-AI-086 Task status shall be tracked: pending, processing, completed, failed.
FR-AI-087 Task results shall be stored in database linked to source entity.
FR-AI-088 Recruiters shall be notified when tasks complete.
3.5 WhatsApp Integration Requirements
3.5.1 WhatsApp Configuration
FR-WA-001 The system shall support configuration of WhatsApp Cloud API credentials.
FR-WA-002 Admins shall configure WhatsApp Business Account ID.
FR-WA-003 Admins shall configure WhatsApp Phone Number ID.
FR-WA-004 Admins shall configure WhatsApp Access Token.
FR-WA-005 The system shall validate WhatsApp API credentials on save.
FR-WA-006 The system shall test WhatsApp connectivity after configuration.
3.5.2 Message Templates
FR-WA-007 The system shall store WhatsApp message templates in database.
FR-WA-008 Each template shall have name, category, language, and content.
FR-WA-009 Templates shall support variable placeholders for personalization.
FR-WA-010 Admins shall create new message templates.
FR-WA-011 Admins shall edit existing message templates.
FR-WA-012 Admins shall submit templates for WhatsApp approval.
FR-WA-013 The system shall track template approval status.
FR-WA-014 Only approved templates shall be available for sending.
FR-WA-015 The system shall support template categories: reminder, alert, update, report.
FR-WA-016 The system shall validate template format before submission.
3.5.3 Message Sending
FR-WA-017 The system shall send WhatsApp messages using approved templates.
FR-WA-018 The system shall substitute template variables with actual values.
FR-WA-019 The system shall validate recipient phone numbers before sending.
FR-WA-020 Phone numbers shall be in E.164 format with country code.
FR-WA-021 The system shall queue messages for asynchronous sending.
FR-WA-022 The system shall support message priority levels.
FR-WA-023 High priority messages shall be sent immediately.
FR-WA-024 Normal priority messages shall be sent within 5 minutes.
FR-WA-025 The system shall retry failed messages up to 3 times.
FR-WA-026 The system shall implement exponential backoff for retries.
FR-WA-027 Permanently failed messages shall be logged with error details.
FR-WA-028 The system shall respect WhatsApp API rate limits.
FR-WA-029 The system shall track message status: pending, sent, delivered, read, failed.
FR-WA-030 The system shall store all messages in database.
FR-WA-031 The system shall log message metadata: recipient, template, variables,
timestamp, status.
3.5.4 Webhook Handling
FR-WA-032 The system shall provide webhook endpoint for WhatsApp status updates.
FR-WA-033 The webhook shall verify signature of incoming requests.
FR-WA-034 The webhook shall handle message delivery status updates.
FR-WA-035 The webhook shall handle message read status updates.
FR-WA-036 The webhook shall handle incoming messages from users.
FR-WA-037 The webhook shall update message status in database.
FR-WA-038 The webhook shall log all webhook events.
FR-WA-039 The webhook shall respond within 5 seconds to avoid timeout.
FR-WA-040 The webhook shall return 200 OK status for valid requests.
3.5.5 Internal Alerts
FR-WA-041 The system shall send WhatsApp alerts for approaching follow-up dates.
FR-WA-042 Follow-up reminders shall be sent 1 day before due date.
FR-WA-043 The system shall send WhatsApp alerts for overdue follow-ups.
FR-WA-044 Overdue alerts shall be sent daily until completed.
FR-WA-045 The system shall send WhatsApp alerts for scheduled interviews.
FR-WA-046 Interview reminders shall be sent 1 day before interview.
FR-WA-047 The system shall send WhatsApp alerts when job scraping completes.
FR-WA-048 Job scraping alerts shall include count of jobs captured.
FR-WA-049 The system shall send WhatsApp alerts for AI-generated insights.
FR-WA-050 AI alerts shall summarize key findings and recommendations.
FR-WA-051 The system shall send daily to-do summary via WhatsApp.
FR-WA-052 Daily summaries shall be sent at 8 AM local time.
FR-WA-053 The system shall send weekly reports via WhatsApp.
FR-WA-054 Weekly reports shall be sent on Saturday evening.
3.5.6 Candidate Messaging (Optional)
FR-WA-055 The system shall support sending messages to candidates via WhatsApp.
FR-WA-056 Candidate messaging shall be configurable by admins to enable or disable.
FR-WA-057 The system shall send job sharing messages to candidates.
FR-WA-058 Job sharing messages shall include job title, company, and link.
FR-WA-059 The system shall send resume request messages to candidates.
FR-WA-060 The system shall send interview confirmation messages to candidates.
FR-WA-061 The system shall send follow-up messages to candidates.
FR-WA-062 The system shall send weekly check-in messages to candidates.
FR-WA-063 All candidate messages shall require recruiter approval before sending.
FR-WA-064 Candidates shall be able to opt-out of WhatsApp messages.
FR-WA-065 The system shall honor opt-out preferences and not send further messages.
3.6 Admin Panel Requirements
3.6.1 User Management
FR-AP-001 Admins shall view all user accounts in a list.
FR-AP-002 The user list shall display name, email, role, and account status.
FR-AP-003 Admins shall create new user accounts.
FR-AP-004 User creation form shall require first name, last name, email, password, and
role.
FR-AP-005 The system shall validate email uniqueness on user creation.
FR-AP-006 The system shall enforce strong password requirements.
FR-AP-007 Passwords shall be minimum 8 characters with uppercase, lowercase, number,
and special character.
FR-AP-008 Admins shall edit existing user accounts.
FR-AP-009 Admins shall change user roles.
FR-AP-010 Admins shall deactivate user accounts.
FR-AP-011 Deactivated accounts shall not be able to login.
FR-AP-012 Admins shall reactivate deactivated accounts.
FR-AP-013 Admins shall reset user passwords.
FR-AP-014 Admins shall unlock locked user accounts.
FR-AP-015 The system shall log all user management actions.
3.6.2 Role Management
FR-AP-016 The system shall support three user roles: Admin, Manager, Recruiter.
FR-AP-017 Admin role shall have full system access.
FR-AP-018 Manager role shall have team management and reporting access.
FR-AP-019 Recruiter role shall have access to assigned data only.
FR-AP-020 Admins shall assign roles during user creation.
FR-AP-021 Admins shall change roles for existing users.
FR-AP-022 Role changes shall take effect on next login.
FR-AP-023 The system shall enforce role-based permissions on all operations.
3.6.3 System Configuration
FR-AP-024 Admins shall configure WhatsApp integration settings.
FR-AP-025 Admins shall configure AI service provider settings.
FR-AP-026 Admins shall configure OpenAI API key.
FR-AP-027 Admins shall select AI model to use.
FR-AP-028 Admins shall enable or disable specific AI features.
FR-AP-029 Admins shall configure email notification settings.
FR-AP-030 Admins shall configure system-wide default values.
FR-AP-031 Admins shall configure job scraping limits.
FR-AP-032 Admins shall configure file upload size limits.
FR-AP-033 All configuration changes shall be logged.
FR-AP-034 Configuration changes shall take effect immediately.
3.6.4 Audit Logs
FR-AP-035 Admins shall view complete audit log of all system activities.
FR-AP-036 Audit logs shall display user, action, entity type, entity ID, timestamp, old values,
new values.
FR-AP-037 Audit logs shall support filtering by user, action, entity type, and date range.
FR-AP-038 Audit logs shall support searching by keywords.
FR-AP-039 Audit logs shall support pagination.
FR-AP-040 Audit logs shall be exportable in CSV format.
FR-AP-041 The system shall automatically log all data modifications.
FR-AP-042 The system shall log all authentication events.
FR-AP-043 The system shall log all authorization failures.
FR-AP-044 The system shall log all configuration changes.
FR-AP-045 Audit logs shall be retained for minimum 1 year.
3.6.5 System Monitoring
FR-AP-046 Admins shall view system health dashboard.
FR-AP-047 Dashboard shall display active users count.
FR-AP-048 Dashboard shall display API request rate.
FR-AP-049 Dashboard shall display database connection count.
FR-AP-050 Dashboard shall display queue job count.
FR-AP-051 Dashboard shall display error rate.
FR-AP-052 Dashboard shall display system uptime.
FR-AP-053 Dashboard shall display storage usage.
FR-AP-054 Dashboard shall refresh automatically every 30 seconds.
FR-AP-055 Admins shall receive alerts for critical system issues.
FR-AP-056 Critical issues include: database connection failure, API errors exceeding
threshold, storage reaching capacity limit.
4. NON-FUNCTIONAL REQUIREMENTS
4.1 Performance Requirements
NFR-PERF-001 API response time for standard CRUD operations shall be less than 200
milliseconds at 90th percentile.
NFR-PERF-002 CRM page load time shall be less than 2 seconds for initial load.
NFR-PERF-003 CRM subsequent navigation shall load within 500 milliseconds.
NFR-PERF-004 Search results shall return within 500 milliseconds.
NFR-PERF-005 Report generation shall complete within 5 seconds for standard reports.
NFR-PERF-006 Dashboard metrics shall update within 1 second after data refresh.
NFR-PERF-007 The system shall support minimum 100 concurrent users without
performance degradation.
NFR-PERF-008 The system shall handle 1000 API requests per second.
NFR-PERF-009 Job scraping shall capture up to 50 jobs within 30 seconds.
NFR-PERF-010 Resume file upload shall complete within 10 seconds for 10 MB files.
NFR-PERF-011 AI resume analysis shall complete within 2 minutes.
NFR-PERF-012 AI LinkedIn optimization shall complete within 1 minute.
NFR-PERF-013 AI job-candidate matching shall complete within 30 seconds per candidate.
NFR-PERF-014 WhatsApp message sending shall complete within 5 seconds.
NFR-PERF-015 Database queries shall utilize indexes for all frequently accessed columns.
NFR-PERF-016 The system shall implement caching for frequently accessed data with 1
hour expiration.
NFR-PERF-017 Static assets shall be compressed and minified.
NFR-PERF-018 The system shall implement lazy loading for images and heavy
components.
NFR-PERF-019 The system shall implement code splitting for optimal bundle sizes.
NFR-PERF-020 Database connection pool shall maintain minimum 10 and maximum 100
connections.
4.2 Security Requirements
NFR-SEC-001 All passwords shall be hashed using bcrypt with minimum 12 salt rounds.
NFR-SEC-002 All API communications shall use HTTPS with TLS 1.3.
NFR-SEC-003 All authentication shall use JWT tokens.
NFR-SEC-004 Access tokens shall expire after 15 minutes.
NFR-SEC-005 Refresh tokens shall expire after 7 days.
NFR-SEC-006 All API requests shall validate JWT tokens before processing.
NFR-SEC-007 All API requests shall enforce role-based access control.
NFR-SEC-008 All sensitive data shall be encrypted at rest using AES-256.
NFR-SEC-009 All file uploads shall be scanned for malware.
NFR-SEC-010 All user inputs shall be sanitized to prevent XSS attacks.
NFR-SEC-011 All database queries shall use parameterized statements to prevent SQL
injection.
NFR-SEC-012 All API endpoints shall implement rate limiting.
NFR-SEC-013 Failed login attempts shall be limited to 5 attempts before account lock.
NFR-SEC-014 Locked accounts shall unlock automatically after 30 minutes.
NFR-SEC-015 All authentication events shall be logged.
NFR-SEC-016 All data modifications shall be logged in audit trail.
NFR-SEC-017 All API responses shall include appropriate security headers including
Content-Security-Policy, X-Frame-Options, X-Content-Type-Options.
NFR-SEC-018 All cookies shall be marked as HttpOnly and Secure.
NFR-SEC-019 The system shall implement CORS policies restricting origins.
NFR-SEC-020 WhatsApp webhook requests shall verify signature.
NFR-SEC-021 File download URLs shall be signed with expiration time.
NFR-SEC-022 The system shall implement protection against CSRF attacks.
NFR-SEC-023 The system shall implement protection against clickjacking.
NFR-SEC-024 The system shall implement input validation on all API endpoints.
NFR-SEC-025 The system shall implement output encoding to prevent injection attacks.
4.3 Reliability Requirements
NFR-REL-001 The system shall maintain 99.5% uptime during business hours.
NFR-REL-002 The system shall handle failures gracefully without data loss.
NFR-REL-003 Failed operations shall be logged with complete error details.
NFR-REL-004 The system shall implement retry logic for transient failures.
NFR-REL-005 Failed background jobs shall be retried up to 3 times with exponential
backoff.
NFR-REL-006 Database transactions shall implement rollback on failure.
NFR-REL-007 The system shall validate all data before persisting to database.
NFR-REL-008 The system shall maintain referential integrity in database.
NFR-REL-009 The system shall implement health check endpoints for all services.
NFR-REL-010 Health checks shall verify database connectivity, Redis connectivity, and file
storage accessibility.
NFR-REL-011 The system shall implement circuit breaker pattern for external service calls.
NFR-REL-012 Circuit breaker shall open after 5 consecutive failures.
NFR-REL-013 Circuit breaker shall attempt recovery after 1 minute.
NFR-REL-014 The system shall provide fallback responses when external services are
unavailable.
NFR-REL-015 The system shall queue critical operations for retry when services are
unavailable.
4.4 Availability Requirements
NFR-AVAIL-001 The system shall be available 24/7 with planned maintenance windows.
NFR-AVAIL-002 Planned maintenance shall be scheduled during off-peak hours.
NFR-AVAIL-003 Planned maintenance shall be announced 48 hours in advance.
NFR-AVAIL-004 Planned maintenance windows shall not exceed 4 hours.
NFR-AVAIL-005 The system shall support zero-downtime deployments.
NFR-AVAIL-006 Database backups shall be performed daily without service interruption.
NFR-AVAIL-007 The system shall implement database replication for high availability.
NFR-AVAIL-008 The system shall support automatic failover to replica in case of primary
failure.
NFR-AVAIL-009 Failover shall complete within 5 minutes.
NFR-AVAIL-010 The system shall implement load balancing across multiple application
instances.
4.5 Scalability Requirements
NFR-SCALE-001 The system architecture shall support horizontal scaling.
NFR-SCALE-002 All application services shall be stateless.
NFR-SCALE-003 The system shall support adding application instances without downtime.
NFR-SCALE-004 The system shall support auto-scaling based on load metrics.
NFR-SCALE-005 Auto-scaling shall trigger when CPU utilization exceeds 70%.
NFR-SCALE-006 The system shall scale up by adding instances within 5 minutes.
NFR-SCALE-007 The system shall scale down by removing instances after 15 minutes
below threshold.
NFR-SCALE-008 Database shall support read replicas for scaling read operations.
NFR-SCALE-009 The system shall support partitioning large tables by date or ID range.
NFR-SCALE-010 The system shall support archiving historical data to separate storage.
4.6 Maintainability Requirements
NFR-MAINT-001 All code shall follow consistent coding standards.
NFR-MAINT-002 All code shall include inline comments for complex logic.
NFR-MAINT-003 All functions shall have descriptive names indicating their purpose.
NFR-MAINT-004 All API endpoints shall be documented in OpenAPI specification.
NFR-MAINT-005 All database schema changes shall be version controlled using migrations.
NFR-MAINT-006 All configuration shall be externalized from code.
NFR-MAINT-007 All secrets shall be stored in secure configuration management.
NFR-MAINT-008 All errors shall include meaningful error messages.
NFR-MAINT-009 All logs shall include sufficient context for debugging.
NFR-MAINT-010 All components shall have clear separation of concerns.
NFR-MAINT-011 All services shall have well-defined interfaces.
NFR-MAINT-012 All dependencies shall be explicitly declared and version pinned.
NFR-MAINT-013 The system shall include comprehensive test coverage.
NFR-MAINT-014 Unit tests shall cover minimum 80% of code.
NFR-MAINT-015 Integration tests shall cover critical workflows.
4.7 Usability Requirements
NFR-USE-001 The CRM interface shall be intuitive requiring minimal training.
NFR-USE-002 The CRM shall provide contextual help tooltips.
NFR-USE-003 The CRM shall provide clear error messages with resolution guidance.
NFR-USE-004 The CRM shall provide confirmation dialogs for destructive actions.
NFR-USE-005 The CRM shall provide undo capability for recent actions where applicable.
NFR-USE-006 The CRM shall provide keyboard shortcuts for frequent actions.
NFR-USE-007 The CRM shall provide responsive design supporting desktop and tablet
devices.
NFR-USE-008 The CRM shall support modern browsers: Chrome, Firefox, Safari, Edge.
NFR-USE-009 The Chrome Extension shall provide clear visual feedback for all actions.
NFR-USE-010 The Chrome Extension shall display progress indicators for long-running
operations.
NFR-USE-011 All forms shall provide inline validation with immediate feedback.
NFR-USE-012 All data tables shall support sorting, filtering, and pagination.
NFR-USE-013 All interfaces shall maintain consistent visual design.
NFR-USE-014 All interfaces shall use consistent terminology.
NFR-USE-015 The system shall support accessibility standards WCAG 2.1 Level AA where
applicable.
4.8 Data Integrity Requirements
NFR-DATA-001 All database transactions shall be ACID compliant.
NFR-DATA-002 All data modifications shall be validated before commit.
NFR-DATA-003 All foreign key relationships shall be enforced.
NFR-DATA-004 All mandatory fields shall be enforced as NOT NULL.
NFR-DATA-005 All data shall include timestamps for creation and modification.
NFR-DATA-006 All data modifications shall be attributed to performing user.
NFR-DATA-007 All data deletions shall be soft deletes where recovery may be needed.
NFR-DATA-008 All data exports shall maintain data integrity and completeness.
NFR-DATA-009 All file uploads shall be validated for type and size before storage.
NFR-DATA-010 All resume files shall be stored with checksums for integrity verification.
4.9 Backup and Recovery Requirements
NFR-BACKUP-001 Full database backups shall be performed daily at 2 AM.
NFR-BACKUP-002 Incremental database backups shall be performed hourly.
NFR-BACKUP-003 All backups shall be encrypted.
NFR-BACKUP-004 Backups shall be stored in separate geographic location.
NFR-BACKUP-005 Backups shall be retained for 30 days.
NFR-BACKUP-006 Resume files shall be backed up daily.
NFR-BACKUP-007 Backup integrity shall be verified weekly.
NFR-BACKUP-008 Recovery procedures shall be documented.
NFR-BACKUP-009 Recovery procedures shall be tested quarterly.
NFR-BACKUP-010 Recovery Time Objective (RTO) shall be less than 4 hours.
NFR-BACKUP-011 Recovery Point Objective (RPO) shall be less than 1 hour.
NFR-BACKUP-012 System shall support point-in-time recovery.
4.10 Compliance Requirements
NFR-COMP-001 The system shall comply with GDPR data protection requirements.
NFR-COMP-002 The system shall implement data minimization collecting only necessary
information.
NFR-COMP-003 The system shall provide data subject access request functionality.
NFR-COMP-004 The system shall provide data deletion functionality honoring right to be
forgotten.
NFR-COMP-005 The system shall provide data export functionality supporting data
portability.
NFR-COMP-006 The system shall maintain data processing records.
NFR-COMP-007 The system shall implement appropriate technical safeguards for personal
data.
NFR-COMP-008 The system shall implement appropriate organizational safeguards for
personal data.
NFR-COMP-009 The system shall notify users of privacy policy.
NFR-COMP-010 The system shall obtain consent for data processing where required.
NFR-COMP-011 The system shall protect against OWASP Top 10 vulnerabilities.
NFR-COMP-012 The system shall undergo security assessment before production
deployment.
NFR-COMP-013 The system shall maintain compliance documentation.
5. EXTERNAL INTERFACE REQUIREMENTS
5.1 User Interface Requirements
5.1.1 Chrome Extension Interface
UIR-CE-001 The extension popup shall be maximum 400 pixels wide and 600 pixels tall.
UIR-CE-002 The extension shall use consistent color scheme matching brand guidelines.
UIR-CE-003 The extension shall display agency logo in header.
UIR-CE-004 The login form shall include email field, password field, and login button.
UIR-CE-005 The staging area shall display jobs in card layout with thumbnail view.
UIR-CE-006 Each job card shall display title, company, location, and checkbox.
UIR-CE-007 The staging area shall include search bar for filtering jobs.
UIR-CE-008 The staging area shall include "Select All" checkbox.
UIR-CE-009 The staging area shall include "Save to CRM" button disabled when no jobs
selected.
UIR-CE-010 Job editing form shall use modal dialog overlay.
UIR-CE-011 All form fields shall include labels and placeholder text.
UIR-CE-012 Required fields shall be marked with asterisk.
UIR-CE-013 Validation errors shall display in red below respective fields.
UIR-CE-014 Success notifications shall display in green banner at top.
UIR-CE-015 Error notifications shall display in red banner at top.
5.1.2 CRM Web Application Interface
UIR-CRM-001 The CRM shall use responsive design supporting screen widths from 1024
pixels to 1920 pixels.
UIR-CRM-002 The CRM shall use consistent navigation header across all pages.
UIR-CRM-003 The header shall include logo, navigation menu, search bar, notifications icon,
and user profile dropdown.
UIR-CRM-004 The CRM shall use sidebar navigation for main sections.
UIR-CRM-005 Sidebar sections shall include Dashboard, Jobs, Candidates, Applications,
Reports, and Settings.
UIR-CRM-006 The CRM shall highlight active navigation item.
UIR-CRM-007 All data tables shall include column headers with sort indicators.
UIR-CRM-008 All data tables shall include pagination controls at bottom.
UIR-CRM-009 All data tables shall include rows per page selector.
UIR-CRM-010 All forms shall use consistent layout with labels above fields.
UIR-CRM-011 All buttons shall use consistent styling with primary and secondary variants.
UIR-CRM-012 Primary actions shall use prominent button styling.
UIR-CRM-013 Destructive actions shall use red button styling.
UIR-CRM-014 All modals shall include close button in top right.
UIR-CRM-015 All modals shall include action buttons at bottom right.
UIR-CRM-016 Loading states shall display spinner indicator.
UIR-CRM-017 Empty states shall display helpful message and suggested action.
UIR-CRM-018 All tooltips shall appear on hover after 500 millisecond delay.
UIR-CRM-019 All date pickers shall use calendar dropdown interface.
UIR-CRM-020 All time inputs shall use 12-hour format with AM/PM selector.
UIR-CRM-021 All numeric inputs shall include thousand separators.
UIR-CRM-022 All file upload interfaces shall support drag and drop.
UIR-CRM-023 Progress bars shall display for long-running operations.
UIR-CRM-024 All charts shall include legend and axis labels.
UIR-CRM-025 All charts shall support hover interactions showing detailed values.
5.1.3 Admin Panel Interface
UIR-AP-001 The admin panel shall use tabbed interface for different admin sections.
UIR-AP-002 Tabs shall include Users, Roles, Configuration, Audit Logs, and System Health.
UIR-AP-003 The user management table shall display name, email, role, status, and
actions.
UIR-AP-004 Action buttons shall include Edit, Deactivate, Reset Password, Unlock.
UIR-AP-005 User creation form shall use modal dialog.
UIR-AP-006 Configuration forms shall group related settings in sections.
UIR-AP-007 Configuration changes shall require confirmation before saving.
UIR-AP-008 Audit log table shall display timestamp, user, action, entity, and details.
UIR-AP-009 Audit log shall support expanding rows to see full details.
UIR-AP-010 System health dashboard shall use card layout for metrics.
UIR-AP-011 System health metrics shall update in real-time.
UIR-AP-012 Critical alerts shall display in red with warning icon.
5.2 Hardware Interfaces
HIR-001 The system shall support standard x86-64 server hardware.
HIR-002 The system shall require minimum 4 CPU cores for application servers.
HIR-003 The system shall require minimum 8 GB RAM for application servers.
HIR-004 The system shall require minimum 100 GB storage for application servers.
HIR-005 The system shall require minimum 8 CPU cores for database servers.
HIR-006 The system shall require minimum 16 GB RAM for database servers.
HIR-007 The system shall require minimum 500 GB storage for database servers.
HIR-008 Storage shall use SSD for optimal performance.
HIR-009 Network interface shall support minimum 1 Gbps connectivity.
HIR-010 The system shall support deployment on virtual machines or containers.
5.3 Software Interfaces
5.3.1 Database Interface
SIR-DB-001 The system shall interface with PostgreSQL version 14 or higher.
SIR-DB-002 Database connection shall use connection pooling.
SIR-DB-003 Database connection pool shall maintain minimum 10 connections.
SIR-DB-004 Database connection pool shall scale to maximum 100 connections.
SIR-DB-005 Database connections shall use SSL/TLS encryption.
SIR-DB-006 Database queries shall use prepared statements.
SIR-DB-007 Database transactions shall use appropriate isolation level.
SIR-DB-008 Long-running queries shall implement timeout mechanisms.
5.3.2 Cache Interface
SIR-CACHE-001 The system shall interface with Redis version 7 or higher.
SIR-CACHE-002 Cache connections shall use connection pooling.
SIR-CACHE-003 Cache data shall have appropriate expiration times.
SIR-CACHE-004 Cache keys shall use consistent naming convention.
SIR-CACHE-005 Cache shall be used for session storage.
SIR-CACHE-006 Cache shall be used for frequently accessed data.
SIR-CACHE-007 Cache invalidation shall occur on data updates.
5.3.3 File Storage Interface
SIR-FILE-001 The system shall interface with AWS S3 or compatible object storage.
SIR-FILE-002 File upload shall support multipart upload for large files.
SIR-FILE-003 File access shall use signed URLs with expiration.
SIR-FILE-004 File metadata shall be stored in database.
SIR-FILE-005 File storage shall organize files in logical folder structure.
SIR-FILE-006 File storage shall implement versioning for critical files.
SIR-FILE-007 File storage shall implement lifecycle policies for archiving.
5.3.4 WhatsApp API Interface
SIR-WA-001 The system shall interface with Meta WhatsApp Cloud API version 2.0.
SIR-WA-002 API calls shall use HTTPS with TLS 1.3.
SIR-WA-003 API authentication shall use bearer token.
SIR-WA-004 API requests shall include appropriate headers.
SIR-WA-005 API responses shall be parsed as JSON.
SIR-WA-006 API errors shall be handled with appropriate retry logic.
SIR-WA-007 API rate limits shall be respected.
SIR-WA-008 Webhook shall verify request signature.
SIR-WA-009 Webhook shall respond within 5 seconds.
5.3.5 AI Service Interface
SIR-AI-001 The system shall interface with OpenAI API version 1.0 or Anthropic Claude API.
SIR-AI-002 API calls shall use HTTPS with TLS 1.3.
SIR-AI-003 API authentication shall use API key in header.
SIR-AI-004 API requests shall specify model and parameters.
SIR-AI-005 API requests shall implement timeout of 60 seconds.
SIR-AI-006 API responses shall be parsed as JSON.
SIR-AI-007 API token usage shall be tracked for cost management.
SIR-AI-008 API errors shall be handled with fallback responses.
5.4 Communication Interfaces
CIR-001 All client-server communication shall use HTTPS protocol.
CIR-002 HTTPS shall use TLS version 1.3 or higher.
CIR-003 All API requests shall use REST architectural style.
CIR-004 API requests shall use appropriate HTTP methods: GET for retrieval, POST for
creation, PUT for update, DELETE for deletion.
CIR-005 API requests shall include Content-Type header specifying application/json.
CIR-006 API requests shall include Accept header specifying application/json.
CIR-007 Authenticated requests shall include Authorization header with bearer token.
CIR-008 API responses shall include appropriate HTTP status codes.
CIR-009 API responses shall include Content-Type header specifying application/json.
CIR-010 Real-time updates shall use WebSocket protocol.
CIR-011 WebSocket connections shall upgrade from HTTPS connection.
CIR-012 WebSocket messages shall use JSON format.
CIR-013 WebSocket shall implement heartbeat mechanism for connection monitoring.
CIR-014 WebSocket shall implement automatic reconnection on disconnection.
CIR-015 Email notifications shall use SMTP protocol.
CIR-016 SMTP connection shall use TLS encryption.
6. SYSTEM FEATURES AND USE CASES
6.1 Job Scraping Workflow
Use Case ID: UC-001
Use Case Name: Manual Job Scraping from Portal
Primary Actor: Recruiter
Preconditions:
● Recruiter is logged into Chrome Extension
● Recruiter has navigated to supported job portal
● Job listing or detail page is loaded
Main Success Scenario:
1. Recruiter clicks "Capture Jobs" button in extension
2. Extension extracts visible job data from page
3. Extension displays jobs in staging area
4. Recruiter reviews job data for accuracy
5. Recruiter edits any incorrect or incomplete fields
6. Recruiter selects jobs to save using checkboxes
7. Recruiter clicks "Save to CRM" button
8. Extension validates all mandatory fields
9. Extension sends jobs to backend API
10. Backend validates and processes job data
11. Backend checks for duplicates
12. Backend saves non-duplicate jobs to database
13. Extension displays success notification with count saved
14. Extension clears staging area of saved jobs
Alternative Flows:
● 3a. If no jobs detected on page, extension displays message "No jobs found on this
page"
● 8a. If validation fails, extension displays error messages for invalid fields and
prevents submission
● 10a. If API call fails, extension displays error and offers retry option
● 11a. If duplicates detected, backend flags them and associates with original jobs
Postconditions:
● New jobs are stored in CRM database
● Jobs are attributed to scraping recruiter
● Jobs are available in job pool for assignment
6.2 Candidate Management Workflow
Use Case ID: UC-002
Use Case Name: Create and Manage Candidate Profile
Primary Actor: Recruiter
Preconditions:
● Recruiter is logged into CRM
● Recruiter has candidate information
Main Success Scenario:
1. Recruiter navigates to Candidates section
2. Recruiter clicks "Add Candidate" button
3. CRM displays candidate creation form
4. Recruiter enters first name, last name, email, phone, LinkedIn URL
5. Recruiter adds relevant tags
6. Recruiter uploads resume file
7. Recruiter clicks "Create Candidate" button
8. CRM validates all field formats
9. CRM creates candidate record in database
10. CRM initiates file upload to storage
11. CRM triggers AI resume analysis
12. CRM displays success message and navigates to candidate detail page
13. Candidate appears in recruiter's candidate list
Alternative Flows:
● 8a. If email format invalid, CRM displays error message and prevents submission
● 8b. If email already exists for another candidate, CRM displays warning and asks for
confirmation
● 10a. If file upload fails, CRM displays error and allows retry
● 11a. If AI analysis fails, CRM logs error but does not prevent candidate creation
Postconditions:
● New candidate is stored in database
● Candidate is assigned to creating recruiter
● Resume is stored in file storage
● AI analysis is queued for processing
6.3 Application Tracking Workflow
Use Case ID: UC-003
Use Case Name: Track Candidate Application Through Lifecycle
Primary Actor: Recruiter
Preconditions:
● Recruiter is logged into CRM
● Job and candidate exist in system
● Recruiter has permission to manage candidate
Main Success Scenario:
1. Recruiter assigns job to candidate
2. CRM creates application record with status "Identified"
3. Recruiter opens application detail page
4. Recruiter updates candidate resume
5. Recruiter changes application status to "Resume Updated"
6. CRM logs status change with timestamp
7. Recruiter sends cold message to candidate on LinkedIn
8. Recruiter changes status to "Cold Message Sent"
9. CRM triggers follow-up reminder for 3 days later
10. Candidate accepts connection
11. Recruiter changes status to "Connection Accepted"
12. Candidate applies for job
13. Recruiter changes status to "Applied"
14. Recruiter adds action "Applied via LinkedIn" with timestamp
15. Interview is scheduled
16. Recruiter changes status to "Interview Scheduled"
17. Recruiter sets follow-up date for interview day
18. CRM sends WhatsApp reminder 1 day before interview
19. Interview completes with positive outcome
20. Recruiter changes status to "Offer"
21. CRM logs complete application timeline
Alternative Flows:
● 9a. If recruiter misses follow-up date, CRM sends overdue notification
● 19a. If interview outcome is negative, recruiter changes status to "Rejected" and
adds rejection reason
● 19b. If candidate withdraws, recruiter changes status to "Closed" and adds closure
reason
Postconditions:
● Application progresses through complete lifecycle
● All status changes are logged with timestamps
● All actions are recorded in timeline
● Performance metrics are updated
6.4 AI Resume Analysis Workflow
Use Case ID: UC-004
Use Case Name: Automated Resume Analysis and Scoring
Primary Actor: AI Agent (CRA)
Triggering Event: Resume uploaded for candidate
Preconditions:
● Candidate exists in system
● Resume file is uploaded to storage
● AI service is configured and available
Main Success Scenario:
1. Resume upload triggers AI analysis task
2. Task is queued with normal priority
3. AI agent picks up task from queue
4. AI agent downloads resume file from storage
5. AI agent extracts text from PDF or DOCX file
6. AI agent sends text to AI service for analysis
7. AI service parses resume into structured sections
8. AI service extracts skills, experience, education
9. AI service calculates ATS compatibility score
10. AI service generates improvement recommendations
11. AI agent stores analysis results in database
12. AI agent updates task status to completed
13. CRM displays analysis results on candidate profile
14. Notification is sent to recruiter
Alternative Flows:
● 5a. If text extraction fails, AI agent logs error and marks task as failed
● 6a. If AI service is unavailable, task is retried after 5 minutes
● 6b. If AI service returns error, task is retried up to 3 times
● 6c. If all retries fail, task is marked as permanently failed and admin is notified
Postconditions:
● Resume analysis results are stored
● ATS score is calculated
● Recommendations are available for recruiter
● Candidate profile is enriched with analysis data
6.5 WhatsApp Reminder Workflow
Use Case ID: UC-005
Use Case Name: Send Follow-up Reminder via WhatsApp
Primary Actor: System (Automated)
Triggering Event: Follow-up date approaching for application
Preconditions:
● Application exists with follow-up date set
● WhatsApp integration is configured
● Recruiter phone number is registered
Main Success Scenario:
1. Scheduler checks for applications with follow-up date tomorrow
2. System identifies applications requiring reminders
3. For each application, system creates WhatsApp message
4. System selects appropriate message template
5. System substitutes template variables with application data
6. System queues message for sending
7. WhatsApp service picks up message from queue
8. WhatsApp service sends message via WhatsApp Cloud API
9. WhatsApp API confirms message sent
10. System updates message status to "sent"
11. WhatsApp delivers message to recruiter
12. WhatsApp API sends delivery confirmation via webhook
13. System updates message status to "delivered"
14. Recruiter reads message
15. WhatsApp API sends read confirmation via webhook
16. System updates message status to "read"
Alternative Flows:
● 8a. If WhatsApp API returns error, message is retried after 5 minutes
● 8b. If retry fails, message is retried again after 15 minutes
● 8c. If all retries fail, message is marked as failed and admin is notified
● 12a. If delivery fails, retry mechanism continues for 24 hours before marking as
permanently failed
Postconditions:
● Reminder message is delivered to recruiter
● Message delivery is confirmed
● Application follow-up is tracked
● Message history is stored for audit
6.6 Performance Report Generation Workflow
Use Case ID: UC-006
Use Case Name: Generate Weekly Performance Report
Primary Actor: AI Agent (CRA)
Triggering Event: Weekly schedule (every Saturday evening)
Preconditions:
● Recruiter exists in system
● Historical data available for past week
● AI service is configured and available
Main Success Scenario:
1. Scheduler triggers weekly report generation
2. AI agent creates report task for each recruiter
3. For each recruiter, AI agent queries database for week's activities
4. AI agent retrieves jobs scraped count
5. AI agent retrieves candidates added count
6. AI agent retrieves applications created count
7. AI agent retrieves status progressions count
8. AI agent calculates conversion rates per stage
9. AI agent compares metrics to previous week
10. AI agent identifies achievements and milestones
11. AI agent identifies challenges and blockers
12. AI agent generates next week preview and goals
13. AI agent compiles report in readable format
14. AI agent stores report in database
15. AI agent queues WhatsApp message with report summary
16. WhatsApp service sends report to recruiter
17. Report is also available in CRM dashboard
Alternative Flows:
● 3a. If no activities found for recruiter, report indicates "No activity this week"
● 16a. If WhatsApp sending fails, report remains available in CRM but notification is
logged as failed
Postconditions:
● Weekly report is generated and stored
● Report is delivered to recruiter via WhatsApp
● Report is accessible in CRM
● Performance trends are tracked
7. DATA REQUIREMENTS
7.1 Logical Data Model
The system data model consists of the following primary entities and their relationships:
Users - Represents agency staff members with authentication credentials and role
information. Users are linked to candidates, jobs, and applications they create or manage.
Candidates - Represents job seekers managed by the agency. Each candidate belongs to
one assigned recruiter and can have multiple resumes and applications.
Jobs - Represents job postings scraped from external portals. Each job is created by one
recruiter and can be assigned to multiple candidates through applications.
Applications - Represents the assignment of a candidate to a job. Applications track the
lifecycle from identification to final outcome and include status history and actions.
Resumes - Represents resume file versions for candidates. Each resume belongs to one
candidate and maintains version history.
Application Actions - Represents discrete actions taken on applications such as applying,
outreach, follow-ups, interviews.
WhatsApp Messages - Represents messages sent via WhatsApp including templates used,
delivery status, and recipient information.
AI Tasks - Represents background AI processing tasks including resume analysis,
optimization, and matching.
Audit Logs - Represents complete history of all system activities for accountability and
compliance.
WhatsApp Templates - Represents pre-approved message templates for WhatsApp
communication.
Agencies - Represents recruitment agencies using the system for multi-tenancy support.
7.2 Data Dictionary
User Entity:
● id: UUID, primary key, automatically generated
● email: string, unique, required, maximum 255 characters
● password_hash: string, required, bcrypt hashed password
● first_name: string, required, maximum 100 characters
● last_name: string, required, maximum 100 characters
● role: enum, required, values: admin, manager, recruiter
● agency_id: UUID, foreign key to agencies, required
● is_active: boolean, default true
● last_login: timestamp, nullable
● created_at: timestamp, default current timestamp
● updated_at: timestamp, default current timestamp, auto-updated
Candidate Entity:
● id: UUID, primary key, automatically generated
● first_name: string, required, maximum 100 characters
● last_name: string, required, maximum 100 characters
● email: string, nullable, maximum 255 characters
● phone: string, nullable, maximum 20 characters
● linkedin_url: string, nullable, maximum 500 characters
● assigned_recruiter_id: UUID, foreign key to users, nullable
● agency_id: UUID, foreign key to agencies, required
● tags: array of strings, nullable
● created_at: timestamp, default current timestamp
● updated_at: timestamp, default current timestamp, auto-updated
Job Entity:
● id: UUID, primary key, automatically generated
● title: string, required, maximum 255 characters
● company: string, required, maximum 255 characters
● location: string, nullable, maximum 255 characters
● description: text, nullable
● experience: string, nullable, maximum 100 characters
● source: enum, required, values: linkedin, indeed, naukri, other
● source_url: string, required, maximum 1000 characters
● scraped_by: UUID, foreign key to users, required
● agency_id: UUID, foreign key to agencies, required
● status: enum, default active, values: active, assigned, filled, closed
● is_duplicate: boolean, default false
● duplicate_of: UUID, foreign key to jobs, nullable
● created_at: timestamp, default current timestamp
● updated_at: timestamp, default current timestamp, auto-updated
Application Entity:
● id: UUID, primary key, automatically generated
● candidate_id: UUID, foreign key to candidates, required
● job_id: UUID, foreign key to jobs, required
● recruiter_id: UUID, foreign key to users, required
● status: enum, required, values: identified, resume_updated, cold_message_sent,
connection_accepted, applied, interview_scheduled, offer, rejected, closed
● current_stage: string, nullable, maximum 100 characters
● next_follow_up: timestamp, nullable
● created_at: timestamp, default current timestamp
● updated_at: timestamp, default current timestamp, auto-updated
Resume Entity:
● id: UUID, primary key, automatically generated
● candidate_id: UUID, foreign key to candidates, required
● version: integer, required
● file_name: string, required, maximum 255 characters
● file_url: string, required, maximum 1000 characters
● file_size: bigint, nullable
● file_type: string, nullable, maximum 50 characters
● uploaded_by: UUID, foreign key to users, required
● uploaded_at: timestamp, default current timestamp
Application Action Entity:
● id: UUID, primary key, automatically generated
● application_id: UUID, foreign key to applications, required
● action_type: enum, required, values: applied, outreach, follow_up, interview, offer,
rejection, note
● description: text, nullable
● performed_by: UUID, foreign key to users, required
● performed_at: timestamp, default current timestamp
WhatsApp Message Entity:
● id: UUID, primary key, automatically generated
● recipient_phone: string, required, maximum 20 characters
● recipient_type: enum, required, values: recruiter, candidate
● message_type: enum, required, values: text, template, media
● template_name: string, nullable, maximum 100 characters
● content: text, nullable
● status: enum, default pending, values: pending, sent, delivered, read, failed
● sent_at: timestamp, nullable
● delivered_at: timestamp, nullable
● read_at: timestamp, nullable
● error_message: text, nullable
● created_at: timestamp, default current timestamp
AI Task Entity:
● id: UUID, primary key, automatically generated
● task_type: enum, required, values: resume_analysis, linkedin_optimization,
job_matching, message_generation, weekly_plan, pipeline_analysis, weekly_report
● entity_type: enum, required, values: candidate, application, job
● entity_id: UUID, required
● status: enum, default pending, values: pending, processing, completed, failed
● input_data: JSON, nullable
● output_data: JSON, nullable
● error_message: text, nullable
● created_at: timestamp, default current timestamp
● completed_at: timestamp, nullable
Audit Log Entity:
● id: UUID, primary key, automatically generated
● user_id: UUID, foreign key to users, nullable
● action: string, required, maximum 100 characters
● entity_type: enum, nullable, values: user, candidate, job, application, resume
● entity_id: UUID, nullable
● old_values: JSON, nullable
● new_values: JSON, nullable
● ip_address: string, nullable, maximum 45 characters
● user_agent: text, nullable
● created_at: timestamp, default current timestamp
7.3 Data Retention and Archival
Active Data Retention:
● All active candidate, job, and application data shall be retained indefinitely in primary
database
● All audit logs shall be retained for minimum 1 year in primary database
● All WhatsApp messages shall be retained for 90 days in primary database
● All AI task results shall be retained for 6 months in primary database
Archival Policy:
● Candidates with no activity for 2 years shall be flagged for archival
● Jobs older than 1 year with status closed shall be archived
● Applications with final status older than 1 year shall be archived
● Archived data shall be moved to separate storage but remain queryable
● Resume files for archived candidates shall be retained for 3 years
Data Deletion Policy:
● Users can request deletion of candidate data to comply with GDPR right to be
forgotten
● Upon deletion request, candidate personal information shall be anonymized
● Resume files shall be permanently deleted from storage
● Aggregated anonymized data may be retained for analytics
● Deletion actions shall be logged in audit trail
● Deleted data cannot be recovered
Backup Retention:
● Daily full backups shall be retained for 30 days
● Weekly full backups shall be retained for 12 weeks
● Monthly full backups shall be retained for 12 months
● Backups older than retention period shall be automatically deleted
7.4 Data Migration
Initial Data Import:
● System shall support bulk import of candidate data from CSV files
● Import shall validate all data before committing to database
● Import shall provide detailed error report for invalid records
● Import shall support mapping of CSV columns to system fields
● Import process shall be transactional with rollback on failure
System Migration:
● All database schema changes shall use versioned migrations
● Migrations shall be tested on staging environment before production
● Migrations shall support rollback to previous version
● Data transformations during migration shall preserve data integrity
● Migration downtime shall not exceed 1 hour
7.5 Data Security
Encryption:
● All passwords shall be hashed using bcrypt with minimum 12 salt rounds
● All personal identifiable information shall be encrypted at rest using AES-256
● All resume files shall be encrypted in storage
● All database backups shall be encrypted
● All data in transit shall use TLS 1.3 encryption
Access Control:
● Database access shall be restricted to application service accounts only
● Database credentials shall be stored in secure configuration management
● Direct database access shall be logged and audited
● Production database access shall require multi-factor authentication
● Database queries shall use least privilege principle
Data Masking:
● Sensitive data in logs shall be masked
● Email addresses in logs shall show only domain
● Phone numbers in logs shall show only last 4 digits
● Passwords shall never be logged
● API tokens shall never be logged
8. APPENDICES
8.1 Glossary
Agency - A recruitment firm that uses this system to manage their recruitment operations
Applicant Tracking - The process of monitoring and managing candidate applications
through various stages
ATS Score - Applicant Tracking System compatibility score indicating how well a resume
matches automated parsing systems
Background Job - An asynchronous task processed separately from main application flow
Circuit Breaker - A design pattern that prevents cascading failures by detecting faults and
temporarily halting operations
Cold Outreach - Initial contact message sent to candidates without prior relationship
Conversion Rate - Percentage of candidates moving from one stage to the next in
application pipeline
Deduplication - Process of identifying and handling duplicate job postings
Job Pool - Centralized repository of all scraped job postings available for assignment
LinkedIn Optimization - Process of improving LinkedIn profile content for better visibility
and engagement
Pipeline - Visual representation of applications organized by current stage
Rate Limiting - Technique to control request frequency to prevent abuse
Scraping - Manual extraction of job posting data from external websites
Semantic Matching - Matching based on meaning and context rather than exact keyword
matching
Soft Delete - Marking records as deleted without physically removing from database
Staging Area - Temporary storage location for reviewing data before permanent save
Vector Embedding - Numerical representation of text for semantic similarity comparison
Webhook - HTTP callback that delivers real-time notifications when events occur
8.2 Acronyms
API - Application Programming Interface
CRUD - Create, Read, Update, Delete
CRA - Careerist Recruiter Assistant
CRM - Customer Relationship Management
CORS - Cross-Origin Resource Sharing
CSV - Comma-Separated Values
DOM - Document Object Model
GDPR - General Data Protection Regulation
HTTPS - Hypertext Transfer Protocol Secure
JSON - JavaScript Object Notation
JWT - JSON Web Token
MVP - Minimum Viable Product
OWASP - Open Web Application Security Project
PDF - Portable Document Format
PII - Personally Identifiable Information
RBAC - Role-Based Access Control
REST - Representational State Transfer
RPO - Recovery Point Objective
RTO - Recovery Time Objective
SRS - Software Requirements Specification
SQL - Structured Query Language
SSL/TLS - Secure Sockets Layer / Transport Layer Security
UI - User Interface
URL - Uniform Resource Locator
UUID - Universally Unique Identifier
WCAG - Web Content Accessibility Guidelines
XSS - Cross-Site Scripting
8.3 Assumptions
1. Recruiters have basic computer literacy and can operate web browsers effectively
2. Agency has dedicated IT infrastructure or cloud hosting capability
3. Internet connectivity is reliable and consistently available
4. Recruiters have valid accounts on job portals they intend to scrape
5. Meta WhatsApp Cloud API access will remain available and affordable
6. AI service providers will maintain stable API availability
7. Job portal structures will remain relatively stable for scraping
8. Agency has obtained necessary permissions for WhatsApp messaging
9. Candidates consent to WhatsApp communication where applicable
10. Agency complies with data protection regulations in their jurisdiction
8.4 Dependencies
External Services:
● Meta WhatsApp Cloud API for messaging functionality
● OpenAI API or Anthropic Claude API for AI features
● SMTP server for email notifications
● DNS service for domain resolution
● SSL certificate authority for HTTPS
Infrastructure:
● PostgreSQL database system
● Redis cache system
● File storage system (AWS S3 or compatible)
● Container orchestration platform (Docker/Kubernetes)
● Load balancer for traffic distribution
Third-party Libraries:
● React and related UI libraries for frontend
● Express or Fastify for backend API
● JWT library for authentication
● bcrypt for password hashing
● PDF parsing libraries for resume analysis
● HTTP client libraries for API integrations
Browser Support:
● Chrome browser for extension (version 90 or higher)
● Modern browsers for CRM web application
END OF SOFTWARE REQUIREMENTS SPECIFICATION