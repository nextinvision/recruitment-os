import { z } from 'zod'
import { JobInput, JobSource } from './types'

export const jobInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  source: z.enum(['linkedin', 'indeed', 'naukri', 'other'] as const),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export function validateJob(job: Partial<JobInput>): { isValid: boolean; errors: string[] } {
  const result = jobInputSchema.safeParse(job)
  
  if (result.success) {
    return { isValid: true, errors: [] }
  }

  const errors = result.error.errors.map(err => {
    const path = err.path.join('.')
    return `${path}: ${err.message}`
  })

  return { isValid: false, errors }
}

export function validateJobs(jobs: Partial<JobInput>[]): { isValid: boolean; errors: string[] } {
  const allErrors: string[] = []
  let allValid = true

  jobs.forEach((job, index) => {
    const validation = validateJob(job)
    if (!validation.isValid) {
      allValid = false
      validation.errors.forEach(err => {
        allErrors.push(`Job ${index + 1}: ${err}`)
      })
    }
  })

  return { isValid: allValid, errors: allErrors }
}

