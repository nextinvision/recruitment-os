export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  STAGING_JOBS: 'staging_jobs',
} as const

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  BULK_JOBS: '/api/jobs/bulk',
} as const

export async function getBackendUrl(): Promise<string> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('backend_url')
      if (result.backend_url && typeof result.backend_url === 'string') {
        return result.backend_url
      }
    }
  } catch {
    // storage unavailable
  }
  return 'https://careeristpro.cloud'
}

export function getBackendUrlSync(): string {
  return 'https://careeristpro.cloud'
}

export async function getApiUrl(endpoint: string): Promise<string> {
  const base = (await getBackendUrl()).replace(/\/$/, '')
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

export function getApiUrlSync(endpoint: string): string {
  const base = getBackendUrlSync().replace(/\/$/, '')
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}
