import { JobSource, JobInput } from '../shared/types'
import { LinkedInSelectors } from './selectors/linkedin'
import { IndeedSelectors } from './selectors/indeed'
import { NaukriSelectors } from './selectors/naukri'

export class DOMExtractor {
  private source: JobSource

  constructor(source: JobSource) {
    this.source = source
  }

  private getSelectors() {
    switch (this.source) {
      case 'linkedin':
        return LinkedInSelectors
      case 'indeed':
        return IndeedSelectors
      case 'naukri':
        return NaukriSelectors
    }
  }

  private getTextContent(selector: string, element: Element | Document = document): string {
    const el = element.querySelector(selector)
    return el?.textContent?.trim() || ''
  }

  private getAllTextContent(selector: string, element: Element | Document = document): string[] {
    const elements = element.querySelectorAll(selector)
    return Array.from(elements).map(el => el.textContent?.trim() || '').filter(Boolean)
  }

  extractJobFromCard(cardElement: Element): Partial<JobInput> | null {
    const selectors = this.getSelectors()
    
    let title = ''
    let company = ''
    let location = ''
    let description = ''

    // Try primary selectors first
    title = this.getTextContent(selectors.jobTitle, cardElement) ||
            this.getTextContent(selectors.altJobTitle, cardElement)
    
    company = this.getTextContent(selectors.jobCompany, cardElement) ||
              this.getTextContent(selectors.altJobCompany, cardElement)
    
    location = this.getTextContent(selectors.jobLocation, cardElement) ||
               this.getTextContent(selectors.altJobLocation, cardElement)
    
    description = this.getTextContent(selectors.jobDescription, cardElement)

    // If no title found, skip this card
    if (!title) {
      return null
    }

    return {
      title,
      company,
      location,
      description,
      source: this.source,
    }
  }

  extractJobFromDetailPage(): Partial<JobInput> | null {
    const selectors = this.getSelectors()
    
    const title = this.getTextContent(selectors.detailTitle) ||
                  this.getTextContent(selectors.altJobTitle)
    
    const company = this.getTextContent(selectors.detailCompany) ||
                    this.getTextContent(selectors.altJobCompany)
    
    const location = this.getTextContent(selectors.detailLocation) ||
                     this.getTextContent(selectors.altJobLocation)
    
    const description = this.getTextContent(selectors.detailDescription) ||
                        this.getAllTextContent('div.job-description').join('\n')

    if (!title) {
      return null
    }

    return {
      title,
      company,
      location,
      description,
      source: this.source,
    }
  }

  extractAllVisibleJobs(): Partial<JobInput>[] {
    const selectors = this.getSelectors()
    const jobs: Partial<JobInput>[] = []

    // Get all job cards
    const cards = document.querySelectorAll(selectors.jobCard) ||
                  document.querySelectorAll(selectors.altJobCard)

    cards.forEach(card => {
      const job = this.extractJobFromCard(card)
      if (job && job.title) {
        jobs.push(job)
      }
    })

    return jobs
  }
}

