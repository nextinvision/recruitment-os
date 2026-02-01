import { JobSource, ScrapedJob } from '../shared/types'
import { DOMExtractor } from './dom-extractor'
import { JobDetector } from './job-detector'
import { validateJob } from '../shared/validation'

export class JobScraper {
  private source: JobSource
  private extractor: DOMExtractor

  constructor(source: JobSource) {
    this.source = source
    this.extractor = new DOMExtractor(source)
  }

  private createScrapedJob(job: Partial<ScrapedJob>, index: number): ScrapedJob {
    const validation = validateJob(job as any)
    
    return {
      id: `job-${Date.now()}-${index}`,
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      description: job.description || '',
      source: this.source,
      isValid: validation.isValid,
      errors: validation.errors,
    }
  }

  scrapeVisibleJobs(): ScrapedJob[] {
    const pageInfo = JobDetector.getPageInfo()
    
    // If on detail page, extract single job
    if (pageInfo.isJobPage) {
      const isDetailPage = 
        (this.source === 'linkedin' && window.location.pathname.includes('/jobs/view/')) ||
        (this.source === 'indeed' && window.location.pathname.startsWith('/viewjob')) ||
        (this.source === 'naukri' && window.location.pathname.includes('/job-details/'))

      if (isDetailPage) {
        const job = this.extractor.extractJobFromDetailPage()
        if (job) {
          return [this.createScrapedJob(job, 0)]
        }
      }
    }

    // Extract all visible jobs from listing page
    const jobs = this.extractor.extractAllVisibleJobs()
    return jobs.map((job, index) => this.createScrapedJob(job, index))
  }

  scrapeCurrentPage(): ScrapedJob[] {
    return this.scrapeVisibleJobs()
  }
}

