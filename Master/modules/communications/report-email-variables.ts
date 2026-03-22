import type { NextRequest } from 'next/server'
import { getPublicAppUrl } from '@/lib/public-url'

export type ClientMetricsSnapshot = {
    funnelPerformance: Array<{ stage: string; count: number }>
    activityDistribution: Array<{ type: string; count: number }>
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
    return lines.join('\n')
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
    return `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
  <p style="margin: 0 0 8px 0; font-weight: bold;">Application pipeline</p>
  <ul style="margin: 0 0 16px 0; padding-left: 20px;">${funnel || '<li>(No applications yet)</li>'}</ul>
  <p style="margin: 0 0 8px 0; font-weight: bold;">Activity distribution</p>
  <ul style="margin: 0; padding-left: 20px;">${acts || '<li>(No activities yet)</li>'}</ul>
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
    }
}
