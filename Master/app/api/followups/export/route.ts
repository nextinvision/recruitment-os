import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { exportFollowUpsToCSV } from '@/modules/followups/service'
import { followUpFilterSchema } from '@/modules/followups/schemas'
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

    const { searchParams } = new URL(request.url)

    // Parse filters
    const filterData: any = {}
    if (searchParams.get('leadId')) filterData.leadId = searchParams.get('leadId')
    if (searchParams.get('clientId')) filterData.clientId = searchParams.get('clientId')
    if (searchParams.get('assignedUserId')) filterData.assignedUserId = searchParams.get('assignedUserId')
    if (searchParams.get('completed') !== null) filterData.completed = searchParams.get('completed') === 'true'
    if (searchParams.get('overdue') !== null) filterData.overdue = searchParams.get('overdue') === 'true'
    if (searchParams.get('entityType')) filterData.entityType = searchParams.get('entityType')
    if (searchParams.get('startDate')) filterData.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) filterData.endDate = searchParams.get('endDate')
    if (searchParams.get('search')) filterData.search = searchParams.get('search')

    const filters = followUpFilterSchema.parse(filterData)

    // Convert date strings to Date objects
    const processedFilters: any = { ...filters }
    if (processedFilters.startDate) {
      processedFilters.startDate = new Date(processedFilters.startDate)
    }
    if (processedFilters.endDate) {
      processedFilters.endDate = new Date(processedFilters.endDate)
    }

    const csv = await exportFollowUpsToCSV(authContext.userId, authContext.role, processedFilters)

    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="followups-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export follow-ups'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

