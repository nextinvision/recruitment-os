import { apiClient } from './api-client.js'
import { STORAGE_KEYS } from '../shared/constants.js'

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Recruitment OS Extension installed')
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): boolean => {
  const handleMessage = async () => {
    try {
      switch (message.type) {
        case 'PING':
          // Simple ping to check if service worker is ready
          return { success: true, data: 'pong' }

        case 'TEST_CONNECTION':
          const connectionTest = await apiClient.testConnection()
          return { success: true, data: connectionTest }

        case 'LOGIN':
          try {
            const loginResult = await apiClient.login(message.credentials)
            // apiClient.login already stores token and user, but ensure it's done
            console.log('[Service Worker] Login successful, user:', loginResult.user?.email)
            return { success: true, data: loginResult }
          } catch (error) {
            console.error('[Service Worker] Login error:', error)
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Login failed',
            }
          }

        case 'LOGOUT':
          try {
            await apiClient.logout()
            // Also clear staging jobs on logout
            await chrome.storage.local.remove(STORAGE_KEYS.STAGING_JOBS)
            console.log('[Service Worker] Logout successful')
            return { success: true }
          } catch (error) {
            console.error('[Service Worker] Logout error:', error)
            // Even if there's an error, try to clear storage
            try {
              await chrome.storage.local.remove([
                STORAGE_KEYS.TOKEN,
                STORAGE_KEYS.USER,
                STORAGE_KEYS.STAGING_JOBS,
              ])
            } catch (cleanupError) {
              console.error('[Service Worker] Cleanup error:', cleanupError)
            }
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Logout failed',
            }
          }

        case 'CHECK_AUTH':
          try {
            const isAuth = await apiClient.isAuthenticated()
            const user = isAuth ? await apiClient.getUser() : null
            console.log('[Service Worker] Auth check:', { authenticated: isAuth, hasUser: !!user })
            return { success: true, data: { authenticated: isAuth, user } }
          } catch (error) {
            console.error('[Service Worker] Auth check error:', error)
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Auth check failed',
              data: { authenticated: false, user: null },
            }
          }

        case 'SUBMIT_JOBS':
          const result = await apiClient.submitBulkJobs(message.jobs)
          return { success: true, data: result }

        case 'GET_STAGING_JOBS':
          const staging = await chrome.storage.local.get(STORAGE_KEYS.STAGING_JOBS)
          return { success: true, data: staging[STORAGE_KEYS.STAGING_JOBS] || [] }

        case 'SAVE_STAGING_JOBS':
          await chrome.storage.local.set({
            [STORAGE_KEYS.STAGING_JOBS]: message.jobs,
          })
          return { success: true }

        case 'CLEAR_STAGING_JOBS':
          await chrome.storage.local.remove(STORAGE_KEYS.STAGING_JOBS)
          return { success: true }

        case 'JOBS_CAPTURED':
          try {
            // Get existing staging jobs
            const existing = await chrome.storage.local.get(STORAGE_KEYS.STAGING_JOBS)
            const existingJobs = existing[STORAGE_KEYS.STAGING_JOBS] || []
            
            // Add new jobs (avoid duplicates by checking id)
            const newJobs = message.jobs || []
            const existingIds = new Set(existingJobs.map((job: any) => job.id))
            const uniqueNewJobs = newJobs.filter((job: any) => !existingIds.has(job.id))
            const updatedJobs = [...existingJobs, ...uniqueNewJobs]
            
            // Save to storage
            await chrome.storage.local.set({
              [STORAGE_KEYS.STAGING_JOBS]: updatedJobs,
            })
            
            console.log(`[Service Worker] Saved ${uniqueNewJobs.length} new job(s) to staging. Total: ${updatedJobs.length}`)
            
            // Try to notify popup if it's open (optional - popup can also read from storage)
            try {
              chrome.runtime.sendMessage({
                type: 'JOBS_CAPTURED',
                jobs: uniqueNewJobs,
                totalCount: updatedJobs.length,
              }).catch(() => {
                // Popup might not be open, that's okay
              })
            } catch (err) {
              // Ignore - popup might not be listening
            }
            
            return { 
              success: true, 
              data: { 
                added: uniqueNewJobs.length, 
                total: updatedJobs.length 
              } 
            }
          } catch (error) {
            console.error('[Service Worker] Error saving captured jobs:', error)
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to save jobs',
            }
          }

        default:
          return { success: false, error: 'Unknown message type' }
      }
    } catch (error) {
      console.error('Service worker error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Handle async response properly
  handleMessage()
    .then((result) => {
      sendResponse(result)
    })
    .catch((error) => {
      console.error('Message handler error:', error)
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    })

  return true // Keep channel open for async response
})

// Handle storage changes (e.g., token expiration)
chrome.storage.onChanged.addListener((changes: { [key: string]: chrome.storage.StorageChange }, areaName: chrome.storage.AreaName): void => {
  if (areaName === 'local' && changes[STORAGE_KEYS.TOKEN]) {
    console.log('Auth token changed')
  }
})

