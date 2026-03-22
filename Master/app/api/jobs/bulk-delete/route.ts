import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { bulkDeleteJobs } from '@/modules/jobs/service'
import { bulkDeleteJobsSchema } from '@/modules/jobs/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const validated = bulkDeleteJobsSchema.parse(body)

    const result = await bulkDeleteJobs(
      validated,
      authContext.userId,
      authContext.role
    )

    for (const d of result.deletedDetails) {
      await logMutation({
        request,
        userId: authContext.userId,
        action: 'DELETE',
        entity: 'Job',
        entityId: d.jobId,
        entityName: `${d.title} at ${d.company}`,
        metadata: { source: 'bulk-delete' },
      }).catch((err) => {
        console.error('Failed to log mutation:', err)
      })
    }

    const response = NextResponse.json(
      {
        deleted: result.deleted.length,
        errors: result.errors,
        jobIds: result.deleted,
      },
      { status: 200 }
    )
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bulk delete failed'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}
