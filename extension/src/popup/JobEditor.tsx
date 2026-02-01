import React, { useState, useEffect } from 'react'
import { ScrapedJob } from '../shared/types'
import { validateJob } from '../shared/validation'

interface JobEditorProps {
  job: ScrapedJob
  onSave: (job: ScrapedJob) => void
  onCancel: () => void
}

export const JobEditor: React.FC<JobEditorProps> = ({ job, onSave, onCancel }) => {
  const [editedJob, setEditedJob] = useState<ScrapedJob>({ ...job })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const validation = validateJob(editedJob)
    setErrors(validation.errors)
  }, [editedJob])

  const handleChange = (field: keyof ScrapedJob, value: string) => {
    setEditedJob(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const validation = validateJob(editedJob)
    if (validation.isValid) {
      onSave({ ...editedJob, isValid: true, errors: [] })
    } else {
      setErrors(validation.errors)
    }
  }

  return (
    <div style={{
      padding: '16px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      marginBottom: '12px',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
          Title *
        </label>
        <input
          type="text"
          value={editedJob.title}
          onChange={(e) => handleChange('title', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
          Company *
        </label>
        <input
          type="text"
          value={editedJob.company}
          onChange={(e) => handleChange('company', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
          Location *
        </label>
        <input
          type="text"
          value={editedJob.location}
          onChange={(e) => handleChange('location', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
          Description *
        </label>
        <textarea
          value={editedJob.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
            resize: 'vertical'
          }}
        />
      </div>

      {errors.length > 0 && (
        <div style={{
          padding: '8px',
          marginBottom: '12px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSave}
          disabled={errors.length > 0}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: errors.length > 0 ? '#ccc' : '#0073b1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: errors.length > 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#ddd',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

