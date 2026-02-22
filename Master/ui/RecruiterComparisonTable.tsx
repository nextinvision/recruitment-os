'use client'

import React from 'react'
import { Badge } from './Badge'
import Link from 'next/link'

interface RecruiterMetrics {
  recruiterId: string
  period: {
    start: Date | string
    end: Date | string
  }
  jobsScraped: number
  candidatesManaged: number
  applicationsCreated: number
  conversionRates: {
    identifiedToApplied: number
    appliedToInterview: number
    interviewToOffer: number
  }
  averageTimePerStage: {
    stage: string
    averageDays: number
  }[]
}

interface RecruiterComparison {
  recruiter: {
    id: string
    name: string
    email: string
  }
  metrics: RecruiterMetrics
}

interface RecruiterComparisonTableProps {
  data: RecruiterComparison[]
  onRecruiterClick?: (recruiterId: string) => void
}

const STAGE_LABELS: Record<string, string> = {
  IDENTIFIED: 'Identified',
  RESUME_UPDATED: 'Resume Updated',
  COLD_MESSAGE_SENT: 'Cold Message Sent',
  CONNECTION_ACCEPTED: 'Connection Accepted',
  APPLIED: 'Applied',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER: 'Offer',
}

export function RecruiterComparisonTable({ data, onRecruiterClick }: RecruiterComparisonTableProps) {
  const [sortBy, setSortBy] = React.useState<'name' | 'jobs' | 'candidates' | 'applications' | 'conversion'>('applications')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortBy) {
      case 'name':
        aValue = a.recruiter.name
        bValue = b.recruiter.name
        break
      case 'jobs':
        aValue = a.metrics.jobsScraped
        bValue = b.metrics.jobsScraped
        break
      case 'candidates':
        aValue = a.metrics.candidatesManaged
        bValue = b.metrics.candidatesManaged
        break
      case 'applications':
        aValue = a.metrics.applicationsCreated
        bValue = b.metrics.applicationsCreated
        break
      case 'conversion':
        aValue = a.metrics.conversionRates.identifiedToApplied
        bValue = b.metrics.conversionRates.identifiedToApplied
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  return (
    <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB]">
          <thead className="bg-[#1F3A5F]">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Recruiter</span>
                  {sortBy === 'name' && (
                    <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                onClick={() => handleSort('jobs')}
              >
                <div className="flex items-center space-x-1">
                  <span>Jobs Scraped</span>
                  {sortBy === 'jobs' && (
                    <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                onClick={() => handleSort('candidates')}
              >
                <div className="flex items-center space-x-1">
                  <span>Candidates Managed</span>
                  {sortBy === 'candidates' && (
                    <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                onClick={() => handleSort('applications')}
              >
                <div className="flex items-center space-x-1">
                  <span>Applications</span>
                  {sortBy === 'applications' && (
                    <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                onClick={() => handleSort('conversion')}
              >
                <div className="flex items-center space-x-1">
                  <span>Conversion Rate</span>
                  {sortBy === 'conversion' && (
                    <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider align-middle"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E7EB]">
            {sortedData.map((item) => (
              <tr
                key={item.recruiter.id}
                className="hover:bg-[rgba(244,180,0,0.05)] transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap align-middle">
                  <div>
                    <div className="font-medium text-[#1F3A5F]">{item.recruiter.name}</div>
                    <div className="text-sm text-gray-500">{item.recruiter.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-middle">
                  <span className="text-sm text-gray-900">{item.metrics.jobsScraped}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-middle">
                  <span className="text-sm text-gray-900">{item.metrics.candidatesManaged}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-middle">
                  <span className="text-sm text-gray-900">{item.metrics.applicationsCreated}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-middle">
                  <div className="flex flex-col gap-1">
                    <Badge variant="info" className="text-xs">
                      {item.metrics.conversionRates.identifiedToApplied.toFixed(1)}% Id→App
                    </Badge>
                    <Badge variant="success" className="text-xs">
                      {item.metrics.conversionRates.appliedToInterview.toFixed(1)}% App→Int
                    </Badge>
                    <Badge variant="warning" className="text-xs">
                      {item.metrics.conversionRates.interviewToOffer.toFixed(1)}% Int→Off
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-middle">
                  {onRecruiterClick ? (
                    <button
                      onClick={() => onRecruiterClick(item.recruiter.id)}
                      className="text-[#1F3A5F] hover:text-[#0F2A4F] text-sm font-medium"
                    >
                      View Details
                    </button>
                  ) : (
                    <Link
                      href={`/reports?recruiterId=${item.recruiter.id}`}
                      className="text-[#1F3A5F] hover:text-[#0F2A4F] text-sm font-medium"
                    >
                      View Details
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <p className="text-gray-600">No recruiter data available for the selected period.</p>
        </div>
      )}
    </div>
  )
}

