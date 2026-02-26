import { JobDetector } from './job-detector'
import { JobScraper } from './job-scraper'
import { UniversalExtractor } from './universal-extractor'
import { UniversalJobDetector } from './universal-detector'
import { ScrapedJob } from '../shared/types'
import { validateJob } from '../shared/validation'

// Manual Selection Mode State
let isMappingMode = false
let currentMappingField: 'title' | 'company' | 'location' | 'description' | null = null
let mappingData: Partial<ScrapedJob> = {}

// Inject capture button into the page
function injectCaptureButton() {
  // Remove existing container if any
  const existing = document.getElementById('recruitment-os-container')
  if (existing) {
    existing.remove()
  }

  // Wait for body to be available
  if (!document.body) {
    setTimeout(injectCaptureButton, 100)
    return
  }

  const pageInfo = JobDetector.getPageInfo()
  const isKnownPlatform = pageInfo.platform && pageInfo.isJobPage

  const container = document.createElement('div')
  container.id = 'recruitment-os-container'
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: auto;
  `

  // Main Action Button (Automatic)
  const autoBtn = document.createElement('button')
  autoBtn.id = 'recruitment-os-capture-btn'
  autoBtn.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Page (AI)'
  autoBtn.style.cssText = `
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
    transition: all 0.2s;
  `

  // Manual Mapping Button
  const manualBtn = document.createElement('button')
  manualBtn.textContent = 'Manual Selection'
  manualBtn.style.cssText = `
    padding: 8px 16px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-family: sans-serif;
  `

  autoBtn.addEventListener('click', async () => {
    autoBtn.disabled = true
    autoBtn.textContent = 'Scanning...'

    try {
      let jobs: ScrapedJob[] = []

      if (isKnownPlatform && pageInfo.platform) {
        const scraper = new JobScraper(pageInfo.platform)
        jobs = scraper.scrapeCurrentPage()
      } else {
        const universalExtractor = new UniversalExtractor()
        let extractedJobs = universalExtractor.extractAllJobs()

        // Deep Scrape Fallback
        if (extractedJobs.length > 0 && extractedJobs.length < 5) {
          autoBtn.textContent = 'Deep Scrape...'
          const clicked = await universalExtractor.findAndClickNextPage()
          if (clicked) {
            const moreJobs = universalExtractor.extractAllJobs()
            extractedJobs = [...extractedJobs, ...moreJobs]
          }
        }

        if (extractedJobs.length === 0) {
          const detailJob = universalExtractor.extractJobFromDetailPage()
          if (detailJob) extractedJobs.push(detailJob)
        }

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
        alert('No jobs found. Try "Manual Selection" if the automatic scan missed them.')
        autoBtn.disabled = false
        autoBtn.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Page (AI)'
        return
      }

      sendJobsToExtension(jobs)
      autoBtn.textContent = `✓ Captured ${jobs.length}`
      setTimeout(() => {
        autoBtn.textContent = isKnownPlatform ? 'Capture Jobs' : 'Scrape Page (AI)'
        autoBtn.disabled = false
      }, 2000)
    } catch (error) {
      console.error('Scrape error:', error)
      autoBtn.disabled = false
      autoBtn.textContent = 'Retry Scrape'
    }
  })

  manualBtn.addEventListener('click', startManualMapping)

  container.appendChild(autoBtn)
  container.appendChild(manualBtn)
  document.body.appendChild(container)
}

function startManualMapping() {
  if (isMappingMode) return
  isMappingMode = true
  currentMappingField = 'title'
  showMappingToast('MANUAL MODE: Click on the JOB TITLE')

  document.addEventListener('click', handleManualClick, true)
  document.body.style.cursor = 'crosshair'
}

function handleManualClick(e: MouseEvent) {
  if (!isMappingMode) return

  e.preventDefault()
  e.stopPropagation()

  const target = e.target as HTMLElement
  const text = target.textContent?.trim() || ''

  if (currentMappingField) {
    mappingData[currentMappingField] = text as any

    const fields: ('title' | 'company' | 'location' | 'description')[] = ['title', 'company', 'location', 'description']
    const currentIndex = fields.indexOf(currentMappingField)

    if (currentIndex < fields.length - 1) {
      currentMappingField = fields[currentIndex + 1]
      showMappingToast(`Captured! Now click the ${currentMappingField.toUpperCase()}`)
    } else {
      finishMapping()
    }
  }
}

async function finishMapping() {
  isMappingMode = false
  currentMappingField = null
  document.removeEventListener('click', handleManualClick, true)
  document.body.style.cursor = 'default'

  const job: ScrapedJob = {
    id: `manual-${Date.now()}`,
    title: mappingData.title || '',
    company: mappingData.company || '',
    location: mappingData.location || '',
    description: mappingData.description || '',
    source: 'other',
    isValid: !!mappingData.title,
    errors: mappingData.title ? [] : ['Title is required'],
  }

  if (confirm(`Save this job to staging?\n\nTitle: ${job.title}\nCompany: ${job.company}`)) {
    sendJobsToExtension([job])
  }

  mappingData = {}
}

function showMappingToast(message: string) {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: #0073b1;
    color: white;
    padding: 14px 28px;
    border-radius: 50px;
    z-index: 10001;
    font-family: sans-serif;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: fadeIn 0.3s;
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function sendJobsToExtension(jobs: ScrapedJob[]) {
  if (!chrome.runtime?.id) {
    alert('Extension context lost. Please refresh the page.')
    return
  }

  chrome.runtime.sendMessage({
    type: 'JOBS_CAPTURED',
    jobs,
    platform: 'other',
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Message error:', chrome.runtime.lastError)
    }
  })
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCaptureButton)
} else {
  injectCaptureButton()
}

// SPA support
let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    setTimeout(injectCaptureButton, 1000)
  }
}).observe(document, { subtree: true, childList: true })
