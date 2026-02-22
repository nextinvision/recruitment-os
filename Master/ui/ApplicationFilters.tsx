'use client'

import React from 'react'
import { Select, Input } from './index'
import { ApplicationStage } from '@prisma/client'

export interface ApplicationFilters {
  stage?: string
  recruiterId?: string
  startDate?: string
  endDate?: string
  search?: string
  hasFollowUp?: boolean
  overdueFollowUps?: boolean
}

interface ApplicationFiltersProps {
  filters: ApplicationFilters
  onChange: (filters: ApplicationFilters) => void
  recruiters?: Array<{ id: string; firstName: string; lastName: string }>
}

const STAGE_LABELS: Record<string, string> = {
  IDENTIFIED: 'Identified',
  RESUME_UPDATED: 'Resume Updated',
  COLD_MESSAGE_SENT: 'Cold Message Sent',
  CONNECTION_ACCEPTED: 'Connection Accepted',
  APPLIED: 'Applied',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
}

export function ApplicationFilters({ filters, onChange, recruiters }: ApplicationFiltersProps) {
  const updateFilter = (key: keyof ApplicationFilters, value: any) => {
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
          placeholder="Search applications..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        <Select
          label="Stage"
          value={filters.stage || ''}
          onChange={(e) => updateFilter('stage', e.target.value)}
          options={[
            { value: '', label: 'All Stages' },
            ...Object.entries(STAGE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
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
            id="hasFollowUp"
            checked={filters.hasFollowUp || false}
            onChange={(e) => updateFilter('hasFollowUp', e.target.checked)}
            className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] rounded focus:ring-[#F4B400]"
          />
          <label htmlFor="hasFollowUp" className="ml-2 text-sm text-[#0F172A]">
            Has Follow-up
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="overdueFollowUps"
            checked={filters.overdueFollowUps || false}
            onChange={(e) => updateFilter('overdueFollowUps', e.target.checked)}
            className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] rounded focus:ring-[#F4B400]"
          />
          <label htmlFor="overdueFollowUps" className="ml-2 text-sm text-[#0F172A]">
            Overdue Follow-ups
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

