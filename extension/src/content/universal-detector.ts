/**
 * Universal Job Detector
 * Detects job listings on any website using intelligent heuristics
 */

export interface JobElement {
  element: Element
  title: string
  company: string
  location: string
  description: string
  confidence: number
}

export class UniversalJobDetector {
  /**
   * Detect if current page might contain job listings
   */
  static isLikelyJobPage(): boolean {
    const url = window.location.href.toLowerCase()
    const pathname = window.location.pathname.toLowerCase()
    const title = document.title.toLowerCase()
    const bodyText = document.body.textContent?.toLowerCase() || ''

    // URL patterns
    const jobUrlPatterns = [
      '/jobs', '/careers', '/opportunities', '/positions', '/openings',
      '/vacancies', '/hiring', '/recruitment', '/apply', '/job-',
    ]

    // Title patterns
    const jobTitlePatterns = [
      'job', 'career', 'hiring', 'position', 'opportunity', 'vacancy',
      'recruitment', 'apply now', 'we are hiring',
    ]

    // Body text patterns
    const jobBodyPatterns = [
      'apply now', 'full time', 'part time', 'remote', 'salary',
      'benefits', 'qualifications', 'requirements', 'job description',
    ]

    // Check URL
    const urlMatch = jobUrlPatterns.some(pattern =>
      url.includes(pattern) || pathname.includes(pattern)
    )

    // Check title
    const titleMatch = jobTitlePatterns.some(pattern => title.includes(pattern))

    // Check body text (at least 2 matches)
    const bodyMatches = jobBodyPatterns.filter(pattern =>
      bodyText.includes(pattern)
    ).length

    // Check for common job-related elements
    const hasJobElements = this.hasJobLikeElements()

    return urlMatch || titleMatch || bodyMatches >= 2 || hasJobElements
  }

