import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, canAccessResource } from '@/lib/rbac'
import { getJobById, updateJob, deleteJob } from '@/modules/jobs/service'
import { createApiResponse, createApiError, handleApiRequest } from '@/lib/api-response'

export async function OPTIONS(request: NextRequest) {
  return handleApiRequest(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleApiRequest(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const job = await getJobById(id)

    if (!job) {
      return createApiError(request, 'Job not found', 404)
    }

    if (!canAccessResource(authContext, job.recruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    return createApiResponse(request, job, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job'
    return createApiError(request, message, 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleApiRequest(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const job = await getJobById(id)

    if (!job) {
      return createApiError(request, 'Job not found', 404)
    }

    if (!canAccessResource(authContext, job.recruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    const body = await request.json()
    const updatedJob = await updateJob({ id, ...body })

    return createApiResponse(request, updatedJob, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update job'
    return createApiError(request, message, 400)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleApiRequest(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const job = await getJobById(id)

    if (!job) {
      return createApiError(request, 'Job not found', 404)
    }

    if (!canAccessResource(authContext, job.recruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    await deleteJob(id)

    return createApiResponse(request, { message: 'Job deleted successfully' }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete job'
    return createApiError(request, message, 500)
  }
}

