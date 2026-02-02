import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getJobById, updateJob, deleteJob } from '@/modules/jobs/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Get token from cookie or Authorization header
    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const job = await getJobById(id)

    if (!job) {
      const response = NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Check access
    if (authContext.role !== 'ADMIN' && authContext.role !== 'MANAGER' && job.recruiterId !== authContext.userId) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const response = NextResponse.json(job, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Get token from cookie or Authorization header
    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const job = await getJobById(id)

    if (!job) {
      const response = NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Check access
    if (authContext.role !== 'ADMIN' && authContext.role !== 'MANAGER' && job.recruiterId !== authContext.userId) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const body = await request.json()
    
    // Get old data for change tracking
    const oldJob = job
    
    const updatedJob = await updateJob({ id, ...body })

    // Log the mutation (Activity + AuditLog)
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'UPDATE',
      entity: 'Job',
      entityId: id,
      entityName: `${updatedJob.title} at ${updatedJob.company}`,
      oldData: oldJob,
      newData: updatedJob,
    }).catch((err) => {
      // Log error but don't fail the request
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(updatedJob, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update job'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Get token from cookie or Authorization header
    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const job = await getJobById(id)

    if (!job) {
      const response = NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Check access
    if (authContext.role !== 'ADMIN' && authContext.role !== 'MANAGER' && job.recruiterId !== authContext.userId) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    await deleteJob(id)

    // Log the mutation (Activity + AuditLog)
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'DELETE',
      entity: 'Job',
      entityId: id,
      entityName: `${job.title} at ${job.company}`,
      oldData: job,
    }).catch((err) => {
      // Log error but don't fail the request
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json({ message: 'Job deleted successfully' }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete job'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

