import { NextRequest, NextResponse } from 'next/server'
import { Packer } from 'docx'
import { renderResumeToDocx } from '@/modules/resume-builder/docx-renderer'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const body = await request.json()
    const { document: resumeDoc } = body

    if (!resumeDoc) {
      return NextResponse.json({ error: 'Missing resume document data' }, { status: 400 })
    }

    const doc = await renderResumeToDocx(resumeDoc)
    const buffer = await Packer.toBuffer(doc)

    const response = new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Resume-${resumeDoc.contact.name || 'Export'}.docx"`,
      },
    })

    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    console.error('DOCX Export Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to export to Word'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}
