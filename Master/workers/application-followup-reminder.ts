import { getUpcomingFollowUps, getOverdueFollowUps } from '@/modules/applications/service'
import { UserRole, NotificationType, NotificationChannel } from '@prisma/client'
import { db } from '@/lib/db'

/**
 * Worker to send reminders for application follow-ups
 * Should be run daily (e.g., via cron job)
 */
export async function processApplicationFollowUpReminders() {
  console.log('[Application Follow-up Reminder] Starting...')

  try {
    // Get all recruiters, admins, and managers
    const users = await db.user.findMany({
      where: {
        role: {
          in: [UserRole.RECRUITER, UserRole.ADMIN, UserRole.MANAGER],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    let totalReminders = 0

    for (const user of users) {
      try {
        // Get upcoming follow-ups (next 1 day)
        const upcoming = await getUpcomingFollowUps(user.id, user.role, 1)
        
        // Get overdue follow-ups
        const overdue = await getOverdueFollowUps(user.id, user.role)

        const allFollowUps = [...overdue, ...upcoming]

        if (allFollowUps.length > 0) {
          // Create notifications for each follow-up
          for (const application of allFollowUps) {
            const isOverdue = new Date(application.followUpDate!) < new Date()
            const clientName = application.client 
              ? `${application.client.firstName} ${application.client.lastName}`
              : 'Unknown Client'
            const title = isOverdue
              ? `Overdue Follow-up: ${clientName}`
              : `Upcoming Follow-up: ${clientName}`
            
            const jobLabel = application.job ? `${application.job.title} at ${application.job.company}` : 'application'
            const message = isOverdue
              ? `Follow-up for ${clientName} (${jobLabel}) is overdue.`
              : `Follow-up for ${clientName} (${jobLabel}) is scheduled for ${new Date(application.followUpDate!).toLocaleDateString()}.`

            await db.notification.create({
              data: {
                userId: user.id,
                title,
                message,
                type: NotificationType.FOLLOW_UP_REMINDER,
                channel: NotificationChannel.EMAIL,
                read: false,
              },
            })

            totalReminders++
          }
        }
      } catch (err) {
        console.error(`[Application Follow-up Reminder] Error processing user ${user.id}:`, err)
      }
    }

    console.log(`[Application Follow-up Reminder] Completed. Created ${totalReminders} reminders.`)
    return { success: true, remindersCreated: totalReminders }
  } catch (error) {
    console.error('[Application Follow-up Reminder] Error:', error)
    throw error
  }
}

// If run directly (for testing)
if (require.main === module) {
  processApplicationFollowUpReminders()
    .then((result) => {
      console.log('Result:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error:', error)
      process.exit(1)
    })
}

