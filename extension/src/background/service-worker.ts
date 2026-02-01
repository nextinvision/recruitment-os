import { apiClient } from './api-client'
import { STORAGE_KEYS } from '../shared/constants'

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Recruitment OS Extension installed')
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
          const loginResult = await apiClient.login(message.credentials)
          return { success: true, data: loginResult }

        case 'LOGOUT':
          await apiClient.logout()
          return { success: true }

        case 'CHECK_AUTH':
          const isAuth = await apiClient.isAuthenticated()
          const user = isAuth ? await apiClient.getUser() : null
          return { success: true, data: { authenticated: isAuth, user } }

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
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEYS.TOKEN]) {
    console.log('Auth token changed')
  }
})

