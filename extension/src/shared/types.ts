export type JobSource = 'linkedin' | 'indeed' | 'naukri'

export interface JobInput {
  title: string
  company: string
  location: string
  description: string
  source: JobSource
}

export interface ScrapedJob extends JobInput {
  id: string
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

export interface PageInfo {
  platform: JobSource | null
  isJobPage: boolean
  url: string
}

