import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { systemHealthService } from '@/modules/system-health/service'
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

    // Only ADMIN can view system health
    requireRole(authContext, [UserRole.ADMIN])

    const [metrics, issues] = await Promise.all([
      systemHealthService.getHealthMetrics(),
      systemHealthService.checkCriticalIssues(),
    ])

    const response = NextResponse.json({
      metrics,
      issues,
    }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch system health'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

