/**
 * Ensures MEETING_REMINDER template exists for existing deployments.
 * Run: npx tsx scripts/ensure-meeting-reminder-template.ts
 * Safe to run multiple times - only creates if missing.
 */
import { PrismaClient, MessageTemplateType, MessageChannel } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.messageTemplate.findFirst({
    where: {
      type: MessageTemplateType.MEETING_REMINDER,
      channel: MessageChannel.EMAIL,
    },
  })

  if (existing) {
    console.log('MEETING_REMINDER template already exists.')
    return
  }

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })

  if (!admin) {
    console.error('No admin user found. Run db:seed first.')
    process.exit(1)
  }

  await prisma.messageTemplate.create({
    data: {
      name: 'Meeting Reminder (TidyCal)',
      type: MessageTemplateType.MEETING_REMINDER,
      channel: MessageChannel.EMAIL,
      subject: 'Meeting Reminder: {{reminderLabel}} until your appointment',
      content: `Hi {{leadName}},

This is a friendly reminder that your scheduled appointment is in {{reminderLabel}}.

Meeting: {{meetingTitle}}
Date: {{meetingDate}}
Time: {{meetingTime}}

If you need to reschedule or have any questions, please reach out.

Best regards,
{{assignedUserName}}`,
      variables: JSON.stringify(['leadName', 'meetingTitle', 'meetingDate', 'meetingTime', 'reminderLabel', 'assignedUserName']),
      enabled: true,
      createdBy: admin.id,
    },
  })

  console.log('Created MEETING_REMINDER template.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
