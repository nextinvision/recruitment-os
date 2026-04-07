interface ScrapedJob {
  id: string
  title: string
  company: string
  location: string
  description: string
  source: string
  sourceUrl: string
}

// ── Source detection ─────────────────────────────────────────────────

function detectSource(): string {
  const host = location.hostname.toLowerCase()
  if (host.includes('linkedin.com')) return 'linkedin'
  if (host.includes('indeed.com') || host.includes('indeed.co')) return 'indeed'
  if (host.includes('naukri.com')) return 'naukri'
  return 'other'
}

// ── Page scan entry point ───────────────────────────────────────────

function scanPage(): ScrapedJob[] {
  const cards = findJobCards()
  const source = detectSource()
  const jobs: ScrapedJob[] = []

  for (const card of cards) {
    const job = extractFromCard(card, source)
    if (job) jobs.push({ id: `job-${Date.now()}-${jobs.length}`, ...job })
  }

  if (jobs.length === 0) {
    const single = extractSingleJob(source)
    if (single) jobs.push({ id: `job-${Date.now()}-0`, ...single })
  }

  return dedup(jobs)
}

// ── Card detection ──────────────────────────────────────────────────

const CARD_SELECTORS = [
  '[data-job-id]', '[data-jk]', '[data-entity-urn*="jobPosting"]',
  '[class*="job-card"]', '[class*="jobCard"]', '[class*="job-listing"]',
  '[class*="job_seen_beacon"]', '[class*="jobTuple"]', '[class*="srp-jobtuple"]',
  '[class*="job-search-card"]', '[class*="base-search-card"]', '[class*="base-card"]',
  '[class*="position-card"]', '[class*="vacancy-card"]', '[class*="career-item"]',
  '[class*="resultContent"]',
  'article[class*="job"]', 'li[class*="job"]',
  'div[class*="job"][class*="item"]', 'div[class*="job"][class*="row"]',
]

function findJobCards(): Element[] {
  for (const sel of CARD_SELECTORS) {
    try {
      const els = document.querySelectorAll(sel)
      if (els.length >= 2) return Array.from(els)
    } catch { /* invalid selector */ }
  }
  return findRepeatingContainers()
}

function findRepeatingContainers(): Element[] {
  const candidates = document.querySelectorAll(
    'ul, ol, div[role="list"], main, section, [class*="list"], [class*="results"], [class*="grid"], [class*="feed"], [class*="cards"]'
  )
  let best: Element[] = []

  for (const container of Array.from(candidates)) {
    const children = Array.from(container.children)
    if (children.length < 2) continue

    const fingerprints = children.map(c => {
      const classes = (c.className || '').toString().split(' ').sort().join(',')
      return `${c.tagName}|${classes}`
    })
    const grouped = new Map<string, Element[]>()
    fingerprints.forEach((fp, i) => {
      if (!grouped.has(fp)) grouped.set(fp, [])
      grouped.get(fp)!.push(children[i])
    })

    for (const group of grouped.values()) {
      if (group.length < 2) continue
      const withLinks = group.filter(el => el.querySelector('a[href]'))
      if (withLinks.length >= 2 && withLinks.length > best.length) {
        best = withLinks
      }
    }
  }

  return best
}

// ── Text segment collector ──────────────────────────────────────────
// Walks a card's DOM and returns all distinct, non-overlapping text
// pieces in document order. This is the foundation for structural
// extraction — every visible piece of text from the card is captured.

interface TextSegment {
  text: string
  el: Element
  tag: string
  classes: string
}

