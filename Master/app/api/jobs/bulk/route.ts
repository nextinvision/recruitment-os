import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { bulkCreateJobs } from '@/modules/jobs/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = await getAuthContext(authHeader)
    const user = requireAuth(authContext)

    const body = await request.json()

    // Inject recruiterId and normalize source for each job
    if (body.jobs && Array.isArray(body.jobs)) {
      body.jobs = body.jobs.map((job: any) => ({
        ...job,
        recruiterId: user.userId,
        source: typeof job.source === 'string' ? job.source.toUpperCase() : job.source
      }))
    }

    const result = await bulkCreateJobs(body)

    const response = NextResponse.json(result, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create jobs'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

