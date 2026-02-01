import { JobSource, PageInfo } from '../shared/types'
import { PLATFORM_DOMAINS } from '../shared/constants'
import { LinkedInSelectors } from './selectors/linkedin'
import { IndeedSelectors } from './selectors/indeed'
import { NaukriSelectors } from './selectors/naukri'

export class JobDetector {
  static detectPlatform(): JobSource | null {
    const hostname = window.location.hostname.toLowerCase()

    for (const [platform, domains] of Object.entries(PLATFORM_DOMAINS)) {
      if (domains.some(domain => hostname.includes(domain))) {
        return platform as JobSource
      }
    }

    return null
  }

  static isJobPage(platform: JobSource | null): boolean {
    if (!platform) return false

    switch (platform) {
      case 'linkedin':
        return LinkedInSelectors.isJobListingPage() || LinkedInSelectors.isJobDetailPage()
      case 'indeed':
        return IndeedSelectors.isJobListingPage() || IndeedSelectors.isJobDetailPage()
      case 'naukri':
        return NaukriSelectors.isJobListingPage() || NaukriSelectors.isJobDetailPage()
      default:
        return false
    }
  }

  static getPageInfo(): PageInfo {
    const platform = this.detectPlatform()
    const isJobPage = this.isJobPage(platform)

    return {
      platform,
      isJobPage,
      url: window.location.href,
    }
  }
}

