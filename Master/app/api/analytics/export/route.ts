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
    
    // Only ADMIN and MANAGER can export reports
    requireRole(authContext, [UserRole.ADMIN, UserRole.MANAGER])

    const searchParams = request.nextUrl.searchParams
    const startDate = new Date(searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    const endDate = new Date(searchParams.get('endDate') || new Date())
    const reportType = (searchParams.get('reportType') || 'system') as 'system' | 'recruiter-comparison' | 'funnel' | 'platform'
    const recruiterId = searchParams.get('recruiterId') || undefined

    const csv = await analyticsService.exportReportsToCSV(startDate, endDate, reportType, recruiterId)

    const filename = `reports-${reportType}-${new Date().toISOString().split('T')[0]}.csv`

    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export reports'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

