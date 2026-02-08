import { JobDetector } from './job-detector'
import { JobScraper } from './job-scraper'
import { UniversalExtractor } from './universal-extractor'
import { UniversalJobDetector } from './universal-detector'
import { ScrapedJob } from '../shared/types'
import { validateJob } from '../shared/validation'

// Inject capture button into the page
function injectCaptureButton() {
  // Remove existing button if any
  const existing = document.getElementById('recruitment-os-capture-btn')
  if (existing) {
    existing.remove()
  }

  // Wait for body to be available
  if (!document.body) {
    console.log('[Recruitment OS] Waiting for body element...')
    setTimeout(injectCaptureButton, 100)
    return
  }

  const pageInfo = JobDetector.getPageInfo()
  const isKnownPlatform = pageInfo.platform && pageInfo.isJobPage
  const isLikelyJobPage = UniversalJobDetector.isLikelyJobPage()
  
  console.log('[Recruitment OS] Injecting capture button', {
    platform: pageInfo.platform,
    isJobPage: pageInfo.isJobPage,
    isKnownPlatform,
    isLikelyJobPage,
    url: window.location.href
  })

  const button = document.createElement('button')
  button.id = 'recruitment-os-capture-btn'
  button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 24px;
    background: ${isKnownPlatform ? '#0073b1' : '#28a745'};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `

  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'Capturing...'

    try {
      let jobs: ScrapedJob[] = []

      if (isKnownPlatform && pageInfo.platform) {
        // Use platform-specific scraper for known platforms
        const scraper = new JobScraper(pageInfo.platform)
        jobs = scraper.scrapeCurrentPage()
      } else {
        // Use universal scraper for unknown websites
        const universalExtractor = new UniversalExtractor()
        const extractedJobs = universalExtractor.extractAllJobs()

        // If no jobs found, try detail page extraction
        if (extractedJobs.length === 0) {
          const detailJob = universalExtractor.extractJobFromDetailPage()
          if (detailJob) {
            extractedJobs.push(detailJob)
          }
        }

        // Convert to ScrapedJob format with validation
        jobs = extractedJobs.map((job, index) => {
          const validation = validateJob(job as any)
          return {
            id: `job-${Date.now()}-${index}`,
            title: job.title || '',
            company: job.company || '',
            location: job.location || '',
            description: job.description || '',
            source: job.source || 'other',
            isValid: validation.isValid,
            errors: validation.errors,
          }
        })
      }

      if (jobs.length === 0) {
        alert('No jobs found on this page. Try:\n1. Navigate to a job listing page\n2. Use manual selection mode (coming soon)\n3. Check if the page structure is supported')
        button.disabled = false
        button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
        return
      }

      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        alert('Extension context invalidated. Please reload the page and try again.')
        button.disabled = false
        button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
        return
      }

      // Send jobs to service worker via message
      try {
        chrome.runtime.sendMessage({
          type: 'JOBS_CAPTURED',
          jobs,
          platform: pageInfo.platform || 'other',
        }, (response) => {
          // Check for extension context errors first
          if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message || ''
            console.error('Extension error:', chrome.runtime.lastError)
            
            // Handle specific "Extension context invalidated" error
            if (errorMessage.includes('Extension context invalidated') || 
                errorMessage.includes('message port closed') ||
                !chrome.runtime.id) {
              alert('Extension was reloaded. Please refresh this page and try again.')
              button.disabled = false
              button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
              return
            }
            
            // Other errors
            alert('Failed to send jobs to extension. Please try again.')
            button.disabled = false
            button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
            return
          }

          if (response?.success) {
            button.textContent = `✓ Captured ${jobs.length} job(s)`
            setTimeout(() => {
              button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
              button.disabled = false
            }, 2000)
          } else {
            alert('Failed to capture jobs. Please try again.')
            button.disabled = false
            button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
          }
        })
      } catch (error) {
        // Catch any runtime errors (e.g., context invalidated during execution)
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('Extension context invalidated') || !chrome.runtime?.id) {
          alert('Extension was reloaded. Please refresh this page and try again.')
        } else {
          alert(`Error sending jobs: ${errorMessage}`)
        }
        button.disabled = false
        button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
      }
    } catch (error) {
      console.error('Error capturing jobs:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check if it's a context invalidation error
      if (errorMessage.includes('Extension context invalidated') || 
          !chrome.runtime?.id) {
        alert('Extension was reloaded. Please refresh this page and try again.')
      } else {
        alert(`Error capturing jobs: ${errorMessage}\n\nCheck the console for details.`)
      }
      
      button.disabled = false
      button.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Jobs'
    }
  })

  try {
    document.body.appendChild(button)
    console.log('[Recruitment OS] Capture button injected successfully')
  } catch (error) {
    console.error('[Recruitment OS] Failed to inject button:', error)
    // Retry after a short delay
    setTimeout(() => {
      try {
        if (document.body) {
          document.body.appendChild(button)
          console.log('[Recruitment OS] Capture button injected on retry')
        }
      } catch (retryError) {
        console.error('[Recruitment OS] Failed to inject button on retry:', retryError)
      }
    }, 500)
  }
}

// Initialize when DOM is ready
console.log('[Recruitment OS] Content script loaded, readyState:', document.readyState)

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Recruitment OS] DOMContentLoaded fired')
    injectCaptureButton()
  })
} else {
  // DOM already loaded, inject immediately
  injectCaptureButton()
}

// Re-inject on navigation (for SPAs)
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(injectCaptureButton, 1000)
  }
}).observe(document, { subtree: true, childList: true })

