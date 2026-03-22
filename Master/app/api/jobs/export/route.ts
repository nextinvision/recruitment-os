import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { exportJobsToCSV } from '@/modules/jobs/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { JobSource, JobStatus, JobType } from '@prisma/client'

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

    const searchParams = request.nextUrl.searchParams
    
    const filters: Record<string, unknown> = {}
    if (searchParams.get('source')) filters.source = searchParams.get('source') as JobSource
    if (searchParams.get('status')) filters.status = searchParams.get('status') as JobStatus
    if (searchParams.get('recruiterId')) filters.recruiterId = searchParams.get('recruiterId')
    if (searchParams.get('startDate')) filters.startDate = new Date(searchParams.get('startDate')!)
    if (searchParams.get('endDate')) filters.endDate = new Date(searchParams.get('endDate')!)
    if (searchParams.get('search')) filters.search = searchParams.get('search')
    if (searchParams.get('isDuplicate')) filters.isDuplicate = searchParams.get('isDuplicate') === 'true'
    if (searchParams.get('jobType')) filters.jobType = searchParams.get('jobType') as JobType
    if (searchParams.get('title')) filters.title = searchParams.get('title')
    if (searchParams.get('company')) filters.company = searchParams.get('company')
    if (searchParams.get('location')) filters.location = searchParams.get('location')
    if (searchParams.get('skills')) filters.skills = searchParams.get('skills')
    if (searchParams.get('ctcRange')) filters.ctcRange = searchParams.get('ctcRange')
    if (searchParams.get('yearsOfExperience')) filters.yearsOfExperience = searchParams.get('yearsOfExperience')

    const csv = await exportJobsToCSV(
      authContext.userId,
      authContext.role,
      Object.keys(filters).length > 0 ? filters : undefined
    )

    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="jobs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export jobs'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

