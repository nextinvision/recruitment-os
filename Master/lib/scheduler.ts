import cron from 'node-cron'
import { followUpQueue } from './queue'
import { db } from '@/lib/db'
import { evaluateAllRulesForEntityType } from '@/modules/rules/service'
import { RuleEntity } from '@/modules/rules/schemas'

/**
 * Check for overdue follow-ups and add them to the queue
 */
export async function checkOverdueFollowUps() {
  try {
    console.log('[Scheduler] Checking for overdue follow-ups...')

    const now = new Date()

    // Find all incomplete follow-ups that are overdue
    const overdueFollowUps = await db.followUp.findMany({
      where: {
        completed: false,
        scheduledDate: {
          lte: now,
        },
      },
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
            id: true,
            companyName: true,
            contactName: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    console.log(`[Scheduler] Found ${overdueFollowUps.length} overdue follow-ups`)

    // Add each overdue follow-up to the queue
    const jobPromises = overdueFollowUps.map((followUp) => {
      return followUpQueue.add(
        `check-followup-${followUp.id}`,
        {
          followUpId: followUp.id,
          scheduledDate: followUp.scheduledDate.toISOString(),
          assignedUserId: followUp.assignedUserId,
          leadId: followUp.leadId || undefined,
          clientId: followUp.clientId || undefined,
          title: followUp.title,
        },
        {
          jobId: `followup-${followUp.id}-${Date.now()}`, // Unique job ID
          removeOnComplete: true,
          removeOnFail: false,
        }
      )
    })

    await Promise.all(jobPromises)

    console.log(`[Scheduler] Added ${overdueFollowUps.length} follow-ups to queue`)
  } catch (error) {
    console.error('[Scheduler] Error checking overdue follow-ups:', error)
  }
}

/**
 * Initialize the cron scheduler
 */
export function initializeScheduler() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    await checkOverdueFollowUps()
  })

  console.log('[Scheduler] Follow-up automation scheduler initialized (runs every 15 minutes)')

  // Run immediately on startup
  checkOverdueFollowUps().catch((err) => {
    console.error('[Scheduler] Error in initial follow-up check:', err)
  })
}

