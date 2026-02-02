import { db } from '@/lib/db'

export interface AuditLogData {
  userId: string
  action: string
  entity: string
  entityId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export interface AuditLogFilters {
  userId?: string
  entity?: string
  action?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export class AuditService {
  /**
   * Create audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: AuditLogFilters) {
    const where: any = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.entity) {
      where.entity = filters.entity
    }

    if (filters.action) {
      where.action = filters.action
    }

    if (filters.entityId) {
      where.entityId = filters.entityId
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    return db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })
  }

  /**
   * Get total count of audit logs matching filters
   */
  async getLogsCount(filters: AuditLogFilters): Promise<number> {
    const where: any = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.entity) {
      where.entity = filters.entity
    }

    if (filters.action) {
      where.action = filters.action
    }

    if (filters.entityId) {
      where.entityId = filters.entityId
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    return db.auditLog.count({ where })
  }
}

export const auditService = new AuditService()

