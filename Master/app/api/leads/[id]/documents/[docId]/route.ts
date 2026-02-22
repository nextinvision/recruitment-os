import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getLeadDocumentById, deleteLeadDocument } from '@/modules/lead-documents/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id: _leadId, docId } = await params
    const doc = await getLeadDocumentById(docId)
    if (!doc || doc.leadId !== _leadId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await deleteLeadDocument(docId)

    await logMutation({
      request,
      userId: authContext.userId,
      action: 'DELETE',
      entity: 'LeadDocument',
      entityId: docId,
      entityName: doc.originalFileName,
      oldData: doc,
      metadata: { leadId: _leadId },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    return NextResponse.json({ message: 'Document deleted' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
