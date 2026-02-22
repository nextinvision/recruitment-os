import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { assignJobToCandidate, bulkAssignJobToCandidates } from '@/modules/jobs/service'
import { assignJobSchema, bulkAssignJobSchema } from '@/modules/jobs/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const body = await request.json()

    // Check if it's bulk assignment
    if (body.candidateIds && Array.isArray(body.candidateIds)) {
      const validated = bulkAssignJobSchema.parse(body)
      const result = await bulkAssignJobToCandidates(
        validated.jobId,
        validated.candidateIds,
        authContext.userId
      )

      // Log mutations for each assignment
      for (const application of result.applications) {
        await logMutation({
          request,
          userId: authContext.userId,
          action: 'CREATE',
          entity: 'Application',
          entityId: application.id,
          entityName: `Application for job ${validated.jobId}`,
          newData: application,
        }).catch((err) => {
          console.error('Failed to log mutation:', err)
        })
      }

      const response = NextResponse.json(result, { status: 201 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    } else {
      // Single assignment
      const validated = assignJobSchema.parse(body)
      const application = await assignJobToCandidate(
        validated.jobId,
        validated.candidateId,
        authContext.userId
      )

      // Log the mutation
      await logMutation({
        request,
        userId: authContext.userId,
        action: 'CREATE',
        entity: 'Application',
        entityId: application.id,
        entityName: `Application for job ${validated.jobId}`,
        newData: application,
      }).catch((err) => {
        console.error('Failed to log mutation:', err)
      })

      const response = NextResponse.json(application, { status: 201 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign job'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

