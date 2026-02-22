import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getApplications } from '@/modules/applications/service'
import { applicationFilterSchema, applicationSortSchema, applicationPaginationSchema } from '@/modules/applications/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const { searchParams } = new URL(request.url)

    // Parse filters - always filter by this client
    const filterData: any = { clientId: id }
    if (searchParams.get('stage')) filterData.stage = searchParams.get('stage')
    if (searchParams.get('recruiterId')) filterData.recruiterId = searchParams.get('recruiterId')
    if (searchParams.get('jobId')) filterData.jobId = searchParams.get('jobId')
    if (searchParams.get('startDate')) filterData.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) filterData.endDate = searchParams.get('endDate')
    if (searchParams.get('search')) filterData.search = searchParams.get('search')
    if (searchParams.get('hasFollowUp')) filterData.hasFollowUp = searchParams.get('hasFollowUp') === 'true'
    if (searchParams.get('overdueFollowUps')) filterData.overdueFollowUps = searchParams.get('overdueFollowUps') === 'true'

    const filters = applicationFilterSchema.parse(filterData)

    // Parse sort options
    const sortData: any = {}
    if (searchParams.get('sortBy')) sortData.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) sortData.sortOrder = searchParams.get('sortOrder')
    const sortOptions = applicationSortSchema.parse(sortData)

    // Parse pagination
    const paginationData: any = {}
    if (searchParams.get('page')) paginationData.page = parseInt(searchParams.get('page') || '1')
    if (searchParams.get('pageSize')) paginationData.pageSize = parseInt(searchParams.get('pageSize') || '25')
    const pagination = applicationPaginationSchema.parse(paginationData)

    // Convert date strings to Date objects
    const processedFilters: any = { ...filters }
    if (processedFilters.startDate) {
      processedFilters.startDate = new Date(processedFilters.startDate)
    }
    if (processedFilters.endDate) {
      processedFilters.endDate = new Date(processedFilters.endDate)
    }

    const result = await getApplications(
      authContext.userId,
      authContext.role,
      processedFilters,
      sortOptions,
      pagination
    )

    const response = NextResponse.json(result, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch applications'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}


