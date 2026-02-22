'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader } from '@/ui'

export default function ATSResumeAnalysisPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="AI Resume Analysis"
          description="Analyze resumes against job descriptions and match candidates to opportunities"
        />
        <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-careerist-yellow-light text-careerist-primary-navy mb-6">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-careerist-text-primary">Coming soon</h2>
            <p className="mt-2 text-careerist-text-secondary max-w-md mx-auto">
              AI resume parsing, scoring, and job–resume matching will be available here. You’ll be able to upload resumes, run analysis, and see match scores against your jobs.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
