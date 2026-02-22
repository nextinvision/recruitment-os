import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getClientById } from '@/modules/clients/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

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
    const client = await getClientById(id)

    if (!client) {
      const response = NextResponse.json({ error: 'Client not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Calculate preparation pipeline status
    const steps = [
      { 
        name: 'Client Name', 
        completed: !!(client.firstName && client.lastName),
        completedAt: client.firstName && client.lastName ? client.createdAt?.toISOString() : undefined
      },
      { 
        name: 'Service Type', 
        completed: !!client.serviceType,
        completedAt: client.serviceType ? client.updatedAt?.toISOString() : undefined
      },
      { 
        name: 'Onboarded Date', 
        completed: !!(client.onboardedDate || client.createdAt),
        completedAt: (client.onboardedDate || client.createdAt)?.toISOString()
      },
      { 
        name: 'Reverse Recruiter', 
        completed: !!client.reverseRecruiterId,
        completedAt: client.reverseRecruiterId ? client.updatedAt?.toISOString() : undefined
      },
      { 
        name: 'WhatsApp Group Created', 
        completed: !!client.whatsappGroupCreated,
        completedAt: client.whatsappGroupCreatedAt?.toISOString()
      },
      { 
        name: 'Job Search Strategy', 
        completed: !!client.jobSearchStrategyDocId,
        completedAt: client.jobSearchStrategyDocId ? client.updatedAt?.toISOString() : undefined
      },
      { 
        name: 'Gmail ID Creation', 
        completed: !!client.gmailCreated,
        completedAt: client.gmailCreatedAt?.toISOString()
      },
      { 
        name: 'Resume + Cover Letter', 
        completed: !!(client._count?.coverLetters && client._count.coverLetters > 0),
        completedAt: client._count?.coverLetters && client._count.coverLetters > 0 ? client.updatedAt?.toISOString() : undefined
      },
      { 
        name: 'LinkedIn Optimized', 
        completed: !!client.linkedInOptimized,
        completedAt: client.linkedInOptimizedAt?.toISOString()
      },
      { 
        name: 'Job Search Initiated', 
        completed: !!client.jobSearchInitiated,
        completedAt: client.jobSearchInitiatedAt?.toISOString()
      },
    ]

    const completedSteps = steps.filter(s => s.completed).length
    const totalSteps = steps.length
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100)

    const response = NextResponse.json({
      clientId: id,
      steps,
      completedSteps,
      totalSteps,
      progressPercentage,
      isReady: client.jobSearchInitiated,
    }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch preparation status'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

