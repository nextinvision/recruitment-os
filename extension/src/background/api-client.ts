import { getApiUrl } from '../shared/constants'
import { LoginCredentials, LoginResponse, JobInput, BulkJobsResponse } from '../shared/types'
import { API_ENDPOINTS, STORAGE_KEYS } from '../shared/constants'

export class ApiClient {
  /**
   * Test connection to the backend API
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    const url = getApiUrl(API_ENDPOINTS.LOGIN)
    console.log('[API Client] Testing connection to:', url)
    
    try {
      // Try to connect (we expect 401/400 for invalid credentials, but that means server is reachable)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' }),
      })
      
      // Any response (even error) means server is reachable
      console.log('[API Client] Connection test response:', response.status)
      return { connected: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[API Client] Connection test failed:', errorMsg)
      return { 
        connected: false, 
        error: `Cannot reach backend at ${url}. ${errorMsg}` 
      }
    }
  }

  private async getToken(): Promise<string | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TOKEN)
    return result[STORAGE_KEYS.TOKEN] || null
  }

  private async getHeaders(includeAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (includeAuth) {
      const token = await this.getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const url = getApiUrl(API_ENDPOINTS.LOGIN)
    console.log('[API Client] Attempting login to:', url)
    
    try {
      const baseHeaders = await this.getHeaders(false)
      // Add header to identify this as extension request (so API doesn't set cookies)
      const headers: Record<string, string> = {
        ...baseHeaders,
        'X-Client-Type': 'extension',
      } as Record<string, string>
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
      })

      console.log('[API Client] Login response status:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Login failed' }))
        console.error('[API Client] Login error:', error)
        throw new Error(error.error || `Login failed: ${response.statusText}`)
      }

      const data: LoginResponse = await response.json()
      console.log('[API Client] Login successful, user:', data.user?.email)
      
      // Store token and user data
      await chrome.storage.local.set({
        [STORAGE_KEYS.TOKEN]: data.token,
        [STORAGE_KEYS.USER]: data.user,
      })

      return data
    } catch (error) {
      console.error('[API Client] Login exception:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend at ${url}. Is the server running?`)
      }
      throw error
    }
  }

  async logout(): Promise<void> {
    await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER])
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken()
    return !!token
  }

  async submitBulkJobs(jobs: JobInput[]): Promise<BulkJobsResponse> {
    const token = await this.getToken()
    if (!token) {
      throw new Error('Not authenticated. Please login first.')
    }

    const url = getApiUrl(API_ENDPOINTS.BULK_JOBS)
    console.log('[API Client] Submitting', jobs.length, 'jobs to:', url)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: await this.getHeaders(true),
        body: JSON.stringify({ jobs }),
      })

      console.log('[API Client] Submit response status:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Submission failed' }))
        console.error('[API Client] Submit error:', error)
        throw new Error(error.error || `Submission failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[API Client] Submit successful, count:', result.count)
      return result
    } catch (error) {
      console.error('[API Client] Submit exception:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend at ${url}. Is the server running?`)
      }
      throw error
    }
  }

  async getUser(): Promise<LoginResponse['user'] | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER)
    return result[STORAGE_KEYS.USER] || null
  }
}

export const apiClient = new ApiClient()

