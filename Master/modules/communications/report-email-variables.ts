import type { NextRequest } from 'next/server'
import { getPublicAppUrl } from '@/lib/public-url'
import type { ReportOutreachCustomFieldRow } from '@/modules/clients/report-outreach-fields'

export type ApplicationPipelineLogSnapshot = {
    id: string
    applicationId: string
    jobTitle: string | null
    company: string | null
    stage: string
    actionType: string
    description: string | null
    performedAt: string | Date
    performedBy: string
}

export type ClientMetricsSnapshot = {
    funnelPerformance: Array<{ stage: string; count: number }>
    activityDistribution: Array<{ type: string; count: number }>
    /** From Client record; embedded in shared report & template variables */
    referralsSentCount?: number | null
    connectionRequestsSentCount?: number | null
    /** Applications → Log Action (per application), scoped to this client */
    applicationPipelineLog?: ApplicationPipelineLogSnapshot[]
    /** User-defined outreach rows from Client.reportOutreachCustomFields */
    reportOutreachCustomFields?: ReportOutreachCustomFieldRow[]
}

/**
 * Plain-text summary of funnel + activities for email templates ({{reportSummary}}).
 */
export function formatReportSummaryPlain(data: ClientMetricsSnapshot): string {
    const lines: string[] = ['Application pipeline', '—'.repeat(40)]
    const withApps = data.funnelPerformance.filter((f) => f.count > 0)
    if (withApps.length === 0) {
        lines.push('(No applications in pipeline yet.)')
    } else {
        for (const f of withApps) {
            const label = f.stage.replace(/_/g, ' ')
            lines.push(`• ${label}: ${f.count}`)
        }
    }
    lines.push('')
    lines.push('Activity distribution', '—'.repeat(40))
    if (data.activityDistribution.length === 0) {
        lines.push('(No activities recorded.)')
    } else {
        for (const a of data.activityDistribution) {
            lines.push(`• ${a.type}: ${a.count}`)
        }
    }

    const pipeline = data.applicationPipelineLog ?? []
    if (pipeline.length > 0) {
        lines.push('')
        lines.push('Application pipeline log', '—'.repeat(40))
        for (const a of pipeline) {
            const when = formatWhen(a.performedAt)
            const role = [a.jobTitle, a.company].filter(Boolean).join(' · ') || 'Role TBD'
            const label = a.actionType.replace(/_/g, ' ')
            const desc = a.description?.trim()
            lines.push(`• ${when} — ${a.performedBy}`)
            lines.push(`  ${role} · Stage ${a.stage.replace(/_/g, ' ')} · ${label}`)
            if (desc) lines.push(`  ${desc.replace(/\n/g, ' ')}`)
        }
    }

    const customOutreach = data.reportOutreachCustomFields ?? []
    const hasBuiltinOutreach =
        data.referralsSentCount != null || data.connectionRequestsSentCount != null
    const hasCustomOutreach = customOutreach.length > 0
    if (hasBuiltinOutreach || hasCustomOutreach) {
        lines.push('')
        lines.push('Outreach', '—'.repeat(40))
        if (data.referralsSentCount != null || data.connectionRequestsSentCount != null) {
            lines.push(
                `• Referrals sent: ${data.referralsSentCount != null ? String(data.referralsSentCount) : '—'}`
            )
            lines.push(
                `• Connection requests sent: ${data.connectionRequestsSentCount != null ? String(data.connectionRequestsSentCount) : '—'}`
            )
        }
        for (const row of customOutreach) {
            lines.push(`• ${row.label}: ${row.value.trim() !== '' ? row.value : '—'}`)
        }
    }
    return lines.join('\n')
}

function formatWhen(d: string | Date): string {
    try {
        return new Date(d).toLocaleString()
    } catch {
        return String(d)
    }
}

/**
 * Minimal HTML block for HTML email templates ({{reportSummaryHtml}}).
 */
