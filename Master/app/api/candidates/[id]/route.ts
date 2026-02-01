import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, canAccessResource } from '@/lib/rbac'
import { getCandidateById, updateCandidate, deleteCandidate } from '@/modules/candidates/service'
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
    const candidate = await getCandidateById(id)

    if (!candidate) {
      return createApiError(request, 'Candidate not found', 404)
    }

    if (!canAccessResource(authContext, candidate.assignedRecruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    return createApiResponse(request, candidate, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch candidate'
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
    const candidate = await getCandidateById(id)

    if (!candidate) {
      return createApiError(request, 'Candidate not found', 404)
    }

    if (!canAccessResource(authContext, candidate.assignedRecruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    const body = await request.json()
    const updatedCandidate = await updateCandidate({ id, ...body })

    return createApiResponse(request, updatedCandidate, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update candidate'
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
    const candidate = await getCandidateById(id)

    if (!candidate) {
      return createApiError(request, 'Candidate not found', 404)
    }

    if (!canAccessResource(authContext, candidate.assignedRecruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    await deleteCandidate(id)

    return createApiResponse(request, { message: 'Candidate deleted successfully' }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete candidate'
    return createApiError(request, message, 500)
  }
}

