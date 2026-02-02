/**
 * Automation initialization
 * Call this from your Next.js app to start the scheduler
 */

import { initializeScheduler } from './scheduler'

let schedulerInitialized = false

/**
 * Initialize follow-up automation system
 * Should be called once when the app starts
 */
export function initializeAutomation() {
  if (schedulerInitialized) {
    console.log('[Automation] Already initialized')
    return
  }

  // Only initialize in server environment
  if (typeof window === 'undefined') {
    initializeScheduler()
    schedulerInitialized = true
    console.log('[Automation] Follow-up automation system initialized')
  }
}

