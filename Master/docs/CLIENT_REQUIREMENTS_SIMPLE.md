# Information Required from Client
## For Complete Development & Deployment

---

## 🔴 CRITICAL - Required Immediately

### 1. AI Service API Key
**Why:** To enable AI features (resume analysis, job matching, LinkedIn optimization)

**Choose ONE:**
- **OpenAI API Key** (Recommended)
  - Get from: https://platform.openai.com/api-keys
  - Send: API Key starting with `sk-...`
  - Budget: $______ per month

- **Anthropic Claude API Key** (Alternative)
  - Get from: https://console.anthropic.com/settings/keys
  - Send: API Key starting with `sk-ant-...`
  - Budget: $______ per month

---

### 2. WhatsApp Business API Credentials
**Why:** To send notifications, reminders, and alerts via WhatsApp

**Required Information:**
- WhatsApp Business Account ID
- Phone Number ID
- Access Token
- Webhook Verify Token
- Business Phone Number (E.164 format: +1234567890)

**Where to get:**
- Meta for Developers: https://developers.facebook.com/apps/
- Setup Guide: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

**Note:** Your WhatsApp Business Account must be verified first.

---

### 3. Email Service Credentials
**Why:** To send email notifications and reports

**Choose ONE:**
- **SendGrid** (Recommended)
  - API Key from: https://app.sendgrid.com/settings/api_keys
  - From Email: `noreply@yourdomain.com`

- **AWS SES** (Alternative)
  - Access Key ID and Secret Access Key
  - Region (e.g., us-east-1)
  - From Email: `noreply@yourdomain.com`

- **SMTP Server** (Simple)
  - SMTP Host, Port, Username, Password
  - From Email: `noreply@yourdomain.com`

---

### 4. Company Branding
**Why:** To customize the system with your branding

**Required:**
- Company Logo (PNG or SVG, high resolution)
- Company Name
- Primary Brand Color (hex code, e.g., #1E40AF)
- Company Email
- Company Phone

---

### 5. Initial Admin Account
**Why:** To access the system after deployment

**Required:**
- Admin Email: `admin@yourdomain.com`
- Admin Password: `_____________`
- Admin First Name: `_____________`
- Admin Last Name: `_____________`

---

## 🟡 HIGH PRIORITY - Needed Soon

### 6. WhatsApp Message Templates
**Why:** WhatsApp requires pre-approved message templates

**Templates needed:**
- Follow-up Reminder
- Interview Reminder
- Job Scraping Confirmation
- Daily To-Do Summary
- Weekly Report

**Note:** We'll help you create these templates and submit them for Meta approval.

---

### 7. Production Domain & SSL
**Why:** For secure access to the system

**Required:**
- Production Domain: `https://yourdomain.com`
- SSL Certificate: We can use Let's Encrypt (free) or you provide

---

### 8. Database & Storage
**Why:** For production data storage

**Current Status:** Using Docker containers on VPS

**For Production:**
- Database credentials (if using external database)
- File storage configuration (AWS S3, Cloudflare R2, or continue with MinIO)

---

## 🟢 MEDIUM PRIORITY - Can Configure Later

### 9. Business Preferences
- Default Timezone (e.g., America/New_York)
- Default Currency (USD, EUR, GBP, etc.)
- Date Format (MM/DD/YYYY, DD/MM/YYYY, etc.)
- Max Jobs per Scraping Session (default: 50)
- Max Resume File Size in MB (default: 10)

---

### 10. Email Templates
**Why:** For professional email notifications

**Templates needed:**
- Welcome Email
- Password Reset Email
- Follow-up Reminder Email
- Interview Reminder Email
- Weekly Report Email

---

### 11. Existing Data (if migrating)
**Why:** To import existing candidates, jobs, and applications

**If you have existing data:**
- Export candidates, jobs, applications as CSV files
- We'll create import scripts based on your format

---

## ⚪ OPTIONAL - Nice to Have

### 12. Design Preferences
- Color scheme preferences
- Font preferences
- UI style (Modern, Minimal, Corporate)

### 13. Security Requirements
- Password policy preferences
- Session timeout duration
- Two-factor authentication (required/optional)

### 14. Feature Configuration
- Which AI features to enable/disable
- Which notification channels to use
- Automation rules preferences

---

## 📋 QUICK CHECKLIST

**Send these ASAP:**
- [ ] AI Service API Key (OpenAI or Anthropic)
- [ ] WhatsApp Business API Credentials
- [ ] Email Service Credentials
- [ ] Company Logo & Branding
- [ ] Initial Admin Account Details

**Send within 1 week:**
- [ ] WhatsApp Message Templates
- [ ] Production Domain Details
- [ ] Business Preferences

**Can send later:**
- [ ] Email Templates
- [ ] Existing Data (if any)
- [ ] Design Preferences
- [ ] Security Requirements

---

## 🔒 SECURITY NOTE

**For sensitive information (API keys, passwords):**
- ✅ Send via password-protected file
- ✅ Use secure file sharing
- ✅ Use encrypted email
- ❌ Do NOT send via regular email or chat

---

## 📞 QUESTIONS?

If you're unsure about any requirement or need help obtaining credentials, please reach out!

---

**Document Version:** 1.0  
**Last Updated:** January 2026

