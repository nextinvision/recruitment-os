import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { analyticsService } from '@/modules/analytics/service'
import { UserRole } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'

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
    
    // Only ADMIN and MANAGER can access system metrics
    requireRole(authContext, [UserRole.ADMIN, UserRole.MANAGER])

    const searchParams = request.nextUrl.searchParams
    const startDate = new Date(searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    const endDate = new Date(searchParams.get('endDate') || new Date())

    const [platformUsage, funnelPerformance] = await Promise.all([
      analyticsService.getPlatformUsage(startDate, endDate),
      analyticsService.getFunnelPerformance(startDate, endDate),
    ])

    const response = NextResponse.json({
      platformUsage,
      funnelPerformance,
      period: { start: startDate, end: endDate },
    }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch system metrics'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

