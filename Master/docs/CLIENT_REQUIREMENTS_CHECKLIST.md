# Client Requirements Checklist
## Information & Files Needed for Development

**Purpose:** Complete list of all information, credentials, and files required from the client to complete the development of the Internal Recruitment Agency System.

**Date:** January 2026

---

## 🔐 1. API CREDENTIALS & INTEGRATIONS

### 1.1 AI Service Provider
**Required for:** AI Agent (CRA) features - Resume analysis, LinkedIn optimization, Job matching, Message generation

**Choose ONE:**
- [ ] **OpenAI API**
  - API Key: `sk-...`
  - Organization ID (if applicable): `org-...`
  - Preferred Model: `gpt-4` / `gpt-4-turbo` / `gpt-3.5-turbo`
  - Budget/Limit per month: $______

- [ ] **Anthropic Claude API**
  - API Key: `sk-ant-...`
  - Preferred Model: `claude-3-opus` / `claude-3-sonnet` / `claude-3-haiku`
  - Budget/Limit per month: $______

**Where to get:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

**Status:** ❌ **CRITICAL - Currently mocked, needs real integration**

---

### 1.2 WhatsApp Business API (Meta)
**Required for:** WhatsApp messaging, notifications, alerts

**Information needed:**
- [ ] **WhatsApp Business Account ID:** `_____________`
- [ ] **Phone Number ID:** `_____________`
- [ ] **Access Token:** `_____________`
- [ ] **Webhook Verify Token:** `_____________` (for webhook security)
- [ ] **App Secret:** `_____________` (for webhook signature verification)
- [ ] **Business Phone Number:** `+1234567890` (E.164 format)

**Where to get:**
- Meta for Developers: https://developers.facebook.com/apps/
- WhatsApp Cloud API Setup Guide: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

**Additional Requirements:**
- [ ] WhatsApp Business Account verified
- [ ] Phone number verified and approved
- [ ] Message templates created and approved (if any)
- [ ] Webhook URL where we can receive status updates: `https://yourdomain.com/api/webhooks/whatsapp`

**Status:** ❌ **CRITICAL - Currently stubbed, needs real integration**

---

### 1.3 Email Service Provider
**Required for:** Email notifications, alerts, reports

**Choose ONE:**
- [ ] **SendGrid**
  - API Key: `SG....`
  - From Email: `noreply@yourdomain.com`
  - From Name: `Recruitment OS`

- [ ] **AWS SES**
  - Access Key ID: `AKIA...`
  - Secret Access Key: `...`
  - Region: `us-east-1` / `eu-west-1` / etc.
  - From Email: `noreply@yourdomain.com`

- [ ] **SMTP Server**
  - SMTP Host: `smtp.gmail.com` / `smtp.office365.com` / etc.
  - SMTP Port: `587` / `465`
  - SMTP Username: `...`
  - SMTP Password: `...`
  - From Email: `noreply@yourdomain.com`
  - Use TLS/SSL: Yes / No

**Status:** ⚠️ **MEDIUM PRIORITY - Email notifications need configuration**

---

### 1.4 Google Custom Search API (Already Configured)
**Status:** ✅ **CONFIGURED** - But verify:
- [ ] API Key is working
- [ ] Search Engine ID is correct
- [ ] Billing is enabled (if needed)

---

## 🏢 2. BUSINESS INFORMATION

### 2.1 Company/Agency Details
- [ ] **Company Name:** `_____________________`
- [ ] **Company Logo:** (PNG/SVG file, high resolution)
- [ ] **Primary Brand Color:** `#________` (hex code)
- [ ] **Secondary Brand Color:** `#________` (hex code)
- [ ] **Company Address:** `_____________________`
- [ ] **Company Phone:** `_____________________`
- [ ] **Company Email:** `_____________________`
- [ ] **Company Website:** `https://...`

---

### 2.2 User Accounts & Roles
**Initial Admin Account:**
- [ ] **Admin Email:** `admin@yourdomain.com`
- [ ] **Admin Password:** `_____________` (will be hashed)
- [ ] **Admin First Name:** `_____________`
- [ ] **Admin Last Name:** `_____________`

**Initial Manager Account (if needed):**
- [ ] **Manager Email:** `manager@yourdomain.com`
- [ ] **Manager Password:** `_____________`
- [ ] **Manager First Name:** `_____________`
- [ ] **Manager Last Name:** `_____________`

**Note:** More users can be added through the admin panel after deployment.

---

