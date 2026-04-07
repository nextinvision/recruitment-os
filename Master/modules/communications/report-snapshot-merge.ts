import type { ClientMetricsSnapshot, ApplicationPipelineLogSnapshot } from './report-email-variables'
import type { ReportOutreachCustomFieldRow } from '@/modules/clients/report-outreach-fields'
import { parseStoredReportOutreachCustomFields } from '@/modules/clients/report-outreach-fields'

/** Payload stored in `ReportSnapshot.data` (JSON): analytics + optional outreach counts */
export type ReportSnapshotData = ClientMetricsSnapshot & {
  applicationPipelineLog?: ApplicationPipelineLogSnapshot[]
}

/**
 * Merge live analytics with persisted client outreach fields for a shareable snapshot.
 */
export function buildReportSnapshotData(
  metrics: {
    funnelPerformance: Array<{ stage: string; count: number }>
    activityDistribution: Array<{ type: string; count: number }>
    applicationPipelineLog: ApplicationPipelineLogSnapshot[]
  },
  outreach: {
    referralsSentCount: number | null
    connectionRequestsSentCount: number | null
    reportOutreachCustomFields: ReportOutreachCustomFieldRow[]
  }
): ReportSnapshotData {
  return {
    ...metrics,
    referralsSentCount: outreach.referralsSentCount,
    connectionRequestsSentCount: outreach.connectionRequestsSentCount,
    reportOutreachCustomFields: outreach.reportOutreachCustomFields,
  }
}
