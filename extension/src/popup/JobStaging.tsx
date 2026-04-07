import React, { useState, useEffect } from 'react'
import { ScrapedJob } from '../shared/types'
import { JobEditor } from './JobEditor'
import { BulkSelector } from './BulkSelector'

interface JobStagingProps {
  jobs: ScrapedJob[]
  onJobsChange: (jobs: ScrapedJob[]) => void
  onSubmit: (jobs: ScrapedJob[]) => Promise<void>
  isSubmitting: boolean
}

export const JobStaging: React.FC<JobStagingProps> = ({
  jobs,
  onJobsChange,
  onSubmit,
  isSubmitting,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const validJobIds = jobs.filter(j => j.isValid).map(j => j.id)
    setSelectedIds(new Set(validJobIds))
  }, [jobs])

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(jobs.filter(j => j.isValid).map(j => j.id)))
  }

  const handleDeselectAll = () => setSelectedIds(new Set())

  const handleDelete = (id: string) => {
    onJobsChange(jobs.filter(j => j.id !== id))
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const handleSaveEdit = (updatedJob: ScrapedJob) => {
    onJobsChange(jobs.map(j => j.id === updatedJob.id ? updatedJob : j))
    setEditingId(null)
  }

  const handleSubmit = async () => {
    const selectedJobs = jobs.filter(j => selectedIds.has(j.id) && j.isValid)
    if (selectedJobs.length === 0) {
      alert('Please select at least one valid job to submit.')
      return
    }
    await onSubmit(selectedJobs)
  }

  const validCount = jobs.filter(j => j.isValid).length
  const invalidCount = jobs.length - validCount

  return (
    <div>
      <div style={{ padding: 16, borderBottom: '1px solid #ddd', background: '#f9f9f9' }}>
        <h3 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Staging Area</h3>
        <p style={{ fontSize: 12, color: '#666' }}>Review and edit captured jobs before submitting</p>
      </div>

      {jobs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          No jobs in staging area. Use "Scan Jobs" on any job page to capture listings.
        </div>
      ) : (
        <>
          <BulkSelector
            jobs={jobs}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {jobs.map(job => {
              if (editingId === job.id) {
                return (
                  <JobEditor
                    key={job.id}
                    job={job}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                )
              }

              const errors = job.errors || []

              return (
                <div
                  key={job.id}
                  style={{
                    padding: 12,
                    borderBottom: '1px solid #eee',
                    background: job.isValid ? 'white' : '#fff5f5',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={() => handleToggleSelect(job.id)}
                      disabled={!job.isValid}
                      style={{ marginTop: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                        {job.title || '(No title)'}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                        {job.company || '(No company)'}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                        {job.location || '(No location)'}
                      </div>
                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block', fontSize: 11, color: '#0073b1', marginBottom: 4,
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden',
                          }}
                        >
                          {job.sourceUrl}
                        </a>
                      )}
                      {job.description && (
                        <div style={{
                          fontSize: 11, color: '#999', marginTop: 4,
                          maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {job.description.substring(0, 100)}...
                        </div>
                      )}
                      {errors.length > 0 && (
                        <div style={{
                          marginTop: 8, padding: 6,
                          background: '#fee', color: '#c33',
                          fontSize: 11, borderRadius: 4,
                        }}>
                          {errors.join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        onClick={() => setEditingId(job.id)}
                        style={{
                          padding: '4px 8px', fontSize: 11,
                          background: '#f0f0f0', border: '1px solid #ddd',
                          borderRadius: 4, cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        style={{
                          padding: '4px 8px', fontSize: 11,
                          background: '#fee', border: '1px solid #fcc',
                          borderRadius: 4, cursor: 'pointer', color: '#c33',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            padding: 12, borderTop: '1px solid #ddd', background: '#f9f9f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              {validCount} valid, {invalidCount} invalid
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedIds.size === 0}
              style={{
                padding: '10px 20px',
                background: isSubmitting || selectedIds.size === 0 ? '#ccc' : '#0073b1',
                color: 'white', border: 'none', borderRadius: 4,
                fontSize: 14, fontWeight: 600,
                cursor: isSubmitting || selectedIds.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Submitting...' : `Submit ${selectedIds.size} Job(s)`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
