import { db } from '@/lib/db'
import { cacheService } from '@/lib/redis'
import { NotificationData } from './types'
import { NotificationType, NotificationChannel, Notification } from '@prisma/client'

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
   * Get user notifications (with Redis caching)
   */
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const cacheKey = `notifications:${userId}:${unreadOnly ? 'unread' : 'all'}`
    
    // Try to get from cache first
    const cached = await cacheService.get<Notification[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from database
    const notifications = await db.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Cache for 30 seconds
    await cacheService.set(cacheKey, notifications, 30)

    return notifications
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new Error('Notification not found')
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    // Invalidate cache for this user
    await cacheService.deletePattern(`notifications:${notification.userId}:*`)
  }

  /**
   * Get unread notification count for user (with Redis caching)
   */
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notifications:${userId}:unread:count`
    
    // Try to get from cache first
    const cached = await cacheService.get<number>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Fetch from database
    const count = await db.notification.count({
      where: {
        userId,
        read: false,
      },
    })

    // Cache for 60 seconds
    await cacheService.set(cacheKey, count, 60)

    return count
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    })

    // Invalidate cache for this user
    await cacheService.deletePattern(`notifications:${userId}:*`)
  }
}

export const notificationService = new NotificationService()