function collectSegments(root: Element): TextSegment[] {
  const segments: TextSegment[] = []
  const usedTexts = new Set<string>()

  function walk(node: Element) {
    const text = node.textContent?.trim() || ''
    if (!text) return

    // Leaf element (no child elements) — capture its text directly
    if (node.children.length === 0) {
      if (text.length > 0 && text.length < 500 && !usedTexts.has(text)) {
        usedTexts.add(text)
        segments.push({
          text,
          el: node,
          tag: node.tagName.toLowerCase(),
          classes: (node.className || '').toString().toLowerCase(),
        })
      }
      return
    }

    // Container with a few children — walk children for granular text
    if (node.children.length <= 6) {
      for (const child of Array.from(node.children)) walk(child)
      return
    }

    // Large container (nav, list-of-lists) — capture its text as one block
    if (text.length > 0 && text.length < 500 && !usedTexts.has(text)) {
      usedTexts.add(text)
      segments.push({
        text,
        el: node,
        tag: node.tagName.toLowerCase(),
        classes: (node.className || '').toString().toLowerCase(),
      })
    }
  }

  for (const child of Array.from(root.children)) walk(child)
  return segments
}

// ── Pattern helpers ─────────────────────────────────────────────────

const LOCATION_KEYWORDS = /\b(remote|hybrid|on-?site|work from home|wfh|telecommute)\b/i
const LOCATION_CITY_STATE = /\b[A-Z][a-z]{2,},\s*[A-Z]{2}\b/
const LOCATION_CITY_COUNTRY = /\b[A-Z][a-z]{2,},\s*[A-Z][a-z]{2,}/
const LOCATION_INDIA = /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|kolkata|noida|gurgaon|gurugram|ahmedabad|jaipur|chandigarh|kochi|lucknow|indore)\b/i
const LOCATION_GLOBAL = /\b(new york|san francisco|london|berlin|toronto|singapore|dubai|sydney|tokyo|seattle|boston|chicago|austin|denver|atlanta|los angeles|paris|amsterdam|dublin)\b/i

function looksLikeLocation(text: string): boolean {
  if (text.length > 100) return false
  return (
    LOCATION_KEYWORDS.test(text) ||
    LOCATION_CITY_STATE.test(text) ||
    LOCATION_CITY_COUNTRY.test(text) ||
    LOCATION_INDIA.test(text) ||
    LOCATION_GLOBAL.test(text)
  )
}

function classHints(classes: string, keywords: string[]): boolean {
  return keywords.some(k => classes.includes(k))
}

const COMPANY_CLASS_HINTS = ['company', 'comp', 'employer', 'org', 'brand', 'subtitle', 'subTitle']
const LOCATION_CLASS_HINTS = ['location', 'loc', 'city', 'address', 'place', 'geo']
const DESC_CLASS_HINTS = ['description', 'desc', 'snippet', 'summary', 'detail', 'content', 'insight', 'text']
const META_CLASS_HINTS = ['salary', 'pay', 'compensation', 'type', 'badge', 'tag', 'meta', 'info', 'date', 'time', 'posted', 'experience', 'exp']

// ── Card extraction ─────────────────────────────────────────────────

