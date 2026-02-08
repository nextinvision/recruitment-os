import React, { useState, useEffect } from 'react'
import { LoginForm } from './LoginForm'
import { JobStaging } from './JobStaging'
import { ApiTestPanel } from './ApiTestPanel'
import { Dashboard } from './Dashboard'
import { LoginCredentials, ScrapedJob, LoginResponse } from '../shared/types'
import { getBackendUrl, STORAGE_KEYS } from '../shared/constants'

type AppState = 'loading' | 'login' | 'dashboard' | 'staging' | 'test'

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>('loading')
  const [user, setUser] = useState<LoginResponse['user'] | null>(null)
  const [stagingJobs, setStagingJobs] = useState<ScrapedJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [showTestPanel, setShowTestPanel] = useState(false)

  useEffect(() => {
    console.log('[App] Component mounted, initializing...')
    let isMounted = true
    
    // Safety timeout - always show login after 2 seconds max
    const safetyTimeout = setTimeout(() => {
      console.warn('[App] Safety timeout reached, forcing login state')
      if (isMounted) {
        setState('login')
      }
    }, 2000)

    // Test API connection on mount
    testApiConnection()
    
    // Ensure chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.error('[App] Chrome runtime not available')
      clearTimeout(safetyTimeout)
      setState('login')
      return
    }

    // Initialize with guaranteed fallback
    const init = async () => {
      try {
        console.log('[App] Starting auth check...')
        await checkAuth()
        console.log('[App] Auth check completed')
      } catch (err) {
        console.error('[App] Auth check error:', err)
        setState('login')
      }
      
      try {
        await loadStagingJobs()
      } catch (err) {
        console.error('[App] Load staging jobs error:', err)
      }
      
      clearTimeout(safetyTimeout)
    }
    
    init()
    listenForCapturedJobs()
    
    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
    }
  }, [])

  const testApiConnection = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }).catch(() => null)
      if (response?.success) {
        if (response.data.connected) {
          setConnectionStatus('Connected to backend')
          console.log('✅ Backend connection verified')
        } else {
          setConnectionStatus(`⚠️ ${response.data.error || 'Backend not reachable'}`)
          console.error('❌ Backend connection failed:', response.data.error)
        }
      }
    } catch (err) {
      console.warn('Connection test failed:', err)
      setConnectionStatus('⚠️ Cannot test connection (service worker issue)')
    }
  }

  const checkAuth = async () => {
    console.log('[checkAuth] Starting authentication check...')
    
    // Try service worker first with very short timeout
    let serviceWorkerWorked = false
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 300)
      )
      
      const messagePromise = new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve(response)
            }
          })
        } catch (err) {
          reject(err)
        }
      })
      
      const response = await Promise.race([messagePromise, timeoutPromise]) as any
      serviceWorkerWorked = true
      console.log('[checkAuth] Service worker responded:', response)
      
      if (response?.success && response.data?.authenticated) {
        console.log('[checkAuth] User authenticated via service worker')
        setUser(response.data.user)
        setState('staging')
        return
      }
    } catch (err) {
      console.warn('[checkAuth] Service worker check failed:', err)
    }
    
    // Fallback: check storage directly (ALWAYS runs)
    console.log('[checkAuth] Using direct storage fallback...')
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER])
      console.log('[checkAuth] Storage result:', { hasToken: !!result[STORAGE_KEYS.TOKEN], hasUser: !!result[STORAGE_KEYS.USER] })
      
      if (result[STORAGE_KEYS.TOKEN] && result[STORAGE_KEYS.USER]) {
        console.log('[checkAuth] User authenticated via storage')
        setUser(result[STORAGE_KEYS.USER])
        setState('dashboard')
      } else {
        console.log('[checkAuth] No auth found, showing login')
        setState('login')
      }
    } catch (storageErr) {
      console.error('[checkAuth] Storage check failed:', storageErr)
      setState('login')
    }
  }

  const loadStagingJobs = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 300)
      )
      
      const messagePromise = new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({ type: 'GET_STAGING_JOBS' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve(response)
            }
          })
        } catch (err) {
          reject(err)
        }
      })
      
      const response = await Promise.race([messagePromise, timeoutPromise]) as any
      
      if (response?.success && response.data) {
        setStagingJobs(response.data)
        return
      }
    } catch (err) {
      console.warn('[loadStagingJobs] Service worker failed, using direct storage:', err)
    }
    
    // Fallback: load directly from storage
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.STAGING_JOBS])
      if (result[STORAGE_KEYS.STAGING_JOBS]) {
        setStagingJobs(result[STORAGE_KEYS.STAGING_JOBS])
      }
    } catch (storageErr) {
      console.error('[loadStagingJobs] Storage fallback failed:', storageErr)
    }
  }

  const listenForCapturedJobs = () => {
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.type === 'JOBS_CAPTURED') {
        const newJobs = message.jobs || []
        console.log('[App] Received JOBS_CAPTURED message:', newJobs.length, 'jobs')
        
        // Reload staging jobs from storage to get the latest (service worker saved them)
        loadStagingJobs().then(() => {
          console.log('[App] Staging jobs refreshed after capture')
        })
        
        // Also update state immediately if we have the jobs
        if (newJobs.length > 0) {
          setStagingJobs(prev => {
            // Avoid duplicates
            const existingIds = new Set(prev.map(j => j.id))
            const uniqueNewJobs = newJobs.filter((job: any) => !existingIds.has(job.id))
            if (uniqueNewJobs.length > 0) {
              const updated = [...prev, ...uniqueNewJobs]
              saveStagingJobs(updated)
              return updated
            }
            return prev
          })
        }
      }
      return true // Keep channel open for async response
    }
    
    chrome.runtime.onMessage.addListener(messageListener)
    
    // Return cleanup function
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }

  const saveStagingJobs = async (jobs: ScrapedJob[]) => {
    try {
      // Try service worker first
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1000)
      )
      
      const messagePromise = new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(
            { type: 'SAVE_STAGING_JOBS', jobs },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message))
              } else {
                resolve(response)
              }
            }
          )
        } catch (err) {
          reject(err)
        }
      })

      await Promise.race([messagePromise, timeoutPromise])
    } catch (err) {
      console.warn('[saveStagingJobs] Service worker failed, using direct storage:', err)
      // Fallback: save directly to storage
      try {
        await chrome.storage.local.set({
          [STORAGE_KEYS.STAGING_JOBS]: jobs,
        })
      } catch (storageErr) {
        console.error('[saveStagingJobs] Direct storage also failed:', storageErr)
      }
    }
  }

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    console.log('[handleLogin] Starting login for:', credentials.email)

    try {
      // Try service worker first (preferred method for consistency)
      let loginResult: LoginResponse | null = null
      let serviceWorkerWorked = false

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service worker timeout')), 2000)
        )
        
        const messagePromise = new Promise<LoginResponse>((resolve, reject) => {
          try {
            chrome.runtime.sendMessage(
              { type: 'LOGIN', credentials },
              (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message))
                } else if (response?.success && response.data) {
                  resolve(response.data)
                } else {
                  reject(new Error(response?.error || 'Login failed'))
                }
              }
            )
          } catch (err) {
            reject(err)
          }
        })

        loginResult = await Promise.race([messagePromise, timeoutPromise]) as LoginResponse
        serviceWorkerWorked = true
        console.log('[handleLogin] Login via service worker successful')
      } catch (swError) {
        console.warn('[handleLogin] Service worker login failed, trying direct API:', swError)
      }

      // Fallback: direct API call if service worker failed
      if (!serviceWorkerWorked || !loginResult) {
        console.log('[handleLogin] Using direct API call as fallback')
        const loginResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Client-Type': 'extension',
          },
          body: JSON.stringify(credentials),
        })

        if (loginResponse.ok) {
          loginResult = await loginResponse.json()
          console.log('[handleLogin] Direct API login successful')
          
          // Store token and user data (service worker should have done this, but ensure it's done)
          if (loginResult) {
            await chrome.storage.local.set({
              [STORAGE_KEYS.TOKEN]: loginResult.token,
              [STORAGE_KEYS.USER]: loginResult.user,
            })
          }
        } else {
          const errorData = await loginResponse.json().catch(() => ({}))
          console.error('[handleLogin] Login failed:', errorData)
          
          // Extract user-friendly error message
          let errorMsg = 'Login failed'
          if (errorData.error) {
            // If error is a string, use it directly
            if (typeof errorData.error === 'string') {
              errorMsg = errorData.error
            } 
            // If error is an array (Zod validation errors), format it
            else if (Array.isArray(errorData.error)) {
              errorMsg = errorData.error
                .map((err: any) => {
                  if (typeof err === 'string') return err
                  if (err.message) return err.message
                  if (err.path && err.path.length > 0) {
                    return `${err.path.join('.')}: ${err.message || 'Invalid value'}`
                  }
                  return 'Validation error'
                })
                .join(', ')
            }
            // If error is an object with message
            else if (errorData.error.message) {
              errorMsg = errorData.error.message
            }
          } else {
            errorMsg = `Login failed: ${loginResponse.statusText}`
          }
          
          setError(errorMsg)
          return
        }
      }

      // Ensure we have valid login result
      if (!loginResult) {
        throw new Error('Login failed: No response received')
      }
      
      if (!loginResult.user || !loginResult.token) {
        throw new Error('Invalid login response: Missing user or token')
      }
      
      setUser(loginResult.user)
      setState('dashboard')
      console.log('[handleLogin] Login complete, user:', loginResult.user.email)
    } catch (err) {
      console.error('[handleLogin] Login exception:', err)
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      
      if (errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        setError(`Cannot connect to backend. Is the server running at ${getBackendUrl()}?`)
      } else {
        setError(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    console.log('[handleLogout] Starting logout...')
    try {
      // Try service worker first
      let serviceWorkerWorked = false
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service worker timeout')), 1000)
        )
        
        const messagePromise = new Promise((resolve, reject) => {
          try {
            chrome.runtime.sendMessage({ type: 'LOGOUT' }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message))
              } else {
                resolve(response)
              }
            })
          } catch (err) {
            reject(err)
          }
        })

        await Promise.race([messagePromise, timeoutPromise])
        serviceWorkerWorked = true
        console.log('[handleLogout] Logout via service worker successful')
      } catch (swError) {
        console.warn('[handleLogout] Service worker logout failed, using direct cleanup:', swError)
      }

      // Always ensure direct cleanup (fallback and safety)
      await chrome.storage.local.remove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.STAGING_JOBS,
      ])
      console.log('[handleLogout] Storage cleared')

      // Reset all state
      setUser(null)
      setStagingJobs([])
      setState('login')
      setError(null)
      console.log('[handleLogout] Logout complete')
    } catch (err) {
      console.error('[handleLogout] Logout exception:', err)
      // Even if there's an error, try to clear state
      try {
        await chrome.storage.local.remove([
          STORAGE_KEYS.TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.STAGING_JOBS,
        ])
        setUser(null)
        setStagingJobs([])
        setState('login')
      } catch (cleanupErr) {
        console.error('[handleLogout] Cleanup failed:', cleanupErr)
      }
    }
  }

  const handleJobsChange = (jobs: ScrapedJob[]) => {
    setStagingJobs(jobs)
    saveStagingJobs(jobs)
  }

  const handleSubmit = async (jobs: ScrapedJob[]) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert ScrapedJob to JobInput (remove id, isValid, errors)
      const jobInputs = jobs.map(({ id, isValid, errors, ...job }) => ({
        ...job,
        source: job.source.toUpperCase() as 'LINKEDIN' | 'INDEED' | 'NAUKRI' | 'OTHER',
      }))

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Submission timeout')), 30000)
      )
      
      const messagePromise = new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(
            { type: 'SUBMIT_JOBS', jobs: jobInputs },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message))
              } else {
                resolve(response)
              }
            }
          )
        } catch (err) {
          reject(err)
        }
      })

      const response = await Promise.race([messagePromise, timeoutPromise]) as any

      if (response?.success) {
        // Remove submitted jobs from staging
        const submittedIds = new Set(jobs.map(j => j.id))
        const remainingJobs = stagingJobs.filter(j => !submittedIds.has(j.id))
        setStagingJobs(remainingJobs)
        saveStagingJobs(remainingJobs)

        alert(`✅ Successfully submitted ${response.data.count} job(s) to dashboard!`)
      } else {
        setError(response?.error || 'Submission failed')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Submission failed'
      setError(errorMsg)
      console.error('[handleSubmit] Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (state === 'login') {
    return (
      <div>
        {connectionStatus && (
          <div style={{
            padding: '8px 16px',
            margin: '0',
            fontSize: '12px',
            backgroundColor: connectionStatus.includes('✅') ? '#e8f5e9' : '#fff3cd',
            color: connectionStatus.includes('✅') ? '#2e7d32' : '#856404',
            borderBottom: '1px solid #ddd'
          }}>
            {connectionStatus}
          </div>
        )}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Recruitment OS</span>
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: showTestPanel ? '#0073b1' : '#f0f0f0',
              color: showTestPanel ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showTestPanel ? 'Hide Tests' : 'Test APIs'}
          </button>
        </div>
        {showTestPanel ? (
          <ApiTestPanel />
        ) : (
          <LoginForm
            onLogin={handleLogin}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    )
  }

  if (state === 'dashboard') {
    return (
      <div>
        {error && (
          <div style={{
            padding: '12px',
            margin: '12px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}
        <Dashboard
          user={user!}
          stagingJobCount={stagingJobs.length}
          onViewStaging={() => setState('staging')}
          onLogout={handleLogout}
        />
      </div>
    )
  }

  if (state === 'staging') {
    return (
      <div>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9f9f9'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {user?.email}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setState('dashboard')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            margin: '12px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <JobStaging
          jobs={stagingJobs}
          onJobsChange={handleJobsChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    )
  }

  return null
}

