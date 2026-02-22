import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { JobFetchService } from '@/modules/jobs/fetch-service'
import { z } from 'zod'

// Allow long-running scrape (gateway/proxy may still need higher timeout, e.g. nginx proxy_read_timeout 300)
export const maxDuration = 300

const fetchJobsSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  source: z.enum(['GOOGLE', 'ADZUNA', 'JOOBLE', 'INDEED_RSS', 'JOBSPY', 'ALL']).default('ALL'),
  limit: z.number().int().min(1).max(100).optional().default(50),
  /** JobSpy: sites to scrape (e.g. indeed, linkedin, naukri). Accepts array or comma-separated string. */
  sites: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((s) =>
      s == null ? undefined : Array.isArray(s) ? s : s.split(',').map((x) => x.trim()).filter(Boolean)
    ),
  /** JobSpy: country (e.g. usa, india, uk) */
  country: z.string().optional(),
})

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * POST /api/jobs/fetch
 * Fetch jobs from external APIs (Google, Adzuna, Jooble, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    // Only recruiters and above can fetch jobs
    if (authContext.role === 'RECRUITER' || authContext.role === 'MANAGER' || authContext.role === 'ADMIN') {
      const body = await request.json()
      const validated = fetchJobsSchema.parse(body)

      const fetchService = new JobFetchService()
      
      // Fetch jobs based on source
      let jobs: any[] = []
      
      if (validated.source === 'ALL') {
        // Fetch from all available sources in parallel (excluding JOBSPY to avoid long waits)
        const fetchPromises = []
        
        // Try Google
        try {
          fetchPromises.push(
            fetchService.fetchFromGoogle({
              query: validated.query,
              location: validated.location,
              limit: Math.floor(validated.limit / 3), // Distribute limit across sources
              source: 'GOOGLE',
            }).catch(err => {
              console.error('Google fetch error:', err)
              return []
            })
          )
        } catch (err) {
          console.error('Google fetch setup error:', err)
        }
        
        // Try Adzuna
        try {
          fetchPromises.push(
            fetchService.fetchFromAdzuna({
              query: validated.query,
              location: validated.location || 'us',
              limit: Math.floor(validated.limit / 3),
              source: 'ADZUNA',
            }).catch(err => {
              console.error('Adzuna fetch error:', err)
              return []
            })
          )
        } catch (err) {
          console.error('Adzuna fetch setup error:', err)
        }
        
        // Try Jooble
        try {
          fetchPromises.push(
            fetchService.fetchFromJooble({
              query: validated.query,
              location: validated.location,
              limit: Math.floor(validated.limit / 3),
              source: 'JOOBLE',
            }).catch(err => {
              console.error('Jooble fetch error:', err)
              return []
            })
          )
        } catch (err) {
          console.error('Jooble fetch setup error:', err)
        }
        
        // Wait for all fetches to complete
        const results = await Promise.all(fetchPromises)
        jobs = results.flat()
        
        // Deduplicate jobs using the service method
        const tempService = new JobFetchService()
        jobs = (tempService as any).deduplicateJobs(jobs)
      } else {
        // Fetch from single source
        try {
          switch (validated.source) {
            case 'GOOGLE':
              jobs = await fetchService.fetchFromGoogle({
                query: validated.query,
                location: validated.location,
                limit: validated.limit,
                source: 'GOOGLE',
              })
              break
            case 'ADZUNA':
              jobs = await fetchService.fetchFromAdzuna({
                query: validated.query,
                location: validated.location || 'us',
                limit: validated.limit,
                source: 'ADZUNA',
              })
              break
            case 'JOOBLE':
              jobs = await fetchService.fetchFromJooble({
                query: validated.query,
                location: validated.location,
                limit: validated.limit,
                source: 'JOOBLE',
              })
              break
            case 'INDEED_RSS':
              jobs = await fetchService.fetchFromIndeedRSS({
                query: validated.query,
                location: validated.location,
                limit: validated.limit,
                source: 'INDEED_RSS',
              })
              break
            case 'JOBSPY':
              jobs = await fetchService.fetchFromJobSpy({
                query: validated.query,
                location: validated.location,
                limit: validated.limit,
                source: 'JOBSPY',
                sites: validated.sites,
                country: validated.country,
              })
              break
            default:
              throw new Error(`Unsupported source: ${validated.source}`)
          }
        } catch (fetchError: any) {
          // Provide helpful error messages
          const errorMessage = fetchError?.message || 'Unknown error occurred'
          
          if (errorMessage.includes('Custom Search JSON API') || errorMessage.includes('does not have the access')) {
            throw new Error('Custom Search API is not enabled. Please enable it in Google Cloud Console: https://console.cloud.google.com/apis/library/customsearch.googleapis.com')
          } else if (errorMessage.includes('referer') || errorMessage.includes('blocked')) {
            throw new Error('API key restrictions are blocking requests. Please update API key restrictions in Google Cloud Console to allow server-side requests.')
          } else if (errorMessage.includes('API key')) {
            throw new Error('Google API key is invalid or not configured. Please check your GOOGLE_API_KEY in .env file.')
          } else {
            throw new Error(`Failed to fetch from ${validated.source}: ${errorMessage}`)
          }
        }
      }

      // Store jobs in database
      const storedCount = await fetchService.storeJobs(jobs, authContext.userId)

      const response = NextResponse.json({
        success: true,
        fetched: jobs.length,
        stored: storedCount,
        skipped: jobs.length - storedCount,
        jobs: jobs.slice(0, 10), // Return first 10 for preview
      }, { status: 200 })
      
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    } else {
      const response = NextResponse.json(
        { error: 'Unauthorized. Only recruiters can fetch jobs.' },
        { status: 403 }
      )
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }
  } catch (error) {
    console.error('Error fetching jobs:', error)
    
    let message = 'Failed to fetch jobs'
    let statusCode = 400
    
    if (error instanceof z.ZodError) {
      message = `Validation error: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      statusCode = 400
    } else if (error instanceof Error) {
      message = error.message
      // If it's an API configuration error, use 500 instead of 400
      if (message.includes('not enabled') || message.includes('API key') || message.includes('restrictions')) {
        statusCode = 500
      }
    }
    
    const response = NextResponse.json({ 
      error: message,
      details: error instanceof z.ZodError ? error.issues : undefined
    }, { status: statusCode })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

