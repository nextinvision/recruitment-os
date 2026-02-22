import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getClientDocumentsByClient, createClientDocument } from '@/modules/client-documents/service'
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

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as any

    const documents = await getClientDocumentsByClient(id, type)

    const response = NextResponse.json(documents, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
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
    const body = await request.json()

    const document = await createClientDocument({
      ...body,
      clientId: id,
      uploadedBy: authContext.userId,
    })

    // If this is a job search strategy document, update the client
    if (document.type === 'JOB_SEARCH_STRATEGY') {
      const { updateClient } = await import('@/modules/clients/service')
      await updateClient({
        id,
        jobSearchStrategyDocId: document.id,
      })
    }

    // Log the mutation
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'ClientDocument',
      entityId: document.id,
      entityName: document.fileName,
      newData: document,
      metadata: { clientId: id, documentType: document.type },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(document, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create document'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

