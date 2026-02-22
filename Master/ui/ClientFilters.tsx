'use client'

import React from 'react'
import { Select, Input } from './index'

export interface ClientFilters {
  status?: string
  assignedUserId?: string
  industry?: string
  startDate?: string
  endDate?: string
  search?: string
  hasSkills?: boolean
}

interface ClientFiltersProps {
  filters: ClientFilters
  onChange: (filters: ClientFilters) => void
  recruiters?: Array<{ id: string; firstName: string; lastName: string }>
}

export function ClientFilters({ filters, onChange, recruiters }: ClientFiltersProps) {
  const updateFilter = (key: keyof ClientFilters, value: any) => {
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
          placeholder="Search clients..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        <Select
          label="Status"
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
        />

        {recruiters && recruiters.length > 0 && (
          <Select
            label="Assigned To"
            value={filters.assignedUserId || ''}
            onChange={(e) => updateFilter('assignedUserId', e.target.value)}
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
          label="Industry"
          type="text"
          placeholder="Filter by industry..."
          value={filters.industry || ''}
          onChange={(e) => updateFilter('industry', e.target.value)}
        />

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
            id="hasSkills"
            checked={filters.hasSkills || false}
            onChange={(e) => updateFilter('hasSkills', e.target.checked)}
            className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] rounded focus:ring-[#F4B400]"
          />
          <label htmlFor="hasSkills" className="ml-2 text-sm text-[#0F172A]">
            Has Skills
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

