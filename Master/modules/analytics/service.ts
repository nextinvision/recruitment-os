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
      db.candidate.count({
        where: {
          assignedRecruiterId: recruiterId,
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
      averageTimePerStage: [],
    }

    // Cache for 5 minutes
    await cacheService.set(cacheKey, metrics, 300)

    return metrics
  }

  /**
   * Get platform source usage (with Redis caching)
   */
  async getPlatformUsage(startDate: Date, endDate: Date) {
    const cacheKey = `analytics:platform:${startDate.getTime()}:${endDate.getTime()}`
    
    // Try to get from cache first
    const cached = await cacheService.get(cacheKey)
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

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300)

    return result
  }

  /**
   * Get funnel performance (with Redis caching)
   */
  async getFunnelPerformance(startDate: Date, endDate: Date) {
    const cacheKey = `analytics:funnel:${startDate.getTime()}:${endDate.getTime()}`
    
    // Try to get from cache first
    const cached = await cacheService.get(cacheKey)
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

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300)

    return result
  }
}

export const analyticsService = new AnalyticsService()

