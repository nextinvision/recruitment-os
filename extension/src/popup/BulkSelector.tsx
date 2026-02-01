import React from 'react'
import { ScrapedJob } from '../shared/types'

interface BulkSelectorProps {
  jobs: ScrapedJob[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export const BulkSelector: React.FC<BulkSelectorProps> = ({
  jobs,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}) => {
  const validJobs = jobs.filter(j => j.isValid)
  const allSelected = validJobs.length > 0 && validJobs.every(j => selectedIds.has(j.id))

  return (
    <div style={{
      padding: '12px',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>
        {selectedIds.size} of {validJobs.length} jobs selected
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
    </div>
  )
}

