import { JobDetector } from './job-detector'
import { JobScraper } from './job-scraper'

// Inject capture button into the page
function injectCaptureButton() {
  // Remove existing button if any
  const existing = document.getElementById('recruitment-os-capture-btn')
  if (existing) {
    existing.remove()
  }

  const pageInfo = JobDetector.getPageInfo()
  
  if (!pageInfo.platform || !pageInfo.isJobPage) {
    return
  }

  const button = document.createElement('button')
  button.id = 'recruitment-os-capture-btn'
  button.textContent = 'Capture Jobs'
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 24px;
    background: #0073b1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `

  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'Capturing...'

    try {
      const scraper = new JobScraper(pageInfo.platform!)
      const jobs = scraper.scrapeCurrentPage()

      if (jobs.length === 0) {
        alert('No jobs found on this page. Make sure you are on a job listing or detail page.')
        button.disabled = false
        button.textContent = 'Capture Jobs'
        return
      }

      // Send jobs to popup via message
      chrome.runtime.sendMessage({
        type: 'JOBS_CAPTURED',
        jobs,
        platform: pageInfo.platform,
      }, (response) => {
        if (response?.success) {
          button.textContent = `✓ Captured ${jobs.length} job(s)`
          setTimeout(() => {
            button.textContent = 'Capture Jobs'
            button.disabled = false
          }, 2000)
        } else {
          alert('Failed to capture jobs. Please try again.')
          button.disabled = false
          button.textContent = 'Capture Jobs'
        }
      })
    } catch (error) {
      console.error('Error capturing jobs:', error)
      alert('Error capturing jobs. Please check the console for details.')
      button.disabled = false
      button.textContent = 'Capture Jobs'
    }
  })

  document.body.appendChild(button)
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCaptureButton)
} else {
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

