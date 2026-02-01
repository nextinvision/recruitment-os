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
   * Get audit logs
   */
  async getLogs(filters: {
    userId?: string
    entity?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }) {
    return db.auditLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && filters.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    })
  }
}

export const auditService = new AuditService()

