# Database Seeding Guide

## Overview

The seed file (`prisma/seed.ts`) contains comprehensive sample data for all entities in the Careerist Recruitment OS dashboard. This ensures the dashboard is populated with realistic data for testing and demonstration purposes.

## What Gets Seeded

### 1. Users (7 total)
- **1 Admin**: admin@careerist.com
- **2 Managers**: manager1@careerist.com, manager2@careerist.com
- **4 Recruiters**: recruiter1@careerist.com, recruiter2@careerist.com, recruiter3@careerist.com
- All passwords: `password123`
- Manager-Recruiter relationships established

### 2. Jobs (6 total)
- Various job titles (Full Stack Developer, DevOps Engineer, Data Scientist, etc.)
- Different sources (LinkedIn, Naukri, Indeed, Other)
- Different statuses (ACTIVE, FILLED)
- Indian companies and locations
- Salary ranges in INR
- Skills arrays populated

### 3. Candidates (6 total)
- Complete profiles with email, phone, LinkedIn
- Tags for categorization
- Assigned to different recruiters
- Notes with relevant information

### 4. Applications (7 total)
- Various stages (IDENTIFIED, APPLIED, INTERVIEW_SCHEDULED, OFFER, REJECTED, etc.)
- Linked to jobs and candidates
- Follow-up dates set
- Notes included

### 5. Leads (4 total)
- Different statuses (NEW, CONTACTED, QUALIFIED, LOST)
- Estimated values in INR
- Various industries
- Different sources
- Assigned to recruiters

### 6. Clients (4 total)
- Active and inactive clients
- Some converted from leads
- Complete contact information
- Indian addresses
- Industry information

### 7. Follow-ups (5 total)
- Mix of completed and pending
- Linked to leads and clients
- Various scheduled dates (past, present, future)
- Notes included

### 8. Activities (6 total)
- Different types (CALL, EMAIL, MEETING, NOTE, TASK)
- Linked to leads and clients
- Various timestamps
- Descriptions included

### 9. Revenues (5 total)
- Different statuses (PENDING, PARTIAL, PAID)
- Amounts in INR (₹3,00,000 - ₹7,50,000)
- Invoice numbers
- Due dates and paid dates
- Linked to clients and leads

### 10. Payments (3 total)
- Linked to revenues
- Different payment methods (Bank Transfer)
- Reference numbers
- Payment dates
- Amounts in INR

### 11. Message Templates (3 total)
- Follow-up Reminder
- Interview Reminder
- Welcome Email
- Different channels (EMAIL, WHATSAPP)
- Variables defined

### 12. Messages (3 total)
- Different statuses (SENT, DELIVERED, PENDING)
- Linked to templates
- Different channels
- Sent/delivered timestamps

### 13. Automation Rules (2 total)
- Auto-follow-up for new leads
- Notify on overdue payments
- Different entities and conditions

### 14. Notifications (3 total)
- Different types (FOLLOW_UP_REMINDER, INTERVIEW_ALERT, OVERDUE_TASK)
- Different channels (IN_APP, EMAIL)
- Mix of read/unread

### 15. Audit Logs (5 total)
- Various actions (CREATE_USER, CREATE_JOB, UPDATE_APPLICATION, etc.)
- Different entities
- IP addresses and user agents

### 16. Files & Resumes (2 each)
- Resume PDFs
- Linked to candidates
- File metadata

## Running the Seed

### Option 1: Using npm script
```bash
npm run db:seed
```

### Option 2: Direct execution
```bash
npx tsx prisma/seed.ts
```

### Option 3: With Prisma
```bash
npx prisma db seed
```

## Important Notes

1. **Data Clearing**: The seed script clears all existing data before seeding. This ensures a clean state.

2. **Relationships**: All relationships are properly established:
   - Recruiters linked to managers
   - Applications linked to jobs and candidates
   - Clients converted from leads
   - Payments linked to revenues
   - Activities and follow-ups linked to leads/clients
   - Messages linked to templates

3. **Indian Context**: 
   - All amounts in INR (₹)
   - Indian company names and locations
   - Indian phone number format (+91)
   - Indian addresses

4. **Realistic Data**: 
   - Dates spread across past, present, and future
   - Mix of completed and pending items
   - Various statuses for better dashboard visualization

5. **Login Credentials**:
   - All users have password: `password123`
   - Use any user email to login

## After Seeding

After running the seed, you'll have:
- ✅ Complete dashboard with all data populated
- ✅ Realistic relationships between entities
- ✅ Various statuses and stages for filtering
- ✅ Historical and future dates for timeline views
- ✅ Revenue and payment data in INR
- ✅ Sample notifications and messages
- ✅ Automation rules configured

## Customization

To customize the seed data:
1. Edit `prisma/seed.ts`
2. Modify the arrays (jobs, candidates, etc.)
3. Adjust dates, amounts, and relationships
4. Re-run the seed script

## Troubleshooting

If seeding fails:
1. Ensure database is running
2. Run `npx prisma generate` first
3. Check database connection in `.env`
4. Verify all enum values match schema
5. Check console for specific error messages

