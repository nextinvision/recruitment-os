/**
 * Universal DOM Extractor
 * Extracts job data from any website using intelligent heuristics
 */

import { JobInput } from '../shared/types'
import { UniversalJobDetector, JobElement } from './universal-detector'

export class UniversalExtractor {
  /**
   * Extract all jobs from current page
   */
  extractAllJobs(): Partial<JobInput>[] {
    const jobElements = UniversalJobDetector.findJobElements()

    return jobElements
      .filter(job => job.confidence > 0.4) // Filter low confidence
      .map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        source: 'other' as const, // Generic source for unknown websites
      }))
  }

  /**
   * Extract single job from a specific element
   */
  extractJobFromElement(element: Element): Partial<JobInput> | null {
    // Use the public findJobElements method and filter by element
    const jobElements = UniversalJobDetector.findJobElements()
    const jobElement = jobElements.find(job => job.element === element)

    if (!jobElement || jobElement.confidence < 0.4) {
      return null
    }

    return {
      title: jobElement.title,
      company: jobElement.company,
      location: jobElement.location,
      description: jobElement.description,
      source: 'other' as const,
    }
  }

  /**
   * Extract job from detail page (single job view)
   */
  extractJobFromDetailPage(): Partial<JobInput> | null {
    // Try to find main content area
    const mainSelectors = [
      'main',
      '[role="main"]',
      'article',
      '.content',
      '.main-content',
      '#content',
      '#main',
    ]

    for (const selector of mainSelectors) {
      try {
        const main = document.querySelector(selector)
        if (main) {
          const job = this.extractJobFromElement(main)
          if (job && job.title && job.title !== 'Untitled Position') {
            return job
          }
        }
      } catch (e) {
        // Invalid selector
      }
    }

    // Fallback: use entire body
    return this.extractJobFromElement(document.body)
  }

  /**
   * Attempt to find and click the "Next" button
   */
  async findAndClickNextPage(): Promise<boolean> {
    const nextButtonSelectors = [
      'a[aria-label*="Next"]',
      'button[aria-label*="Next"]',
      'a[class*="next"]',
      'button[class*="next"]',
      'a[id*="next"]',
      'button[id*="next"]',
      'li[class*="next"] a',
      'span:contains("Next")', // Note: contains is not a native CSS selector, handled below
    ]

    let foundButton: HTMLElement | null = null

    // 1. Check direct selectors
    for (const selector of nextButtonSelectors) {
      try {
        const el = document.querySelector(selector) as HTMLElement
        if (el && this.isElementVisible(el)) {
          foundButton = el
          break
        }
      } catch (e) { }
    }

    // 2. Search by text content
    if (!foundButton) {
      const allButtons = document.querySelectorAll('button, a, span, div[role="button"]')
      for (const btn of Array.from(allButtons)) {
        const text = btn.textContent?.trim().toLowerCase() || ''
        if ((text === 'next' || text === 'forward' || text === '>') && this.isElementVisible(btn as HTMLElement)) {
          foundButton = btn as HTMLElement
          break
        }
      }
    }

    if (foundButton) {
      console.log('[UniversalExtractor] Found next button, clicking...', foundButton)
      foundButton.click()
      // Wait for navigation/hydration
      await new Promise(resolve => setTimeout(resolve, 3000))
      return true
    }

    return false
  }

  private isElementVisible(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
  }
}

