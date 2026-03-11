'use client'

import React from 'react'
import { Select, Input } from './index'

export interface JobFilters {
  source?: string
  status?: string
  jobType?: string
  recruiterId?: string
  startDate?: string
  endDate?: string
  search?: string
  isDuplicate?: boolean
  title?: string
  company?: string
  location?: string
  skills?: string
  ctcRange?: string
  yearsOfExperience?: string
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
    <div className="bg-white shadow-xl rounded-2xl p-8 border border-[#E5E7EB] mb-8 transition-all hover:shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#0F172A]">Advanced Filters</h3>
        <button
          onClick={() => onChange({})}
          className="text-sm font-semibold text-[#6366F1] hover:text-[#4F46E5] transition-colors flex items-center gap-1 bg-[#EEF2FF] px-3 py-1.5 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Reset All
        </button>
      </div>

      <div className="space-y-6">
        {/* Main Search and Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Quick Search"
            type="text"
            placeholder="Search titles, companies, description..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="focus:ring-2 focus:ring-[#6366F1] border-gray-200"
          />

          <Select
            label="Job Source"
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
            label="Job Status"
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'CLOSED', label: 'Closed' },
              { value: 'FILLED', label: 'Filled' },
            ]}
          />
        </div>

        <div className="h-px bg-gray-100 my-4" />

        {/* Granular Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Input
            label="Job Title"
            type="text"
            placeholder="e.g. Frontend Developer"
            value={filters.title || ''}
            onChange={(e) => updateFilter('title', e.target.value)}
          />

          <Input
            label="Company"
            type="text"
            placeholder="e.g. Google"
            value={filters.company || ''}
            onChange={(e) => updateFilter('company', e.target.value)}
          />

          <Input
            label="Location"
            type="text"
            placeholder="e.g. Bangalore, Remote"
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value)}
          />

          <Select
            label="Job Type"
            value={filters.jobType || ''}
            onChange={(e) => updateFilter('jobType', e.target.value)}
            options={[
              { value: '', label: 'Select Type' },
              { value: 'ONSITE', label: 'Onsite' },
              { value: 'HYBRID', label: 'Hybrid' },
              { value: 'REMOTE', label: 'Remote' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Key Skills"
            type="text"
            placeholder="React, Node.js (comma separated)"
            value={filters.skills || ''}
            onChange={(e) => updateFilter('skills', e.target.value)}
          />

          <Input
            label="CTC Range"
            type="text"
            placeholder="e.g. 15-25 LPA"
            value={filters.ctcRange || ''}
            onChange={(e) => updateFilter('ctcRange', e.target.value)}
          />

          <Input
            label="Experience"
            type="text"
            placeholder="e.g. 3-5 years"
            value={filters.yearsOfExperience || ''}
            onChange={(e) => updateFilter('yearsOfExperience', e.target.value)}
          />
        </div>

        <div className="h-px bg-gray-100 my-4" />

        {/* Date and Recruiter Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          {recruiters && recruiters.length > 0 && (
            <Select
              label="Assigned Recruiter"
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
            label="Posted From"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => updateFilter('startDate', e.target.value)}
          />

          <Input
            label="Posted To"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => updateFilter('endDate', e.target.value)}
          />

          <div className="flex items-center h-10 px-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="isDuplicate"
              checked={filters.isDuplicate || false}
              onChange={(e) => updateFilter('isDuplicate', e.target.checked)}
              className="h-5 w-5 text-[#6366F1] border-gray-300 rounded focus:ring-[#6366F1] cursor-pointer"
            />
            <label htmlFor="isDuplicate" className="ml-3 text-sm font-medium text-[#1E293B] cursor-pointer">
              Show Duplicates Only
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

