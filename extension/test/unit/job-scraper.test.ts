/**
 * Unit tests for job scraper
 * Run with: npm test
 */

import { describe, beforeEach, test, expect } from 'vitest'
import { JobScraper } from '../../src/content/job-scraper'
import { JobSource } from '../../src/shared/types'

// Mock DOM
function createMockDOM() {
  document.body.innerHTML = `
    <div data-job-id="1">
      <a class="job-card-list__title">Software Engineer</a>
      <a class="job-card-container__company-name">Tech Corp</a>
      <span class="job-card-container__metadata-item">Remote</span>
      <div class="job-card-list__description">Job description here</div>
    </div>
    <div data-job-id="2">
      <a class="job-card-list__title">Frontend Developer</a>
      <a class="job-card-container__company-name">Startup Inc</a>
      <span class="job-card-container__metadata-item">San Francisco</span>
      <div class="job-card-list__description">React developer needed</div>
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
        pathname: '/jobs/',
        hostname: 'www.linkedin.com'
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

