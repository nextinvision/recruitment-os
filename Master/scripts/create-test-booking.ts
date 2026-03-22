/**
 * Create test booking for meeting reminder test
 * Meeting: March 14, 2026 at 2:40 PM IST
 * Run: npx tsx scripts/create-test-booking.ts
 *
 * For immediate test (email in ~5 min): npx tsx scripts/create-test-booking.ts --now
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const immediateTest = process.argv.includes('--now')

  // March 14, 2026 at 2:40 PM IST (or ~12 min from now for --now)
  const occurredAt = immediateTest
    ? new Date(Date.now() + 12 * 60 * 1000)
    : new Date('2026-03-14T14:40:00+05:30')

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  if (!admin) {
    console.error('No admin user found')
    process.exit(1)
  }

  const lead = await prisma.lead.create({
    data: {
      firstName: 'Anand',
      lastName: 'Singh (testing mail)',
      email: 'theanandsingh76@gmail.com',
      status: 'NEW',
      source: 'TidyCal',
      assignedUserId: admin.id,
      externalId: 'test-booking-' + Date.now(),
      externalSource: 'TidyCal',
    },
  })

  const activity = await prisma.activity.create({
    data: {
      type: 'MEETING',
      title: 'TidyCal: Test Meeting with Anand Singh',
      description: 'Test booking for reminder automation',
      occurredAt,
      assignedUserId: admin.id,
      leadId: lead.id,
      externalId: 'test-booking-' + Date.now(),
      externalSource: 'TidyCal',
    },
  })

  console.log('✓ Test booking created')
  console.log('  Lead: Anand Singh (testing mail) - theanandsingh76@gmail.com')
  console.log('  Meeting:', occurredAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'IST')
  console.log('  Lead ID:', lead.id)
  console.log('  Activity ID:', activity.id)

  if (immediateTest) {
    console.log('\n⏱️  Running reminder worker to send email now...')
    const { processMeetingReminders } = await import('../modules/communications/meeting-reminder.service')
    const result = await processMeetingReminders()
    console.log('   Sent:', result.sent.length, 'Errors:', result.errors.length)
    if (result.sent.length > 0) console.log('   Check inbox: theanandsingh76@gmail.com')
    if (result.errors.length > 0) result.errors.forEach((e) => console.error('   ', e))
  } else {
    console.log('\nReminders will be sent at:')
    console.log('  - 24h before: March 13, 2026 ~2:40 PM IST')
    console.log('  - 1h before:  March 14, 2026 ~1:40 PM IST')
    console.log('  - 15m before: March 14, 2026 ~2:25 PM IST')
    console.log('\nFor immediate test, run: npx tsx scripts/create-test-booking.ts --now')
  }
  console.log('\nEnsure cron runs every 5 min or call: POST /api/cron/meeting-reminders')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
