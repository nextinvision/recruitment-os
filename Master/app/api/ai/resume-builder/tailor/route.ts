import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * POST /api/ai/resume-builder/tailor
 * Calls Python backend to generate AI tailoring suggestions for a resume against a job
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const { resume_data, job_id } = body

    if (!resume_data || !job_id) {
      const response = NextResponse.json(
        { error: 'resume_data and job_id are required' },
        { status: 400 }
      )
      return addCorsHeaders(response, request.headers.get('origin'))
    }

    const job = await db.job.findUnique({
      where: { id: job_id },
    })

    if (!job) {
      const response = NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
      return addCorsHeaders(response, request.headers.get('origin'))
    }

    const jobForAI = {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.skills,
      skills: job.skills,
    }

    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8080'
    const pythonResponse = await fetch(`${pythonBackendUrl}/api/tailor-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_data: mapResumeToTailorFormat(resume_data),
        job: jobForAI,
      }),
    })

    if (!pythonResponse.ok) {
      const errText = await pythonResponse.text().catch(() => 'Unknown error')
      const response = NextResponse.json(
        { error: `AI tailoring failed: ${errText}` },
        { status: 502 }
      )
      return addCorsHeaders(response, request.headers.get('origin'))
    }

    const result = await pythonResponse.json()
    const response = NextResponse.json(result, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to tailor resume'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

function mapResumeToTailorFormat(doc: Record<string, unknown>): Record<string, unknown> {
  const contact = (doc.contact as Record<string, string>) || {}
  const skills = (doc.skills as string[]) || []
  const experience = (doc.experience as Array<Record<string, unknown>>) || []
  const expYears = experience.length > 0 ? Math.min(experience.length * 2, 20) : 0
  return {
    name: contact.name || '',
    skills,
    summary: doc.profile || '',
    experience_years: expYears,
    education: ((doc.education as Array<{ degree?: string; institution?: string }>) || []).map(
      (e) => `${e.degree || ''} - ${e.institution || ''}`.trim()
    ),
    experience: experience.map((e) => ({
      company: e.company,
      role: e.role,
      dateRange: `${e.startDate || ''} – ${e.endDate || ''}`,
      bullets: e.bullets || [],
    })),
    raw_text: [doc.profile, skills.join(' ')].filter(Boolean).join(' ').slice(0, 3000),
  }
}
