import { db } from '@/lib/db'
import { NotificationData, WhatsAppMessage, EmailMessage } from './types'
import { NotificationType, NotificationChannel } from '@prisma/client'

export class NotificationService {
  /**
   * Create and send notification
   */
  async sendNotification(data: NotificationData): Promise<void> {
    // Create notification record
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        type: data.type as NotificationType,
        channel: data.channel as NotificationChannel,
        title: data.title,
        message: data.message,
        sent: false,
      },
    })

    // Send via appropriate channel
    if (data.channel === 'WHATSAPP') {
      await this.sendWhatsApp(data)
    } else if (data.channel === 'EMAIL') {
      await this.sendEmail(data)
    }

    // Mark as sent
    await db.notification.update({
      where: { id: notification.id },
      data: { sent: true, sentAt: new Date() },
    })
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsApp(data: NotificationData): Promise<void> {
    // TODO: Integrate with WhatsApp Business API
    // For now, just log
    console.log('[WhatsApp] Sending:', data.message)
  }

  /**
   * Send email
   */
  private async sendEmail(data: NotificationData): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log('[Email] Sending:', data.message)
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, unreadOnly = false) {
    return db.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })
  }
}

export const notificationService = new NotificationService()

