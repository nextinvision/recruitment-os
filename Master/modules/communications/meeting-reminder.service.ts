/**
 * Meeting Reminder Service
 * Sends automated reminder emails for TidyCal-synced meetings at 24h, 1h, and 15m before.
 * Handles rescheduling and cancellation via TidyCal webhook sync.
 */

import { db } from '@/lib/db'
import { MeetingReminderType } from '@prisma/client'
import { messageService } from './message.service'
import { getTemplateByType } from './template.service'
import { MessageChannel, MessageTemplateType } from '@prisma/client'
import { renderMessageTemplate } from './render-message-template'

const REMINDER_WINDOWS: {
  type: MeetingReminderType
  minutesBefore: number
  windowMinutes: number // ± window for cron run tolerance
}[] = [
  { type: 'REMINDER_24H', minutesBefore: 24 * 60, windowMinutes: 30 },
  { type: 'REMINDER_1H', minutesBefore: 60, windowMinutes: 10 },
  { type: 'REMINDER_15M', minutesBefore: 15, windowMinutes: 5 },
]

function isCancelledMeeting(title: string): boolean {
  return title.trim().toUpperCase().startsWith('[CANCELLED]')
}

/**
 * Process and send meeting reminders for upcoming TidyCal meetings.
 * Skips cancelled meetings (title starts with [CANCELLED]).
 * Tracks sent reminders by (activityId, reminderType, occurredAt) so rescheduled
 * meetings get new reminders; cancelled meetings never get reminders.
 */
export async function processMeetingReminders(): Promise<{
  success: boolean
  sent: { activityId: string; reminderType: string; leadName: string }[]
  skipped: number
  errors: string[]
}> {
  const now = new Date()
  const sent: { activityId: string; reminderType: string; leadName: string }[] = []
  const errors: string[] = []
  let skipped = 0

  for (const { type, minutesBefore, windowMinutes } of REMINDER_WINDOWS) {
    const minMs = (minutesBefore - windowMinutes) * 60 * 1000
    const maxMs = (minutesBefore + windowMinutes) * 60 * 1000
    const minOccurredAt = new Date(now.getTime() + minMs)
    const maxOccurredAt = new Date(now.getTime() + maxMs)

    const activities = await db.activity.findMany({
      where: {
        type: 'MEETING',
        externalSource: 'TidyCal',
        leadId: { not: null },
        occurredAt: {
          gte: minOccurredAt,
          lte: maxOccurredAt,
        },
      },
      include: {
        lead: true,
        assignedUser: true,
      },
    })

    for (const activity of activities) {
      if (isCancelledMeeting(activity.title)) {
        skipped++
        continue
      }

      if (!activity.lead?.email) {
        skipped++
        continue
      }

      const alreadySent = await db.meetingReminderSent.findUnique({
        where: {
          activityId_reminderType_occurredAt: {
            activityId: activity.id,
            reminderType: type,
            occurredAt: activity.occurredAt,
          },
        },
      })

      if (alreadySent) {
        skipped++
        continue
      }

      const template = await getTemplateByType(MessageTemplateType.MEETING_REMINDER, MessageChannel.EMAIL)
      if (!template) {
        errors.push(`No MEETING_REMINDER template for EMAIL - skipping ${activity.id}`)
        continue
      }

      const meetingDate = activity.occurredAt.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const meetingTime = activity.occurredAt.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
      const reminderLabel =
        type === 'REMINDER_24H'
          ? '24 hours'
          : type === 'REMINDER_1H'
            ? '1 hour'
            : '15 minutes'

      const content = renderMessageTemplate(template.content, {
        leadName: `${activity.lead.firstName} ${activity.lead.lastName}`,
        clientName: `${activity.lead.firstName} ${activity.lead.lastName}`,
        meetingTitle: activity.title.replace(/^\[CANCELLED\]\s*/i, '').trim(),
        meetingDate,
        meetingTime,
        reminderLabel,
        assignedUserName: activity.assignedUser
          ? `${activity.assignedUser.firstName} ${activity.assignedUser.lastName}`
          : 'Your recruiter',
      })

      try {
        await messageService.sendMessage({
          templateId: template.id,
          channel: MessageChannel.EMAIL,
          recipientType: 'lead',
          recipientId: activity.lead.id,
          recipientEmail: activity.lead.email,
          subject: template.subject || `Meeting Reminder: ${reminderLabel} until your appointment`,
          content,
          sentBy: activity.assignedUserId,
        })

        await db.meetingReminderSent.create({
          data: {
            activityId: activity.id,
            reminderType: type,
            occurredAt: activity.occurredAt,
          },
        })

        sent.push({
          activityId: activity.id,
          reminderType: type,
          leadName: `${activity.lead.firstName} ${activity.lead.lastName}`,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Failed to send ${type} for ${activity.id}: ${msg}`)
      }
    }
  }

  return {
    success: errors.length === 0,
    sent,
    skipped,
    errors,
  }
}
