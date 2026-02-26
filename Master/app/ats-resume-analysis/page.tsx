'use client'

import { useState, useCallback, useRef } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Button, Spinner, Alert } from '@/ui'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedResume {
  name?: string
  skills: string[]
  experience_years: number
  summary?: string
  education?: string[]
  contact?: Record<string, string>
  raw_text?: string
  ats_score?: number
  readability_score?: number
  keyword_score?: number
  impact_score?: number
  formatting_issues?: string[]
  actionable_recommendations?: string[]
}

interface JobMatch {
  job_id?: string
  id?: string
  job_title?: string
  title?: string
  company?: string
  match_percentage?: number
  score?: number
  location?: string
  salaryRange?: string
  salary?: string
  sourceUrl?: string
  matching_skills?: string[]
  missing_skills?: string[]
  explanation?: string
  recommendation?: string
  source?: string
}

type Step = 'upload' | 'parsed' | 'matching' | 'results'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ATSResumeAnalysisPage() {
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null)
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [dbJobCount, setDbJobCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // ─── Step 1: Upload & Parse ─────────────────────────────────────────────────

  const handleFile = useCallback(async (selectedFile: File) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(pdf|doc|docx)$/i)) {
      setError('Only PDF, DOC, and DOCX files are allowed.')
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.')
      return
    }

    setFile(selectedFile)
    setError('')
    setLoading(true)

    try {
      const form = new FormData()
      form.append('resume', selectedFile)

      const res = await fetch('/api/ai/resume-upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: form,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse resume')
      }

      setResumeData(data)
      setStep('parsed')
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [handleFile])

  // ─── Step 2: Match against DB jobs ──────────────────────────────────────────

  const handleMatch = async () => {
    if (!resumeData) return
    setStep('matching')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/match-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ resume_data: resumeData, limit: 50 }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Matching failed')
      }

      setMatches(data.matches || [])
      setDbJobCount(data.db_job_count ?? 0)
      setStep('results')
    } catch (err: any) {
      setError(err.message || 'Failed to match jobs.')
      setStep('parsed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setResumeData(null)
    setMatches([])
    setError('')
    setDbJobCount(0)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="AI Resume Analysis"
          description="Upload a resume to parse skills and match against jobs in your database using Gemini AI"
        />

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-6 mb-8">
          {(['upload', 'parsed', 'results'] as const).map((s, i) => {
            const labels = ['Upload Resume', 'Review Parse', 'Job Matches']
            const done = step === 'results' || (step === 'parsed' && i === 0)
            const active = step === s || (step === 'matching' && s === 'results')
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${done ? 'bg-green-500 text-white' :
                  active ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                  {done && i < ['upload', 'parsed', 'results'].indexOf(step) ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                  {labels[i]}
                </span>
                {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
              </div>
            )
          })}
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
            {error.includes('No active jobs') && (
              <span className="block mt-1 text-sm">
                Go to <strong>Jobs → Fetch Jobs tab</strong> to populate the database first.
              </span>
            )}
          </Alert>
        )}

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Upload Resume</h2>
              <p className="text-sm text-gray-500 mt-1">PDF, DOC, or DOCX — max 10 MB</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Spinner />
                  <p className="text-gray-500 text-sm">Parsing resume with AI...</p>
                </div>
              ) : (
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-700">
                        {dragging ? 'Drop file here' : 'Drag & drop your resume'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                      Choose File
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Parsed Results ── */}
        {step === 'parsed' && resumeData && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resume Parsed {resumeData.name ? `— ${resumeData.name}` : ''}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">{file?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('resume-builder-import', JSON.stringify(resumeData))
                        window.location.href = '/resume-builder'
                      }
                    }}
                  >
                    Open in Resume Builder →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={reset}>Upload New</Button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Detected Skills ({resumeData.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.length > 0 ? resumeData.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                        {skill}
                      </span>
                    )) : <span className="text-gray-400 text-sm">No skills detected</span>}
                  </div>
                </div>

                {/* Summary Info */}
                <div className="space-y-3">
                  {resumeData.experience_years > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</span>
                      <p className="text-sm text-gray-800 mt-1">{resumeData.experience_years} year{resumeData.experience_years !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {resumeData.summary && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</span>
                      <p className="text-sm text-gray-800 mt-1 line-clamp-3">{resumeData.summary}</p>
                    </div>
                  )}
                  {resumeData.education && resumeData.education.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Education</span>
                      <ul className="mt-1 space-y-0.5">
                        {resumeData.education.map((edu, i) => (
                          <li key={i} className="text-sm text-gray-800">{edu}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── ATS Report Card ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900">Enterprise ATS Report Card</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Overall Score:</span>
                  <span className={`text-xl font-bold ${(resumeData.ats_score || 0) >= 80 ? 'text-green-600' :
                    (resumeData.ats_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {resumeData.ats_score || 0}/100
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Score Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Readability', score: resumeData.readability_score || 0, color: 'bg-blue-500' },
                    { label: 'Keywords', score: resumeData.keyword_score || 0, color: 'bg-indigo-500' },
                    { label: 'Impact / Metrics', score: resumeData.impact_score || 0, color: 'bg-purple-500' },
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                  {/* Formatting Issues */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-red-700 mb-4 uppercase tracking-wide">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Formatting Red Flags ({resumeData.formatting_issues?.length || 0})
                    </h4>
                    <ul className="space-y-3">
                      {resumeData.formatting_issues?.map((issue, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-900">
                          <span className="shrink-0 mt-0.5">•</span>
                          {issue}
                        </li>
                      )) || <p className="text-sm text-gray-400 italic">No formatting issues detected.</p>}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-green-700 mb-4 uppercase tracking-wide">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Actionable Recommendations
                    </h4>
                    <ul className="space-y-3">
                      {resumeData.actionable_recommendations?.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100 text-sm text-green-900 font-medium">
                          <span className="shrink-0 text-green-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          {rec}
                        </li>
                      )) || <p className="text-sm text-gray-400 italic">Looking solid! No specific recommendations.</p>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Match CTA */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Ready to find matching jobs?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gemini AI will score your resume against all active jobs in the database.
                </p>
              </div>
              <Button onClick={handleMatch} className="shrink-0">
                Match Against DB Jobs →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2.5: Matching Spinner ── */}
        {step === 'matching' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 flex flex-col items-center gap-6">
            <Spinner />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">Gemini AI is analysing your resume…</p>
              <p className="text-sm text-gray-500 mt-2">Scoring your skills against jobs in the database. This may take 10–30 seconds.</p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Results ── */}
        {step === 'results' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {matches.length} Job Match{matches.length !== 1 ? 'es' : ''} Found
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Scored against {dbJobCount} active jobs in your database
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('parsed')}>← Back to Report</Button>
                <Button variant="secondary" onClick={reset}>New Resume</Button>
              </div>
            </div>

            {/* Persistence of ATS Score in Results */}
            {resumeData && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-1 rounded-md text-xs font-bold">ATS</div>
                  <span className="text-sm font-medium text-blue-900">Your Resume ATS Score:</span>
                </div>
                <span className={`text-lg font-bold ${(resumeData.ats_score || 0) >= 80 ? 'text-green-600' :
                  (resumeData.ats_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {resumeData.ats_score || 0}/100
                </span>
              </div>
            )}

            {matches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No matches found. Try fetching more jobs from the Jobs page first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match, idx) => {
                  const title = match.job_title || match.title || 'Unknown Role'
                  const score = match.match_percentage ?? match.score ?? 0
                  const scoreColor =
                    score >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
                      score >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'

                  return (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${scoreColor}`}>
                              {score}% match
                            </span>
                            {match.source && (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                                {match.source}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {match.company}
                            {match.location ? ` · ${match.location}` : ''}
                            {(match.salaryRange || match.salary) ? ` · ${match.salaryRange || match.salary}` : ''}
                          </p>
                        </div>

                        {/* Score bar */}
                        <div className="shrink-0 w-24">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 text-right mt-1">{score}%</p>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {match.matching_skills && match.matching_skills.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">✓ Matching Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {match.matching_skills.map((s) => (
                                <span key={s} className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {match.missing_skills && match.missing_skills.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">✗ Missing Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {match.missing_skills.map((s) => (
                                <span key={s} className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      {match.explanation && (
                        <p className="mt-3 text-sm text-gray-600 italic border-l-2 border-blue-200 pl-3">{match.explanation}</p>
                      )}
                      {match.recommendation && (
                        <p className="mt-2 text-xs font-medium text-blue-700">{match.recommendation}</p>
                      )}

                      {/* Apply link */}
                      {match.sourceUrl && (
                        <div className="mt-4">
                          <a
                            href={match.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Apply Now
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout >
  )
}