function extractFromCard(card: Element, source: string): Omit<ScrapedJob, 'id'> | null {
  const segments = collectSegments(card)
  if (segments.length === 0) return null

  const link = findLink(card)

  // 1. Find title — first heading, or first class-hint "title", or first link text
  let titleIdx = -1
  let title = ''

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i]
    if (/^h[1-4]$/.test(s.tag) && s.text.length > 3 && s.text.length < 200) {
      title = s.text; titleIdx = i; break
    }
  }
  if (!title) {
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i]
      if (classHints(s.classes, ['title', 'desig', 'heading', 'name']) && s.text.length > 3 && s.text.length < 200) {
        title = s.text; titleIdx = i; break
      }
    }
  }
  if (!title) {
    const titleLink = card.querySelector('a')
    if (titleLink) {
      const t = titleLink.textContent?.trim() || ''
      if (t.length > 3 && t.length < 200) {
        title = t
        titleIdx = segments.findIndex(s => s.text === t)
      }
    }
  }
  if (!title) return null

  // 2. Classify remaining segments by class hints first, then by position & pattern
  let company = ''
  let locationText = ''
  const metaParts: string[] = []
  const descParts: string[] = []

  const used = new Set<number>()
  if (titleIdx >= 0) used.add(titleIdx)

  // Pass 1: class-based assignment (high confidence)
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue
    const s = segments[i]

    if (!company && classHints(s.classes, COMPANY_CLASS_HINTS) && s.text.length < 120) {
      company = s.text; used.add(i)
    } else if (!locationText && classHints(s.classes, LOCATION_CLASS_HINTS) && s.text.length < 120) {
      locationText = s.text; used.add(i)
    } else if (classHints(s.classes, DESC_CLASS_HINTS) && s.text.length > 20) {
      descParts.push(s.text); used.add(i)
    } else if (classHints(s.classes, META_CLASS_HINTS) && s.text.length < 120) {
      metaParts.push(s.text); used.add(i)
    }
  }

  // Also try data-testid attributes (Indeed style)
  if (!company) {
    const el = card.querySelector('[data-testid*="company"]')
    if (el) {
      const t = el.textContent?.trim() || ''
      if (t.length > 0 && t.length < 120) {
        company = t
        const idx = segments.findIndex(s => s.text === t)
        if (idx >= 0) used.add(idx)
      }
    }
  }
  if (!locationText) {
    const el = card.querySelector('[data-testid*="location"]')
    if (el) {
      const t = el.textContent?.trim() || ''
      if (t.length > 0 && t.length < 120) {
        locationText = t
        const idx = segments.findIndex(s => s.text === t)
        if (idx >= 0) used.add(idx)
      }
    }
  }

  // Pass 2: structural fallback for remaining un-assigned segments
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue
    const s = segments[i]

    // Short text after title but before description — likely company or location
    if (s.text.length < 80) {
      if (!company) {
        company = s.text; used.add(i)
      } else if (!locationText && looksLikeLocation(s.text)) {
        locationText = s.text; used.add(i)
      } else if (!locationText && s.text.length < 60) {
        locationText = s.text; used.add(i)
      } else {
        metaParts.push(s.text); used.add(i)
      }
    } else {
      descParts.push(s.text); used.add(i)
    }
  }

  // Build description from desc parts + metadata
  const allDesc = [...metaParts, ...descParts].filter(Boolean)
  const description = allDesc.join(' | ').substring(0, 2000)

  return {
    title,
    company,
    location: locationText,
    description,
    source,
    sourceUrl: link || location.href,
  }
}

// ── Single job / detail page ────────────────────────────────────────

function extractSingleJob(source: string): Omit<ScrapedJob, 'id'> | null {
  const root = document.querySelector('main, [role="main"], article, .content, #content') || document.body

  // Try heading-based title
  let title = ''
  const h1 = root.querySelector('h1')
  if (h1) title = h1.textContent?.trim() || ''
  if (!title) {
    const h2 = root.querySelector('h2')
    if (h2) title = h2.textContent?.trim() || ''
  }
  if (!title) return null

  // Company
  let company = ''
  const companySels = [
    '[class*="company"]', '[class*="Company"]', '[class*="employer"]',
    '[class*="org-name"]', '[data-testid*="company"]',
    '[itemprop="hiringOrganization"]', 'a[href*="/company"]',
  ]
  for (const sel of companySels) {
    try {
      const el = root.querySelector(sel)
      if (el) { company = el.textContent?.trim() || ''; if (company) break }
    } catch { /* invalid */ }
  }

  // Location
  let loc = ''
  const locSels = [
    '[class*="location"]', '[class*="Location"]', '[class*="loc"]',
    '[data-testid*="location"]', '[itemprop="jobLocation"]',
  ]
  for (const sel of locSels) {
    try {
      const el = root.querySelector(sel)
      if (el) { loc = el.textContent?.trim() || ''; if (loc) break }
    } catch { /* invalid */ }
  }

  // Description — grab the largest text block
  let description = ''
  const descSels = [
    '[class*="description"]', '[class*="Description"]',
    '#jobDescriptionText', '#job-details',
    '[itemprop="description"]', '[class*="job-desc"]',
    '[class*="jd-desc"]', 'section.description',
  ]
  for (const sel of descSels) {
    try {
      const el = root.querySelector(sel)
      if (el) {
        const t = el.textContent?.trim() || ''
        if (t.length > description.length) description = t.substring(0, 3000)
      }
    } catch { /* invalid */ }
  }
  if (!description) {
    const paragraphs = root.querySelectorAll('p, li')
    const texts: string[] = []
    for (const p of Array.from(paragraphs)) {
      const t = p.textContent?.trim() || ''
      if (t.length > 20) texts.push(t)
    }
    description = texts.join(' | ').substring(0, 3000)
  }

  return {
    title,
    company,
    location: loc,
    description,
    source,
    sourceUrl: location.href,
  }
}

