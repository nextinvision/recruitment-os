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
    // Auto-select all valid jobs
    const validJobIds = jobs.filter(j => j.isValid).map(j => j.id)
    setSelectedIds(new Set(validJobIds))
  }, [jobs])

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const validJobIds = jobs.filter(j => j.isValid).map(j => j.id)
    setSelectedIds(new Set(validJobIds))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleDelete = (id: string) => {
    onJobsChange(jobs.filter(j => j.id !== id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
  }

  const handleSaveEdit = (updatedJob: ScrapedJob) => {
    onJobsChange(jobs.map(j => j.id === updatedJob.id ? updatedJob : j))
    setEditingId(null)
  }

  const handleCancelEdit = () => {
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

  const validJobs = jobs.filter(j => j.isValid)
  const invalidJobs = jobs.filter(j => !j.isValid)

  return (
    <div>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>
          Staging Area
        </h3>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Review and edit captured jobs before submitting
        </p>
      </div>

      {jobs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          No jobs in staging area. Capture jobs from a supported job portal.
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

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {jobs.map(job => {
              if (editingId === job.id) {
                return (
                  <JobEditor
                    key={job.id}
                    job={job}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                  />
                )
              }

              return (
                <div
                  key={job.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: job.isValid ? 'white' : '#fff5f5'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={() => handleToggleSelect(job.id)}
                      disabled={!job.isValid}
                      style={{ marginTop: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
                        {job.title || '(No title)'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                        {job.company || '(No company)'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {job.location || '(No location)'}
                      </div>
                      {job.description && (
                        <div style={{
                          fontSize: '11px',
                          color: '#999',
                          marginTop: '4px',
                          maxHeight: '40px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {job.description.substring(0, 100)}...
                        </div>
                      )}
                      {job.errors.length > 0 && (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px',
                          backgroundColor: '#fee',
                          color: '#c33',
                          fontSize: '11px',
                          borderRadius: '4px'
                        }}>
                          {job.errors.join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        onClick={() => handleEdit(job.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: '#fee',
                          border: '1px solid #fcc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#c33'
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
            padding: '12px',
            borderTop: '1px solid #ddd',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {validJobs.length} valid, {invalidJobs.length} invalid
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedIds.size === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: isSubmitting || selectedIds.size === 0 ? '#ccc' : '#0073b1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting || selectedIds.size === 0 ? 'not-allowed' : 'pointer'
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

