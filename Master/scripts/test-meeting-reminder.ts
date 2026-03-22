/**
 * Test script for meeting reminder automation.
 * Creates a test meeting in the 15m window, runs the worker, then cleans up.
 *
 * Run: npx tsx scripts/test-meeting-reminder.ts
 *
 * Ensure:
 * 1. MEETING_REMINDER template exists (npm run db:ensure-meeting-reminder)
 * 2. Email/SMTP is configured in .env
 */
import { PrismaClient } from '@prisma/client'
import { processMeetingReminders } from '../modules/communications/meeting-reminder.service'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Meeting Reminder Test ===\n')

  // 1. Ensure template exists
  const template = await prisma.messageTemplate.findFirst({
    where: { type: 'MEETING_REMINDER', channel: 'EMAIL' },
  })
  if (!template) {
    console.error('❌ MEETING_REMINDER template not found. Run: npm run db:ensure-meeting-reminder')
    process.exit(1)
  }
  console.log('✓ MEETING_REMINDER template found')

  // 2. Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  if (!admin) {
    console.error('❌ No admin user found')
    process.exit(1)
  }

  // 3. Create test lead with email (use your test email)
  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  console.log(`\nCreating test lead with email: ${testEmail}`)

  const lead = await prisma.lead.create({
    data: {
      firstName: 'Test',
      lastName: 'Reminder',
      email: testEmail,
      status: 'NEW',
      source: 'Test',
      assignedUserId: admin.id,
      externalId: 'test-reminder-' + Date.now(),
      externalSource: 'TidyCal',
    },
  })
  console.log('✓ Test lead created:', lead.id)

  // 4. Create meeting activity ~12 minutes from now (in 15m window: 10-20 min)
  const occurredAt = new Date(Date.now() + 12 * 60 * 1000)
  const activity = await prisma.activity.create({
    data: {
      type: 'MEETING',
      title: 'TidyCal: Test Meeting with Test Reminder',
      description: 'Test meeting for reminder automation',
      occurredAt,
      assignedUserId: admin.id,
      leadId: lead.id,
      externalId: 'test-reminder-' + Date.now(),
      externalSource: 'TidyCal',
    },
  })
  console.log('✓ Test meeting created:', activity.id, 'at', occurredAt.toISOString())

  // 5. Run the reminder worker
  console.log('\n--- Running meeting reminder worker ---')
  const result = await processMeetingReminders()
  console.log('\n--- Result ---')
  console.log('Sent:', result.sent.length)
  console.log('Skipped:', result.skipped)
  console.log('Errors:', result.errors.length)
  if (result.sent.length > 0) {
    console.log('Sent reminders:', result.sent)
  }
  if (result.errors.length > 0) {
    result.errors.forEach((e) => console.error('  ', e))
  }

  // 6. Cleanup
  console.log('\n--- Cleanup ---')
  await prisma.meetingReminderSent.deleteMany({ where: { activityId: activity.id } })
  await prisma.activity.delete({ where: { id: activity.id } })
  await prisma.lead.delete({ where: { id: lead.id } })
  console.log('✓ Test data removed')

  console.log('\n=== Done ===')
  if (result.sent.length > 0) {
    console.log('Check your inbox at', testEmail)
  } else if (result.errors.length > 0) {
    console.log('Check errors above - likely SMTP/email config')
  } else {
    console.log('No reminders sent (meeting may be outside window). Try again in a few minutes.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
