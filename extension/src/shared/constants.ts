import { JobSource } from './types'

export const SUPPORTED_PLATFORMS: JobSource[] = ['linkedin', 'indeed', 'naukri', 'other']

export const PLATFORM_DOMAINS: Record<JobSource, string[]> = {
  linkedin: ['www.linkedin.com', 'linkedin.com'],
  indeed: ['www.indeed.com', 'indeed.com'],
  naukri: ['www.naukri.com', 'naukri.com'],
  other: [], // Universal scraper - no specific domains
}

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  STAGING_JOBS: 'staging_jobs',
} as const

// For backward compatibility with direct storage access
export const STORAGE_KEY_AUTH_TOKEN = 'auth_token'
export const STORAGE_KEY_USER_DATA = 'user_data'
export const STORAGE_KEY_STAGING_JOBS = 'staging_jobs'

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  BULK_JOBS: '/api/jobs/bulk',
} as const

/**
 * Get the backend URL from chrome.storage or use default
 * For production builds, set PRODUCTION_API_URL during build
 * For development, defaults to localhost:3000
 */
export async function getBackendUrl(): Promise<string> {
  // Try to get from chrome.storage first (user-configured or set during installation)
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('backend_url')
      if (result.backend_url && typeof result.backend_url === 'string') {
        return result.backend_url
      }
    }
  } catch (error) {
    console.warn('[Constants] Could not read backend_url from storage:', error)
  }

  // Fallback to build-time default
  // For production: Update this value or use build-production script
  // The build script will replace this line automatically
  const buildTimeUrl = 'http://localhost:3000'
  
  return buildTimeUrl
}

/**
 * Synchronous version for cases where async is not possible
 * Use this only when you can't use async/await
 */
export function getBackendUrlSync(): string {
  // For sync access, return default
  // For production: Update this value or use build-production script
  return 'http://localhost:3000'
}

/**
 * Get full API URL for an endpoint
 * This is async because it may need to read from chrome.storage
 */
export async function getApiUrl(endpoint: string): Promise<string> {
  const baseUrl = await getBackendUrl()
  // Ensure baseUrl doesn't end with / and endpoint starts with /
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${cleanBaseUrl}${cleanEndpoint}`
}

/**
 * Synchronous version - use only when async is not possible
 */
export function getApiUrlSync(endpoint: string): string {
  const baseUrl = getBackendUrlSync()
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${cleanBaseUrl}${cleanEndpoint}`
}

