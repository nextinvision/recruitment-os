import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getLeadById } from '@/modules/leads/service'
import { uploadLeadDocument, getLeadDocumentsByLeadId } from '@/modules/lead-documents/service'
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

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const lead = await getLeadById(id)
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const documents = await getLeadDocumentsByLeadId(id)
    const response = NextResponse.json(documents, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lead documents'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const lead = await getLeadById(id)
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = file.type || 'application/octet-stream'

    const document = await uploadLeadDocument({
      leadId: id,
      buffer,
      originalFileName: file.name,
      contentType,
      uploadedBy: authContext.userId,
    })

    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'LeadDocument',
      entityId: document.id,
      entityName: document.originalFileName,
      newData: document,
      metadata: { leadId: id },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(document, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    console.error('Lead document upload error:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload document'
    const status = message.includes('Failed to upload') ? 500 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
