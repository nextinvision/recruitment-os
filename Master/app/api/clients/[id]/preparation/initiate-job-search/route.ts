import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getClientById, updateClient } from '@/modules/clients/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    
    // Get current client
    const oldClient = await getClientById(id)
    if (!oldClient) {
      const response = NextResponse.json({ error: 'Client not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Validate prerequisites
    if (!oldClient.serviceType) {
      const response = NextResponse.json({ error: 'Service type must be assigned before initiating job search' }, { status: 400 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    if (!oldClient.reverseRecruiterId) {
      const response = NextResponse.json({ error: 'Reverse recruiter must be assigned before initiating job search' }, { status: 400 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Update client to initiate job search
    const client = await updateClient({
      id,
      jobSearchInitiated: true,
      jobSearchInitiatedAt: new Date().toISOString(),
    })

    // Log the mutation
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'UPDATE',
      entity: 'Client',
      entityId: id,
      entityName: `${client.firstName} ${client.lastName}`,
      oldData: oldClient,
      newData: client,
      metadata: { clientId: id, action: 'INITIATE_JOB_SEARCH' },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(client, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initiate job search'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

