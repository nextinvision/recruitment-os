'use client'

import React from 'react'
import { Select, Input } from './index'

export interface ActivityFilters {
  leadId?: string
  clientId?: string
  assignedUserId?: string
  type?: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP'
  startDate?: string
  endDate?: string
  search?: string
}

interface ActivityFiltersProps {
  filters: ActivityFilters
  onChange: (filters: ActivityFilters) => void
  onClear?: () => void
  recruiters?: Array<{ id: string; firstName: string; lastName: string }>
  leads?: Array<{ id: string; firstName: string; lastName: string; currentCompany?: string }>
  clients?: Array<{ id: string; firstName: string; lastName: string }>
}

const ACTIVITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'CALL', label: 'Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'NOTE', label: 'Note' },
  { value: 'TASK', label: 'Task' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
]

export function ActivityFilters({ filters, onChange, onClear, recruiters, leads, clients }: ActivityFiltersProps) {
  const updateFilter = (key: keyof ActivityFilters, value: any) => {
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
          placeholder="Search activities..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        <Select
          label="Type"
          value={filters.type || ''}
          onChange={(e) => updateFilter('type', e.target.value)}
          options={ACTIVITY_TYPES}
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

        {leads && leads.length > 0 && (
          <Select
            label="Lead"
            value={filters.leadId || ''}
            onChange={(e) => updateFilter('leadId', e.target.value)}
            options={[
              { value: '', label: 'All Leads' },
              ...leads.map(l => ({
                value: l.id,
                label: `${l.firstName} ${l.lastName}` + (l.currentCompany ? ` (${l.currentCompany})` : ''),
              })),
            ]}
          />
        )}

        {clients && clients.length > 0 && (
          <Select
            label="Client"
            value={filters.clientId || ''}
            onChange={(e) => updateFilter('clientId', e.target.value)}
            options={[
              { value: '', label: 'All Clients' },
              ...clients.map(c => ({
                value: c.id,
                label: `${c.firstName} ${c.lastName}`,
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
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onClear ? onClear() : onChange({})}
          className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}

