/**
 * Message Service
 * Handles sending messages via different channels with retry logic and status tracking
 */

import { db } from '@/lib/db'
import { MessageChannel, MessageStatus } from '@prisma/client'
import { whatsappService } from './whatsapp.service'
import { emailService } from './email.service'
import { SendMessageInput } from './schemas'

export class MessageService {
  /**
   * Send message with retry logic
   */
  async sendMessage(input: SendMessageInput & { sentBy: string }): Promise<string> {
    const { templateId, channel, recipientType, recipientId, recipientPhone, recipientEmail, subject, content, variables, metadata, sentBy } = input

    // Create message record
    const message = await db.message.create({
      data: {
        templateId: templateId || null,
        channel,
        recipientType,
        recipientId,
        recipientPhone: recipientPhone || null,
        recipientEmail: recipientEmail || null,
        subject: subject || null,
        content: this.renderTemplate(content, variables || {}),
        status: MessageStatus.PENDING,
        sentBy,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Send message
    try {
      await this.attemptSend(message.id, channel, {
        phone: recipientPhone,
        email: recipientEmail,
        subject,
        content: message.content,
      })

      return message.id
    } catch (error) {
      // Update message with error
      await db.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      // Retry if retry count is less than max
      if (message.retryCount < message.maxRetries) {
        await this.retryMessage(message.id)
      }

      throw error
    }
  }

  /**
   * Attempt to send message
   */
  private async attemptSend(
    messageId: string,
    channel: MessageChannel,
    details: {
      phone?: string | null
      email?: string | null
      subject?: string | null
      content: string
    }
  ): Promise<void> {
    let externalId: string | undefined

    if (channel === MessageChannel.WHATSAPP) {
      if (!details.phone) {
        throw new Error('Phone number required for WhatsApp')
      }
      externalId = await whatsappService.sendTextMessage(details.phone, details.content)
    } else if (channel === MessageChannel.EMAIL) {
      if (!details.email) {
        throw new Error('Email address required for email')
      }
      if (!details.subject) {
        throw new Error('Subject required for email')
      }
      const result = await emailService.sendEmail({
        to: details.email,
        from: emailService.getFromEmail(),
        subject: details.subject,
        html: details.content,
      })
      externalId = result.messageId
    } else {
      throw new Error(`Unsupported channel: ${channel}`)
    }

    // Update message with success
    await db.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.SENT,
        sentAt: new Date(),
        externalId,
      },
    })
  }

  /**
   * Retry sending a failed message
   */
  private async retryMessage(messageId: string): Promise<void> {
    const message = await db.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return
    }

    // Increment retry count
    await db.message.update({
      where: { id: messageId },
      data: {
        retryCount: { increment: 1 },
        status: MessageStatus.PENDING,
      },
    })

    // Wait before retry (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, message.retryCount), 30000) // Max 30 seconds
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Retry sending
    try {
      await this.attemptSend(messageId, message.channel, {
        phone: message.recipientPhone,
        email: message.recipientEmail,
        subject: message.subject,
        content: message.content,
      })
    } catch (error) {
      // If still failing and retries exhausted, mark as failed
      const updated = await db.message.findUnique({
        where: { id: messageId },
      })

      if (updated && updated.retryCount >= updated.maxRetries) {
        await db.message.update({
          where: { id: messageId },
          data: {
            status: MessageStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Max retries exceeded',
          },
        })
      }
    }
  }

  /**
   * Update message status (for webhooks)
   */
  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    externalId?: string
  ): Promise<void> {
    const updateData: any = {
      status,
    }

    if (status === MessageStatus.DELIVERED) {
      updateData.deliveredAt = new Date()
    } else if (status === MessageStatus.READ) {
      updateData.readAt = new Date()
    }

    if (externalId) {
      updateData.externalId = externalId
    }

    await db.message.update({
      where: { id: messageId },
      data: updateData,
    })
  }

  /**
   * Get message by external ID
   */
  async getMessageByExternalId(externalId: string): Promise<{ id: string; channel: MessageChannel } | null> {
    const message = await db.message.findFirst({
      where: { externalId },
      select: { id: true, channel: true },
    })

    return message
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

  /**
   * Get message history for a recipient
   */
  async getMessageHistory(recipientType: string, recipientId: string, limit: number = 50) {
    return db.message.findMany({
      where: {
        recipientType,
        recipientId,
      },
      include: {
        template: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get all messages (for admin view)
   */
  async getAllMessages(filters?: {
    channel?: string
    status?: string
    recipientType?: string
    limit?: number
  }) {
    const where: any = {}

    if (filters?.channel) {
      where.channel = filters.channel
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.recipientType) {
      where.recipientType = filters.recipientType
    }

    return db.message.findMany({
      where,
      include: {
        template: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    })
  }
}

export const messageService = new MessageService()

