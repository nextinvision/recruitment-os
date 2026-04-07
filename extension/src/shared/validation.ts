import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Staging validity for the extension popup: title + company are required to review/submit.
 * Description is often empty on listing pages; the API bulk endpoint stores a placeholder when missing.
 */
export function validateJob(job: { title?: string; company?: string; location?: string; description?: string }): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!job.title || job.title.trim().length === 0) errors.push('Title is required')
  if (!job.company || job.company.trim().length === 0) errors.push('Company is required')
  return { isValid: errors.length === 0, errors }
}
