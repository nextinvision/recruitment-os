import React from 'react'
import Link from 'next/link'

interface RecruiterMetrics {
  recruiterId: string
  period: {
    start: string
    end: string
  }
  jobsScraped: number
  candidatesManaged: number
  applicationsCreated: number
  conversionRates: {
    identifiedToApplied: number
    appliedToInterview: number
    interviewToOffer: number
  }
}

interface RecruiterComparison {
  recruiter: {
    id: string
    name: string
    email: string
  }
  metrics: RecruiterMetrics
}

interface RecruiterComparisonWidgetProps {
  comparison: RecruiterComparison[]
}

export function RecruiterComparisonWidget({ comparison }: RecruiterComparisonWidgetProps) {
  if (comparison.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Recruiter Performance Comparison</h3>
        <p className="text-sm text-[#64748B]">No recruiter data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0F172A]">Recruiter Performance Comparison</h3>
        <Link href="/reports" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
          View detailed reports
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB]">
          <thead className="bg-[#F8F9FA]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Recruiter
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Jobs
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Candidates
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Applications
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider">
                Conversion Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E7EB]">
            {comparison.map((item) => (
              <tr key={item.recruiter.id} className="hover:bg-[rgba(244,180,0,0.05)] transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#0F172A]">{item.recruiter.name}</div>
                  <div className="text-xs text-[#64748B]">{item.recruiter.email}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-[#0F172A]">
                  {item.metrics.jobsScraped}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-[#0F172A]">
                  {item.metrics.candidatesManaged}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-[#0F172A]">
                  {item.metrics.applicationsCreated}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <div className="text-[#0F172A] font-medium">
                    {item.metrics.conversionRates.interviewToOffer.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[#64748B]">
                    Interview → Offer
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

