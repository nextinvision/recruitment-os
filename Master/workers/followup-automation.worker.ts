import { Worker, Job } from 'bullmq'
import { queueConnection } from '@/lib/queue'
import { db } from '@/lib/db'
import { notificationService } from '@/modules/notifications/service'
import { createActivity } from '@/modules/activities/service'
import { UserRole } from '@prisma/client'

interface FollowUpCheckJob {
  followUpId: string
  scheduledDate: string
  assignedUserId: string
  leadId?: string
  clientId?: string
  title: string
}

/**
 * Calculate hours overdue
 */
function getHoursOverdue(scheduledDate: Date): number {
  const now = new Date()
  const diff = now.getTime() - scheduledDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60))
}

/**
 * Get escalation level based on hours overdue
 */
function getEscalationLevel(hoursOverdue: number): {
  level: 'employee' | 'manager' | 'admin'
  hours: number
} {
  if (hoursOverdue >= 96) {
    return { level: 'admin', hours: hoursOverdue }
  } else if (hoursOverdue >= 48) {
    return { level: 'manager', hours: hoursOverdue }
  } else {
    return { level: 'employee', hours: hoursOverdue }
  }
}

/**
 * Get manager for a user
 */
async function getManager(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { managerId: true },
  })
  return user?.managerId || null
}

/**
 * Get all admins
 */
async function getAdmins(): Promise<string[]> {
  const admins = await db.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  })
  return admins.map((a) => a.id)
}

/**
 * Process follow-up check job
 */
async function processFollowUpCheck(job: Job<FollowUpCheckJob>) {
  const { followUpId, scheduledDate, assignedUserId, leadId, clientId, title } = job.data

  try {
    // Check if follow-up still exists and is not completed
    const followUp = await db.followUp.findUnique({
      where: { id: followUpId },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            managerId: true,
          },
        },
        lead: {
          select: {
            companyName: true,
            contactName: true,
          },
        },
        client: {
          select: {
            companyName: true,
            contactName: true,
          },
        },
      },
    })

    // If follow-up doesn't exist or is completed, skip
    if (!followUp || followUp.completed) {
      return { skipped: true, reason: 'Follow-up completed or not found' }
    }

    const scheduled = new Date(scheduledDate)
    const now = new Date()

    // Only process if overdue
    if (scheduled > now) {
      return { skipped: true, reason: 'Follow-up not yet due' }
    }

    const hoursOverdue = getHoursOverdue(scheduled)
    const escalation = getEscalationLevel(hoursOverdue)

    // Determine who to notify
    let notifyUserIds: string[] = []
    let notificationTitle = ''
    let notificationMessage = ''

    if (escalation.level === 'employee') {
      // Notify assigned employee
      notifyUserIds = [assignedUserId]
      notificationTitle = 'Follow-up Overdue'
      notificationMessage = `Your follow-up "${title}" was due ${hoursOverdue} hour(s) ago. Please complete it as soon as possible.`
    } else if (escalation.level === 'manager') {
      // Notify manager
      const managerId = await getManager(assignedUserId)
      if (managerId) {
        notifyUserIds = [managerId, assignedUserId] // Also notify employee
        notificationTitle = 'Follow-up Escalation - Manager'
        notificationMessage = `Follow-up "${title}" assigned to ${followUp.assignedUser.firstName} ${followUp.assignedUser.lastName} is ${hoursOverdue} hours overdue. Please follow up.`
      } else {
        // No manager, escalate to admin
        notifyUserIds = await getAdmins()
        notificationTitle = 'Follow-up Escalation - Admin'
        notificationMessage = `Follow-up "${title}" assigned to ${followUp.assignedUser.firstName} ${followUp.assignedUser.lastName} is ${hoursOverdue} hours overdue. No manager assigned.`
      }
    } else if (escalation.level === 'admin') {
      // Notify all admins
      notifyUserIds = await getAdmins()
      notificationTitle = 'Follow-up SLA Breach - Admin Escalation'
      notificationMessage = `CRITICAL: Follow-up "${title}" assigned to ${followUp.assignedUser.firstName} ${followUp.assignedUser.lastName} is ${hoursOverdue} hours overdue (96+ hours). Immediate action required.`
    }

    // Create notifications for all users
    const notificationPromises = notifyUserIds.map((userId) =>
      notificationService.sendNotification({
        userId,
        type: 'OVERDUE_TASK',
        channel: 'IN_APP',
        title: notificationTitle,
        message: notificationMessage,
      })
    )

    await Promise.all(notificationPromises)

    // Create activity log for escalation
    const entityName = followUp.lead
      ? `${followUp.lead.companyName} (Lead)`
      : followUp.client
        ? `${followUp.client.companyName} (Client)`
        : 'Unknown'

    await createActivity({
      leadId: leadId || undefined,
      clientId: clientId || undefined,
      assignedUserId: assignedUserId,
      type: 'FOLLOW_UP',
      title: `Follow-up Escalation: ${escalation.level.toUpperCase()}`,
      description: `Follow-up "${title}" for ${entityName} is ${hoursOverdue} hours overdue. Escalated to ${escalation.level}.`,
      occurredAt: new Date().toISOString(),
    })

    return {
      success: true,
      followUpId,
      hoursOverdue,
      escalationLevel: escalation.level,
      notifiedUsers: notifyUserIds.length,
    }
  } catch (error) {
    console.error(`Error processing follow-up check for ${followUpId}:`, error)
    throw error
  }
}

/**
 * Create and start the worker
 */
export function createFollowUpWorker() {
  const worker = new Worker<FollowUpCheckJob>(
    'follow-up-automation',
    async (job) => {
      return await processFollowUpCheck(job)
    },
    {
      connection: queueConnection,
      concurrency: 10, // Process up to 10 jobs concurrently
      limiter: {
        max: 100, // Max 100 jobs per interval
        duration: 60000, // Per minute
      },
    }
  )

  worker.on('completed', (job) => {
    console.log(`[FollowUp Worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[FollowUp Worker] Job ${job?.id} failed:`, err)
  })

  worker.on('error', (err) => {
    console.error('[FollowUp Worker] Error:', err)
  })

  return worker
}

