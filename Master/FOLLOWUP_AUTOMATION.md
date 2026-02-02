# Follow-Up Automation System

## Overview

A comprehensive automation system for managing follow-ups with automatic notifications, escalations, and SLA tracking.

## Architecture

### Components

1. **BullMQ Queue** (`lib/queue.ts`)
   - Redis-based job queue
   - Handles follow-up check jobs
   - Configurable retry and cleanup policies

2. **Worker** (`workers/followup-automation.worker.ts`)
   - Processes follow-up check jobs
   - Implements escalation logic
   - Creates notifications and activities

3. **Scheduler** (`lib/scheduler.ts`)
   - Cron job runs every 15 minutes
   - Finds overdue follow-ups
   - Adds jobs to the queue

4. **API Endpoint** (`app/api/cron/followups/route.ts`)
   - Manual trigger endpoint
   - Can be called by external cron services

## Escalation Logic

### Timeline

- **0-48 hours overdue**: Notify assigned employee
- **48-96 hours overdue**: Escalate to manager + notify employee
- **96+ hours overdue**: Escalate to admin + SLA breach alert

### Escalation Flow

1. **Employee Notification** (0-48h)
   - Creates in-app notification
   - Logs activity with type `FOLLOW_UP`
   - Notification type: `OVERDUE_TASK`

2. **Manager Escalation** (48-96h)
   - Notifies manager (if exists)
   - Also notifies employee
   - Creates escalation activity log
   - If no manager, escalates directly to admin

3. **Admin Escalation** (96h+)
   - Notifies all admins
   - Creates critical SLA breach activity
   - Notification title includes "CRITICAL" prefix

## Setup

### 1. Install Dependencies

```bash
npm install bullmq node-cron
npm install -D @types/node-cron
```

### 2. Environment Variables

Ensure Redis is configured in `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=recruitment_redis_password
CRON_SECRET=your-secret-token  # Optional, for API endpoint auth
```

### 3. Start Worker Process

Run the worker as a separate process:

```bash
npm run worker
```

Or use PM2:

```bash
pm2 start npm --name "followup-worker" -- run worker
```

### 4. Initialize Scheduler

The scheduler can be initialized in two ways:

#### Option A: Next.js App (Development)

Add to `app/layout.tsx` or a server component:

```typescript
import { initializeAutomation } from '@/lib/automation'

// In server component
initializeAutomation()
```

#### Option B: External Cron (Production)

Use the API endpoint with a cron service:

```bash
# Vercel Cron
# vercel.json
{
  "crons": [{
    "path": "/api/cron/followups",
    "schedule": "*/15 * * * *"
  }]
}

# Or GitHub Actions, etc.
```

## Usage

### Manual Trigger

```bash
curl -X GET http://localhost:3000/api/cron/followups \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Monitoring

Check queue status:

```typescript
import { followUpQueue } from '@/lib/queue'

// Get queue metrics
const waiting = await followUpQueue.getWaitingCount()
const active = await followUpQueue.getActiveCount()
const completed = await followUpQueue.getCompletedCount()
const failed = await followUpQueue.getFailedCount()
```

## UI Components

### Follow-Ups Page (`/followups`)

- **Today's Follow-Ups**: Follow-ups scheduled for today
- **Overdue Follow-Ups**: Follow-ups past their scheduled date
- **Upcoming Follow-Ups**: Follow-ups in the next 7 days
- Mark as complete functionality
- Create/edit follow-ups

### Escalation Dashboard (`/dashboard/escalations`)

- **Admin Escalations**: 96+ hours overdue (CRITICAL)
- **Manager Escalations**: 48-96 hours overdue
- Shows hours overdue
- Links to related leads/clients
- Only visible to Admin and Manager roles

## Features

### ✅ Implemented

- [x] BullMQ queue system
- [x] Redis worker process
- [x] Cron scheduler (15-minute intervals)
- [x] Automatic notification creation
- [x] Automatic activity logging
- [x] Escalation logic (employee → manager → admin)
- [x] SLA breach detection (96h+)
- [x] Today's Follow-Ups UI
- [x] Overdue Follow-Ups UI
- [x] Manager escalation dashboard
- [x] API endpoint for external triggers

### 🔄 Future Enhancements

- [ ] Email notifications for escalations
- [ ] WhatsApp notifications for critical escalations
- [ ] Dashboard metrics (escalation rate, average resolution time)
- [ ] Escalation history tracking
- [ ] Customizable SLA thresholds
- [ ] Bulk follow-up operations
- [ ] Follow-up templates

## Troubleshooting

### Worker Not Processing Jobs

1. Check Redis connection:
   ```bash
   redis-cli -h localhost -p 6380 -a recruitment_redis_password ping
   ```

2. Check worker logs for errors

3. Verify queue has jobs:
   ```typescript
   const waiting = await followUpQueue.getWaitingCount()
   console.log('Waiting jobs:', waiting)
   ```

### Scheduler Not Running

1. Check if scheduler is initialized
2. Verify cron expression is correct
3. Check server logs for errors
4. Use API endpoint as fallback

### Notifications Not Created

1. Verify notification service is working
2. Check database for notification records
3. Verify user IDs are correct
4. Check activity logs for errors

## Performance

- **Concurrency**: 10 jobs processed simultaneously
- **Rate Limiting**: 100 jobs per minute
- **Job Retention**: 
  - Completed: 24 hours
  - Failed: 7 days
- **Cache**: Notifications cached for 30-60 seconds

## Security

- API endpoint can be protected with `CRON_SECRET`
- Worker runs with same database permissions as app
- All operations logged in activities table
- RBAC enforced for UI access

