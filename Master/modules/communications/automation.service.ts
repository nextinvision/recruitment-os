/**
 * Communication Automation Service
 * Handles automated messages for follow-ups, interviews, offers, etc.
 */

import { db } from '@/lib/db'
import { messageService } from './message.service'
import { getTemplateByType } from './template.service'
import { MessageChannel, MessageTemplateType } from '@prisma/client'

export class CommunicationAutomation {
  /**
   * Send follow-up reminder
   */
  async sendFollowUpReminder(followUpId: string, channel: MessageChannel = MessageChannel.WHATSAPP): Promise<void> {
    const followUp = await db.followUp.findUnique({
      where: { id: followUpId },
      include: {
        assignedUser: true,
        lead: true,
        client: true,
      },
    })

    if (!followUp) {
      return
    }

    // Get template
    const template = await getTemplateByType(MessageTemplateType.FOLLOW_UP, channel)
    if (!template) {
      console.warn(`No template found for FOLLOW_UP on ${channel}`)
      return
    }

    // Determine recipient
    const entity = followUp.lead || followUp.client
    if (!entity) {
      return
    }

    const recipientType = followUp.leadId ? 'lead' : 'client'
    const recipientId = entity.id
    const recipientPhone = (entity as any).phone ?? undefined
    const recipientEmail = (entity as any).email

    // Render template
    const content = this.renderTemplate(template.content, {
      title: followUp.title,
      scheduledDate: followUp.scheduledDate.toLocaleDateString(),
      companyName: (entity as any).currentCompany || (entity as any).companyName || 'Client',
      contactName: (entity as any).firstName && (entity as any).lastName
        ? `${(entity as any).firstName} ${(entity as any).lastName}`
        : (entity as any).contactName || '',
    })

    // Send message
    await messageService.sendMessage({
      templateId: template.id,
      channel,
      recipientType,
      recipientId,
      recipientPhone: channel === MessageChannel.WHATSAPP ? recipientPhone : undefined,
      recipientEmail: channel === MessageChannel.EMAIL ? recipientEmail : undefined,
      subject: template.subject || 'Follow-up Reminder',
      content,
      sentBy: followUp.assignedUserId,
    })
  }

  /**
   * Send interview reminder
   */
  async sendInterviewReminder(applicationId: string, channel: MessageChannel = MessageChannel.WHATSAPP): Promise<void> {
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        client: true,
        job: true,
      },
    })

    if (!application || application.stage !== 'INTERVIEW_SCHEDULED' || !application.client) {
      return
    }

    // Get template
    const template = await getTemplateByType(MessageTemplateType.INTERVIEW_REMINDER, channel)
    if (!template) {
      console.warn(`No template found for INTERVIEW_REMINDER on ${channel}`)
      return
    }

    if (!application.job) return

    // Render template
    const content = this.renderTemplate(template.content, {
      candidateName: `${application.client.firstName} ${application.client.lastName}`,
      jobTitle: application.job.title,
      company: application.job.company,
      interviewDate: new Date().toLocaleDateString(), // You may want to store actual interview date
    })

    // Send message
    await messageService.sendMessage({
      templateId: template.id,
      channel,
      recipientType: 'client',
      recipientId: application.clientId || '',
      recipientPhone: channel === MessageChannel.WHATSAPP ? (application.client.phone ?? undefined) : undefined,
      recipientEmail: channel === MessageChannel.EMAIL ? application.client.email ?? undefined : undefined,
      subject: template.subject || 'Interview Reminder',
      content,
      sentBy: application.recruiterId,
    })
  }

  /**
   * Send offer letter
   */
  async sendOfferLetter(applicationId: string, channel: MessageChannel = MessageChannel.EMAIL): Promise<void> {
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        client: true,
        job: true,
      },
    })

    if (!application || application.stage !== 'OFFER' || !application.client || !application.job) {
      return
    }

    // Get template
    const template = await getTemplateByType(MessageTemplateType.OFFER_LETTER, channel)
    if (!template) {
      console.warn(`No template found for OFFER_LETTER on ${channel}`)
      return
    }

    // Render template
    const content = this.renderTemplate(template.content, {
      candidateName: `${application.client.firstName} ${application.client.lastName}`,
      jobTitle: application.job.title,
      company: application.job.company,
      salary: application.job.salaryRange || 'TBD',
      startDate: new Date().toLocaleDateString(), // You may want to store actual start date
    })

    // Send message
    await messageService.sendMessage({
      templateId: template.id,
      channel,
      recipientType: 'client',
      recipientId: application.clientId || '',
      recipientPhone: channel === MessageChannel.WHATSAPP ? (application.client.phone ?? undefined) : undefined,
      recipientEmail: channel === MessageChannel.EMAIL ? application.client.email ?? undefined : undefined,
      subject: template.subject || 'Job Offer',
      content,
      sentBy: application.recruiterId,
    })
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    let rendered = template

    // Replace {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })

    return rendered
  }
}

export const communicationAutomation = new CommunicationAutomation()

