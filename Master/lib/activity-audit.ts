/**
 * Unified Activity + Audit Logging System
 * 
 * Every mutation (create, update, delete) must:
 * 1. Write Activity (business context - what happened)
 * 2. Write AuditLog (compliance - who did what, when, from where)
 */

import { db } from '@/lib/db'

type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP'

export interface MutationContext {
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string // e.g., 'Job', 'Candidate', 'Lead', 'Client'
  entityId: string
  entityName?: string // Human-readable name (e.g., "Software Engineer at Google")
  changes?: Record<string, { old?: unknown; new?: unknown }> // For UPDATE actions
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown> // Additional context
}

export interface ActivityData {
  leadId?: string
  clientId?: string
  assignedUserId: string
  type: ActivityType
  title: string
  description?: string
  occurredAt?: Date
}

/**
 * Unified logging service that creates both Activity and AuditLog
 */
export class UnifiedLogger {
  /**
   * Log a mutation (creates both Activity and AuditLog)
   */
  async logMutation(context: MutationContext): Promise<void> {
    const { userId, action, entity, entityId, entityName, changes, ipAddress, userAgent, metadata } = context

    // Determine activity type based on action
    let activityType: ActivityType = 'NOTE'
    if (action === 'CREATE') {
      activityType = 'TASK'
    } else if (action === 'UPDATE') {
      activityType = 'NOTE'
    } else if (action === 'DELETE') {
      activityType = 'TASK'
    }

    // Create activity title and description
    const activityTitle = this.getActivityTitle(action, entity, entityName)
    const activityDescription = this.getActivityDescription(action, entity, entityName, changes)

    // Create audit log details
    const auditDetails = this.getAuditDetails(action, entity, entityName, changes, metadata)

    // Helper to safely extract string from metadata
    const getStringFromMetadata = (key: string): string | null => {
      if (!metadata || !metadata[key]) return null
      const value = metadata[key]
      return typeof value === 'string' ? value : null
    }

    // Create both records in parallel
    await Promise.all([
      // Create Activity (business context)
      db.activity.create({
        data: {
          assignedUserId: userId,
          type: activityType,
          title: activityTitle,
          description: activityDescription,
          occurredAt: new Date(),
          // Link to lead/client if applicable
          leadId: getStringFromMetadata('leadId'),
          clientId: getStringFromMetadata('clientId'),
        },
      }),

      // Create AuditLog (compliance)
      db.auditLog.create({
        data: {
          userId,
          action: `${action}_${entity.toUpperCase()}`,
          entity,
          entityId,
          details: auditDetails,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      }),
    ])
  }

  /**
   * Get activity title based on action and entity
   */
  private getActivityTitle(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    entityName?: string
  ): string {
    const entityDisplay = entityName || entity
    switch (action) {
      case 'CREATE':
        return `Created ${entity}: ${entityDisplay}`
      case 'UPDATE':
        return `Updated ${entity}: ${entityDisplay}`
      case 'DELETE':
        return `Deleted ${entity}: ${entityDisplay}`
    }
  }

  /**
   * Get activity description with change details
   */
  private getActivityDescription(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    entityName?: string,
    changes?: Record<string, { old?: unknown; new?: unknown }>
  ): string {
    if (action === 'CREATE') {
      return `New ${entity.toLowerCase()} created${entityName ? `: ${entityName}` : ''}`
    }

    if (action === 'DELETE') {
      return `${entity} deleted${entityName ? `: ${entityName}` : ''}`
    }

    // For UPDATE, include change details
    if (changes && Object.keys(changes).length > 0) {
      const changeDescriptions = Object.entries(changes)
        .map(([field, { old, new: newValue }]) => {
          return `${field}: ${this.formatValue(old)} → ${this.formatValue(newValue)}`
        })
        .join(', ')

      return `Updated ${entity.toLowerCase()}. Changes: ${changeDescriptions}`
    }

    return `${entity} updated`
  }

  /**
   * Get audit log details (JSON string)
   */
  private getAuditDetails(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    entityName?: string,
    changes?: Record<string, { old?: unknown; new?: unknown }>,
    metadata?: Record<string, unknown>
  ): string {
    const details: Record<string, unknown> = {
      action,
      entity,
      entityName: entityName || null,
      timestamp: new Date().toISOString(),
    }

    if (changes) {
      details.changes = changes
    }

    if (metadata) {
      details.metadata = metadata
    }

    return JSON.stringify(details)
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '(empty)'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  /**
   * Extract request context from Next.js request
   */
  static getRequestContext(request: {
    headers?: {
      get?: (name: string) => string | null
    }
  }): { ipAddress?: string; userAgent?: string } {
    const headers = request.headers || {}
    const getHeader = (name: string) => {
      if (headers.get) {
        return headers.get(name)
      }
      return (headers as Record<string, string | null>)[name] || null
    }

    return {
      ipAddress: getHeader('x-forwarded-for')?.split(',')[0] || getHeader('x-real-ip') || undefined,
      userAgent: getHeader('user-agent') || undefined,
    }
  }

  /**
   * Compare two objects and extract changes
   */
  static extractChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, { old?: unknown; new?: unknown }> {
    const changes: Record<string, { old?: unknown; new?: unknown }> = {}
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])

    for (const key of allKeys) {
      const oldValue = oldData[key]
      const newValue = newData[key]

      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        continue
      }

      // Skip internal fields
      if (['id', 'createdAt', 'updatedAt'].includes(key)) {
        continue
      }

      changes[key] = {
        old: oldValue,
        new: newValue,
      }
    }

    return changes
  }
}

export const unifiedLogger = new UnifiedLogger()

