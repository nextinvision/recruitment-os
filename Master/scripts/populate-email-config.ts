import { systemConfigService } from '../modules/system-config/service'
import { db } from '../lib/db'

async function seed() {
    console.log('Seeding email configuration...')

    // Find an admin user to use as updatedBy
    const admin = await db.user.findFirst({
        where: { role: 'ADMIN' },
    })

    if (!admin) {
        console.error('No admin user found. Please create an admin user first.')
        process.exit(1)
    }

    const configs = [
        { key: 'email.smtp_host', value: 'smtp.hostinger.com', category: 'email' as const, description: 'SMTP Host' },
        { key: 'email.smtp_port', value: '465', category: 'email' as const, description: 'SMTP Port' },
        { key: 'email.smtp_user', value: 'info@careerist.pro', category: 'email' as const, description: 'SMTP Username' },
        { key: 'email.smtp_password', value: 'Careerist@2026!', category: 'email' as const, description: 'SMTP Password' },
        { key: 'email.from_address', value: 'info@careerist.pro', category: 'email' as const, description: 'From Email Address' },
        { key: 'email.from_name', value: 'Careerist Pro', category: 'email' as const, description: 'From Name' },
        { key: 'email.smtp_secure', value: 'true', category: 'email' as const, description: 'Whether to use SSL (true for port 465)' },
    ]

    for (const config of configs) {
        await systemConfigService.setConfig({
            ...config,
            updatedBy: admin.id,
        })
        console.log(`Configured ${config.key}`)
    }

    console.log('Email configuration seeded successfully.')
}

seed()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
