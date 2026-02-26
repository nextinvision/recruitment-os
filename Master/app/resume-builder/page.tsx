'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Button, Spinner, Alert, Modal } from '@/ui'
import { ResumeEditor } from '@/components/resume-builder/ResumeEditor'
import { ResumePreview } from '@/components/resume-builder/ResumePreview'
import {
  createEmptyResumeDocument,
  parsedToResumeDocument,
} from '@/modules/resume-builder/template'
import type { ResumeDocument } from '@/modules/resume-builder/types'

const STORAGE_KEY = 'resume-builder-draft'

export default function ResumeBuilderPage() {
  const [document, setDocument] = useState<ResumeDocument>(createEmptyResumeDocument())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [showTailorModal, setShowTailorModal] = useState(false)
  const [tailorJobId, setTailorJobId] = useState('')
  const [tailorJobTitle, setTailorJobTitle] = useState('')
  const [tailorLoading, setTailorLoading] = useState(false)
  const [tailorResult, setTailorResult] = useState<Record<string, unknown> | null>(null)
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; company: string }>>([])
  const [matchingLoading, setMatchingLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Load from ATS import (sessionStorage), URL params, or localStorage draft
  useEffect(() => {
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const urlClientId = urlParams.get('clientId')
    const urlDraftId = urlParams.get('id')

    if (urlClientId) {
      setClientId(urlClientId)
    }

    if (urlDraftId && token) {
      setLoading(true)
      fetch(`/api/resume-drafts/${urlDraftId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.content) {
            setDocument(data.content)
            setDraftId(data.id)
            if (data.clientId) {
              setClientId(data.clientId)
            }
          }
        })
        .catch(() => { })
        .finally(() => setLoading(false))
      return
    }

    const importData = sessionStorage.getItem('resume-builder-import')
    if (importData) {
      try {
        const parsed = JSON.parse(importData)
        const doc = parsedToResumeDocument(parsed)
        setDocument(doc)
        sessionStorage.removeItem('resume-builder-import')
      } catch {
        // ignore
      }
      return
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const doc = JSON.parse(stored) as ResumeDocument
        setDocument(doc)
      } catch {
        // ignore
      }
    }
  }, [token])

  // Persist to localStorage on change (debounced)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
    }, 500)
    return () => clearTimeout(t)
  }, [document])

  const loadJobs = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/jobs?pageSize=100&status=ACTIVE', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        const list = (data.jobs || []).map((j: { id: string; title: string; company: string }) => ({
          id: j.id,
          title: j.title,
          company: j.company,
        }))
        setJobs(list)
      }
    } catch {
      setJobs([])
    }
  }, [token])

  const loadClients = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/clients?pageSize=100', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch {
      setClients([])
    }
  }, [token])

  useEffect(() => {
    loadJobs()
    loadClients()
  }, [loadJobs, loadClients])

  const handleSaveDraft = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(draftId ? `/api/resume-drafts/${draftId}` : '/api/resume-drafts', {
        method: draftId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({
          content: document,
          clientId: clientId || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      const data = await res.json()
      setDraftId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setImporting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('resume', file)
      const res = await fetch('/api/ai/resume-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setDocument(parsedToResumeDocument(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFindMatches = async () => {
    if (!token) return
    setMatchingLoading(true)
    try {
      const res = await fetch('/api/ai/match-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ resume_data: document, limit: 10 }),
      })
      const data = await res.json()
      if (res.ok && data.matches) {
        setJobs(data.matches.map((m: any) => ({
          id: m.job_id || m.id,
          title: m.title || m.job_title,
          company: m.company,
        })))
      }
    } catch {
      // ignore
    } finally {
      setMatchingLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!previewRef.current) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setError('Pop-up blocked. Please allow pop-ups to export PDF.')
      return
    }

    const content = previewRef.current.outerHTML
    const title = `Resume - ${document.contact.name || 'Resume'}`

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: #f3f4f6;
            }
            @media print {
              body {
                background: white;
              }
              .resume-preview {
                width: 100% !important;
                margin: 0 !important;
                padding: 40pt 45pt !important; /* Force margins from config if needed */
                box-shadow: none !important;
              }
            }
            * {
              box-sizing: border-box;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Wait for content and styles to be ready
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const handleTailor = async () => {
    if (!tailorJobId || !token) return
    setTailorLoading(true)
    setTailorResult(null)
    setError('')
    try {
      const res = await fetch('/api/ai/resume-builder/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          resume_data: document,
          job_id: tailorJobId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Tailoring failed')
      setTailorResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tailoring failed')
    } finally {
      setTailorLoading(false)
    }
  }

  const applySuggestion = (field: string, value: string | string[]) => {
    if (field === 'profile' && typeof value === 'string') {
      setDocument((d) => ({ ...d, profile: value }))
    }
    if (field === 'keywords') {
      const arr = Array.isArray(value) ? value : [value]
      setDocument((d) => ({
        ...d,
        skills: [...new Set([...d.skills, ...arr])],
      }))
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Resume Builder"
          description="Create, edit, and export your resume. Use AI tailoring to optimize for specific jobs."
        />

        {error && (
          <Alert variant="error" className="mb-6" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-careerist-text-secondary whitespace-nowrap">
              For Client:
            </label>
            <select
              className="rounded-md border border-careerist-border bg-careerist-card px-3 py-1.5 text-sm text-careerist-text-primary focus:border-careerist-primary-yellow focus:outline-none"
              value={clientId || ''}
              onChange={(e) => setClientId(e.target.value || null)}
            >
              <option value="">Select a Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="h-6 w-px bg-careerist-border mx-2 hidden sm:block" />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? <Spinner size="sm" className="mr-2" /> : null}
            Import from File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleImportFile}
          />
          <Button variant="secondary" onClick={() => setShowTailorModal(true)}>
            AI Tailor for Job
          </Button>
          <Button onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
            {saving ? <Spinner size="sm" className="mr-2" /> : null}
            Save Draft
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-y-auto">
            <ResumeEditor
              document={document}
              onChange={setDocument}
              onRemoveExperience={(id) =>
                setDocument((d) => ({
                  ...d,
                  experience: d.experience.filter((e) => e.id !== id),
                }))
              }
              onRemoveEducation={(id) =>
                setDocument((d) => ({
                  ...d,
                  education: d.education.filter((e) => e.id !== id),
                }))
              }
            />
          </div>
          <div className="lg:sticky lg:top-6">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Preview</h3>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto rounded bg-white p-6 shadow-sm">
                <ResumePreview ref={previewRef} document={document} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tailor Modal */}
      <Modal
        isOpen={showTailorModal}
        onClose={() => {
          setShowTailorModal(false)
          setTailorResult(null)
        }}
        title="AI Resume Tailoring"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Select Job to Tailor For
              </label>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={tailorJobId}
                onChange={(e) => {
                  const opt = e.target.selectedOptions[0]
                  setTailorJobId(e.target.value)
                  setTailorJobTitle(opt?.text || '')
                }}
              >
                <option value="">Choose a job...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} @ {j.company}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              onClick={handleFindMatches}
              disabled={matchingLoading}
              title="Find jobs that match this resume"
            >
              {matchingLoading ? <Spinner size="sm" /> : 'Find Matches'}
            </Button>
          </div>
          <Button onClick={handleTailor} disabled={!tailorJobId || tailorLoading} className="w-full">
            {tailorLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Get AI Tailoring Suggestions
          </Button>

          {tailorResult && (
            <div className="mt-6 space-y-4 rounded border border-gray-200 p-4">
              {(tailorResult.keywords_to_add as string[])?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-green-700">Keywords to Add</h4>
                  <div className="flex flex-wrap gap-2">
                    {(tailorResult.keywords_to_add as string[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => applySuggestion('keywords', [k])}
                        className="rounded bg-green-100 px-2 py-1 text-xs text-green-800 hover:bg-green-200"
                      >
                        + {k}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {typeof tailorResult.summary_rewrite === 'string' && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-blue-700">Suggested Profile</h4>
                  <p className="mb-2 text-sm text-gray-700">{tailorResult.summary_rewrite}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => applySuggestion('profile', String(tailorResult.summary_rewrite))}
                  >
                    Apply
                  </Button>
                </div>
              )}
              {(tailorResult.tailoring_suggestions as Array<{ section: string; suggested: string; reason: string }>)?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">Suggestions</h4>
                  <ul className="space-y-2">
                    {(tailorResult.tailoring_suggestions as Array<{ section: string; suggested: string; reason: string }>).map((s, i) => (
                      <li key={i} className="rounded bg-gray-50 p-2 text-sm">
                        <div className="font-medium">{s.section}:</div>
                        <div className="text-gray-600">{s.suggested}</div>
                        <div className="text-xs text-gray-500">{s.reason}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {typeof tailorResult.cover_letter === 'string' && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">Cover Letter Opening</h4>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {tailorResult.cover_letter}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  )
}
