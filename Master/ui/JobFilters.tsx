'use client'

import React from 'react'
import { Select, Input } from './index'

export interface JobFilters {
  source?: string
  status?: string
  recruiterId?: string
  startDate?: string
  endDate?: string
  search?: string
  isDuplicate?: boolean
}

interface JobFiltersProps {
  filters: JobFilters
  onChange: (filters: JobFilters) => void
  recruiters?: Array<{ id: string; firstName: string; lastName: string }>
}

export function JobFilters({ filters, onChange, recruiters }: JobFiltersProps) {
  const updateFilter = (key: keyof JobFilters, value: any) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB] mb-6">
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Search"
          type="text"
          placeholder="Search jobs..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        <Select
          label="Source"
          value={filters.source || ''}
          onChange={(e) => updateFilter('source', e.target.value)}
          options={[
            { value: '', label: 'All Sources' },
            { value: 'LINKEDIN', label: 'LinkedIn' },
            { value: 'INDEED', label: 'Indeed' },
            { value: 'NAUKRI', label: 'Naukri' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />

        <Select
          label="Status"
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'CLOSED', label: 'Closed' },
            { value: 'FILLED', label: 'Filled' },
          ]}
        />

        {recruiters && recruiters.length > 0 && (
          <Select
            label="Recruiter"
            value={filters.recruiterId || ''}
            onChange={(e) => updateFilter('recruiterId', e.target.value)}
            options={[
              { value: '', label: 'All Recruiters' },
              ...recruiters.map(r => ({
                value: r.id,
                label: `${r.firstName} ${r.lastName}`,
              })),
            ]}
          />
        )}

        <Input
          label="Start Date"
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => updateFilter('startDate', e.target.value)}
        />

        <Input
          label="End Date"
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => updateFilter('endDate', e.target.value)}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDuplicate"
            checked={filters.isDuplicate || false}
            onChange={(e) => updateFilter('isDuplicate', e.target.checked)}
            className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] rounded focus:ring-[#F4B400]"
          />
          <label htmlFor="isDuplicate" className="ml-2 text-sm text-[#0F172A]">
            Show Duplicates Only
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onChange({})}
          className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}

