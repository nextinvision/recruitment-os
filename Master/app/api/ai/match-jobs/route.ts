import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * POST /api/ai/match-jobs
 *
 * Accepts resume_data (parsed by /api/ai/resume-upload) and matches it
 * against ACTIVE jobs in the PostgreSQL database using Gemini AI (via Python backend).
 *
 * Request body:
 *   {
 *     resume_data: { skills, experience_years, summary, education, raw_text },
 *     limit?: number   // how many DB jobs to send to AI (default 50)
 *   }
 *
 * Returns:
 *   { matches: [{ job_id, title, company, match_percentage, matching_skills, missing_skills, explanation }] }
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value
        ? `Bearer ${request.cookies.get('token')?.value}`
        : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const { resume_data, limit = 50 } = body

    if (!resume_data || !resume_data.skills) {
      const response = NextResponse.json(
        { error: 'resume_data with skills is required' },
        { status: 400 }
      )
      return addCorsHeaders(response, request.headers.get('origin'))
    }

    // -------------------------------------------------------------------------
    // Step 1: Convert candidate resume to vector embedding
    // -------------------------------------------------------------------------
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8080'
    const textToEmbed = `${resume_data.summary || ''} ${resume_data.skills.join(' ')}`.substring(0, 8000)

    const embedResponse = await fetch(`${pythonBackendUrl}/api/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToEmbed })
    })

    if (!embedResponse.ok) {
      const errText = await embedResponse.text().catch(() => 'Unknown error')
      const response = NextResponse.json({ error: `AI embedding failed: ${errText}` }, { status: 502 })
      return addCorsHeaders(response, request.headers.get('origin'))
    }

    const embedResult = await embedResponse.json()
    const candidateVector = embedResult.embedding
    const vectorStr = `[${candidateVector.join(',')}]`

    // -------------------------------------------------------------------------
    // Step 2: Pull top MATCHING active jobs from PostgreSQL via pgvector
    // -------------------------------------------------------------------------
    const fetchLimit = Math.min(limit, 50)  // cap at 50 to keep AI prompt manageable
    const dbJobs = await db.$queryRawUnsafe<any[]>(`
      SELECT id, title, company, location, description, skills, "salaryRange", "experienceRequired", "sourceUrl", source, status,
             1 - (embedding <=> $1::vector) AS math_similarity 
      FROM "jobs" 
      WHERE status = 'ACTIVE' AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector 
      LIMIT $2;
    `, vectorStr, fetchLimit)

    if (dbJobs.length === 0) {
      const response = NextResponse.json({
        success: true,
        matches: [],
        total_matched: 0,
        message: 'No active jobs in database. Use the Fetch Jobs tab to populate jobs first.',
        db_job_count: 0,
      })
      return addCorsHeaders(response, request.headers.get('origin'))
    }

    // -------------------------------------------------------------------------
    // Step 3: Forward resume_data + perfectly matched DB jobs to Python backend for Gemini scoring
    // -------------------------------------------------------------------------

    // Normalize jobs for Python backend (match the shape GeminiMatcher expects)
    const jobsForAI = dbJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.skills,   // GeminiMatcher looks for requirements or skills
      skills: job.skills,
      salaryRange: job.salaryRange || 'Not disclosed',
      experienceRequired: job.experienceRequired || '',
      sourceUrl: job.sourceUrl || '',
      source: job.source,
    }))

    const pythonResponse = await fetch(`${pythonBackendUrl}/api/match-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_data,
        jobs: jobsForAI,
      }),
    })

    if (!pythonResponse.ok) {
      const errText = await pythonResponse.text().catch(() => 'Unknown error')
      const response = NextResponse.json(
        { error: `AI matching failed: ${errText}` },
        { status: 502 }
      )
      return addCorsHeaders(response, request.headers.get('origin'))
    }

    const aiResult = await pythonResponse.json()

    // Enrich each match with the full DB job data (sourceUrl etc.)
    const jobMap = new Map(dbJobs.map((j) => [j.id, j]))
    const enrichedMatches = (aiResult.matches || []).map((match: any) => {
      const dbJob = jobMap.get(match.job_id || match.id)
      return {
        ...match,
        sourceUrl: dbJob?.sourceUrl || match.sourceUrl || '',
        source: dbJob?.source || '',
        location: dbJob?.location || match.location || '',
        salaryRange: dbJob?.salaryRange || match.salary || 'Not disclosed',
      }
    })

    const response = NextResponse.json({
      success: true,
      matches: enrichedMatches,
      total_matched: enrichedMatches.length,
      db_job_count: dbJobs.length,
    })
    return addCorsHeaders(response, request.headers.get('origin'))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to match jobs'
    const response = NextResponse.json({ error: message }, { status: 500 })
    return addCorsHeaders(response, request.headers.get('origin'))
  }
}
