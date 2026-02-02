#!/usr/bin/env tsx

/**
 * Initialize MinIO buckets on startup
 * Run this script after starting Docker services
 */

import { initializeBuckets } from '@/lib/storage'

async function main() {
  try {
    console.log('Initializing MinIO buckets...')
    await initializeBuckets()
    console.log('✅ MinIO buckets initialized successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to initialize MinIO buckets:', error)
    process.exit(1)
  }
}

main()

