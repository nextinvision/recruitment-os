import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApplicationStage } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const { token } = await params

        const application = await (db.application as any).findUnique({
            where: { approvalToken: token },
            include: {
                job: true,
                // applicationJobs relation is available in updated Prisma schema; ignore in older generated types
                // @ts-ignore
                applicationJobs: {
                    include: {
                        job: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        const response = NextResponse.json(application, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        console.error('Public Approval GET Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const { token } = await params
        const body = await request.json()
        const { action } = body // 'APPROVE', 'REJECT', 'SAVE'

        const application = await db.application.findUnique({
            where: { approvalToken: token },
        })

        if (!application) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        let newStage: ApplicationStage = application.stage
        let updateData: any = {}

        if (action === 'APPROVE') {
            newStage = ApplicationStage.IDENTIFIED
            updateData.approvedAt = new Date()
            updateData.approvalToken = null // Token used, invalidate it
        } else if (action === 'REJECT') {
            newStage = ApplicationStage.REJECTED
            updateData.approvalToken = null // Token used, invalidate it
        } else if (action === 'SAVE') {
            // Stay in PENDING_CLIENT_APPROVAL, but maybe we want to track that they saw it
            return NextResponse.json({ message: 'Saved for later' }, { status: 200 })
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Update application stage and invalidate token
        const updated = await db.application.update({
            where: { id: application.id },
            data: {
                stage: newStage,
                stageChangedAt: new Date(),
                ...updateData
            }
        })

        // Also stamp all attached jobs with APPROVED / REJECTED status at job level
        try {
            if (action === 'APPROVE') {
                await (db as any).applicationJob.updateMany({
                    where: { applicationId: application.id },
                    data: {
                        status: 'APPROVED',
                        respondedAt: new Date(),
                    },
                })
            } else if (action === 'REJECT') {
                await (db as any).applicationJob.updateMany({
                    where: { applicationId: application.id },
                    data: {
                        status: 'REJECTED',
                        respondedAt: new Date(),
                    },
                })
            }
        } catch (err) {
            console.error('Failed to update applicationJobs status on public approval:', err)
        }

        const response = NextResponse.json({ success: true, stage: updated.stage }, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        console.error('Public Approval POST Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
