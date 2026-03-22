'use client'

import { useState } from 'react'
import { Button, Input, Select, Alert, Spinner, useToast } from '@/ui'
import { GoogleSearchEmbed } from './GoogleSearchEmbed'
import {
  JOBSPY_PLATFORMS,
  JOBSPY_DEFAULT_PLATFORMS,
  type JobSpyPlatformValue,
} from '@/modules/jobs/jobspy-platforms'

interface FetchStatus {
  source: string
  status: 'idle' | 'fetching' | 'success' | 'error'
  fetched: number
  stored: number
  skipped: number
  error?: string
}

interface JobFetchPanelProps {
  onFetchComplete?: () => void
}

export function JobFetchPanel({ onFetchComplete }: JobFetchPanelProps) {
  const { showToast, removeToast } = useToast()
  const [query, setQuery] = useState('software engineer')
  const [location, setLocation] = useState('')
  const [limit, setLimit] = useState(50)
  const [fetchStatuses, setFetchStatuses] = useState<Record<string, FetchStatus>>({})
  const [isFetching, setIsFetching] = useState(false)
  const [activeSource, setActiveSource] = useState<string>('ALL')
  const [showEmbeddedSearch, setShowEmbeddedSearch] = useState(false)
  const [jobSpyCountry, setJobSpyCountry] = useState('india')
  const [jobSpySites, setJobSpySites] = useState<JobSpyPlatformValue[]>([...JOBSPY_DEFAULT_PLATFORMS])
  
  // Get search engine ID from environment (will be passed from parent or use default)
  const searchEngineId = 'c146913a207604fe4' // Default from .env, can be made configurable

  const sources = [
    { value: 'ALL', label: 'All Sources', description: 'Fetch from multiple job boards' },
    { value: 'JOBSPY', label: 'JobSpy', description: 'Indeed, LinkedIn, Naukri, Glassdoor, and more' },
    { value: 'GOOGLE', label: 'Goole search', description: 'Search across' },
    { value: 'ADZUNA', label: 'Job aggregator', description: 'Global job listings' },
  ]

  const handleFetch = async (source: string) => {
    setIsFetching(true)
    setActiveSource(source)

    // Initialize status for this source
    setFetchStatuses(prev => ({
      ...prev,
      [source]: {
        source,
        status: 'fetching',
        fetched: 0,
        stored: 0,
        skipped: 0,
      },
    }))

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showToast('Please log in to fetch jobs', 'error')
        return
      }

      const requestBody: Record<string, unknown> = {
        query: query.trim() || 'software engineer',
        location: location.trim() || undefined,
        source: source === 'ALL' ? 'ALL' : source,
        limit: limit,
      }

      if (source === 'JOBSPY') {
        requestBody.country = jobSpyCountry.trim() || 'india'
        requestBody.sites = jobSpySites.length > 0 ? jobSpySites : JOBSPY_DEFAULT_PLATFORMS
      }

      // Remove empty location to avoid sending empty string
      if (!requestBody.location) {
        delete requestBody.location
      }

      const response = await fetch('/api/jobs/fetch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch jobs' }))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        
        // Show user-friendly error messages (no technical/API details)
        if (errorMessage.includes('not enabled') || errorMessage.includes('API key') || errorMessage.includes('credentials')) {
          throw new Error('Search service is not available. Please try again later or contact support.')
        } else if (errorMessage.includes('Validation error')) {
          throw new Error(`Invalid request: ${errorMessage}`)
        } else {
          throw new Error(errorMessage)
        }
      }

      const data = await response.json()

      setFetchStatuses(prev => ({
        ...prev,
        [source]: {
          source,
          status: 'success',
          fetched: data.fetched || 0,
          stored: data.stored || 0,
          skipped: data.skipped || 0,
        },
      }))

      const sourceLabel = sources.find((s) => s.value === source)?.label ?? 'source'
      showToast(
        `Successfully fetched ${data.fetched} jobs from ${source === 'ALL' ? 'all sources' : sourceLabel}. ${data.stored} new jobs stored.`,
        'success'
      )

      if (onFetchComplete) {
        onFetchComplete()
      }
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs'
      if (
        source === 'JOBSPY' &&
        (errorMessage.includes('429') || errorMessage.includes('Max retries') || errorMessage.includes('google.com'))
      ) {
        errorMessage =
          'One of the selected sources is temporarily unavailable. Try changing your platform selection and try again.'
      }

      setFetchStatuses(prev => ({
        ...prev,
        [source]: {
          source,
          status: 'error',
          fetched: 0,
          stored: 0,
          skipped: 0,
          error: errorMessage,
        },
      }))

      const sourceLabel = sources.find((s) => s.value === source)?.label ?? 'source'
      showToast(`Error fetching from ${sourceLabel}: ${errorMessage}`, 'error')
    } finally {
      setIsFetching(false)
    }
  }

  const handleFetchAll = async () => {
    // Fetch from all sources sequentially
    for (const source of ['GOOGLE', 'ADZUNA']) {
      await handleFetch(source)
      // Small delay between sources to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const getStatusColor = (status: FetchStatus['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'fetching':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: FetchStatus['status']) => {
    switch (status) {
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'fetching':
        return <Spinner size="sm" />
      default:
        return '○'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Fetch Jobs from External Sources</h2>
        <p className="text-sm text-gray-600">
          Search and import jobs from multiple job boards and aggregators
        </p>
      </div>

      {/* Search Form */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title / Keywords
            </label>
            <Input
              type="text"
              placeholder="e.g., software engineer, data scientist"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., San Francisco, Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Jobs
            </label>
            <Select
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
              options={[
                { value: '10', label: '10 jobs' },
                { value: '25', label: '25 jobs' },
                { value: '50', label: '50 jobs' },
                { value: '100', label: '100 jobs' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Options when JobSpy source is selected */}
      {activeSource === 'JOBSPY' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-sm font-medium text-amber-800 mb-2">Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-1">Country</label>
              <Input
                type="text"
                placeholder="e.g. usa, india, uk"
                value={jobSpyCountry}
                onChange={(e) => setJobSpyCountry(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-1">Platforms</label>
              <p className="text-xs text-amber-600 mb-2">Select one or more job boards to fetch from.</p>
              <div className="flex flex-wrap gap-3">
                {JOBSPY_PLATFORMS.map((platform) => {
                  const isChecked = jobSpySites.includes(platform.value as JobSpyPlatformValue)
                  return (
                    <label
                      key={platform.value}
                      className="inline-flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setJobSpySites(jobSpySites.filter((s) => s !== platform.value))
                          } else {
                            setJobSpySites([...jobSpySites, platform.value as JobSpyPlatformValue])
                          }
                        }}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-amber-900">
                        {platform.label}
                        {platform.warning && (
                          <span className="ml-1 text-amber-600 font-normal" title={platform.warning}>
                            (may fail)
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-amber-600 mt-1">Fetch is capped at 25 jobs per run to avoid timeout.</p>
            </div>
          </div>
        </div>
      )}

      {/* Source Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map((source) => {
            const status = fetchStatuses[source.value]
            const isActive = activeSource === source.value
            const isCurrentlyFetching = isFetching && isActive

            return (
              <div
                key={source.value}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => !isFetching && setActiveSource(source.value)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{source.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{source.description}</p>
                  </div>
                  {status && (
                    <span className={`text-lg ${getStatusColor(status.status)}`}>
                      {getStatusIcon(status.status)}
                    </span>
                  )}
                </div>
                {status && status.status !== 'idle' && (
                  <div className="mt-2 text-xs space-y-1">
                    {status.status === 'success' && (
                      <>
                        <div className="text-green-600">
                          Fetched: {status.fetched} | Stored: {status.stored}
                        </div>
                        {status.skipped > 0 && (
                          <div className="text-gray-500">Skipped: {status.skipped} duplicates</div>
                        )}
                      </>
                    )}
                    {status.status === 'error' && (
                      <div className="text-red-600">{status.error}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleFetch(activeSource)}
          disabled={isFetching}
          className="flex-1"
        >
          {isFetching && activeSource === activeSource ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Fetching from {sources.find(s => s.value === activeSource)?.label}...
            </>
          ) : (
            `Fetch from ${sources.find(s => s.value === activeSource)?.label}`
          )}
        </Button>
        {activeSource === 'ALL' && (
          <Button
            onClick={handleFetchAll}
            disabled={isFetching}
            variant="secondary"
          >
            Fetch from All Sources
          </Button>
        )}
      </div>

      {/* Status Summary */}
      {Object.keys(fetchStatuses).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Fetch Status</h3>
          <div className="space-y-2">
            {Object.values(fetchStatuses).map((status) => (
              <div
                key={status.source}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${getStatusColor(status.status)}`}>
                    {getStatusIcon(status.status)}
                  </span>
                  <span className="text-sm text-gray-700">
                    {sources.find(s => s.value === status.source)?.label || status.source}
                  </span>
                </div>
                {status.status === 'success' && (
                  <div className="text-xs text-gray-600">
                    {status.fetched} fetched, {status.stored} stored
                  </div>
                )}
                {status.status === 'error' && (
                  <div className="text-xs text-red-600">{status.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle between fetch and embedded search */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Search options</h3>
          <button
            onClick={() => setShowEmbeddedSearch(!showEmbeddedSearch)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showEmbeddedSearch ? '← Back to fetch' : 'Try live search →'}
          </button>
        </div>
        
        {showEmbeddedSearch ? (
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Live search</h4>
            <p className="text-sm text-gray-600 mb-4">
              Search jobs below. Results appear as you type.
            </p>
            <GoogleSearchEmbed searchEngineId={searchEngineId} />
          </div>
        ) : (
          <Alert variant="info">
            <div className="text-sm">
              <strong>Note:</strong> Jobs are automatically deduplicated before storing. 
              Only new jobs that don't already exist in your database will be added.
            </div>
          </Alert>
        )}
      </div>
    </div>
  )
}

