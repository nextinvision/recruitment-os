import { notificationService } from '../modules/notifications/service'
import { db } from '../lib/db'

async function test() {
    console.log('Testing email notification...')

    // Find an admin user to send notification to
    const admin = await db.user.findFirst({
        where: { role: 'ADMIN' },
    })

    if (!admin) {
        console.error('No admin user found.')
        process.exit(1)
    }

    console.log(`Sending test email to ${admin.email}...`)

    try {
        await notificationService.sendNotification({
            userId: admin.id,
            type: 'FOLLOW_UP_REMINDER',
            channel: 'EMAIL',
            title: 'Email System Test',
            message: 'This is a test email from the newly integrated email system on Careerist Pro.',
        })
        console.log('Test notification sent command executed. Check logs for SMTP verification and sending status.')
    } catch (error) {
        console.error('Failed to send test notification:', error)
    }
}

test()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
