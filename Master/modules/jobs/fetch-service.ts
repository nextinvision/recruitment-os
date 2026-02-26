/**
 * Job Fetching Service
 * Fetches jobs from various APIs (Google, Adzuna, Jooble, etc.)
 * and stores them in the database
 */

import { db } from '@/lib/db'
import { JobSource, JobStatus } from '@prisma/client'
import { createJob } from './service'

interface JobFetchOptions {
  query?: string
  location?: string
  source: 'GOOGLE' | 'ADZUNA' | 'JOOBLE' | 'INDEED_RSS' | 'GOOGLE_STRUCTURED' | 'JOBSPY'
  limit?: number
  recruiterId?: string
  /** JobSpy: sites to scrape (e.g. indeed, linkedin, naukri). Default: indeed */
  sites?: string[]
  /** JobSpy: country code (e.g. usa, india, uk). Default: usa */
  country?: string
}

interface FetchedJob {
  title: string
  company: string
  location: string
  description: string
  source: JobSource
  sourceUrl?: string
  skills?: string[]
  experienceRequired?: string
  salaryRange?: string
  /** Extra details stored in DB notes (e.g. job_type, company_industry, date_posted) */
  notes?: string
}

export class JobFetchService {
  /**
   * Fetch jobs from Google Custom Search API
   * Supports pagination to fetch more than 10 results
   */
  async fetchFromGoogle(options: JobFetchOptions): Promise<FetchedJob[]> {
    const { query = 'software engineer', location = '', limit = 50 } = options
    
    const googleApiKey = process.env.GOOGLE_API_KEY
    const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
    
    if (!googleApiKey || !googleSearchEngineId) {
      throw new Error('Google API credentials not configured. Please add GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID to .env')
    }
    
    // Build search query - optimize for job searches
    const searchQuery = location 
      ? `${query} jobs ${location} site:linkedin.com/jobs OR site:indeed.com/jobs OR site:glassdoor.com/Job OR site:monster.com/jobs OR site:ziprecruiter.com/jobs`
      : `${query} jobs site:linkedin.com/jobs OR site:indeed.com/jobs OR site:glassdoor.com/Job OR site:monster.com/jobs OR site:ziprecruiter.com/jobs`
    
    const allJobs: FetchedJob[] = []
    const maxResultsPerPage = 10 // Google API limit
    const totalPages = Math.ceil(limit / maxResultsPerPage)
    
    try {
      // Fetch multiple pages to get more results
      for (let page = 1; page <= totalPages && allJobs.length < limit; page++) {
        const startIndex = (page - 1) * maxResultsPerPage + 1
        const numResults = Math.min(maxResultsPerPage, limit - allJobs.length)
        
        const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(searchQuery)}&num=${numResults}&start=${startIndex}`
        
        const response = await fetch(url)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (errorData.error?.code === 429) {
            throw new Error('Google API rate limit exceeded. Please wait before trying again.')
          }
          throw new Error(`Google API error: ${response.statusText} - ${errorData.error?.message || ''}`)
        }
        
        const data = await response.json()
        
        if (!data.items || data.items.length === 0) {
          break // No more results
        }
        
        const jobs = data.items.map((item: any) => ({
          title: this.extractTitle(item.title),
          company: this.extractCompany(item.title, item.displayLink),
          location: location || this.extractLocation(item.snippet),
          description: item.snippet || item.htmlSnippet || '',
          source: this.detectJobSource(item.link),
          sourceUrl: item.link,
          skills: this.extractSkills(item.snippet || item.htmlSnippet || ''),
        }))
        
        allJobs.push(...jobs)
        
        // If we got fewer results than requested, we've reached the end
        if (data.items.length < numResults) {
          break
        }
      }
      
      return allJobs.slice(0, limit)
    } catch (error) {
      console.error('Error fetching from Google:', error)
      throw error
    }
  }
  
  /**
   * Detect job source from URL
   */
  private detectJobSource(url: string): JobSource {
    const lowerUrl = url.toLowerCase()
    
    if (lowerUrl.includes('linkedin.com')) {
      return JobSource.LINKEDIN
    } else if (lowerUrl.includes('indeed.com')) {
      return JobSource.INDEED
    } else if (lowerUrl.includes('naukri.com')) {
      return JobSource.NAUKRI
    } else {
      return JobSource.OTHER
    }
  }
  
  /**
   * Normalize user location to Adzuna country code for API path.
   * Adzuna uses country codes in path: gb, us, in, au, etc.
   */
  private normalizeAdzunaCountry(location?: string): string {
    if (!location || !location.trim()) return 'in'
    const loc = location.trim().toLowerCase()
    if (loc === 'us' || loc === 'usa' || loc === 'united states') return 'us'
    if (loc === 'gb' || loc === 'uk' || loc === 'united kingdom') return 'gb'
    if (loc === 'in' || loc === 'india') return 'in'
    if (loc === 'au' || loc === 'australia') return 'au'
    if (loc === 'de' || loc === 'germany') return 'de'
    if (loc === 'br' || loc === 'brazil') return 'br'
    if (loc === 'fr' || loc === 'france') return 'fr'
    return 'in' // Default to India for unspecified or city names
  }

  /**
   * Fetch jobs from Adzuna API
   */
  async fetchFromAdzuna(options: JobFetchOptions): Promise<FetchedJob[]> {
    const { query = 'software engineer', location, limit = 50 } = options
    const country = this.normalizeAdzunaCountry(location)
    const whereParam = (location?.trim() || country) // "where" can be country or city

    const appId = process.env.ADZUNA_APP_ID || process.env.ADZUNA_APP_KEY
    const appKey = process.env.ADZUNA_APP_KEY

    if (!appKey) {
      throw new Error('Adzuna API credentials not configured. Add ADZUNA_APP_KEY (and ADZUNA_APP_ID) to .env')
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId || appKey}&app_key=${appKey}&results_per_page=${Math.min(limit, 50)}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(whereParam)}&content-type=application/json`
    
    try {
      const response = await fetch(url)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const errMsg = (data as { error?: string })?.error || response.statusText
        throw new Error(`Adzuna API error: ${errMsg}`)
      }
      
      if (!data.results || data.results.length === 0) {
        return []
      }
      
      return data.results.map((job: any) => ({
        title: job.title || '',
        company: job.company?.display_name || job.company?.name || 'Unknown',
        location: job.location?.display_name || job.location?.area?.join(', ') || '',
        description: job.description || '',
        source: JobSource.OTHER, // Will be mapped to ADZUNA if needed
        sourceUrl: job.redirect_url || job.url,
        skills: this.extractSkills(job.description),
        experienceRequired: job.category?.label,
        salaryRange: job.salary_min && job.salary_max 
          ? `${job.salary_min}-${job.salary_max} ${job.salary_is_predicted ? '(estimated)' : ''}`
          : undefined,
      }))
    } catch (error) {
      console.error('Error fetching from Adzuna:', error)
      throw error
    }
  }
  
