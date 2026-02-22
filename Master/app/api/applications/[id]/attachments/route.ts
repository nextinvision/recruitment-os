import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getAttachmentsByApplication, createAttachment } from '@/modules/application-attachments/service'
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
    const attachments = await getAttachmentsByApplication(id)

    const response = NextResponse.json(attachments, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch attachments'
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

    const attachment = await createAttachment({
      ...body,
      applicationId: id,
      uploadedBy: authContext.userId,
    })

    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'ApplicationAttachment',
      entityId: attachment.id,
      entityName: `Attachment for application ${id}`,
      newData: attachment,
      metadata: { applicationId: id, attachmentType: attachment.type },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(attachment, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create attachment'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}