### 2.3 Business Rules & Preferences
- [ ] **Default Timezone:** `America/New_York` / `Europe/London` / etc.
- [ ] **Default Currency:** `USD` / `EUR` / `GBP` / etc.
- [ ] **Date Format:** `MM/DD/YYYY` / `DD/MM/YYYY` / `YYYY-MM-DD`
- [ ] **Time Format:** `12-hour` / `24-hour`
- [ ] **Max Jobs per Scraping Session:** `50` (default)
- [ ] **Max Resume File Size (MB):** `10` (default)
- [ ] **Account Lockout Duration (minutes):** `30` (default)
- [ ] **Failed Login Attempts Before Lock:** `5` (default)

---

## 🌐 3. HOSTING & DEPLOYMENT

### 3.1 Domain & SSL
- [ ] **Production Domain:** `https://yourdomain.com`
- [ ] **SSL Certificate:** 
  - [ ] We'll use Let's Encrypt (free)
  - [ ] You'll provide certificate files
- [ ] **Subdomain for API (if different):** `api.yourdomain.com`

---

### 3.2 Server/Hosting Details
**Choose ONE:**

- [ ] **VPS/Cloud Server (AWS, DigitalOcean, etc.)**
  - Server IP: `_____________`
  - SSH Access: Yes / No
  - Server OS: `Ubuntu 22.04` / `CentOS` / etc.
  - Root/Sudo Access: Yes / No

- [ ] **Docker Deployment**
  - Docker Host: `_____________`
  - Docker Registry: `_____________`
  - Container Orchestration: `Docker Compose` / `Kubernetes`

- [ ] **Platform as a Service (PaaS)**
  - Platform: `Vercel` / `Railway` / `Render` / etc.
  - Account Access: Yes / No

**Current Status:** ✅ **DEPLOYED** on Hostinger VPS (`88.222.245.158`)

---

### 3.3 Database
- [ ] **Database Host:** `localhost` / `db.yourdomain.com`
- [ ] **Database Name:** `recruitment_os`
- [ ] **Database User:** `recruitment_user`
- [ ] **Database Password:** `_____________`
- [ ] **Database Port:** `5432` / `5433`

**Note:** Currently using PostgreSQL in Docker. Production database details needed.

---

### 3.4 File Storage
**Choose ONE:**

- [ ] **AWS S3**
  - Bucket Name: `recruitment-os-files`
  - Access Key ID: `AKIA...`
  - Secret Access Key: `...`
  - Region: `us-east-1` / etc.
  - Public URL: `https://recruitment-os-files.s3.amazonaws.com`

- [ ] **Cloudflare R2**
  - Bucket Name: `recruitment-os-files`
  - Access Key ID: `...`
  - Secret Access Key: `...`
  - Public URL: `https://...`

- [ ] **MinIO (Self-hosted)** ✅ **CURRENTLY USING**
  - Endpoint: `storage.yourdomain.com`
  - Access Key: `_____________`
  - Secret Key: `_____________`
  - Public URL: `https://storage.yourdomain.com`

---

## 📧 4. COMMUNICATION TEMPLATES

### 4.1 WhatsApp Message Templates
**Required for:** WhatsApp Cloud API compliance (templates must be pre-approved)

**Templates needed:**
- [ ] **Follow-up Reminder Template**
  - Name: `follow_up_reminder`
  - Language: `en`
  - Content: `_____________________`
  - Variables: `{{candidate_name}}`, `{{job_title}}`, `{{follow_up_date}}`

- [ ] **Interview Reminder Template**
  - Name: `interview_reminder`
  - Language: `en`
  - Content: `_____________________`
  - Variables: `{{candidate_name}}`, `{{interview_date}}`, `{{company_name}}`

- [ ] **Job Scraping Confirmation Template**
  - Name: `job_scrape_confirmation`
  - Language: `en`
  - Content: `_____________________`
  - Variables: `{{job_count}}`, `{{source}}`

- [ ] **Daily To-Do Summary Template**
  - Name: `daily_todo_summary`
  - Language: `en`
  - Content: `_____________________`
  - Variables: `{{pending_followups}}`, `{{overdue_tasks}}`

- [ ] **Weekly Report Template**
  - Name: `weekly_report`
  - Language: `en`
  - Content: `_____________________`
  - Variables: `{{jobs_scraped}}`, `{{candidates_added}}`, `{{applications_created}}`

**Note:** Templates must be submitted to Meta for approval before use.

---

### 4.2 Email Templates
**Required for:** Email notifications

