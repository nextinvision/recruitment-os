'use client'

import { Button, Input } from '@/ui'
import type { ReportOutreachCustomFieldRow } from '@/modules/clients/report-outreach-fields'

export function ReportOutreachCustomFieldsEditor({
  rows,
  onChange,
}: {
  rows: ReportOutreachCustomFieldRow[]
  onChange: (rows: ReportOutreachCustomFieldRow[]) => void
}) {
  const addRow = () => {
    onChange([...rows, { id: crypto.randomUUID(), label: '', value: '' }])
  }

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id))
  }

  const updateRow = (
    id: string,
    patch: Partial<Pick<ReportOutreachCustomFieldRow, 'label' | 'value'>>
  ) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-careerist-text-secondary">
        Add any metrics you track (e.g. &quot;InMails sent&quot;, &quot;Coffee chats&quot;). Only rows with a <strong>field name</strong> are saved.
      </p>
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 rounded-lg border border-careerist-border bg-careerist-bg-secondary/40"
        >
          <Input
            label="Field name"
            value={row.label}
            onChange={(e) => updateRow(row.id, { label: e.target.value })}
            placeholder="e.g. InMails sent"
          />
          <Input
            label="Value"
            value={row.value}
            onChange={(e) => updateRow(row.id, { value: e.target.value })}
            placeholder="e.g. 24"
          />
          <Button type="button" variant="secondary" className="shrink-0" onClick={() => removeRow(row.id)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={addRow}>
        Add custom field
      </Button>
    </div>
  )
}
