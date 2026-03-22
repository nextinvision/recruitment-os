/**
 * Unit tests for validation
 */

import { describe, test, expect } from 'vitest'
import { validateJob, validateJobs } from '../../src/shared/validation'
import { JobInput } from '../../src/shared/types'

describe('Job Validation', () => {
  const validJob: JobInput = {
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Remote',
    description: 'Job description here',
    source: 'linkedin'
  }

  test('should validate correct job', () => {
    const result = validateJob(validJob)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject job without title', () => {
    const invalidJob = { ...validJob, title: '' }
    const result = validateJob(invalidJob)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('should reject job without company', () => {
    const invalidJob = { ...validJob, company: '' }
    const result = validateJob(invalidJob)
    expect(result.isValid).toBe(false)
  })

  test('should reject job without location', () => {
    const invalidJob = { ...validJob, location: '' }
    const result = validateJob(invalidJob)
    expect(result.isValid).toBe(false)
  })

  test('should reject job without description', () => {
    const invalidJob = { ...validJob, description: '' }
    const result = validateJob(invalidJob)
    expect(result.isValid).toBe(false)
  })

  test('should validate multiple jobs', () => {
    const jobs = [validJob, { ...validJob, title: 'Another Job' }]
    const result = validateJobs(jobs)
    expect(result.isValid).toBe(true)
  })

  test('should detect invalid jobs in batch', () => {
    const jobs = [
      validJob,
      { ...validJob, title: '' }, // Invalid
      { ...validJob, company: '' } // Invalid
    ]
    const result = validateJobs(jobs)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