- [ ] **Welcome Email Template**
- [ ] **Password Reset Email Template**
- [ ] **Follow-up Reminder Email Template**
- [ ] **Interview Reminder Email Template**
- [ ] **Weekly Report Email Template**

**Format:** HTML email templates with variables

---

## 📋 5. DATA & MIGRATION

### 5.1 Existing Data (if migrating from another system)
- [ ] **Candidates CSV Export:** `candidates.csv`
  - Columns: `first_name`, `last_name`, `email`, `phone`, `linkedin_url`, `tags`, `assigned_recruiter`
- [ ] **Jobs CSV Export:** `jobs.csv`
  - Columns: `title`, `company`, `location`, `description`, `source`, `source_url`, `skills`
- [ ] **Applications CSV Export:** `applications.csv`
  - Columns: `candidate_id`, `job_id`, `stage`, `created_at`
- [ ] **Users CSV Export:** `users.csv`
  - Columns: `email`, `first_name`, `last_name`, `role`, `manager_id`

**Note:** We'll create import scripts based on your data format.

---

### 5.2 Sample Data (for testing)
- [ ] **Sample Resume Files:** (PDF/DOCX) - 5-10 files for testing
- [ ] **Sample Job Descriptions:** (Text files) - 10-20 examples
- [ ] **Sample Candidate Profiles:** (LinkedIn URLs or profiles)

---

## 🎨 6. DESIGN & BRANDING

### 6.1 Brand Assets
- [ ] **Company Logo:** 
  - Format: PNG (transparent background) or SVG
  - Size: 512x512px minimum
  - File: `logo.png` / `logo.svg`
- [ ] **Favicon:** 
  - Format: ICO or PNG
  - Size: 32x32px, 16x16px
  - File: `favicon.ico`
- [ ] **Brand Colors:**
  - Primary: `#________`
  - Secondary: `#________`
  - Accent: `#________`
  - Background: `#________`
  - Text: `#________`

---

### 6.2 UI/UX Preferences
- [ ] **Design Style:** `Modern` / `Minimal` / `Corporate` / `Custom`
- [ ] **Color Scheme:** `Light` / `Dark` / `Auto` (system preference)
- [ ] **Font Preferences:** (if custom fonts)
  - Primary Font: `Inter` / `Roboto` / `Custom`
  - Secondary Font: `...`

**Note:** Currently using Tailwind CSS with default styling. Custom themes can be applied.

---

## 🔒 7. SECURITY & COMPLIANCE

### 7.1 Security Requirements
- [ ] **Password Policy:**
  - Min Length: `8` (default)
  - Require Uppercase: Yes / No
  - Require Lowercase: Yes / No
  - Require Numbers: Yes / No
  - Require Special Characters: Yes / No
- [ ] **Session Timeout (minutes):** `60` / `120` / `480`
- [ ] **Two-Factor Authentication:** Required / Optional / Not Required
- [ ] **IP Whitelisting:** Required / Not Required
  - If required, provide IP addresses: `_____________________`

---

### 7.2 Compliance Requirements
- [ ] **GDPR Compliance:** Required / Not Required
  - If required:
    - [ ] Data Retention Policy: `1 year` / `2 years` / `indefinite`
    - [ ] Right to Deletion: Yes / No
    - [ ] Data Export: Yes / No
- [ ] **Data Backup Frequency:** `Daily` / `Weekly` / `Monthly`
- [ ] **Backup Retention:** `30 days` / `90 days` / `1 year`
- [ ] **Audit Log Retention:** `1 year` (SRS requirement)

---

## 📱 8. CHROME EXTENSION

### 8.1 Extension Details
- [ ] **Extension Name:** `Recruitment OS` / `Your Company Name`
- [ ] **Extension Description:** `_____________________`
- [ ] **Extension Icon:** (PNG, 128x128px)
- [ ] **Chrome Web Store Listing:** 
  - [ ] Will be published to Chrome Web Store
  - [ ] Will be distributed privately (Enterprise)

---

## ⚙️ 9. CONFIGURATION & SETTINGS

### 9.1 System Configuration
- [ ] **Default Language:** `English` / `Spanish` / etc.
- [ ] **Supported Languages:** `English only` / `Multiple languages`
- [ ] **Email Notifications:** Enabled / Disabled
- [ ] **WhatsApp Notifications:** Enabled / Disabled
- [ ] **SMS Notifications:** Enabled / Disabled (if applicable)
- [ ] **AI Features:** All Enabled / Selective
  - [ ] Resume Analysis: Enabled / Disabled
  - [ ] LinkedIn Optimization: Enabled / Disabled
  - [ ] Job Matching: Enabled / Disabled
  - [ ] Message Generation: Enabled / Disabled
  - [ ] Weekly Planning: Enabled / Disabled
  - [ ] Pipeline Analysis: Enabled / Disabled

