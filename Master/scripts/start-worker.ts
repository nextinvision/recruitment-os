#!/usr/bin/env tsx

/**
 * Standalone worker process for follow-up automation
 * Run this as a separate process: npm run worker
 */

import { createFollowUpWorker } from '@/workers/followup-automation.worker'

console.log('Starting Follow-Up Automation Worker...')

const worker = createFollowUpWorker()

console.log('Worker started. Waiting for jobs...')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...')
  await worker.close()
  process.exit(0)
})

