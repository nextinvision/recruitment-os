import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getJobs, createJob } from '@/modules/jobs/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const jobs = await getJobs(authContext.userId, authContext.role)

    const response = NextResponse.json(jobs, { status: 200 })
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
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const job = await createJob(body)

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