---

### 9.2 Feature Flags
- [ ] **Job Fetching from APIs:** Enabled / Disabled
- [ ] **Duplicate Detection:** Enabled / Disabled
- [ ] **Automation Rules:** Enabled / Disabled
- [ ] **Client Messaging (WhatsApp):** Enabled / Disabled
- [ ] **Candidate Opt-out:** Enabled / Disabled

---

## 📊 10. ANALYTICS & REPORTING

### 10.1 Reporting Preferences
- [ ] **Weekly Reports:** 
  - Day: `Saturday` / `Sunday` / `Monday`
  - Time: `6:00 PM` / `8:00 PM` / etc.
  - Recipients: `All Recruiters` / `Managers Only` / `Custom`
- [ ] **Daily Summaries:**
  - Time: `8:00 AM` / `9:00 AM` / etc.
  - Recipients: `All Recruiters` / `Managers Only`
- [ ] **Report Format:** `Email` / `WhatsApp` / `Both` / `In-App Only`

---

## 🚀 11. DEPLOYMENT & GO-LIVE

### 11.1 Deployment Schedule
- [ ] **Target Go-Live Date:** `_____________________`
- [ ] **Preferred Deployment Time:** `Weekend` / `Weekday Evening` / `Specific Date/Time`
- [ ] **Maintenance Window:** `_____________________`
- [ ] **Rollback Plan:** `Required` / `Not Required`

---

### 11.2 Testing & Training
- [ ] **Test Users:** 
  - Number of test users: `5` / `10` / `20`
  - Test period: `1 week` / `2 weeks` / `1 month`
- [ ] **Training Required:** Yes / No
  - If yes:
    - [ ] Training sessions: `1` / `2` / `3`
    - [ ] Training materials: `Video` / `Documentation` / `Live Session`

---

## 📝 12. DOCUMENTATION

### 12.1 User Documentation
- [ ] **User Manual:** Required / Not Required
- [ ] **Admin Guide:** Required / Not Required
- [ ] **API Documentation:** Required / Not Required
- [ ] **Training Videos:** Required / Not Required

---

## ✅ PRIORITY CHECKLIST

### 🔴 CRITICAL (Must Have Before Development)
1. [ ] **AI Service API Key** (OpenAI or Anthropic)
2. [ ] **WhatsApp Business API Credentials**
3. [ ] **Email Service Credentials**
4. [ ] **Company Logo & Branding**
5. [ ] **Initial Admin Account Details**

### 🟡 HIGH PRIORITY (Needed Soon)
6. [ ] **WhatsApp Message Templates** (for approval)
7. [ ] **Domain & SSL Certificate**
8. [ ] **Production Database Credentials**
9. [ ] **File Storage Configuration**
10. [ ] **Business Rules & Preferences**

### 🟢 MEDIUM PRIORITY (Can Be Configured Later)
11. [ ] **Email Templates**
12. [ ] **Existing Data for Migration**
13. [ ] **UI/UX Preferences**
14. [ ] **Security Requirements**
15. [ ] **Feature Flags Configuration**

### ⚪ LOW PRIORITY (Nice to Have)
16. [ ] **Chrome Extension Branding**
17. [ ] **Analytics Preferences**
18. [ ] **Training Requirements**
19. [ ] **Documentation Requirements**

---

## 📧 HOW TO SUBMIT

**Please provide the information in one of the following formats:**

1. **Fill this checklist** and send back
2. **Create a document** with all required information
3. **Schedule a call** to go through requirements
4. **Use a secure method** for sensitive credentials (password-protected file, encrypted email, etc.)

**For sensitive credentials (API keys, passwords):**
- ✅ Use password-protected ZIP file
- ✅ Use secure file sharing (Google Drive with restricted access)
- ✅ Send via encrypted email
- ❌ Do NOT send via regular email or chat

---

## 📞 CONTACT

**Questions?** Please reach out if:
- You're unsure about any requirement
- You need help obtaining credentials
- You want to discuss alternatives
- You have specific business needs not covered here

---

**Last Updated:** January 2026  
**Version:** 1.0