// ── Link finder ─────────────────────────────────────────────────────

function findLink(card: Element): string {
  const sels = [
    'a[href*="/jobs/view"]', 'a[href*="/viewjob"]',
    'a[href*="/job-listings"]', 'a[href*="/job-details"]',
    'a[href*="/job/"]', 'a[href*="/career"]', 'a[href*="/position"]',
    'a[href*="/apply"]',
    'h1 a', 'h2 a', 'h3 a', 'h4 a',
    'a[class*="title"]', 'a[class*="Title"]',
  ]
  for (const sel of sels) {
    try {
      const a = card.querySelector(sel) as HTMLAnchorElement | null
      if (a?.href && a.href.startsWith('http')) return a.href
    } catch { /* invalid */ }
  }
  // Fallback: first link in the card
  const first = card.querySelector('a[href]') as HTMLAnchorElement | null
  if (first?.href && first.href.startsWith('http')) return first.href
  return ''
}

// ── Dedup ───────────────────────────────────────────────────────────

function dedup(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>()
  return jobs.filter(j => {
    const key = `${j.title}|${j.sourceUrl}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── UI ──────────────────────────────────────────────────────────────

function injectButton() {
  const existing = document.getElementById('ros-scan-btn')
  if (existing) existing.remove()

  if (!document.body) {
    setTimeout(injectButton, 200)
    return
  }

  const btn = document.createElement('button')
  btn.id = 'ros-scan-btn'
  btn.textContent = 'Scan Jobs'
  btn.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 99999;
    padding: 12px 24px; background: #0073b1; color: #fff;
    border: none; border-radius: 6px; cursor: pointer;
    font-size: 14px; font-weight: 600;
    box-shadow: 0 2px 10px rgba(0,0,0,0.25);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background 0.2s;
  `
  btn.onmouseenter = () => { btn.style.background = '#005a8c' }
  btn.onmouseleave = () => { btn.style.background = '#0073b1' }

  btn.addEventListener('click', async () => {
    btn.disabled = true
    btn.textContent = 'Scanning...'
    btn.style.background = '#999'

    try {
      const jobs = scanPage()

      if (jobs.length === 0) {
        showToast('No jobs found on this page.')
        return
      }

      sendJobs(jobs)
      btn.textContent = `Found ${jobs.length} job${jobs.length > 1 ? 's' : ''}`
      btn.style.background = '#28a745'
      showToast(`${jobs.length} job${jobs.length > 1 ? 's' : ''} sent to staging`)
    } catch (err) {
      console.error('[RecruitmentOS]', err)
      showToast('Scan failed. Check console for details.')
    } finally {
      setTimeout(() => {
        btn.disabled = false
        btn.textContent = 'Scan Jobs'
        btn.style.background = '#0073b1'
      }, 2000)
    }
  })

  document.body.appendChild(btn)
}

function showToast(msg: string) {
  const t = document.createElement('div')
  t.textContent = msg
  t.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    background: #333; color: #fff; padding: 12px 24px; border-radius: 8px;
    z-index: 100000; font-size: 14px; font-family: sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  `
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}

function sendJobs(jobs: ScrapedJob[]) {
  if (!chrome.runtime?.id) {
    showToast('Extension context lost. Refresh the page.')
    return
  }

  chrome.runtime.sendMessage(
    { type: 'JOBS_CAPTURED', jobs },
    (resp) => {
      if (chrome.runtime.lastError) {
        console.error('[RecruitmentOS]', chrome.runtime.lastError)
      }
    }
  )
}

// ── Init ────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectButton)
} else {
  injectButton()
}

let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    setTimeout(injectButton, 1000)
  }
}).observe(document, { subtree: true, childList: true })