export function formatReportSummaryHtml(data: ClientMetricsSnapshot): string {
    const funnel = data.funnelPerformance
        .filter((f) => f.count > 0)
        .map((f) => `<li><strong>${escapeHtml(f.stage.replace(/_/g, ' '))}</strong>: ${f.count}</li>`)
        .join('')
    const acts = data.activityDistribution
        .map((a) => `<li><strong>${escapeHtml(a.type)}</strong>: ${a.count}</li>`)
        .join('')
    const customOutreach = data.reportOutreachCustomFields ?? []
    const hasBuiltinOutreach =
        data.referralsSentCount != null || data.connectionRequestsSentCount != null
    const hasCustomOutreach = customOutreach.length > 0
    const outreachBlock =
        hasBuiltinOutreach || hasCustomOutreach
            ? `
  <p style="margin: 16px 0 8px 0; font-weight: bold;">Outreach</p>
  <ul style="margin: 0; padding-left: 20px;">
    ${hasBuiltinOutreach ? `<li><strong>Referrals sent</strong>: ${data.referralsSentCount != null ? escapeHtml(String(data.referralsSentCount)) : '—'}</li>
    <li><strong>Connection requests sent</strong>: ${data.connectionRequestsSentCount != null ? escapeHtml(String(data.connectionRequestsSentCount)) : '—'}</li>` : ''}
    ${customOutreach
        .map(
            (row) =>
                `<li><strong>${escapeHtml(row.label)}</strong>: ${escapeHtml(row.value.trim() !== '' ? row.value : '—')}</li>`
        )
        .join('')}
  </ul>`
            : ''

    const pipeline = data.applicationPipelineLog ?? []
    const pipelineBlock =
        pipeline.length > 0
            ? `
  <p style="margin: 16px 0 8px 0; font-weight: bold;">Application pipeline log</p>
  <ul style="margin: 0 0 16px 0; padding-left: 20px;">
    ${pipeline
        .map((a) => {
            const role = [a.jobTitle, a.company].filter(Boolean).join(' · ') || 'Role TBD'
            const head = `${escapeHtml(formatWhen(a.performedAt))} — ${escapeHtml(a.performedBy)} · ${escapeHtml(role)} · ${escapeHtml(a.stage.replace(/_/g, ' '))} · ${escapeHtml(a.actionType.replace(/_/g, ' '))}`
            const desc = a.description?.trim()
            return `<li><strong style="display:block;margin-bottom:4px;">${head}</strong>${desc ? `<span style="color:#444;">${escapeHtml(desc)}</span>` : ''}</li>`
        })
        .join('')}
  </ul>`
            : ''

    return `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
  <p style="margin: 0 0 8px 0; font-weight: bold;">Application pipeline</p>
  <ul style="margin: 0 0 16px 0; padding-left: 20px;">${funnel || '<li>(No applications yet)</li>'}</ul>
  <p style="margin: 0 0 8px 0; font-weight: bold;">Activity distribution</p>
  <ul style="margin: 0 0 16px 0; padding-left: 20px;">${acts || '<li>(No activities yet)</li>'}</ul>${pipelineBlock}${outreachBlock}
</div>`.trim()
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export function buildReportEmailVariables(params: {
    request: NextRequest
    client: { firstName: string; lastName: string; email: string | null }
    snapshotToken: string
    metrics: ClientMetricsSnapshot
}): Record<string, string> {
    const base = getPublicAppUrl(params.request)
    const reportLink = `${base}/public/reports/${params.snapshotToken}`
    const { client, metrics } = params
    const fullName = `${client.firstName} ${client.lastName}`.trim()

    const ref = metrics.referralsSentCount
    const conn = metrics.connectionRequestsSentCount
    const customRows = metrics.reportOutreachCustomFields ?? []
    const outreachCustomPlain = customRows.map((r) => `${r.label}: ${r.value || '—'}`).join('\n')
    const outreachCustomHtml =
        customRows.length > 0
            ? `<ul style="margin:0;padding-left:20px;">${customRows
                  .map(
                      (r) =>
                          `<li><strong>${escapeHtml(r.label)}</strong>: ${escapeHtml(r.value.trim() !== '' ? r.value : '—')}</li>`
                  )
                  .join('')}</ul>`
            : ''

    return {
        firstName: client.firstName,
        lastName: client.lastName,
        fullName,
        /** Same as fullName — use in templates as Dear {{clientName}} */
        clientName: fullName,
        email: client.email || '',
        reportLink,
        reportUrl: reportLink,
        publicReportUrl: reportLink,
        link: reportLink,
        reportSummary: formatReportSummaryPlain(metrics),
        reportSummaryHtml: formatReportSummaryHtml(metrics),
        referralsSentCount: ref != null ? String(ref) : '',
        connectionRequestsSentCount: conn != null ? String(conn) : '',
        outreachCustomSummary: outreachCustomPlain,
        outreachCustomSummaryHtml: outreachCustomHtml,
    }
}
