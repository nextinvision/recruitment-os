/**
 * Test that createClientSchema accepts payloads from both manual and Tydical-synced leads
 * (null/undefined for optional fields) without throwing.
 */
import { createClientSchema } from '../modules/clients/schemas'

// Simulate convert payload: manual lead (some fields) and Tydical lead (nulls)
const manualLeadPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  industry: 'Tech',
  notes: 'Manual lead',
  leadId: 'lead_abc',
  assignedUserId: 'user_123',
}

const tydicalLeadPayload = {
  firstName: 'John',
  lastName: 'Smith',
  email: null,
  phone: null,
  industry: null, // This was causing: expected string, received null
  notes: null,
  leadId: 'lead_tydical',
  assignedUserId: 'user_123',
}

const mixedPayload = {
  firstName: 'Mixed',
  lastName: 'Lead',
  email: undefined,
  phone: '',
  industry: null,
  currentJobTitle: null,
  experience: null,
  address: null,
  notes: null,
  leadId: 'lead_mixed',
  assignedUserId: 'user_123',
}

function run() {
  console.log('Testing createClientSchema with lead-style payloads...\n')

  try {
    const r1 = createClientSchema.parse(manualLeadPayload)
    console.log('✓ Manual lead payload:', { industry: r1.industry, email: r1.email })
  } catch (e) {
    console.error('✗ Manual lead payload failed:', e)
    process.exit(1)
  }

  try {
    const r2 = createClientSchema.parse(tydicalLeadPayload)
    console.log('✓ Tydical lead payload (nulls):', { industry: r2.industry, email: r2.email, notes: r2.notes })
  } catch (e) {
    console.error('✗ Tydical lead payload failed:', e)
    process.exit(1)
  }

  try {
    const r3 = createClientSchema.parse(mixedPayload)
    console.log('✓ Mixed payload (null + empty string):', { industry: r3.industry, phone: r3.phone })
  } catch (e) {
    console.error('✗ Mixed payload failed:', e)
    process.exit(1)
  }

  console.log('\nAll schema tests passed.')
}

run()
