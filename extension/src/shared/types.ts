export interface ScrapedJob {
  id: string
  title: string
  company: string
  location: string
  description: string
  source: string
  sourceUrl: string
  isValid: boolean
  errors: string[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

export interface BulkJobsResponse {
  count: number
}

export interface StorageData {
  token?: string
  user?: LoginResponse['user']
  stagingJobs?: ScrapedJob[]
}
