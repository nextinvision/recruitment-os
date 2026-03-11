import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getClientDocumentById } from '@/modules/client-documents/service'
import { getClientById } from '@/modules/clients/service'
import { storageService } from '@/lib/storage'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { UserRole } from '@prisma/client'

function contentTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    txt: 'text/plain',
  }
  return map[ext || ''] || 'application/octet-stream'
}

/**
 * GET /api/clients/[id]/documents/[docId]/download
 * Streams the file from MinIO so the browser can open/download it.
 * Root cause fix: stored fileUrl (http://localhost:9000/documents/...) is MinIO's
 * S3 API and is not served as public GET; this proxy fetches from MinIO and returns the file.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id: clientId, docId } = await params

    const document = await getClientDocumentById(docId)
    if (!document || document.clientId !== clientId) {
      const response = NextResponse.json({ error: 'Document not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const client = await getClientById(clientId)
    if (!client) {
      const response = NextResponse.json({ error: 'Client not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    if (authContext.role !== UserRole.ADMIN && authContext.role !== UserRole.MANAGER && client.assignedUserId !== authContext.userId) {
      const response = NextResponse.json({ error: 'Not allowed to access this client\'s documents' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const buffer = await storageService.downloadFile(document.fileName, 'DOCUMENT')
    const contentType = contentTypeFromFileName(document.fileName)
    const uint8Array = new Uint8Array(buffer)
    const displayName = (document as { originalFileName?: string | null }).originalFileName || document.fileName
    const safeName = displayName.replace(/[^\w\s.-]/g, '_')

    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Content-Length': uint8Array.length.toString(),
      },
    })

    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to download document'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}
