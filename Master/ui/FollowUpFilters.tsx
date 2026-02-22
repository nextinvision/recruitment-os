'use client'

import React from 'react'
import { Select, Input } from './index'

export interface FollowUpFilters {
  leadId?: string
  clientId?: string
  assignedUserId?: string
  completed?: boolean
  overdue?: boolean
  entityType?: string
  startDate?: string
  endDate?: string
  search?: string
}

interface FollowUpFiltersProps {
  filters: FollowUpFilters
  onChange: (filters: FollowUpFilters) => void
  recruiters?: Array<{ id: string; firstName: string; lastName: string }>
  leads?: Array<{ id: string; firstName: string; lastName: string; currentCompany?: string }>
  clients?: Array<{ id: string; firstName: string; lastName: string }>
}

export function FollowUpFilters({ filters, onChange, recruiters, leads, clients }: FollowUpFiltersProps) {
  const updateFilter = (key: keyof FollowUpFilters, value: any) => {
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
          placeholder="Search follow-ups..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        <Select
          label="Status"
          value={filters.completed !== undefined ? (filters.completed ? 'completed' : 'pending') : ''}
          onChange={(e) => {
            if (e.target.value === 'completed') {
              updateFilter('completed', true)
            } else if (e.target.value === 'pending') {
              updateFilter('completed', false)
            } else {
              updateFilter('completed', undefined)
            }
          }}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ]}
        />

        <Select
          label="Entity Type"
          value={filters.entityType || ''}
          onChange={(e) => updateFilter('entityType', e.target.value)}
          options={[
            { value: '', label: 'All Types' },
            { value: 'lead', label: 'Leads Only' },
            { value: 'client', label: 'Clients Only' },
            { value: 'all', label: 'All Entities' },
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

        <div className="flex items-center">
          <input
            type="checkbox"
            id="overdue"
            checked={filters.overdue || false}
            onChange={(e) => updateFilter('overdue', e.target.checked)}
            className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] rounded focus:ring-[#F4B400]"
          />
          <label htmlFor="overdue" className="ml-2 text-sm text-[#0F172A]">
            Overdue Only
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

