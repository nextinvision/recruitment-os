import { db } from '@/lib/db'
import { cacheService } from '@/lib/redis'
import { ApplicationStage, UserRole } from '@prisma/client'

/** Prisma groupBy returns `_count` as a number (v5); normalize if an aggregate object appears. */
function prismaGroupByCount(row: { _count: number | { _all: number } }): number {
  const c = row._count
  if (typeof c === 'number' && !Number.isNaN(c)) return c
  if (c && typeof c === 'object' && typeof c._all === 'number') return c._all
  return 0
}

/** Canonical funnel order for client-level application pipeline (matches ApplicationStage enum). */
const CLIENT_APPLICATION_FUNNEL_STAGES: ApplicationStage[] = [
  ApplicationStage.PENDING_CLIENT_APPROVAL,
  ApplicationStage.IDENTIFIED,
  ApplicationStage.RESUME_UPDATED,
  ApplicationStage.COLD_MESSAGE_SENT,
  ApplicationStage.CONNECTION_ACCEPTED,
  ApplicationStage.APPLIED,
  ApplicationStage.FOLLOW_UP_1,
  ApplicationStage.FOLLOW_UP_2,
  ApplicationStage.FINAL_FOLLOW_UP,
  ApplicationStage.NO_RESPONSE,
  ApplicationStage.INTERVIEW_PREPARATION,
  ApplicationStage.INTERVIEW_SCHEDULED,
  ApplicationStage.OFFER,
  ApplicationStage.REJECTED,
  ApplicationStage.CLOSED,
]

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
      'FOLLOW_UP_1',
      'FOLLOW_UP_2',
      'FINAL_FOLLOW_UP',
      'NO_RESPONSE',
      'INTERVIEW_PREPARATION',
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
      count: prismaGroupByCount(j),
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
      'PENDING_CLIENT_APPROVAL',
      'IDENTIFIED',
      'RESUME_UPDATED',
      'COLD_MESSAGE_SENT',
      'CONNECTION_ACCEPTED',
      'APPLIED',
      'FOLLOW_UP_1',
      'FOLLOW_UP_2',
      'FINAL_FOLLOW_UP',
      'NO_RESPONSE',
      'INTERVIEW_PREPARATION',
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
    salesMetrics: {
      totalRevenue: number
      totalCollected: number
      pendingBalance: number
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
      salesMetrics: {
        totalRevenue: number
        totalCollected: number
        pendingBalance: number
      }
    }>(cacheKey)
    if (cached) {
      return cached
    }

    const [totalJobs, totalCandidates, totalApplications, activeApplications, revenues, payments] = await Promise.all([
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
      db.revenue.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { amount: true, status: true },
      }),
      db.payment.aggregate({
        where: { paymentDate: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
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

    const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.amount), 0)
    const totalCollected = Number(payments._sum.amount || 0)
    const pendingBalance = revenues
      .filter(r => r.status === 'PENDING' || r.status === 'PARTIAL')
      .reduce((sum, r) => sum + Number(r.amount), 0) // Simplify pending by summing all unpaid full amounts for now, a more robust way would calculate the diff but this aligns with getClientMetrics

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
      salesMetrics: {
        totalRevenue,
        totalCollected,
        pendingBalance,
      }
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
      'FOLLOW_UP_1',
      'FOLLOW_UP_2',
      'FINAL_FOLLOW_UP',
      'NO_RESPONSE',
      'INTERVIEW_PREPARATION',
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
   * Get report data formatted for export
   */
  async getReportData(
    startDate: Date,
    endDate: Date,
    reportType: 'system' | 'recruiter-comparison' | 'funnel' | 'platform',
    recruiterId?: string
  ): Promise<{ headers: string[]; data: any[][] }> {
    let data: any[][] = []
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

    return { headers, data }
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
    const { headers, data } = await this.getReportData(startDate, endDate, reportType, recruiterId)

    const csv = [
      headers.join(','),
      ...data.map((row) => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return csv
  }

  /**
   * Get metrics for a specific client
   */
  async getClientMetrics(clientId: string): Promise<{
    funnelPerformance: Array<{ stage: string; count: number }>
    activityDistribution: Array<{ type: string; count: number }>
    /** Log actions from applications (Pipeline → Log Action); not the same as Activity NOTE counts */
    applicationPipelineLog: Array<{
      id: string
      applicationId: string
      jobTitle: string | null
      company: string | null
      stage: string
      actionType: string
      description: string | null
      performedAt: Date
      performedBy: string
    }>
  }> {
    /**
     * Funnel for client reports is expected to reflect both:
     * - Applied (stage was reached at some point)
     * - Follow-up 1 (stage was reached later)
     *
     * The DB's `Application.stage` only stores the *current* stage, so we must derive
     * "stage reached" counts from historical stage transitions.
     *
     * We use `AuditLog` entries written by PATCH /api/applications/:id to reconstruct
     * the timeline of stage changes, without changing existing tables.
     */
    const applications = await db.application.findMany({
      where: { clientId },
      select: { id: true, stage: true },
    })

    const applicationIds = applications.map((a) => a.id)

    const auditLogs = applicationIds.length
      ? await db.auditLog.findMany({
          where: {
            entity: 'Application',
            entityId: { in: applicationIds },
          },
          select: { entityId: true, details: true },
          orderBy: { createdAt: 'asc' },
        })
      : []

    const [activities, applicationActions] = await Promise.all([
      db.activity.groupBy({
        by: ['type'],
        where: { clientId },
        _count: true,
      }),
      db.applicationAction.findMany({
        where: {
          application: { clientId },
        },
        include: {
          application: {
            select: {
              id: true,
              stage: true,
              job: {
                select: { title: true, company: true },
              },
            },
          },
          performedBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { performedAt: 'desc' },
        take: 200,
      }),
    ])

    // Build "stage reached" set per application id.
    const reachedStagesByApplicationId = new Map<string, Set<string>>()
    for (const app of applications) {
      // Include current stage even if audit history is missing (seed/legacy cases).
      reachedStagesByApplicationId.set(app.id, new Set<string>([String(app.stage)]))
    }

    for (const log of auditLogs) {
      const entityId = log.entityId
      if (!entityId) continue
      const stageSet = reachedStagesByApplicationId.get(entityId)
      if (!stageSet) continue

      if (!log.details) continue

      // AuditLog.details is a JSON string produced by UnifiedLogger.getAuditDetails.
      // We safely parse and look for changes.stage.new.
      let parsed: any = null
      try {
        parsed = JSON.parse(log.details)
      } catch {
        parsed = null
      }

      const stageNew = parsed?.changes?.stage?.new
      if (typeof stageNew === 'string' && stageNew.trim().length > 0) {
        stageSet.add(stageNew)
      }
    }

    // Convert sets to stage counts (distinct applications that reached stage).
    const countByStage = new Map<string, number>()
    for (const stageSet of reachedStagesByApplicationId.values()) {
      for (const stage of stageSet.values()) {
        countByStage.set(stage, (countByStage.get(stage) ?? 0) + 1)
      }
    }

    const funnelPerformance: Array<{ stage: string; count: number }> = CLIENT_APPLICATION_FUNNEL_STAGES.map((stage) => ({
      stage: String(stage),
      count: countByStage.get(stage) ?? 0,
    }))

    // Any stages not in the canonical list (e.g. after enum migration) still show up.
    for (const [stage, count] of countByStage.entries()) {
      if (!CLIENT_APPLICATION_FUNNEL_STAGES.includes(stage as ApplicationStage)) {
        funnelPerformance.push({
          stage,
          count,
        })
      }
    }

    const activityDistribution = activities.map((a) => ({
      type: a.type,
      count: prismaGroupByCount(a),
    }))

    const applicationPipelineLog = applicationActions.map((a) => ({
      id: a.id,
      applicationId: a.applicationId,
      jobTitle: a.application.job?.title ?? null,
      company: a.application.job?.company ?? null,
      stage: a.application.stage,
      actionType: a.type,
      description: a.description,
      performedAt: a.performedAt,
      performedBy: a.performedBy
        ? `${a.performedBy.firstName} ${a.performedBy.lastName}`.trim()
        : 'Unknown',
    }))

    return {
      funnelPerformance,
      activityDistribution,
      applicationPipelineLog,
    }
  }
}

export const analyticsService = new AnalyticsService()