  /**
   * Fetch jobs from Jooble API
   */
  async fetchFromJooble(options: JobFetchOptions): Promise<FetchedJob[]> {
    const { query = 'software engineer', location = '', limit = 50 } = options
    
    const apiKey = process.env.JOOBLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Jooble API credentials not configured')
    }
    
    const url = 'https://jooble.org/api/' + apiKey
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: query,
          location: location,
          radius: 25,
          page: 1,
          searchMode: 1,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Jooble API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.jobs || data.jobs.length === 0) {
        return []
      }
      
      return data.jobs.slice(0, limit).map((job: any) => ({
        title: job.title || '',
        company: job.company || 'Unknown',
        location: job.location || '',
        description: job.snippet || '',
        source: JobSource.OTHER,
        sourceUrl: job.link,
        skills: this.extractSkills(job.snippet),
        salaryRange: job.salary,
      }))
    } catch (error) {
      console.error('Error fetching from Jooble:', error)
      throw error
    }
  }
  
  /**
   * Fetch jobs from JobSpy scraper API (FastAPI service).
   * Maps scraped records to FetchedJob and maps site to JobSource (LINKEDIN, INDEED, NAUKRI, OTHER).
   * All scraped details are preserved: skills, experience_range, salary, and extra fields in notes.
   */
  async fetchFromJobSpy(options: JobFetchOptions): Promise<FetchedJob[]> {
    const {
      query = 'software engineer',
      location,
      limit = 50,
      sites,
      country = 'india',
    } = options

    const baseUrl = process.env.JOBSPY_API_URL || 'http://127.0.0.1:8000'
    const url = `${baseUrl.replace(/\/$/, '')}/scrape`

    // Cap per request so scrape finishes before typical 60s gateway timeout (each site runs in parallel)
    const resultsWanted = Math.min(limit, 25)
    const body = {
      search_term: query,
      location: location || undefined,
      country: country.toLowerCase(),
      results_wanted: resultsWanted,
      sites: sites && sites.length > 0 ? sites : ['indeed', 'linkedin', 'naukri'],
      hours_old: undefined as number | undefined,
      verbose: 0,
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000) // 2 min for scraper

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`JobSpy API error: ${response.status} - ${errText}`)
      }

      const data = await response.json() as { jobs?: Record<string, unknown>[]; count?: number }
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : []

      return rawJobs.map((row: Record<string, unknown>) => this.mapJobSpyRowToFetchedJob(row))
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error) {
        if (err.name === 'AbortError') throw new Error('JobSpy scraper timed out (2 min)')
        throw err
      }
      throw err
    }
  }

  /**
   * Map a single JobSpy API record to FetchedJob. Preserves all details; extra fields go into notes.
   */
  private mapJobSpyRowToFetchedJob(row: Record<string, unknown>): FetchedJob {
    const site = (typeof row.site === 'string' ? row.site : '')?.toLowerCase() || 'other'
    const source = this.mapJobSpySiteToJobSource(site)

    const title = String(row.title ?? '').trim() || 'Untitled'
    const company = String(row.company ?? '').trim() || 'Unknown'
    const location = String(row.location ?? '').trim() || 'Not specified'
    const description = String(row.description ?? '').trim() || 'No description provided.'
    const jobUrl = row.job_url_direct || row.job_url
    const sourceUrl = typeof jobUrl === 'string' ? jobUrl : ''

    let skills: string[] = []
    if (typeof row.skills === 'string' && row.skills.trim()) {
      skills = row.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    } else if (Array.isArray(row.skills)) {
      skills = (row.skills as unknown[]).map(s => String(s)).filter(Boolean)
    }

    const experienceRequired = typeof row.experience_range === 'string' ? row.experience_range : undefined

    let salaryRange: string | undefined
    const min = row.min_amount != null && row.min_amount !== ''
    const max = row.max_amount != null && row.max_amount !== ''
    const currency = (row.currency as string) || 'USD'
    if (min && max) {
      salaryRange = `${currency} ${row.min_amount} - ${row.max_amount}`
    } else if (min) {
      salaryRange = `${currency} ${row.min_amount}+`
    } else if (typeof row.compensation === 'string' && row.compensation) {
      salaryRange = row.compensation as string
    }

    const extra: Record<string, unknown> = {}
    if (row.job_type) extra.job_type = row.job_type
    if (row.date_posted) extra.date_posted = row.date_posted
    if (row.is_remote != null) extra.is_remote = row.is_remote
    if (row.job_level) extra.job_level = row.job_level
    if (row.company_industry) extra.company_industry = row.company_industry
    if (row.company_url) extra.company_url = row.company_url
    if (row.company_rating != null) extra.company_rating = row.company_rating
    if (row.interval) extra.salary_interval = row.interval
    if (row.listing_type) extra.listing_type = row.listing_type
    const notes = Object.keys(extra).length > 0 ? JSON.stringify(extra, null, 0) : undefined

    return {
      title,
      company,
      location,
      description,
      source,
      sourceUrl: sourceUrl || undefined,
      skills: skills.length > 0 ? skills : undefined,
      experienceRequired,
      salaryRange,
      notes,
    }
  }

  private mapJobSpySiteToJobSource(site: string): JobSource {
    switch (site) {
      case 'linkedin':
        return JobSource.LINKEDIN
      case 'indeed':
        return JobSource.INDEED
      case 'naukri':
        return JobSource.NAUKRI
      default:
        return JobSource.OTHER
    }
  }

  /**
   * Fetch jobs from Indeed RSS feed
   */
  async fetchFromIndeedRSS(options: JobFetchOptions): Promise<FetchedJob[]> {
    const { query = 'software engineer', location = '', limit = 25 } = options
    
    const rssUrl = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&limit=${limit}`
    
    try {
      const response = await fetch(rssUrl)
      if (!response.ok) {
        throw new Error(`Indeed RSS error: ${response.statusText}`)
      }
      
      const xml = await response.text()
      
      // Parse RSS XML (simplified - use proper XML parser in production)
      const jobs: FetchedJob[] = []
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      const matches = xml.match(itemRegex)
      
      if (matches) {
        for (const match of matches.slice(0, limit)) {
          const titleMatch = match.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)
          const linkMatch = match.match(/<link>(.*?)<\/link>/)
          const descriptionMatch = match.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)
          
          if (titleMatch && linkMatch) {
            const title = titleMatch[1]
            const parts = title.split(' - ')
            
            jobs.push({
              title: parts[0] || title,
              company: parts[1] || 'Unknown',
              location: parts[2] || location,
              description: descriptionMatch ? descriptionMatch[1] : '',
              source: JobSource.INDEED,
              sourceUrl: linkMatch[1],
              skills: this.extractSkills(descriptionMatch ? descriptionMatch[1] : ''),
            })
          }
        }
      }
      
      return jobs
    } catch (error) {
      console.error('Error fetching from Indeed RSS:', error)
      throw error
    }
  }
  
  /**
   * Fetch jobs from multiple sources and merge results
   * Note: This method is kept for backward compatibility but the API route now handles parallel fetching
   */
  async fetchAll(options: JobFetchOptions): Promise<FetchedJob[]> {
    const sources = options.source === 'GOOGLE' 
      ? ['GOOGLE'] 
      : options.source === 'ADZUNA'
      ? ['ADZUNA']
      : options.source === 'JOOBLE'
      ? ['JOOBLE']
      : ['GOOGLE', 'ADZUNA', 'JOOBLE'] // Fetch from all if not specified
    
    const allJobs: FetchedJob[] = []
    
    for (const source of sources) {
      try {
        let jobs: FetchedJob[] = []
        
        switch (source) {
          case 'GOOGLE':
            jobs = await this.fetchFromGoogle({ ...options, source: 'GOOGLE' })
            break
          case 'ADZUNA':
            jobs = await this.fetchFromAdzuna({ ...options, source: 'ADZUNA' })
            break
          case 'JOOBLE':
            jobs = await this.fetchFromJooble({ ...options, source: 'JOOBLE' })
            break
        }
        
        // Map source to JobSource enum
        jobs = jobs.map(job => ({
          ...job,
          source: this.mapSourceToJobSource(source),
        }))
        
        allJobs.push(...jobs)
      } catch (error) {
        console.error(`Error fetching from ${source}:`, error)
        // Continue with other sources even if one fails
      }
    }
    
    // Deduplicate jobs based on title, company, and location
    return this.deduplicateJobs(allJobs)
  }
  
  /**
   * Store fetched jobs in database
   */
  async storeJobs(jobs: FetchedJob[], recruiterId: string): Promise<number> {
    let storedCount = 0
    
    for (const job of jobs) {
      try {
        // Check if job already exists
        const existing = await db.job.findFirst({
          where: {
            title: job.title,
            company: job.company,
            location: job.location,
            source: job.source,
          },
        })
        
        if (existing) {
          continue // Skip duplicates
        }
        
        // Create job (all details: skills, experience, salary, notes from scraper)
        await createJob({
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          source: job.source,
          sourceUrl: job.sourceUrl,
          skills: job.skills || [],
          experienceRequired: job.experienceRequired,
          salaryRange: job.salaryRange,
          notes: job.notes ?? undefined,
          recruiterId,
          status: JobStatus.ACTIVE,
        })
        
        storedCount++
      } catch (error) {
        console.error('Error storing job:', error)
        // Continue with next job
      }
    }
    
    return storedCount
  }
  
  // Helper methods
  
  private extractTitle(title: string): string {
    // Remove common prefixes like "Job: ", "Hiring: ", etc.
    return title
      .replace(/^(Job|Hiring|Position):\s*/i, '')
      .replace(/\s*-\s*.*$/, '') // Remove trailing company/location
      .trim()
  }
  
  private extractCompany(title: string, displayLink?: string): string {
    // Try to extract company from title (format: "Title - Company - Location")
    const parts = title.split(' - ')
    if (parts.length >= 2) {
      return parts[parts.length - 2] || parts[parts.length - 1]
    }
    
    // Fallback to domain name
    if (displayLink) {
      return displayLink.replace(/^www\./, '').replace(/\.(com|org|net|io)$/, '')
    }
    
    return 'Unknown'
  }
  
  private extractLocation(snippet: string): string {
    // Try to extract location from snippet
    const locationPatterns = [
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /([A-Z][a-z]+,\s*[A-Z]{2})/,
      /([A-Z][a-z]+,\s*[A-Z][a-z]+)/,
    ]
    
    for (const pattern of locationPatterns) {
      const match = snippet.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return ''
  }
  
  private extractSkills(text: string): string[] {
    // Common tech skills to look for
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git',
      'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
      'Machine Learning', 'AI', 'Data Science',
    ]
    
    const foundSkills: string[] = []
    const lowerText = text.toLowerCase()
    
    for (const skill of commonSkills) {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill)
      }
    }
    
    return foundSkills
  }
  
  private mapSourceToJobSource(source: string): JobSource {
    switch (source) {
      case 'GOOGLE':
      case 'GOOGLE_STRUCTURED':
        return JobSource.OTHER // Add GOOGLE to enum if needed
      case 'ADZUNA':
        return JobSource.OTHER // Add ADZUNA to enum if needed
      case 'JOOBLE':
        return JobSource.OTHER // Add JOOBLE to enum if needed
      case 'INDEED_RSS':
        return JobSource.INDEED
      default:
        return JobSource.OTHER
    }
  }
  
  deduplicateJobs(jobs: FetchedJob[]): FetchedJob[] {
    const seen = new Set<string>()
    const unique: FetchedJob[] = []
    
    for (const job of jobs) {
      // Create a unique key from title, company, and location
      const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`
      
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(job)
      }
    }
    
    return unique
  }
}

