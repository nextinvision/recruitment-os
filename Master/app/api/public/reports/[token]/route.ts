import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/public/reports/[token] - Get public snapshot data
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        const snapshot = await db.reportSnapshot.findUnique({
            where: { token },
            include: {
                client: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })

        if (!snapshot) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        // Never expose internal CRM timeline notes on the public link (strip legacy snapshots too).
        const rawData = snapshot.data as Record<string, unknown> | null
        const sanitizedData =
            rawData && typeof rawData === 'object' && !Array.isArray(rawData)
                ? (() => {
                      const { notes: _omit, ...rest } = rawData
                      return rest
                  })()
                : rawData

        return NextResponse.json({
            ...snapshot,
            data: sanitizedData,
        })
    } catch (error: any) {
        console.error('Error fetching public report:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
