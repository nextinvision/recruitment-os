/**
 * Unit tests for job scraper
 * Run with: npm test
 */

import { JobScraper } from '../../src/content/job-scraper'
import { JobSource } from '../../src/shared/types'

// Mock DOM
function createMockDOM() {
  document.body.innerHTML = `
    <div data-job-id="1">
      <a class="job-title">Software Engineer</a>
      <a class="company">Tech Corp</a>
      <span class="location">Remote</span>
      <div class="description">Job description here</div>
    </div>
    <div data-job-id="2">
      <a class="job-title">Frontend Developer</a>
      <a class="company">Startup Inc</a>
      <span class="location">San Francisco</span>
      <div class="description">React developer needed</div>
    </div>
  `
}

describe('JobScraper', () => {
  beforeEach(() => {
    createMockDOM()
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://www.linkedin.com/jobs/',
        pathname: '/jobs/'
      },
      writable: true
    })
  })

  test('should create scraper instance', () => {
    const scraper = new JobScraper('linkedin')
    expect(scraper).toBeDefined()
  })

  test('should scrape visible jobs', () => {
    const scraper = new JobScraper('linkedin')
    const jobs = scraper.scrapeVisibleJobs()
    
    expect(jobs.length).toBeGreaterThan(0)
    expect(jobs[0]).toHaveProperty('title')
    expect(jobs[0]).toHaveProperty('company')
    expect(jobs[0]).toHaveProperty('source', 'linkedin')
  })

  test('should validate scraped jobs', () => {
    const scraper = new JobScraper('linkedin')
    const jobs = scraper.scrapeVisibleJobs()
    
    jobs.forEach(job => {
      expect(job).toHaveProperty('isValid')
      expect(job).toHaveProperty('errors')
      expect(Array.isArray(job.errors)).toBe(true)
    })
  })
})

