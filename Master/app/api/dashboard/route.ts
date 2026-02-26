import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { analyticsService } from '@/modules/analytics/service'
import { getPendingFollowUps, getOverdueFollowUps, getTodayFollowUps } from '@/modules/followups/service'
import { getActivities } from '@/modules/activities/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { UserRole } from '@prisma/client'
import { db } from '@/lib/db'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const searchParams = request.nextUrl.searchParams
    const startDate = new Date(searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    const endDate = new Date(searchParams.get('endDate') || new Date())

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    // Get basic metrics
    const metrics = await analyticsService.getRecruiterMetrics(
      authContext.userId,
      startDate,
      endDate
    )

    // For ADMIN/MANAGER, count ALL clients (not just those assigned to their own userId)
    const totalClientsManaged =
      authContext.role === UserRole.ADMIN || authContext.role === UserRole.MANAGER
        ? await db.client.count()
        : metrics.candidatesManaged

    // Get active applications count
    const activeApplications = await analyticsService.getActiveApplicationsCount(
      authContext.userId,
      authContext.role
    )

    // Get pending follow-ups (not completed, scheduled in future)
    const pendingFollowUps = await getPendingFollowUps(
      authContext.userId,
      authContext.role
    )

    // Get overdue follow-ups (not completed, scheduled in past)
    const overdueFollowUps = await getOverdueFollowUps(
      authContext.userId,
      authContext.role
    )

    // Get today's follow-ups (to-do list)
    const todayFollowUps = await getTodayFollowUps(
      authContext.userId,
      authContext.role
    )

    // Get recent activities (last 10)
    const recentActivitiesResult = await getActivities(
      authContext.userId,
      authContext.role,
      {
        endDate: new Date().toISOString(),
      },
      undefined,
      { page: 1, pageSize: 10 }
    )
    const recentActivities = recentActivitiesResult.activities

    // Get recent jobs, clients, applications
    const [recentJobs, recentClients, recentApplications] = await Promise.all([
      db.job.findMany({
        where: authContext.role === UserRole.RECRUITER
          ? { recruiterId: authContext.userId }
          : {},
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
        },
      }),
      db.client.findMany({
        where: authContext.role === UserRole.RECRUITER
          ? { assignedUserId: authContext.userId }
          : {},
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }),
      db.application.findMany({
        where: authContext.role === UserRole.RECRUITER
          ? { recruiterId: authContext.userId }
          : {},
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              company: true,
            },
          },
        },
      }),
    ])

    // AI Recommendations (mock for now - will be replaced with real AI later)
    const aiRecommendations = [
      {
        id: '1',
        type: 'JOB_MATCH',
        title: 'High Match Job Available',
        description: '3 candidates match the Senior Developer position at TechCorp',
        priority: 'high',
        actionUrl: '/jobs',
      },
      {
        id: '2',
        type: 'FOLLOW_UP',
        title: 'Follow-up Reminder',
        description: 'You have 2 follow-ups scheduled for today',
        priority: 'medium',
        actionUrl: '/followups',
      },
    ]

    const dashboardData: any = {
      stats: {
        jobsScraped: metrics.jobsScraped,
        clientsManaged: totalClientsManaged,
        applicationsCreated: metrics.applicationsCreated,
        activeApplications,
      },
      conversionRates: metrics.conversionRates,
      pendingFollowUps: pendingFollowUps.slice(0, 5),
      overdueTasks: overdueFollowUps.slice(0, 5),
      todayToDoList: todayFollowUps,
      recentActivities: recentActivities.slice(0, 10),
      aiRecommendations,
      recentJobs,
      recentClients,
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        stage: app.stage,
        client: app.client,
        job: app.job,
      })),
    }

    // Admin/Manager specific data
    if (authContext.role === UserRole.ADMIN || authContext.role === UserRole.MANAGER) {
      const [recruiterComparison, platformAnalytics, funnelMetrics, systemMetrics] = await Promise.all([
        analyticsService.getRecruiterComparison(startDate, endDate),
        analyticsService.getPlatformUsage(startDate, endDate),
        analyticsService.getFunnelPerformance(startDate, endDate),
        analyticsService.getSystemMetrics(startDate, endDate),
      ])

      dashboardData.admin = {
        systemMetrics,
        recruiterComparison,
        platformAnalytics,
        funnelMetrics,
      }
    }

    const response = NextResponse.json(dashboardData, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard data'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

