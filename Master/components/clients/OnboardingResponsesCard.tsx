'use client'

import { buildOnboardingDisplayRows, type OnboardingDisplayRow } from '@/modules/onboarding-forms/present-submission'

export type OnboardingSubmissionForOverview = {
  id: string
  submittedAt: string
  data: Record<string, unknown>
  form: {
    id: string
    title: string
    description: string | null
    fields: unknown
  }
}

function RowView({ row }: { row: OnboardingDisplayRow }) {
  if (row.kind === 'section') {
    return (
      <div className="col-span-1 sm:col-span-2 pt-2 mt-2 border-t border-careerist-border first:mt-0 first:pt-0 first:border-0">
        <h4 className="text-sm font-semibold text-careerist-primary-navy">{row.title}</h4>
      </div>
    )
  }
  return (
    <div className="min-w-0">
      <label className="text-sm font-medium text-careerist-text-secondary">{row.label}</label>
      <p className="text-careerist-text-primary whitespace-pre-wrap break-words mt-0.5">{row.value}</p>
    </div>
  )
}

/** Shared grid for onboarding answers (CRM cards, submission preview modal, etc.). */
export function OnboardingSubmissionFieldsDisplay({
  fields,
  data,
}: {
  fields: unknown
  data: Record<string, unknown>
}) {
  const rows = buildOnboardingDisplayRows(fields, data)
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No responses recorded.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {rows.map((row, idx) => (
        <RowView
          key={row.kind === 'field' ? `f-${row.fieldKey}-${idx}` : `s-${idx}`}
          row={row}
        />
      ))}
    </div>
  )
}

export function OnboardingResponsesCard({ submissions }: { submissions: OnboardingSubmissionForOverview[] }) {
  if (!submissions || submissions.length === 0) return null

  return (
    <div className="space-y-6">
      {submissions.map((sub) => {
        if (buildOnboardingDisplayRows(sub.form.fields, sub.data).length === 0) return null
        return (
          <div
            key={sub.id}
            className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-careerist-text-primary">Onboarding form</h2>
                <p className="text-sm font-medium text-careerist-text-primary mt-0.5">{sub.form.title}</p>
                {sub.form.description && (
                  <p className="text-xs text-careerist-text-secondary mt-1">{sub.form.description}</p>
                )}
              </div>
              <p className="text-xs text-careerist-text-secondary whitespace-nowrap">
                Submitted {new Date(sub.submittedAt).toLocaleString()}
              </p>
            </div>
            <OnboardingSubmissionFieldsDisplay fields={sub.form.fields} data={sub.data} />
          </div>
        )
      })}
    </div>
  )
}
