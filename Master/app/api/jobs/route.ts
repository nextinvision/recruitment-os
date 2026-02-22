import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getJobs, createJob } from '@/modules/jobs/service'
import { jobFiltersSchema, jobSortSchema, jobPaginationSchema } from '@/modules/jobs/schemas'
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    
    // Filters
    const filters: any = {}
    if (searchParams.get('source')) filters.source = searchParams.get('source')
    if (searchParams.get('status')) filters.status = searchParams.get('status')
    if (searchParams.get('recruiterId')) filters.recruiterId = searchParams.get('recruiterId')
    if (searchParams.get('startDate')) filters.startDate = new Date(searchParams.get('startDate')!)
    if (searchParams.get('endDate')) filters.endDate = new Date(searchParams.get('endDate')!)
    if (searchParams.get('search')) filters.search = searchParams.get('search')
    if (searchParams.get('isDuplicate')) filters.isDuplicate = searchParams.get('isDuplicate') === 'true'

    // Sort options
    const sortOptions: any = {}
    if (searchParams.get('sortBy')) sortOptions.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) sortOptions.sortOrder = searchParams.get('sortOrder')

    // Pagination
    const pagination: any = {}
    if (searchParams.get('page')) pagination.page = parseInt(searchParams.get('page')!)
    if (searchParams.get('pageSize')) pagination.pageSize = parseInt(searchParams.get('pageSize')!)

    const result = await getJobs(
      authContext.userId,
      authContext.role,
      Object.keys(filters).length > 0 ? filters : undefined,
      Object.keys(sortOptions).length > 0 ? sortOptions : undefined,
      Object.keys(pagination).length > 0 ? pagination : undefined
    )

    const response = NextResponse.json(result, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs'
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
    const job = await createJob(body)

    // Log the mutation
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'Job',
      entityId: job.id,
      entityName: `${job.title} at ${job.company}`,
      newData: job,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(job, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create job'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}
