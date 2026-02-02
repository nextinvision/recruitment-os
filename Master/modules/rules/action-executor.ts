/**
 * Action Executor for Automation Rules
 * Executes actions when rules are triggered
 */

import { RuleAction, RuleActionType } from './schemas'
import { db } from '@/lib/db'
import { notificationService } from '@/modules/notifications/service'
import { createActivity } from '@/modules/activities/service'
import { createFollowUp } from '@/modules/followups/service'
import { NotificationType, NotificationChannel } from '@prisma/client'

export class ActionExecutor {
  /**
   * Execute a single action
   */
  static async executeAction(
    action: RuleAction,
    entityId: string,
    entityType: string,
    entityData: Record<string, unknown>
  ): Promise<void> {
    const { type, target, message, metadata } = action

    switch (type) {
      case RuleActionType.NOTIFY_EMPLOYEE:
        await this.notifyEmployee(entityId, entityType, target, message, entityData)
        break

      case RuleActionType.NOTIFY_MANAGER:
        await this.notifyManager(entityId, entityType, message, entityData)
        break

      case RuleActionType.NOTIFY_ADMIN:
        await this.notifyAdmin(entityId, entityType, message, entityData)
        break

      case RuleActionType.ESCALATE:
        await this.escalate(entityId, entityType, message, entityData)
        break

      case RuleActionType.CREATE_ACTIVITY:
        await this.createActivity(entityId, entityType, message, metadata)
        break

      case RuleActionType.UPDATE_STATUS:
        await this.updateStatus(entityId, entityType, metadata)
        break

      case RuleActionType.CREATE_FOLLOW_UP:
        await this.createFollowUp(entityId, entityType, metadata)
        break
    }
  }

  /**
   * Execute multiple actions
   */
  static async executeActions(
    actions: RuleAction[],
    entityId: string,
    entityType: string,
    entityData: Record<string, unknown>
  ): Promise<void> {
    await Promise.all(
      actions.map((action) => this.executeAction(action, entityId, entityType, entityData))
    )
  }

  /**
   * Notify employee (target is userId)
   */
  private static async notifyEmployee(
    entityId: string,
    entityType: string,
    targetUserId: string | undefined,
    message: string | undefined,
    entityData: Record<string, unknown>
  ): Promise<void> {
    if (!targetUserId) {
      // Get assigned user from entity
      const assignedUser = entityData.assignedUserId || (entityData.assignedUser as { id?: string })?.id
      if (!assignedUser || typeof assignedUser !== 'string') {
        return
      }
      const assignedUserId = assignedUser

      await notificationService.sendNotification({
        userId: assignedUserId,
        type: NotificationType.FOLLOW_UP_REMINDER,
        channel: NotificationChannel.IN_APP,
        title: 'Automation Alert',
        message: message || `Action required for ${entityType.toLowerCase()}`,
      })
    } else {
      await notificationService.sendNotification({
        userId: targetUserId,
        type: NotificationType.FOLLOW_UP_REMINDER,
        channel: NotificationChannel.IN_APP,
        title: 'Automation Alert',
        message: message || `Action required for ${entityType.toLowerCase()}`,
      })
    }
  }

  /**
   * Notify manager
   */
  private static async notifyManager(
    _entityId: string,
    entityType: string,
    message: string | undefined,
    _entityData: Record<string, unknown>
  ): Promise<void> {
    // Find managers
    const managers = await db.user.findMany({
      where: { role: 'MANAGER' },
    })

    await Promise.all(
      managers.map((manager) =>
        notificationService.sendNotification({
          userId: manager.id,
          type: NotificationType.OVERDUE_TASK,
          channel: NotificationChannel.IN_APP,
          title: 'Escalation Alert',
          message: message || `${entityType} requires attention`,
        })
      )
    )
  }

  /**
   * Notify admin
   */
  private static async notifyAdmin(
    _entityId: string,
    entityType: string,
    message: string | undefined,
    _entityData: Record<string, unknown>
  ): Promise<void> {
    // Find admins
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
    })

    await Promise.all(
      admins.map((admin) =>
        notificationService.sendNotification({
          userId: admin.id,
          type: NotificationType.OVERDUE_TASK,
          channel: NotificationChannel.IN_APP,
          title: 'Critical Alert',
          message: message || `${entityType} requires immediate attention`,
        })
      )
    )
  }

  /**
   * Escalate (notify manager and admin)
   */
  private static async escalate(
    entityId: string,
    entityType: string,
    message: string | undefined,
    entityData: Record<string, unknown>
  ): Promise<void> {
    await Promise.all([
      this.notifyManager(entityId, entityType, message, entityData),
      this.notifyAdmin(entityId, entityType, message, entityData),
    ])
  }

  /**
   * Create activity
   */
  private static async createActivity(
    entityId: string,
    entityType: string,
    message: string | undefined,
    metadata: Record<string, unknown> | undefined
  ): Promise<void> {
    const assignedUserId = metadata?.assignedUserId as string | undefined
    if (!assignedUserId) {
      return
    }

    await createActivity({
      assignedUserId,
      type: 'NOTE',
      title: 'Automation Activity',
      description: message || `Automated activity for ${entityType.toLowerCase()}`,
      leadId: entityType === 'LEAD' ? entityId : undefined,
      clientId: entityType === 'CLIENT' ? entityId : undefined,
    })
  }

  /**
   * Update status
   */
  private static async updateStatus(
    entityId: string,
    entityType: string,
    metadata: Record<string, unknown> | undefined
  ): Promise<void> {
    const newStatus = metadata?.status as string | undefined
    if (!newStatus) {
      return
    }

    switch (entityType) {
      case 'LEAD':
        await db.lead.update({
          where: { id: entityId },
          data: { status: newStatus as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' },
        })
        break
      case 'CLIENT':
        await db.client.update({
          where: { id: entityId },
          data: { status: newStatus as 'ACTIVE' | 'INACTIVE' },
        })
        break
      case 'APPLICATION':
        await db.application.update({
          where: { id: entityId },
          data: { stage: newStatus as 'IDENTIFIED' | 'RESUME_UPDATED' | 'COLD_MESSAGE_SENT' | 'CONNECTION_ACCEPTED' | 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'OFFER' | 'REJECTED' | 'CLOSED' },
        })
        break
    }
  }

  /**
   * Create follow-up
   */
  private static async createFollowUp(
    entityId: string,
    entityType: string,
    metadata: Record<string, unknown> | undefined
  ): Promise<void> {
    const assignedUserId = metadata?.assignedUserId as string | undefined
    const dueDate = metadata?.dueDate as string | undefined
    const notes = metadata?.notes as string | undefined

    if (!assignedUserId || !dueDate) {
      return
    }

    await createFollowUp({
      assignedUserId,
      title: 'Automated Follow-up',
      scheduledDate: new Date(dueDate).toISOString(),
      notes: notes || 'Automated follow-up',
      leadId: entityType === 'LEAD' ? entityId : undefined,
      clientId: entityType === 'CLIENT' ? entityId : undefined,
    })
  }
}

