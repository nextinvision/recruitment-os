const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function testOutreach() {
    console.log('Testing Outreach Sequence...')

    try {
        // 1. Find a contact to test with
        const contact = await db.companyContact.findFirst({
            include: { company: true }
        })

        if (!contact) {
            console.log('No contact found to test with. Please add a contact first.')
            return
        }

        // 2. Find a user to assign follow-ups to
        const user = await db.user.findFirst()
        if (!user) {
            console.log('No user found.')
            return
        }

        console.log(`Starting outreach for contact: ${contact.firstName} ${contact.lastName} (Company: ${contact.company.name})`)

        // 3. Mark Initial Contact Sent manually (simulating service)
        const updatedContact = await db.companyContact.update({
            where: { id: contact.id },
            data: {
                status: 'INITIAL_CONTACT_SENT',
                outreachStartedAt: new Date(),
                lastInteractionAt: new Date(),
            }
        })

        console.log('Contact status updated to:', updatedContact.status)

        // 4. Create follow-ups manually (simulating service)
        const followUps = [
            { days: 2, title: `Follow-up 1: ${contact.firstName}` },
            { days: 5, title: `Follow-up 2: ${contact.firstName}` },
            { days: 8, title: `Final Follow-up: ${contact.firstName}` },
        ]

        for (const fu of followUps) {
            const scheduledDate = new Date()
            scheduledDate.setDate(scheduledDate.getDate() + fu.days)
            scheduledDate.setHours(9, 0, 0, 0)

            await db.followUp.create({
                data: {
                    title: fu.title,
                    description: `${fu.title} for ${contact.firstName}`,
                    scheduledDate: scheduledDate,
                    assignedUserId: user.id,
                    companyContactId: contact.id,
                }
            })
        }

        // 5. Verify follow-ups created
        const createdFollowUps = await db.followUp.findMany({
            where: { companyContactId: contact.id },
            orderBy: { scheduledDate: 'asc' }
        })

        console.log(`Verified: ${createdFollowUps.length} follow-ups created.`)
        createdFollowUps.forEach((fu, i) => {
            console.log(`  Follow-up ${i + 1}: ${fu.title} - Scheduled for ${fu.scheduledDate.toISOString()}`)
        })

        console.log('\nOutreach Sequence Simulation Passed!')
    } catch (error) {
        console.error('Test failed:', error)
    } finally {
        await db.$disconnect()
    }
}

testOutreach()
