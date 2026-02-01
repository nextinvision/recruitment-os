import { db } from '@/lib/db'
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
   * Get recruiter metrics
   */
  async getRecruiterMetrics(
    recruiterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RecruiterMetrics> {
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

    return {
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
  }

  /**
   * Get platform source usage
   */
  async getPlatformUsage(startDate: Date, endDate: Date) {
    const jobs = await db.job.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    })

    return jobs.map((j) => ({
      source: j.source,
      count: j._count,
    }))
  }

  /**
   * Get funnel performance
   */
  async getFunnelPerformance(startDate: Date, endDate: Date) {
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

    return stages.map((stage) => ({
      stage,
      count: applications.filter((a) => a.stage === stage).length,
    }))
  }
}

export const analyticsService = new AnalyticsService()

