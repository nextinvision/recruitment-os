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

    // Only Admin can export audit logs
    if (authContext.role !== UserRole.ADMIN) {
      const response = NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
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

    // For export, get all matching records (no limit)
    filters.limit = 10000 // Large limit for export

    const logs = await auditService.getLogs(filters)

    // Convert to CSV
    const csvHeaders = [
      'ID',
      'Timestamp',
      'User',
      'User Email',
      'Action',
      'Entity',
      'Entity ID',
      'Details',
      'IP Address',
      'User Agent',
    ]

    const csvRows = logs.map((log) => {
      const details = log.details ? JSON.parse(log.details) : {}
      return [
        log.id,
        log.createdAt.toISOString(),
        `${log.user.firstName} ${log.user.lastName}`,
        log.user.email,
        log.action,
        log.entity,
        log.entityId || '',
        JSON.stringify(details),
        log.ipAddress || '',
        log.userAgent || '',
      ]
    })

    // Escape CSV values
    const escapeCsv = (value: string) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [
      csvHeaders.map(escapeCsv).join(','),
      ...csvRows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n')

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export audit logs'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

