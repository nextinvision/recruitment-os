import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { auditService } from '@/modules/audit/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { UserRole } from '@prisma/client'

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

    // Only Admin and Manager can view audit logs
    if (authContext.role !== UserRole.ADMIN && authContext.role !== UserRole.MANAGER) {
      const response = NextResponse.json({ error: 'Access denied. Admin or Manager role required.' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const searchParams = request.nextUrl.searchParams
    const filters: any = {}

    if (searchParams.get('userId')) {
      filters.userId = searchParams.get('userId')
    }

    if (searchParams.get('entity')) {
      filters.entity = searchParams.get('entity')
    }

    if (searchParams.get('action')) {
      filters.action = searchParams.get('action')
    }

    if (searchParams.get('entityId')) {
      filters.entityId = searchParams.get('entityId')
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }

    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }

    const limit = searchParams.get('limit')
    if (limit) {
      filters.limit = parseInt(limit)
    }

    const offset = searchParams.get('offset')
    if (offset) {
      filters.offset = parseInt(offset)
    }

    const [logs, total] = await Promise.all([
      auditService.getLogs(filters),
      auditService.getLogsCount(filters),
    ])

    const response = NextResponse.json(
      {
        logs,
        total,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      },
      { status: 200 }
    )
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

