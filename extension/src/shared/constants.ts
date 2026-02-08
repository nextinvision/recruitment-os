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

export function getBackendUrl(): string {
  // Default to localhost for development
  // In production, update this to your production backend URL
  // You can also store this in chrome.storage for user configuration
  return 'http://localhost:3000'
}

export function getApiUrl(endpoint: string): string {
  const baseUrl = getBackendUrl()
  return `${baseUrl}${endpoint}`
}

