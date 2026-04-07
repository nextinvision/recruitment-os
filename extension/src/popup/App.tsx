import React, { useState, useEffect } from 'react'
import { LoginForm } from './LoginForm'
import { JobStaging } from './JobStaging'
import { LoginCredentials, ScrapedJob, LoginResponse } from '../shared/types'
import { getBackendUrl, STORAGE_KEYS } from '../shared/constants'
import { validateJob } from '../shared/validation'

type View = 'loading' | 'login' | 'staging'

/**
 * Single gate that ensures every job object has isValid/errors
 * before it enters React state. Prevents undefined-access crashes
 * regardless of whether jobs come from storage, messages, or edits.
 */
function normalize(raw: any[]): ScrapedJob[] {
  if (!Array.isArray(raw)) return []
  return raw.map((j: any) => {
    if (j.isValid !== undefined && Array.isArray(j.errors)) return j as ScrapedJob
    const v = validateJob(j)
    return {
      id: j.id || `job-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: j.title || '',
      company: j.company || '',
      location: j.location || '',
      description: j.description || '',
      source: j.source || 'other',
      sourceUrl: j.sourceUrl || '',
      isValid: v.isValid,
      errors: v.errors,
    }
  })
}

export const App: React.FC = () => {
  const [view, setView] = useState<View>('loading')
  const [user, setUser] = useState<LoginResponse['user'] | null>(null)
  const [jobs, setJobs] = useState<ScrapedJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setView('login'), 2000)

    const init = async () => {
      await checkAuth()
      await loadJobs()
      clearTimeout(timeout)
    }
    init()
    listenForCapturedJobs()

    return () => clearTimeout(timeout)
  }, [])

  // ── Auth ────────────────────────────────────────────────────────

  const checkAuth = async () => {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER])
      if (result[STORAGE_KEYS.TOKEN] && result[STORAGE_KEYS.USER]) {
        setUser(result[STORAGE_KEYS.USER])
        setView('staging')
      } else {
        setView('login')
      }
    } catch {
      setView('login')
    }
  }

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      const baseUrl = await getBackendUrl()
      const resp = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'extension' },
        body: JSON.stringify(credentials),
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        const msg = typeof data.error === 'string' ? data.error : `Login failed (${resp.status})`
        setError(msg)
        return
      }

      const data: LoginResponse = await resp.json()
      await chrome.storage.local.set({
        [STORAGE_KEYS.TOKEN]: data.token,
        [STORAGE_KEYS.USER]: data.user,
      })
      setUser(data.user)
      setView('staging')
      await loadJobs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER, STORAGE_KEYS.STAGING_JOBS])
    setUser(null)
    setJobs([])
    setView('login')
  }

  // ── Jobs ────────────────────────────────────────────────────────

  const loadJobs = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.STAGING_JOBS)
      const raw = result[STORAGE_KEYS.STAGING_JOBS]
      if (raw) setJobs(normalize(raw))
    } catch { /* ignore */ }
  }

  const saveJobs = async (updated: ScrapedJob[]) => {
    setJobs(updated)
    await chrome.storage.local.set({ [STORAGE_KEYS.STAGING_JOBS]: updated })
  }

  const listenForCapturedJobs = () => {
    chrome.runtime.onMessage.addListener((msg: any) => {
      if (msg.type === 'JOBS_CAPTURED') {
        const incoming = normalize(msg.jobs)
        setJobs(prev => {
          const ids = new Set(prev.map(j => j.id))
          const fresh = incoming.filter(j => !ids.has(j.id))
          if (fresh.length === 0) return prev
          const merged = [...prev, ...fresh]
          chrome.storage.local.set({ [STORAGE_KEYS.STAGING_JOBS]: merged })
          return merged
        })
      }
      return true
    })
  }

  const handleSubmit = async (selected: ScrapedJob[]) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const baseUrl = await getBackendUrl()
      const token = (await chrome.storage.local.get(STORAGE_KEYS.TOKEN))[STORAGE_KEYS.TOKEN]
      if (!token) { setError('Not authenticated'); return }

      const payload = selected.map(({ id, isValid, errors, ...rest }) => ({
        ...rest,
        source: rest.source.toUpperCase(),
      }))

      const resp = await fetch(`${baseUrl}/api/jobs/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ jobs: payload }),
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        let msg = `Submit failed (${resp.status})`
        if (typeof data.error === 'string') msg = data.error
        else if (Array.isArray(data.error)) {
          msg = data.error
            .map((err: any) =>
              typeof err === 'string' ? err : err?.message || err?.path?.join?.('.') || 'Invalid value'
            )
            .join('; ')
        } else if (data.error?.message) msg = data.error.message
        setError(msg)
        return
      }

      const result = await resp.json()
      const submittedIds = new Set(selected.map(j => j.id))
      const remaining = jobs.filter(j => !submittedIds.has(j.id))
      await saveJobs(remaining)
      alert(`Submitted ${result.count} job(s) to dashboard!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  if (view === 'loading') {
    return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading...</div>
  }

  if (view === 'login') {
    return <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
  }

  return (
    <div>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f9f9f9',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{user?.email}</div>
        </div>
        <button onClick={handleLogout} style={{
          padding: '6px 14px', fontSize: 12, background: '#f0f0f0',
          border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer',
        }}>
          Logout
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, margin: 12, background: '#fee', color: '#c33', borderRadius: 4, fontSize: 13 }}>
          {error}
        </div>
      )}

      <JobStaging
        jobs={jobs}
        onJobsChange={saveJobs}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
