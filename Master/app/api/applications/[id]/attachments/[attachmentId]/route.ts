import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getAttachmentById, updateAttachment, deleteAttachment } from '@/modules/application-attachments/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    requireAuth(await getAuthContext(authHeader))

    const { attachmentId } = await params
    const attachment = await getAttachmentById(attachmentId)

    if (!attachment) {
      const response = NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const response = NextResponse.json(attachment, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch attachment'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { attachmentId } = await params
    const body = await request.json()

    const oldAttachment = await getAttachmentById(attachmentId)
    if (!oldAttachment) {
      const response = NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const attachment = await updateAttachment({
      id: attachmentId,
      ...body,
    })

    await logMutation({
      request,
      userId: authContext.userId,
      action: 'UPDATE',
      entity: 'ApplicationAttachment',
      entityId: attachmentId,
      entityName: `Attachment ${attachmentId}`,
      oldData: oldAttachment,
      newData: attachment,
      metadata: { applicationId: attachment.applicationId },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(attachment, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update attachment'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { attachmentId } = await params

    const oldAttachment = await getAttachmentById(attachmentId)
    if (!oldAttachment) {
      const response = NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    await deleteAttachment(attachmentId)

    await logMutation({
      request,
      userId: authContext.userId,
      action: 'DELETE',
      entity: 'ApplicationAttachment',
      entityId: attachmentId,
      entityName: `Attachment ${attachmentId}`,
      oldData: oldAttachment,
      metadata: { applicationId: oldAttachment.applicationId },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json({ success: true }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete attachment'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}


