import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { exportApplicationsToCSV } from '@/modules/applications/service'
import { applicationFilterSchema } from '@/modules/applications/schemas'
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
    if (searchParams.get('stage')) filterData.stage = searchParams.get('stage')
    if (searchParams.get('recruiterId')) filterData.recruiterId = searchParams.get('recruiterId')
    if (searchParams.get('jobId')) filterData.jobId = searchParams.get('jobId')
    if (searchParams.get('clientId')) filterData.clientId = searchParams.get('clientId')
    if (searchParams.get('startDate')) filterData.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) filterData.endDate = searchParams.get('endDate')
    if (searchParams.get('search')) filterData.search = searchParams.get('search')
    if (searchParams.get('hasFollowUp')) filterData.hasFollowUp = searchParams.get('hasFollowUp') === 'true'
    if (searchParams.get('overdueFollowUps')) filterData.overdueFollowUps = searchParams.get('overdueFollowUps') === 'true'

    const filters = applicationFilterSchema.parse(filterData)

    // Convert date strings to Date objects
    const processedFilters: any = { ...filters }
    if (processedFilters.startDate) {
      processedFilters.startDate = new Date(processedFilters.startDate)
    }
    if (processedFilters.endDate) {
      processedFilters.endDate = new Date(processedFilters.endDate)
    }

    const csv = await exportApplicationsToCSV(authContext.userId, authContext.role, processedFilters)

    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export applications'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

