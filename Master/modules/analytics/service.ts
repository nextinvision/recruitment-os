import { db } from '@/lib/db'
import { cacheService } from '@/lib/redis'
import { UserRole } from '@prisma/client'

export interface RecruiterMetrics {
  recruiterId: string
  period: {
    start: Date
    end: Date
  }
  jobsScraped: number
  candidatesManaged: number
  applicationsCreated: number
  conversionRates: {
    identifiedToApplied: number
    appliedToInterview: number
    interviewToOffer: number
  }
  averageTimePerStage: {
    stage: string
    averageDays: number
  }[]
}

export interface RecruiterComparison {
  recruiter: {
    id: string
    name: string
    email: string
  }
  metrics: RecruiterMetrics
}

export class AnalyticsService {
  /**
   * Get recruiter metrics (with Redis caching)
   */
  async getRecruiterMetrics(
    recruiterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RecruiterMetrics> {
    const cacheKey = `analytics:recruiter:${recruiterId}:${startDate.getTime()}:${endDate.getTime()}`
    
    // Try to get from cache first
    const cached = await cacheService.get<RecruiterMetrics>(cacheKey)
    if (cached) {
      return cached
    }

    const [jobs, candidates, applications] = await Promise.all([
      db.job.count({
        where: {
          recruiterId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      db.client.count({
        where: {
          assignedUserId: recruiterId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      db.application.findMany({
        where: {
          recruiterId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ])

    const identified = applications.filter((a) => a.stage === 'IDENTIFIED').length
    const applied = applications.filter((a) => a.stage === 'APPLIED').length
    const interview = applications.filter((a) => a.stage === 'INTERVIEW_SCHEDULED').length
    const offer = applications.filter((a) => a.stage === 'OFFER').length

    // Calculate average time per stage
    const stages = [
      'IDENTIFIED',
      'RESUME_UPDATED',
      'COLD_MESSAGE_SENT',
      'CONNECTION_ACCEPTED',
      'APPLIED',
      'INTERVIEW_SCHEDULED',
      'OFFER',
    ]

    const averageTimePerStage = stages.map((stage) => {
      const stageApplications = applications.filter((a) => a.stage === stage)
      if (stageApplications.length === 0) {
        return { stage, averageDays: 0 }
      }

      const totalDays = stageApplications.reduce((sum, app) => {
        if (!app.stageChangedAt) {
          // Use createdAt as fallback
          const stageStartDate = new Date(app.createdAt)
          const now = new Date()
          const diffTime = Math.abs(now.getTime() - stageStartDate.getTime())
          return sum + Math.floor(diffTime / (1000 * 60 * 60 * 24))
        }
        const stageStartDate = new Date(app.stageChangedAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - stageStartDate.getTime())
        return sum + Math.floor(diffTime / (1000 * 60 * 60 * 24))
      }, 0)

      return {
        stage,
        averageDays: Math.round((totalDays / stageApplications.length) * 10) / 10, // Round to 1 decimal
      }
    })

    const metrics: RecruiterMetrics = {
      recruiterId,
      period: { start: startDate, end: endDate },
      jobsScraped: jobs,
      candidatesManaged: candidates,
      applicationsCreated: applications.length,
      conversionRates: {
        identifiedToApplied: identified > 0 ? (applied / identified) * 100 : 0,
        appliedToInterview: applied > 0 ? (interview / applied) * 100 : 0,
        interviewToOffer: interview > 0 ? (offer / interview) * 100 : 0,
      },
      averageTimePerStage,
    }

    // Cache for 1 hour (3600 seconds) as per FR-BE-106
    await cacheService.set(cacheKey, metrics, 3600)

    return metrics
  }

  /**
   * Get platform source usage (with Redis caching)
   */
  async getPlatformUsage(startDate: Date, endDate: Date): Promise<Array<{ source: string; count: number }>> {
    const cacheKey = `analytics:platform:${startDate.getTime()}:${endDate.getTime()}`
    
    // Try to get from cache first
    const cached = await cacheService.get<Array<{ source: string; count: number }>>(cacheKey)
    if (cached) {
      return cached
    }

    const jobs = await db.job.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    })

    const result = jobs.map((j) => ({
      source: j.source,
      count: j._count,
    }))

    // Cache for 1 hour (3600 seconds) as per FR-BE-106
    await cacheService.set(cacheKey, result, 3600)

    return result
  }

  /**
   * Get funnel performance (with Redis caching)
   */
  async getFunnelPerformance(startDate: Date, endDate: Date): Promise<Array<{ stage: string; count: number }>> {
    const cacheKey = `analytics:funnel:${startDate.getTime()}:${endDate.getTime()}`
    
    // Try to get from cache first
    const cached = await cacheService.get<Array<{ stage: string; count: number }>>(cacheKey)
    if (cached) {
      return cached
    }

    const applications = await db.application.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    })

    const stages = [
      'IDENTIFIED',
      'RESUME_UPDATED',
      'COLD_MESSAGE_SENT',
      'CONNECTION_ACCEPTED',
      'APPLIED',
      'INTERVIEW_SCHEDULED',
      'OFFER',
      'REJECTED',
      'CLOSED',
    ]

    const result = stages.map((stage) => ({
      stage,
      count: applications.filter((a) => a.stage === stage).length,
    }))

    // Cache for 1 hour (3600 seconds) as per FR-BE-106
    await cacheService.set(cacheKey, result, 3600)

    return result
  }

  /**
   * Get active applications count (non-terminal stages)
   */
  async getActiveApplicationsCount(recruiterId: string, userRole: UserRole) {
    const where: any = {
      stage: {
        notIn: ['REJECTED', 'CLOSED'],
      },
    }

    if (userRole === UserRole.RECRUITER) {
      where.recruiterId = recruiterId
    }

    return db.application.count({ where })
  }

  /**
   * Get recruiter performance comparison (for Admin/Manager)
   */
  async getRecruiterComparison(startDate: Date, endDate: Date): Promise<RecruiterComparison[]> {
    const cacheKey = `analytics:recruiter-comparison:${startDate.getTime()}:${endDate.getTime()}`
    
    const cached = await cacheService.get<RecruiterComparison[]>(cacheKey)
    if (cached) {
      return cached
    }

    const recruiters = await db.user.findMany({
      where: {
        role: UserRole.RECRUITER,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    const comparison = await Promise.all(
      recruiters.map(async (recruiter) => {
        const metrics = await this.getRecruiterMetrics(recruiter.id, startDate, endDate)
        return {
          recruiter: {
            id: recruiter.id,
            name: `${recruiter.firstName} ${recruiter.lastName}`,
            email: recruiter.email,
          },
          metrics,
        }
      })
    )

    // Cache for 1 hour (3600 seconds) as per FR-BE-106
    await cacheService.set(cacheKey, comparison, 3600)
    return comparison
  }

  /**
   * Get system-wide metrics (for Admin)
   */
  async getSystemMetrics(startDate: Date, endDate: Date): Promise<{
    totalJobs: number
    totalCandidates: number
    totalApplications: number
    activeApplications: number
    conversionRates: {
      identifiedToApplied: number
      appliedToInterview: number
      interviewToOffer: number
    }
  }> {
    const cacheKey = `analytics:system:${startDate.getTime()}:${endDate.getTime()}`
    
    const cached = await cacheService.get<{
      totalJobs: number
      totalCandidates: number
      totalApplications: number
      activeApplications: number
      conversionRates: {
        identifiedToApplied: number
        appliedToInterview: number
        interviewToOffer: number
      }
    }>(cacheKey)
    if (cached) {
      return cached
    }

    const [totalJobs, totalCandidates, totalApplications, activeApplications] = await Promise.all([
      db.job.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      db.candidate.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      db.application.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      db.application.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          stage: {
            notIn: ['REJECTED', 'CLOSED'],
          },
        },
      }),
    ])

    const allApplications = await db.application.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    })

    const identified = allApplications.filter((a) => a.stage === 'IDENTIFIED').length
    const applied = allApplications.filter((a) => a.stage === 'APPLIED').length
    const interview = allApplications.filter((a) => a.stage === 'INTERVIEW_SCHEDULED').length
    const offer = allApplications.filter((a) => a.stage === 'OFFER').length

    const metrics = {
      totalJobs,
      totalCandidates,
      totalApplications,
      activeApplications,
      conversionRates: {
        identifiedToApplied: identified > 0 ? (applied / identified) * 100 : 0,
        appliedToInterview: applied > 0 ? (interview / applied) * 100 : 0,
        interviewToOffer: interview > 0 ? (offer / interview) * 100 : 0,
      },
    }

    // Cache for 1 hour (3600 seconds) as per FR-BE-106
    await cacheService.set(cacheKey, metrics, 3600)
    return metrics
  }

  /**
   * Get average time per stage (system-wide or recruiter-specific)
   */
  async getAverageTimePerStage(startDate: Date, endDate: Date, recruiterId?: string): Promise<Array<{ stage: string; averageDays: number; count: number }>> {
    const cacheKey = `analytics:avg-time:${recruiterId || 'system'}:${startDate.getTime()}:${endDate.getTime()}`
    
    const cached = await cacheService.get<Array<{ stage: string; averageDays: number; count: number }>>(cacheKey)
    if (cached) {
      return cached
    }

    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    }

    if (recruiterId) {
      where.recruiterId = recruiterId
    }

    const applications = await db.application.findMany({
      where,
      select: {
        stage: true,
        stageChangedAt: true,
        createdAt: true,
      },
    })

    const stages = [
      'IDENTIFIED',
      'RESUME_UPDATED',
      'COLD_MESSAGE_SENT',
      'CONNECTION_ACCEPTED',
      'APPLIED',
      'INTERVIEW_SCHEDULED',
      'OFFER',
    ]

    const result = stages.map((stage) => {
      const stageApplications = applications.filter((a) => a.stage === stage)
      if (stageApplications.length === 0) {
        return { stage, averageDays: 0, count: 0 }
      }

      const totalDays = stageApplications.reduce((sum, app) => {
        if (!app.stageChangedAt) {
          const stageStartDate = new Date(app.createdAt)
          const now = new Date()
          const diffTime = Math.abs(now.getTime() - stageStartDate.getTime())
          return sum + Math.floor(diffTime / (1000 * 60 * 60 * 24))
        }
        const stageStartDate = new Date(app.stageChangedAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - stageStartDate.getTime())
        return sum + Math.floor(diffTime / (1000 * 60 * 60 * 24))
      }, 0)

      return {
        stage,
        averageDays: Math.round((totalDays / stageApplications.length) * 10) / 10,
        count: stageApplications.length,
      }
    })

    await cacheService.set(cacheKey, result, 3600)
    return result
  }

  /**
   * Export reports to CSV
   */
  async exportReportsToCSV(
    startDate: Date,
    endDate: Date,
    reportType: 'system' | 'recruiter-comparison' | 'funnel' | 'platform',
    recruiterId?: string
  ): Promise<string> {
    let data: any[] = []
    let headers: string[] = []

    switch (reportType) {
      case 'system': {
        const metrics = await this.getSystemMetrics(startDate, endDate)
        headers = ['Metric', 'Value']
        data = [
          ['Total Jobs', String(metrics.totalJobs)],
          ['Total Candidates', String(metrics.totalCandidates)],
          ['Total Applications', String(metrics.totalApplications)],
          ['Active Applications', String(metrics.activeApplications)],
          ['Identified to Applied %', `${metrics.conversionRates.identifiedToApplied.toFixed(2)}%`],
          ['Applied to Interview %', `${metrics.conversionRates.appliedToInterview.toFixed(2)}%`],
          ['Interview to Offer %', `${metrics.conversionRates.interviewToOffer.toFixed(2)}%`],
        ]
        break
      }
      case 'recruiter-comparison': {
        const comparison = await this.getRecruiterComparison(startDate, endDate)
        headers = ['Recruiter', 'Email', 'Jobs Scraped', 'Candidates Managed', 'Applications Created', 'Identified→Applied %', 'Applied→Interview %', 'Interview→Offer %']
        data = comparison.map((item) => [
          item.recruiter.name,
          item.recruiter.email,
          String(item.metrics.jobsScraped),
          String(item.metrics.candidatesManaged),
          String(item.metrics.applicationsCreated),
          `${item.metrics.conversionRates.identifiedToApplied.toFixed(2)}%`,
          `${item.metrics.conversionRates.appliedToInterview.toFixed(2)}%`,
          `${item.metrics.conversionRates.interviewToOffer.toFixed(2)}%`,
        ])
        break
      }
      case 'funnel': {
        const funnel = await this.getFunnelPerformance(startDate, endDate)
        headers = ['Stage', 'Count', 'Percentage']
        const total = funnel.reduce((sum, item) => sum + item.count, 0)
        data = funnel.map((item) => [
          item.stage,
          String(item.count),
          total > 0 ? `${((item.count / total) * 100).toFixed(2)}%` : '0%',
        ])
        break
      }
      case 'platform': {
        const platform = await this.getPlatformUsage(startDate, endDate)
        headers = ['Platform', 'Job Count', 'Percentage']
        const total = platform.reduce((sum, item) => sum + item.count, 0)
        data = platform.map((item) => [
          item.source,
          String(item.count),
          total > 0 ? `${((item.count / total) * 100).toFixed(2)}%` : '0%',
        ])
        break
      }
    }

    const csv = [
      headers.join(','),
      ...data.map((row) => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return csv
  }
}

export const analyticsService = new AnalyticsService()

