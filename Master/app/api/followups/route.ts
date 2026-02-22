import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getFollowUps, createFollowUp } from '@/modules/followups/service'
import { followUpFilterSchema, followUpSortSchema, followUpPaginationSchema } from '@/modules/followups/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

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

    // Parse sort options
    const sortData: any = {}
    if (searchParams.get('sortBy')) sortData.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) sortData.sortOrder = searchParams.get('sortOrder')
    const sortOptions = followUpSortSchema.parse(sortData)

    // Parse pagination
    const paginationData: any = {}
    if (searchParams.get('page')) paginationData.page = parseInt(searchParams.get('page') || '1')
    if (searchParams.get('pageSize')) paginationData.pageSize = parseInt(searchParams.get('pageSize') || '25')
    const pagination = followUpPaginationSchema.parse(paginationData)

    // Convert date strings to Date objects
    const processedFilters: any = { ...filters }
    if (processedFilters.startDate) {
      processedFilters.startDate = new Date(processedFilters.startDate)
    }
    if (processedFilters.endDate) {
      processedFilters.endDate = new Date(processedFilters.endDate)
    }

    const result = await getFollowUps(
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
    const message = error instanceof Error ? error.message : 'Failed to fetch follow-ups'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    // Set assignedUserId from auth context if not provided
    if (!body.assignedUserId) {
      body.assignedUserId = authContext.userId
    }

    const followUp = await createFollowUp(body)

    // Log the mutation (Activity + AuditLog)
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'FollowUp',
      entityId: followUp.id,
      entityName: followUp.title,
      newData: followUp,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(followUp, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create follow-up'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}
