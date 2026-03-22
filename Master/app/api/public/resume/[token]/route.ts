import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * GET /api/public/resume/[token]
 * Returns resume draft content and metadata for the public resume view page (preview, download, accept/reject).
 * No auth required.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const { token } = await params

        const link = await (db as any).resumeLink.findUnique({
            where: { token },
            include: {
                resumeDraft: {
                    select: { id: true, content: true, template: true, updatedAt: true }
                },
                client: {
                    select: { firstName: true, lastName: true }
                }
            }
        })

        if (!link) {
            return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
        }

        const payload = {
            id: link.id,
            token: link.token,
            response: link.response,
            respondedAt: link.respondedAt,
            sentAt: link.sentAt,
            resume: link.resumeDraft
                ? {
                    id: link.resumeDraft.id,
                    content: link.resumeDraft.content,
                    template: link.resumeDraft.template,
                    updatedAt: link.resumeDraft.updatedAt,
                }
                : null,
            clientName: link.client
                ? `${link.client.firstName} ${link.client.lastName}`
                : null,
        }

        const response = NextResponse.json(payload, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        console.error('GET /api/public/resume/[token] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/public/resume/[token]
 * Body: { action: 'ACCEPT' | 'REJECT' }
 * Records the client's response (accept/reject) and invalidates the link for further changes.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const { token } = await params
        const body = await request.json().catch(() => ({}))
        const action = body.action as string

        if (action !== 'ACCEPT' && action !== 'REJECT') {
            return NextResponse.json({ error: 'Invalid action. Use ACCEPT or REJECT.' }, { status: 400 })
        }

        const link = await (db as any).resumeLink.findUnique({
            where: { token }
        })

        if (!link) {
            return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
        }

        if (link.response !== 'PENDING') {
            return NextResponse.json(
                { error: 'This link has already been used.', response: link.response },
                { status: 400 }
            )
        }

        const newResponse = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
        await (db as any).resumeLink.update({
            where: { id: link.id },
            data: {
                response: newResponse,
                respondedAt: new Date(),
            }
        })

        const response = NextResponse.json(
            { success: true, response: newResponse },
            { status: 200 }
        )
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        console.error('POST /api/public/resume/[token] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
