import { describe, test, expect } from 'vitest'
import { validateJob } from '../../src/shared/validation'

describe('validateJob', () => {
  test('valid job passes', () => {
    const result = validateJob({ title: 'Engineer', company: 'Acme' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('missing title fails', () => {
    const result = validateJob({ title: '', company: 'Acme' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Title is required')
  })

  test('missing company fails', () => {
    const result = validateJob({ title: 'Engineer', company: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Company is required')
  })
})
