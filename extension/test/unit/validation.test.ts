import { describe, test, expect } from 'vitest'
import { validateJob } from '../../src/shared/validation'

describe('Job Validation', () => {
  test('valid job with title and company passes', () => {
    const result = validateJob({ title: 'Software Engineer', company: 'Acme Corp' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject job without title', () => {
    const result = validateJob({ title: '', company: 'Acme Corp' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Title is required')
  })

  test('should reject job without company', () => {
    const result = validateJob({ title: 'Software Engineer', company: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Company is required')
  })

  test('should reject job missing both title and company', () => {
    const result = validateJob({ title: '', company: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBe(2)
  })

  test('location and description are optional', () => {
    const result = validateJob({ title: 'Engineer', company: 'Corp', location: '', description: '' })
    expect(result.isValid).toBe(true)
  })
})
