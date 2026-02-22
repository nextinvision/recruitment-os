import { db } from '@/lib/db'
import { cacheService, redis } from '@/lib/redis'

export interface SystemHealthMetrics {
  activeUsers: number
  apiRequestRate: number
  databaseConnections: number
  queueJobCount: number
  errorRate: number
  systemUptime: number
  storageUsage: {
    total: number
    used: number
    available: number
    percentage: number
  }
  timestamp: Date
}

export class SystemHealthService {
  /**
   * Get active users count (users who logged in within last 24 hours)
   */
  async getActiveUsersCount(): Promise<number> {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    return db.user.count({
      where: {
        isActive: true,
        lastLogin: {
          gte: oneDayAgo,
        },
      },
    })
  }

  /**
   * Get API request rate (requests per minute)
   * This would typically come from a monitoring service or be tracked in Redis
   */
  async getApiRequestRate(): Promise<number> {
    // For now, return a mock value. In production, this would come from monitoring
    // or be tracked via middleware/API gateway
    const cacheKey = 'system:api:request-rate'
    const cached = await cacheService.get<number>(cacheKey)
    return cached || 0
  }

  /**
   * Get database connection count
   * This is an approximation - actual connection pool stats would come from Prisma
   */
  async getDatabaseConnections(): Promise<number> {
    // Prisma doesn't expose connection pool stats directly
    // This would need to be tracked separately or use a monitoring tool
    // For now, return a placeholder
    return 0
  }

  /**
   * Get queue job count (pending + active jobs)
   */
  async getQueueJobCount(): Promise<number> {
    try {
      // Check Redis for BullMQ queue stats
      if (redis) {
        const queues = await redis.keys('bull:*:waiting')
        let totalJobs = 0
        for (const queueKey of queues) {
          const count = await redis.llen(queueKey)
          totalJobs += count
        }
        return totalJobs
      }
    } catch (error) {
      console.error('Failed to get queue job count:', error)
    }
    return 0
  }

  /**
   * Get error rate (errors per hour)
   */
  async getErrorRate(): Promise<number> {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    // Count audit logs with error-related actions
    const errorCount = await db.auditLog.count({
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
        action: {
          contains: 'ERROR',
        },
      },
    })

    return errorCount
  }

  /**
   * Get system uptime (in seconds)
   */
  async getSystemUptime(): Promise<number> {
    const cacheKey = 'system:uptime:start'
    const startTime = await cacheService.get<number>(cacheKey)
    
    if (!startTime) {
      // Set start time if not exists
      const now = Date.now()
      await cacheService.set(cacheKey, now, 86400 * 365) // Store for 1 year
      return 0
    }

    return Math.floor((Date.now() - startTime) / 1000)
  }

  /**
   * Get storage usage (approximation based on file sizes)
   */
  async getStorageUsage(): Promise<{ total: number; used: number; available: number; percentage: number }> {
    // Get total file sizes from database
    const files = await db.file.findMany({
      select: {
        fileSize: true,
      },
    })

    const used = files.reduce((sum, file) => sum + file.fileSize, 0)
    
    // Assume 10GB total storage (this should be configurable)
    const total = 10 * 1024 * 1024 * 1024 // 10GB in bytes
    const available = Math.max(0, total - used)
    const percentage = total > 0 ? (used / total) * 100 : 0

    return {
      total,
      used,
      available,
      percentage: Math.round(percentage * 100) / 100,
    }
  }

  /**
   * Get all system health metrics
   */
  async getHealthMetrics(): Promise<SystemHealthMetrics> {
    const [
      activeUsers,
      apiRequestRate,
      databaseConnections,
      queueJobCount,
      errorRate,
      systemUptime,
      storageUsage,
    ] = await Promise.all([
      this.getActiveUsersCount(),
      this.getApiRequestRate(),
      this.getDatabaseConnections(),
      this.getQueueJobCount(),
      this.getErrorRate(),
      this.getSystemUptime(),
      this.getStorageUsage(),
    ])

    return {
      activeUsers,
      apiRequestRate,
      databaseConnections,
      queueJobCount,
      errorRate,
      systemUptime,
      storageUsage,
      timestamp: new Date(),
    }
  }

  /**
   * Check for critical issues
   */
  async checkCriticalIssues(): Promise<Array<{ type: string; message: string; severity: 'critical' | 'warning' }>> {
    const issues: Array<{ type: string; message: string; severity: 'critical' | 'warning' }> = []
    const metrics = await this.getHealthMetrics()

    // Check database connection
    try {
      await db.user.count()
    } catch (error) {
      issues.push({
        type: 'database',
        message: 'Database connection failure',
        severity: 'critical',
      })
    }

    // Check error rate threshold (more than 10 errors per hour)
    if (metrics.errorRate > 10) {
      issues.push({
        type: 'error_rate',
        message: `High error rate: ${metrics.errorRate} errors per hour`,
        severity: 'critical',
      })
    }

    // Check storage capacity (more than 90% used)
    if (metrics.storageUsage.percentage > 90) {
      issues.push({
        type: 'storage',
        message: `Storage capacity critical: ${metrics.storageUsage.percentage.toFixed(1)}% used`,
        severity: 'critical',
      })
    } else if (metrics.storageUsage.percentage > 80) {
      issues.push({
        type: 'storage',
        message: `Storage capacity warning: ${metrics.storageUsage.percentage.toFixed(1)}% used`,
        severity: 'warning',
      })
    }

    return issues
  }
}

export const systemHealthService = new SystemHealthService()