  /**
   * Check if page has elements that look like job listings
   */
  private static hasJobLikeElements(): boolean {
    // Look for common job listing patterns
    const selectors = [
      '[class*="job"]',
      '[class*="career"]',
      '[class*="position"]',
      '[id*="job"]',
      '[id*="career"]',
      '[data-job]',
      '[data-position]',
    ]

    let count = 0
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          count += elements.length
        }
      } catch (e) {
        // Invalid selector, skip
      }
    })

    return count >= 3 // At least 3 job-like elements
  }

  /**
   * Find all potential job elements on the page
   */
  static findJobElements(): JobElement[] {
    const candidates: JobElement[] = []

    // Strategy 1: Look for structured job cards (common patterns)
    const cardSelectors = [
      '[class*="job-card"]',
      '[class*="job-item"]',
      '[class*="job-listing"]',
      '[class*="position-card"]',
      '[class*="career-item"]',
      '[data-job-id]',
      '[data-position-id]',
      'article[class*="job"]',
      'div[class*="job"]',
    ]

    cardSelectors.forEach(selector => {
      try {
        const cards = document.querySelectorAll(selector)
        cards.forEach(card => {
          const job = this.extractFromCard(card)
          if (job && job.confidence > 0.5) {
            candidates.push(job)
          }
        })
      } catch (e) {
        // Invalid selector
      }
    })

    // Strategy 2: Look for list items that might be jobs
    if (candidates.length === 0) {
      const listItems = document.querySelectorAll('li, div[role="listitem"]')
      listItems.forEach(item => {
        const job = this.extractFromCard(item)
        if (job && job.confidence > 0.6) {
          candidates.push(job)
        }
      })
    }

    // Strategy 3: Look for article or section elements
    if (candidates.length === 0) {
      const articles = document.querySelectorAll('article, section')
      articles.forEach(article => {
        const job = this.extractFromCard(article)
        if (job && job.confidence > 0.5) {
          candidates.push(job)
        }
      })
    }

    // Strategy 4: Structural Pattern Detection (IDS Logic Fallback)
    if (candidates.length === 0) {
      const patternJobs = this.findPatternClusters()
      patternJobs.forEach(job => {
        candidates.push(job)
      })
    }

    // Remove duplicates (same element)
    const unique = new Map<Element, JobElement>()
    candidates.forEach(job => {
      if (!unique.has(job.element) || unique.get(job.element)!.confidence < job.confidence) {
        unique.set(job.element, job)
      }
    })

    return Array.from(unique.values())
  }

  /**
   * Extract job data from a DOM element using heuristics
   */
  private static extractFromCard(element: Element): JobElement | null {
    const text = element.textContent || ''
    const innerHTML = element.innerHTML.toLowerCase()

    // Skip if too small (likely not a job card)
    if (text.length < 50) {
      return null
    }

    // Look for title (usually in heading or strong/bold)
    const title = this.findTitle(element)
    if (!title || title.length < 3) {
      return null
    }

    // Look for company name
    const company = this.findCompany(element)

    // Look for location
    const location = this.findLocation(element)

    // Look for description
    const description = this.findDescription(element, text)

    // Calculate confidence based on what we found
    let confidence = 0.3 // Base confidence
    if (title) confidence += 0.3
    if (company) confidence += 0.2
    if (location) confidence += 0.1
    if (description && description.length > 100) confidence += 0.1

    // Boost confidence if element has job-related classes/attributes
    if (this.hasJobAttributes(element)) {
      confidence += 0.2
    }

    return {
      element,
      title: title || 'Untitled Position',
      company: company || 'Company Not Specified',
      location: location || 'Location Not Specified',
      description: description || text.substring(0, 500),
      confidence: Math.min(confidence, 1.0),
    }
  }

  /**
   * Pattern-based Detection (IDS Logic)
   * Finds repeating clusters of DOM elements even if they lack job-related keywords
   */
  static findPatternClusters(): JobElement[] {
    const body = document.body;
    const allElements = body.querySelectorAll('*');
    const clusterMap = new Map<string, Element[]>();

    // 1. Generate structural fingerprints for all elements
    allElements.forEach(el => {
      // Skip very small or hidden elements
      if (el.textContent && el.textContent.length < 20) return;
      if (el.children.length < 2) return; // Must have sub-structure

      const fingerprint = this.generateFingerprint(el);
      if (!clusterMap.has(fingerprint)) {
        clusterMap.set(fingerprint, []);
      }
      clusterMap.get(fingerprint)!.push(el);
    });

    const candidates: JobElement[] = [];

    // 2. Analyze clusters with high repetition (>= 3)
    clusterMap.forEach((elements, fingerprint) => {
      if (elements.length >= 3) {
        // This is a repeating pattern!
        elements.forEach(el => {
          const job = this.extractFromPattern(el);
          if (job) {
            candidates.push(job);
          }
        });
      }
    });

    return candidates;
  }

  /**
   * Generate a structural fingerprint for an element
   */
  private static generateFingerprint(el: Element): string {
    const childTags = Array.from(el.children)
      .map(c => c.tagName.toLowerCase())
      .join('>');

    // Combine tag sequence with class count for a unique but flexible fingerprint
    return `${el.tagName.toLowerCase()}[${childTags}](${el.className.split(' ').length})`;
  }

  /**
   * Extract data from a pattern-detected element
   */
  private static extractFromPattern(el: Element): JobElement | null {
    const title = this.findTitle(el);
    if (!title) return null;

    const company = this.findCompany(el);
    const location = this.findLocation(el);
    const description = this.findDescription(el, el.textContent || '');

    return {
      element: el,
      title,
      company,
      location,
      description,
      confidence: 0.5 // Base confidence for pattern matches
    };
  }

  /**
   * Find job title in element
   */
  private static findTitle(element: Element): string {
    // Try headings first
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
    for (const heading of headings) {
      const text = heading.textContent?.trim() || ''
      if (text.length > 5 && text.length < 200) {
        return text
      }
    }

    // Try strong/bold text
    const strong = element.querySelector('strong, b, [class*="title"], [class*="name"]')
    if (strong) {
      const text = strong.textContent?.trim() || ''
      if (text.length > 5 && text.length < 200) {
        return text
      }
    }

    // Try first line of text
    const text = element.textContent?.trim() || ''
    const firstLine = text.split('\n')[0]?.trim() || ''
    if (firstLine.length > 5 && firstLine.length < 200) {
      return firstLine
    }

    return ''
  }

  /**
   * Find company name in element
   */
  private static findCompany(element: Element): string {
    // Look for company-related classes/attributes
    const companySelectors = [
      '[class*="company"]',
      '[class*="employer"]',
      '[class*="organization"]',
      '[data-company]',
      '[data-employer]',
    ]

    for (const selector of companySelectors) {
      try {
        const el = element.querySelector(selector)
        if (el) {
          const text = el.textContent?.trim() || ''
          if (text.length > 1 && text.length < 100) {
            return text
          }
        }
      } catch (e) {
        // Invalid selector
      }
    }

    // Look for links that might be company names
    const links = element.querySelectorAll('a')
    for (const link of links) {
      const text = link.textContent?.trim() || ''
      const href = link.getAttribute('href') || ''
      // If link text looks like a company name and href doesn't look like a job URL
      if (text.length > 2 && text.length < 50 &&
        !href.includes('/job') && !href.includes('/apply')) {
        return text
      }
    }

    return ''
  }

  /**
   * Find location in element
   */
  private static findLocation(element: Element): string {
    // Look for location-related classes
    const locationSelectors = [
      '[class*="location"]',
      '[class*="city"]',
      '[class*="address"]',
      '[data-location]',
      '[data-city]',
    ]

    for (const selector of locationSelectors) {
      try {
        const el = element.querySelector(selector)
        if (el) {
          const text = el.textContent?.trim() || ''
          if (text.length > 1 && text.length < 100) {
            return text
          }
        }
      } catch (e) {
        // Invalid selector
      }
    }

    // Look for common location patterns in text
    const text = element.textContent || ''
    const locationPatterns = [
      /(Remote|Hybrid|On-site|Onsite)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/, // City, State
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/, // City Name
    ]

    for (const pattern of locationPatterns) {
      const match = text.match(pattern)
      if (match && match[0]) {
        return match[0].trim()
      }
    }

    return ''
  }

  /**
   * Find description in element
   */
  private static findDescription(element: Element, fullText: string): string {
    // Look for description-related classes
    const descSelectors = [
      '[class*="description"]',
      '[class*="summary"]',
      '[class*="details"]',
      '[class*="content"]',
    ]

    for (const selector of descSelectors) {
      try {
        const el = element.querySelector(selector)
        if (el) {
          const text = el.textContent?.trim() || ''
          if (text.length > 50) {
            return text.substring(0, 2000) // Limit description length
          }
        }
      } catch (e) {
        // Invalid selector
      }
    }

    // Use full text as fallback (limited)
    return fullText.substring(0, 2000)
  }

  /**
   * Check if element has job-related attributes
   */
  private static hasJobAttributes(element: Element): boolean {
    const className = element.className?.toLowerCase() || ''
    const id = element.id?.toLowerCase() || ''
    const dataAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => attr.value.toLowerCase())

    const jobKeywords = ['job', 'career', 'position', 'opening', 'vacancy', 'hiring']

    const allText = `${className} ${id} ${dataAttrs.join(' ')}`

    return jobKeywords.some(keyword => allText.includes(keyword))
  }
}

