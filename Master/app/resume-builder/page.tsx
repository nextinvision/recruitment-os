'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Button, Spinner, Alert, Modal, showToast } from '@/ui'
import { ChevronDown } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'edit' | 'tailor'>('edit')
  const [tailorJobId, setTailorJobId] = useState('')
  const [tailorJobTitle, setTailorJobTitle] = useState('')
  const [tailorLoading, setTailorLoading] = useState(false)
  const [tailorResult, setTailorResult] = useState<Record<string, unknown> | null>(null)
  const [atsScore, setAtsScore] = useState<number | null>(null)
  const [atsAnalysis, setAtsAnalysis] = useState<Record<string, unknown> | null>(null)
  const [atsLoading, setAtsLoading] = useState(false)
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; company: string }>>([])
  const [matchingLoading, setMatchingLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])

  // AI Tailor Enhancements
  const [tailorInputMode, setTailorInputMode] = useState<'search' | 'manual'>('search')
  const [manualJD, setManualJD] = useState('')
  const [jobSearchQuery, setJobSearchQuery] = useState('')
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
            if (data.atsScore !== undefined) setAtsScore(data.atsScore)
            if (data.atsAnalysis !== undefined) setAtsAnalysis(data.atsAnalysis)
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
          atsScore: atsScore !== null ? atsScore : undefined,
          atsAnalysis: atsAnalysis !== null ? atsAnalysis : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      const data = await res.json()
      setDraftId(data.id)
      showToast('Draft saved successfully', 'success')
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

  const handleExportWord = () => {
    if (!previewRef.current) return
    const content = previewRef.current.outerHTML
    const title = `Resume - ${document.contact.name || 'Resume'}`

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .resume-preview { width: 100%; margin: 0; padding: 20px; }
      </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${title}.doc`
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleTailor = async () => {
    const canTailor = tailorInputMode === 'search' ? !!tailorJobId : !!manualJD.trim()
    if (!canTailor || !token) return
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
          job_id: tailorInputMode === 'search' ? tailorJobId : undefined,
          manual_jd: tailorInputMode === 'manual' ? manualJD : undefined,
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

  const applySuggestion = (field: string, value: any) => {
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
    if (field === 'bullet') {
      const { original, suggested } = value
      setDocument((d) => ({
        ...d,
        experience: d.experience.map((exp) => ({
          ...exp,
          bullets: exp.bullets.map((b) => (b === original ? suggested : b)),
        })),
      }))
    }
    if (field === 'section_suggest') {
      const { section, suggested } = value
      if (section === 'profile' || section === 'summary') {
        setDocument((d) => ({ ...d, profile: suggested }))
      } else if (section === 'skills') {
        const arr = suggested.split(',').map((s: string) => s.trim())
        setDocument((d) => ({ ...d, skills: [...new Set([...d.skills, ...arr])] }))
      }
    }
  }

  const handleAnalyzeATS = async () => {
    if (!token) return
    setAtsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/resume-builder/analyze-ats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ resume_data: document }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ATS Analysis failed')
      setAtsScore(data.ats_score)
      setAtsAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ATS Analysis failed')
    } finally {
      setAtsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-theme(spacing.4))] overflow-hidden">
        {/* Compact Header for Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-careerist-border pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-careerist-text-primary">Resume Builder</h1>
            <p className="text-xs text-careerist-text-secondary hidden sm:block">Edit on the left, preview on the right.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <label className="text-xs font-medium text-careerist-text-secondary whitespace-nowrap">
                Client:
              </label>
              <select
                className="rounded-md border border-careerist-border bg-careerist-card px-2 py-1 text-xs text-careerist-text-primary focus:border-careerist-primary-yellow focus:outline-none"
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

            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? <Spinner size="sm" className="mr-2" /> : null}
              Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleImportFile}
            />
            <Button
              variant={activeTab === 'tailor' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('tailor')}
            >
              AI Tailor
            </Button>

            <div className="relative group">
              <Button size="sm" className="flex items-center gap-1 pr-1.5">
                Download
                <ChevronDown className="h-4 w-4" />
              </Button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-careerist-card border border-careerist-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none group-hover:pointer-events-auto">
                <div className="p-1">
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3 py-2 text-xs text-careerist-text-primary hover:bg-careerist-bg-gray rounded-md transition-colors flex items-center gap-2"
                  >
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handleExportWord}
                    className="w-full text-left px-3 py-2 text-xs text-careerist-text-primary hover:bg-careerist-bg-gray rounded-md transition-colors flex items-center gap-2"
                  >
                    <span>Download Word</span>
                  </button>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              Save
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-4" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Main Split Body */}
        <div className="flex flex-1 overflow-hidden gap-6">
          {/* Left: Editor/Tailor Pane */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 mb-4 border-b border-careerist-border pb-px">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px - 4 py - 2 text - sm font - medium transition - colors border - b - 2 ${activeTab === 'edit'
                  ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                  : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary'
                  } `}
              >
                Edit Details
              </button>
              <button
                onClick={() => setActiveTab('tailor')}
                className={`px - 4 py - 2 text - sm font - medium transition - colors border - b - 2 ${activeTab === 'tailor'
                  ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                  : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary'
                  } `}
              >
                AI Tailoring
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeTab === 'edit' ? (
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
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                  <section className="rounded-lg border border-careerist-border bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-careerist-text-primary mb-4">AI Job Matcher</h3>
                    <div className="flex border-b border-gray-100 mb-6">
                      <button
                        className={`px - 4 py - 2 text - sm font - medium transition - colors ${tailorInputMode === 'search'
                          ? 'border-b-2 border-careerist-primary-yellow text-careerist-primary-yellow'
                          : 'text-gray-500 hover:text-gray-700'
                          } `}
                        onClick={() => setTailorInputMode('search')}
                      >
                        Search Database
                      </button>
                      <button
                        className={`px - 4 py - 2 text - sm font - medium transition - colors ${tailorInputMode === 'manual'
                          ? 'border-b-2 border-careerist-primary-yellow text-careerist-primary-yellow'
                          : 'text-gray-500 hover:text-gray-700'
                          } `}
                        onClick={() => setTailorInputMode('manual')}
                      >
                        Paste Job Description
                      </button>
                    </div>

                    {tailorInputMode === 'search' ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-careerist-text-secondary">
                            Find Job Posting
                          </label>
                          {tailorJobId ? (
                            <div className="flex items-center justify-between rounded-lg border border-careerist-primary-yellow bg-yellow-50 px-4 py-3">
                              <div>
                                <div className="font-bold text-careerist-text-primary">{tailorJobTitle.split(' @ ')[0]}</div>
                                <div className="text-xs text-careerist-text-secondary">{tailorJobTitle.split(' @ ')[1]}</div>
                              </div>
                              <button
                                onClick={() => {
                                  setTailorJobId('')
                                  setTailorJobTitle('')
                                }}
                                className="p-1 rounded-full hover:bg-yellow-100 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                className="w-full rounded-lg border border-careerist-border px-4 py-2.5 text-sm focus:border-careerist-primary-yellow focus:ring-1 focus:ring-careerist-primary-yellow focus:outline-none transition-all"
                                placeholder="Search by job title or company..."
                                value={jobSearchQuery}
                                onChange={(e) => setJobSearchQuery(e.target.value)}
                              />
                              {jobSearchQuery.trim() && (
                                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-careerist-border bg-white shadow-xl custom-scrollbar">
                                  {jobs.filter(
                                    (j) =>
                                      j.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                                      j.company.toLowerCase().includes(jobSearchQuery.toLowerCase())
                                  ).length > 0 ? (
                                    jobs
                                      .filter(
                                        (j) =>
                                          j.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                                          j.company.toLowerCase().includes(jobSearchQuery.toLowerCase())
                                      )
                                      .map((j) => (
                                        <button
                                          key={j.id}
                                          className="w-full px-4 py-3 text-left text-sm hover:bg-careerist-bg transition-colors border-b last:border-0 border-gray-50"
                                          onClick={() => {
                                            setTailorJobId(j.id)
                                            setTailorJobTitle(`${j.title} @${j.company} `)
                                            setJobSearchQuery('')
                                          }}
                                        >
                                          <div className="font-bold text-careerist-text-primary uppercase tracking-tight">{j.title}</div>
                                          <div className="text-xs text-careerist-text-secondary mt-0.5">{j.company}</div>
                                        </button>
                                      ))
                                  ) : (
                                    <div className="px-4 py-4 text-sm text-gray-500 text-center italic">No matching jobs found.</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleFindMatches}
                              disabled={matchingLoading}
                            >
                              {matchingLoading ? <Spinner size="sm" /> : '↻ Refresh Available Jobs'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-careerist-text-secondary">
                          Job Description
                        </label>
                        <textarea
                          className="h-40 w-full rounded-lg border border-careerist-border px-4 py-3 text-sm focus:border-careerist-primary-yellow focus:ring-1 focus:ring-careerist-primary-yellow focus:outline-none transition-all"
                          placeholder="Paste the requirements, role description, and responsibilities here for AI analysis..."
                          value={manualJD}
                          onChange={(e) => setManualJD(e.target.value)}
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleTailor}
                      disabled={
                        (tailorInputMode === 'search' && !tailorJobId) ||
                        (tailorInputMode === 'manual' && !manualJD.trim()) ||
                        tailorLoading
                      }
                      className="w-full mt-6 py-3"
                    >
                      {tailorLoading ? <Spinner size="sm" className="mr-2" /> : '✨ Run AI Tailoring Analysis'}
                    </Button>
                  </section>

                  {tailorResult && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                      {(tailorResult.keywords_to_add as string[])?.length > 0 && (
                        <div className="rounded-lg border border-green-100 bg-green-50/50 p-6 shadow-sm">
                          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-green-700 flex items-center">
                            <span className="mr-2">🎯</span> Missing Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(tailorResult.keywords_to_add as string[]).map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => applySuggestion('keywords', [k])}
                                className="rounded-full bg-white border border-green-200 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
                              >
                                + {k}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {typeof tailorResult.summary_rewrite === 'string' && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
                          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-700 flex items-center">
                            <span className="mr-2">📝</span> Suggested Profile Rewrite
                          </h4>
                          <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-inner mb-4">
                            <p className="text-sm leading-relaxed text-gray-800 italic">"{tailorResult.summary_rewrite}"</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => applySuggestion('profile', String(tailorResult.summary_rewrite))}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Apply to Profile
                          </Button>
                        </div>
                      )}

                      {(tailorResult.tailoring_suggestions as Array<any>)?.length > 0 && (
                        <div className="rounded-lg border border-careerist-border bg-white p-6 shadow-sm">
                          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-careerist-text-secondary">
                            Section Optimizations
                          </h4>
                          <div className="space-y-3">
                            {(tailorResult.tailoring_suggestions as Array<any>).map((s, i) => (
                              <div key={i} className="rounded-xl border border-gray-100 bg-careerist-bg p-5 transition-all hover:border-careerist-primary-yellow/30">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="font-bold text-careerist-primary-yellow text-xs uppercase tracking-widest">
                                    {s.section}
                                  </div>
                                  {s.suggested && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() =>
                                        applySuggestion('section_suggest', {
                                          section: s.section,
                                          suggested: s.suggested,
                                        })
                                      }
                                    >
                                      Apply Change
                                    </Button>
                                  )}
                                </div>
                                <div className="text-sm text-careerist-text-primary leading-relaxed">{s.suggested || s.reason}</div>
                                {s.suggested && <div className="mt-3 text-xs text-careerist-text-secondary italic bg-white/50 p-2 rounded border border-gray-50">{s.reason}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(tailorResult.bullets_to_rewrite as Array<any>)?.length > 0 && (
                        <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-6 shadow-sm">
                          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-purple-700">
                            Impact Bullet Rewrites
                          </h4>
                          <div className="space-y-4">
                            {(tailorResult.bullets_to_rewrite as Array<any>).map((b, i) => (
                              <div key={i} className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
                                <div className="mb-4">
                                  <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Current Bullet</span>
                                  <p className="text-xs text-gray-500 line-through mt-1">"{b.original}"</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                  <div className="flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-purple-600">AI Enhanced</span>
                                    <p className="text-sm font-medium text-purple-900 mt-1 leading-relaxed">"{b.suggested}"</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={() =>
                                      applySuggestion('bullet', {
                                        original: b.original,
                                        suggested: b.suggested,
                                      })
                                    }
                                  >
                                    Apply Rewrite
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {typeof tailorResult.cover_letter === 'string' && (
                        <div className="rounded-lg border border-careerist-border bg-white p-6 shadow-sm">
                          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-careerist-text-secondary">
                            Cover Letter Ideas
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-inner">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 italic">
                              {tailorResult.cover_letter}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ATS Analysis Section */}
                  <section className="rounded-lg border border-careerist-border bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500 mt-6">
                    <div className="bg-blue-50 border-b border-blue-100 p-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-careerist-text-primary flex items-center gap-2">
                          <span className="bg-blue-600 text-white rounded p-1 text-xs">ATS</span>
                          ATS Compatibility Scanner
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Check your resume's readability, keyword match, and formatting directly.
                        </p>
                      </div>
                      <Button
                        onClick={handleAnalyzeATS}
                        disabled={atsLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {atsLoading ? <Spinner size="sm" className="mr-2" /> : 'Run ATS Scan'}
                      </Button>
                    </div>

                    {atsScore !== null && atsAnalysis && (
                      <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                            Overall Score
                          </span>
                          <span className={`text - 2xl font - bold ${atsScore >= 80 ? 'text-green-600' :
                            atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            } `}>
                            {atsScore}/100
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          {[
                            { label: 'Readability', score: atsAnalysis.readability_score as number || 0, color: 'bg-blue-500' },
                            { label: 'Keywords', score: atsAnalysis.keyword_score as number || 0, color: 'bg-indigo-500' },
                            { label: 'Impact / Metrics', score: atsAnalysis.impact_score as number || 0, color: 'bg-purple-500' },
                          ].map((s) => (
                            <div key={s.label}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
                                <span className="text-xs font-bold text-gray-900">{s.score}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${s.color} transition-all duration-1000`}
                                  style={{ width: `${s.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                          {/* Formatting Issues */}
                          <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-red-700 mb-4 uppercase tracking-wide">
                              <span className="mr-1">⚠️</span> Formatting Red Flags
                            </h4>
                            <ul className="space-y-3">
                              {(atsAnalysis.formatting_issues as string[])?.map((issue, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100 text-sm text-red-900">
                                  <span className="shrink-0 mt-0.5">•</span>
                                  {issue}
                                </li>
                              )) || <p className="text-sm text-gray-400 italic">No formatting issues detected.</p>}
                            </ul>
                          </div>

                          {/* Recommendations */}
                          <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-green-700 mb-4 uppercase tracking-wide">
                              <span className="mr-1">✅</span> Recommendations
                            </h4>
                            <ul className="space-y-3">
                              {(atsAnalysis.actionable_recommendations as string[])?.map((rec, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100 text-sm text-green-900 font-medium">
                                  <span className="shrink-0 mt-0.5">•</span>
                                  {rec}
                                </li>
                              )) || <p className="text-sm text-gray-400 italic">Looking solid! No specific recommendations.</p>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview Pane */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-careerist-border bg-gray-100 flex flex-col pt-0 custom-scrollbar shadow-inner">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-careerist-border px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-careerist-text-secondary">
                Live Preview
              </span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
              </div>
            </div>
            <div className="p-8 flex flex-col items-center flex-1">
              <div className="scale-75 sm:scale-90 md:scale-100 origin-top bg-white shadow-2xl transition-transform duration-300">
                <ResumePreview ref={previewRef} document={document} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </DashboardLayout>
  )
}
