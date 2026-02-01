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
      const result = await chrome.storage.local.get(['auth_token', 'user_data'])
      console.log('[checkAuth] Storage result:', { hasToken: !!result.auth_token, hasUser: !!result.user_data })
      
      if (result.auth_token && result.user_data) {
        console.log('[checkAuth] User authenticated via storage')
        setUser(result.user_data)
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
      const result = await chrome.storage.local.get(['staging_jobs'])
      if (result.staging_jobs) {
        setStagingJobs(result.staging_jobs)
      }
    } catch (storageErr) {
      console.error('[loadStagingJobs] Storage fallback failed:', storageErr)
    }
  }

  const listenForCapturedJobs = () => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'JOBS_CAPTURED') {
        const newJobs = message.jobs || []
        setStagingJobs(prev => [...prev, ...newJobs])
        saveStagingJobs([...stagingJobs, ...newJobs])
      }
    })
  }

  const saveStagingJobs = async (jobs: ScrapedJob[]) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_STAGING_JOBS',
        jobs,
      })
    } catch (err) {
      console.error('Failed to save staging jobs:', err)
    }
  }

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    console.log('[handleLogin] Starting login for:', credentials.email)

    try {
      // Use direct API call as primary method (more reliable than service worker)
      // Service workers can be terminated/sleeping, causing delays
      const loginResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (loginResponse.ok) {
        const data = await loginResponse.json()
        console.log('[handleLogin] Login successful, user:', data.user?.email)
        
        // Store token and user data
        await chrome.storage.local.set({
          [STORAGE_KEYS.TOKEN]: data.token,
          [STORAGE_KEYS.USER]: data.user,
        })
        
        setUser(data.user)
        setState('dashboard')
      } else {
        const errorData = await loginResponse.json().catch(() => ({}))
        const errorMsg = errorData.error || `Login failed: ${loginResponse.statusText}`
        console.error('[handleLogin] Login failed:', errorMsg)
        setError(errorMsg)
      }
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
    try {
      await chrome.runtime.sendMessage({ type: 'LOGOUT' })
      setUser(null)
      setStagingJobs([])
      setState('login')
    } catch (err) {
      console.error('Logout failed:', err)
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
        source: job.source.toUpperCase() as 'LINKEDIN' | 'INDEED' | 'NAUKRI',
      }))

      const response = await chrome.runtime.sendMessage({
        type: 'SUBMIT_JOBS',
        jobs: jobInputs,
      })

      if (response?.success) {
        // Remove submitted jobs from staging
        const submittedIds = new Set(jobs.map(j => j.id))
        const remainingJobs = stagingJobs.filter(j => !submittedIds.has(j.id))
        setStagingJobs(remainingJobs)
        saveStagingJobs(remainingJobs)

        alert(`Successfully submitted ${response.data.count} job(s)!`)
      } else {
        setError(response?.error || 'Submission failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
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

