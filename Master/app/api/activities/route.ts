import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getActivities, createActivity } from '@/modules/activities/service'
import { activityFilterSchema, activitySortSchema, activityPaginationSchema } from '@/modules/activities/schemas'
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
    if (searchParams.get('type')) filterData.type = searchParams.get('type')
    if (searchParams.get('startDate')) filterData.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) filterData.endDate = searchParams.get('endDate')
    if (searchParams.get('search')) filterData.search = searchParams.get('search')

    const filters = activityFilterSchema.parse(filterData)

    // Parse sort options
    const sortData: any = {}
    if (searchParams.get('sortBy')) sortData.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) sortData.sortOrder = searchParams.get('sortOrder')
    const sortOptions = activitySortSchema.parse(sortData)

    // Parse pagination
    const paginationData: any = {}
    if (searchParams.get('page')) paginationData.page = parseInt(searchParams.get('page') || '1')
    if (searchParams.get('pageSize')) paginationData.pageSize = parseInt(searchParams.get('pageSize') || '25')
    const pagination = activityPaginationSchema.parse(paginationData)

    // Convert date strings to Date objects
    const processedFilters: any = { ...filters }
    if (processedFilters.startDate) {
      processedFilters.startDate = new Date(processedFilters.startDate)
    }
    if (processedFilters.endDate) {
      processedFilters.endDate = new Date(processedFilters.endDate)
    }

    const result = await getActivities(
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
    const message = error instanceof Error ? error.message : 'Failed to fetch activities'
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
    
    const activity = await createActivity(body)

    // Log the mutation
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'Activity',
      entityId: activity.id,
      entityName: activity.title,
      newData: activity,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(activity, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create activity'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

