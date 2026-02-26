'use client'

import { useState } from 'react'
import { Button, Input, Select, Alert, Spinner } from '@/ui'

interface GoogleFetchStats {
    fetched: number
    stored: number
    skipped: number
}

interface GoogleFetchPanelProps {
    onFetchComplete?: () => void
}

/**
 * GoogleFetchPanel
 *
 * Dedicated panel for fetching jobs via Google Jobs API (SerpApi) through the
 * Python backend (/api/fetch-jobs → SerpApi with pagination).
 *
 * Completely separate from JobFetchPanel — does not share state or components.
 * Stores fetched jobs in PostgreSQL via /api/jobs/fetch (source: SERPAPI).
 */
export function GoogleFetchPanel({ onFetchComplete }: GoogleFetchPanelProps) {
    const [query, setQuery] = useState('software engineer')
    const [location, setLocation] = useState('India')
    const [limit, setLimit] = useState(100)
    const [skills, setSkills] = useState('')

    const [status, setStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle')
    const [stats, setStats] = useState<GoogleFetchStats | null>(null)
    const [error, setError] = useState('')
    const [previewJobs, setPreviewJobs] = useState<any[]>([])

    const handleFetch = async () => {
        setStatus('fetching')
        setError('')
        setStats(null)
        setPreviewJobs([])

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                setError('Please log in to fetch jobs.')
                setStatus('error')
                return
            }

            const skillsList = skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)

            // Build query string from skills if no explicit query was set
            const searchQuery = query.trim() || (skillsList.length > 0 ? skillsList.join(' ') : 'software engineer')

            const response = await fetch('/api/jobs/fetch', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    source: 'SERPAPI',
                    query: searchQuery,
                    location: location.trim() || 'India',
                    limit,
                    // Pass skills so Python backend can use them for smarter title matching
                    skills: skillsList,
                }),
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'Unknown error' }))
                throw new Error(errData.error || `HTTP ${response.status}`)
            }

            const data = await response.json()

            setStats({
                fetched: data.fetched ?? 0,
                stored: data.stored ?? 0,
                skipped: data.skipped ?? 0,
            })
            setPreviewJobs(data.jobs || [])
            setStatus('success')

            if (onFetchComplete) onFetchComplete()
        } catch (err: any) {
            setError(err.message || 'Failed to fetch from Google Jobs API.')
            setStatus('error')
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Google Jobs Fetch (SerpApi)</h2>
                        <p className="text-sm text-gray-500">
                            Fetches real Google Jobs listings with pagination — up to 100 jobs per search title, saved to your database.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Info banner */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <strong>How it works:</strong> Uses SerpApi Google Jobs API (10 jobs/page, paginated) via your Python backend.
                        All fetched jobs are deduplicated before saving — jobs already in your database are skipped automatically.
                    </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Job Title / Keywords
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., React Developer, Data Scientist"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={status === 'fetching'}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Location
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., India, Bangalore, Remote"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={status === 'fetching'}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Skills (comma-separated, optional)
                            <span className="ml-1 text-xs text-gray-400 font-normal">— used to generate smarter search titles</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Python, React, AWS, TypeScript"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            disabled={status === 'fetching'}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Max Jobs to Fetch
                        </label>
                        <Select
                            value={String(limit)}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            disabled={status === 'fetching'}
                            options={[
                                { value: '25', label: '25 jobs (fast)' },
                                { value: '50', label: '50 jobs' },
                                { value: '100', label: '100 jobs (recommended)' },
                                { value: '200', label: '200 jobs' },
                                { value: '500', label: '500 jobs (max, slow)' },
                            ]}
                        />
                    </div>
                </div>

                {/* Error */}
                {status === 'error' && error && (
                    <Alert variant="error">{error}</Alert>
                )}

                {/* Success Stats */}
                {status === 'success' && stats && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">{stats.fetched}</p>
                            <p className="text-sm text-green-600 mt-1">Jobs Fetched</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700">{stats.stored}</p>
                            <p className="text-sm text-blue-600 mt-1">New Jobs Saved</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-gray-600">{stats.skipped}</p>
                            <p className="text-sm text-gray-500 mt-1">Duplicates Skipped</p>
                        </div>
                    </div>
                )}

                {/* Fetch Button */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleFetch}
                        disabled={status === 'fetching'}
                        className="min-w-[180px]"
                    >
                        {status === 'fetching' ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Fetching Google Jobs…
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                                </svg>
                                Fetch from Google Jobs
                            </>
                        )}
                    </Button>

                    {status === 'fetching' && (
                        <p className="text-sm text-gray-500">
                            This may take 30–120 seconds depending on the limit. Please wait…
                        </p>
                    )}

                    {status === 'success' && (
                        <Button variant="secondary" onClick={() => { setStatus('idle'); setStats(null); setPreviewJobs([]) }}>
                            Fetch Again
                        </Button>
                    )}
                </div>

                {/* Preview of first 5 fetched jobs */}
                {status === 'success' && previewJobs.length > 0 && (
                    <div className="border-t border-gray-100 pt-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            Preview — First {Math.min(previewJobs.length, 5)} of {stats?.fetched} fetched jobs
                        </h3>
                        <div className="space-y-2">
                            {previewJobs.slice(0, 5).map((job: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{job.title || 'Unknown Role'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {job.company || '—'} · {job.location || '—'}
                                            {(job.salary || job.salaryRange) ? ` · ${job.salary || job.salaryRange}` : ''}
                                        </p>
                                    </div>
                                    {(job.url || job.sourceUrl) && (
                                        <a
                                            href={job.url || job.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline shrink-0"
                                        >
                                            View ↗
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                            All {stats?.stored} new jobs are now saved in your database. View them in the All Jobs tab.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
