import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApplicationStage, ClientJobApprovalStatus } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { ensurePrimaryJobInApplicationJobs } from '@/modules/jobs/service'
import { APPLICATION_JOBS_ORDER_BY } from '@/modules/applications/application-job-order'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * When every ApplicationJob row is non-PENDING, close out the approval:
 * - Any APPROVED → IDENTIFIED + approvedAt
 * - All REJECTED → REJECTED
 * If any row is still PENDING, leave stage unchanged so the client can return to the link.
 */
async function finalizeApplicationIfAllJobsResolved(applicationId: string): Promise<{
    finalized: boolean
    stage: ApplicationStage
}> {
    const app = await db.application.findUnique({
        where: { id: applicationId },
        include: {
          applicationJobs: { orderBy: APPLICATION_JOBS_ORDER_BY },
        },
    })
    if (!app) {
        return { finalized: false, stage: ApplicationStage.PENDING_CLIENT_APPROVAL }
    }

    if (app.applicationJobs.length === 0) {
        return { finalized: false, stage: app.stage }
    }

    const pending = app.applicationJobs.filter((aj) => aj.status === ClientJobApprovalStatus.PENDING)
    if (pending.length > 0) {
        return { finalized: false, stage: app.stage }
    }

    const anyApproved = app.applicationJobs.some((aj) => aj.status === ClientJobApprovalStatus.APPROVED)

    const updated = await db.application.update({
        where: { id: applicationId },
        data: {
            stage: anyApproved ? ApplicationStage.IDENTIFIED : ApplicationStage.REJECTED,
            stageChangedAt: new Date(),
            ...(anyApproved ? { approvedAt: new Date() } : {}),
        },
    })

    return { finalized: true, stage: updated.stage }
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
                    orderBy: APPLICATION_JOBS_ORDER_BY,
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
        const { action, jobId, applicationJobId } = body as {
            action?: string
            jobId?: string
            applicationJobId?: string
        }

        const application = await db.application.findUnique({
            where: { approvalToken: token },
            include: {
              applicationJobs: { orderBy: APPLICATION_JOBS_ORDER_BY },
            },
        })

        if (!application) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        // --- Per-job approval (multi-job flow; also supports legacy primary job via jobId) ---
        if (action === 'APPROVE_JOB' || action === 'REJECT_JOB') {
            if (!applicationJobId && !jobId) {
                return NextResponse.json(
                    { error: 'Provide applicationJobId or jobId for per-job actions' },
                    { status: 400 }
                )
            }

            await ensurePrimaryJobInApplicationJobs(
                application.id,
                application.jobId,
                application.applicationJobs
            )

            const fresh = await db.application.findUnique({
                where: { id: application.id },
                include: {
                  applicationJobs: { orderBy: APPLICATION_JOBS_ORDER_BY },
                },
            })
            if (!fresh) {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 })
            }

            const target = applicationJobId
                ? fresh.applicationJobs.find((aj) => aj.id === applicationJobId)
                : jobId
                  ? fresh.applicationJobs.find((aj) => aj.jobId === jobId)
                  : undefined

            if (!target) {
                return NextResponse.json({ error: 'Job not found for this application' }, { status: 404 })
            }

            if (target.status !== ClientJobApprovalStatus.PENDING) {
                return NextResponse.json(
                    { error: 'This job has already been responded to' },
                    { status: 400 }
                )
            }

            const newStatus =
                action === 'APPROVE_JOB' ? ClientJobApprovalStatus.APPROVED : ClientJobApprovalStatus.REJECTED

            await db.applicationJob.update({
                where: { id: target.id },
                data: {
                    status: newStatus,
                    respondedAt: new Date(),
                },
            })

            const { finalized, stage } = await finalizeApplicationIfAllJobsResolved(application.id)

            const response = NextResponse.json(
                { success: true, stage, finalized },
                { status: 200 }
            )
            return addCorsHeaders(response, request.headers.get('origin'))
        }

        // --- Bulk + legacy single-action flow (Approve all / Reject all) ---
        if (action === 'SAVE') {
            return NextResponse.json({ message: 'Saved for later' }, { status: 200 })
        }

        if (action !== 'APPROVE' && action !== 'REJECT') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const appFull = await db.application.findUnique({
            where: { id: application.id },
            include: {
              applicationJobs: { orderBy: APPLICATION_JOBS_ORDER_BY },
            },
        })
        if (!appFull) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        await ensurePrimaryJobInApplicationJobs(
            appFull.id,
            appFull.jobId,
            appFull.applicationJobs
        )

        const status =
            action === 'APPROVE' ? ClientJobApprovalStatus.APPROVED : ClientJobApprovalStatus.REJECTED

        try {
            await db.applicationJob.updateMany({
                where: {
                    applicationId: application.id,
                    status: ClientJobApprovalStatus.PENDING,
                },
                data: {
                    status,
                    respondedAt: new Date(),
                },
            })
        } catch (err) {
            console.error('Failed to update applicationJobs status on public approval:', err)
        }

        let { finalized, stage } = await finalizeApplicationIfAllJobsResolved(application.id)

        // Legacy: no join rows (e.g. missing jobId) — close out application directly
        if (!finalized) {
            const count = await db.applicationJob.count({ where: { applicationId: application.id } })
            if (count === 0) {
                const updatedLegacy = await db.application.update({
                    where: { id: application.id },
                    data: {
                        stage: action === 'APPROVE' ? ApplicationStage.IDENTIFIED : ApplicationStage.REJECTED,
                        stageChangedAt: new Date(),
                        ...(action === 'APPROVE' ? { approvedAt: new Date() } : {}),
                    },
                })
                stage = updatedLegacy.stage
                finalized = true
            }
        }

        const response = NextResponse.json(
            { success: true, stage, finalized },
            { status: 200 }
        )
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        console.error('Public Approval POST Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
