import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, canAccessResource } from '@/lib/rbac'
import { getCandidateById, updateCandidate, deleteCandidate } from '@/modules/candidates/service'
import { createApiResponse, createApiError, handleApiRequest } from '@/lib/api-response'
import { logMutation } from '@/lib/mutation-logger'

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
    
    // Get old data for change tracking
    const oldCandidate = candidate
    
    const updatedCandidate = await updateCandidate({ id, ...body })

    // Log the mutation (Activity + AuditLog)
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'UPDATE',
      entity: 'Candidate',
      entityId: id,
      entityName: `${updatedCandidate.firstName} ${updatedCandidate.lastName}`,
      oldData: oldCandidate,
      newData: updatedCandidate,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

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

    // Log the mutation (Activity + AuditLog)
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'DELETE',
      entity: 'Candidate',
      entityId: id,
      entityName: `${candidate.firstName} ${candidate.lastName}`,
      oldData: candidate,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    return createApiResponse(request, { message: 'Candidate deleted successfully' }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete candidate'
    return createApiError(request, message, 500)
  }
}

