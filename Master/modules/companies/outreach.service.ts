import { db } from '@/lib/db'
import { ContactStatus, ActivityType } from '@prisma/client'
import { createActivity } from '@/modules/activities/service'
import { createFollowUp } from '@/modules/followups/service'

export class OutreachService {
    /**
     * Start the automated outreach sequence for a contact
     */
    async startOutreachSequence(params: {
        companyId: string
        contactId: string
        userId: string
    }) {
        const { companyId, contactId, userId } = params

        // 1. Update contact status
        const contact = await (db.companyContact.update as any)({
            where: { id: contactId },
            data: {
                status: ContactStatus.INITIAL_CONTACT_SENT,
                outreachStartedAt: new Date(),
                lastInteractionAt: new Date(),
            },
            include: {
                company: true,
            },
        })

        const contactName = `${contact.firstName} ${contact.lastName}`
        const companyName = (contact as any).company?.name || 'Unknown Company'

        // 2. Create activity log for initial contact
        await createActivity({
            companyContactId: contactId,
            assignedUserId: userId,
            type: ActivityType.EMAIL, // Or appropriate type
            title: 'Initial Contact Sent',
            description: `Initial contact sent to ${contactName} at ${companyName}. Automated follow-up sequence started.`,
            occurredAt: new Date().toISOString(),
        })

        // 3. Schedule 3 follow-up reminders
        const followUps = [
            {
                days: 2,
                title: `Follow-up 1: ${contactName}`,
                description: `Follow-up 2 days after initial contact with ${contactName}.`,
            },
            {
                days: 5,
                title: `Follow-up 2: ${contactName}`,
                description: `Follow-up 3 days after first follow-up (5 days total) with ${contactName}.`,
            },
            {
                days: 8,
                title: `Final Follow-up: ${contactName}`,
                description: `Final follow-up 3 days after second follow-up (8 days total) with ${contactName}.`,
            },
        ]

        for (const fu of followUps) {
            const scheduledDate = new Date()
            scheduledDate.setDate(scheduledDate.getDate() + fu.days)
            // Set to 9 AM UTC (or business hours)
            scheduledDate.setHours(9, 0, 0, 0)

            await createFollowUp({
                title: fu.title,
                description: fu.description,
                scheduledDate: scheduledDate.toISOString(),
                assignedUserId: userId,
                companyContactId: contactId,
            } as any) // Type cast if needed due to schema update lag in types (though we ran generate)
        }

        return contact
    }

    /**
   * Cancel any pending follow-ups if contact replies or becomes uninterested
   */
    async cancelOutreachSequence(contactId: string, newStatus: ContactStatus) {
        // 1. Update contact status
        await db.companyContact.update({
            where: { id: contactId },
            data: {
                status: newStatus,
                lastInteractionAt: new Date(),
            }
        })

        // 2. Delete pending (uncompleted) follow-ups for this sequence
        await (db.followUp.deleteMany as any)({
            where: {
                companyContactId: contactId,
                completed: false,
            }
        })
    }
}

export const outreachService = new OutreachService()
