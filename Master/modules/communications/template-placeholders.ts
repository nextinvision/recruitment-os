/**
 * Single source of truth: where templates are used in the app and which {{placeholders}} each flow fills.
 * Used by Admin → Communications (reference panel) and TemplateBuilder hints.
 */

export type TemplateFlowId =
  | 'follow_up_automation'
  | 'interview_reminder_automation'
  | 'offer_letter_automation'
  | 'meeting_reminder_tidycal'
  | 'client_resume_email'
  | 'client_report_email'
  | 'lead_onboarding_email'
  | 'whatsapp_resume_preview'
  | 'whatsapp_report_preview'
  | 'whatsapp_lead_onboarding_preview'
  | 'application_job_approval'
  | 'manual_generic'

export interface TemplateFlowDefinition {
  id: TemplateFlowId
  title: string
  /** Prisma MessageTemplateType when automation looks up by type */
  templateType?: string
  channel?: string
  /** Where in the product this is triggered */
  triggeredFrom: string[]
  /** Variables the backend passes (use these names in {{double braces}}) */
  variables: { name: string; description: string }[]
  notes?: string
}

/** Flows that use getTemplateByType(type, channel) — first enabled match wins */
export const AUTOMATION_TEMPLATE_FLOWS: TemplateFlowDefinition[] = [
  {
    id: 'follow_up_automation',
    title: 'Follow-up reminder',
    templateType: 'FOLLOW_UP',
    channel: 'WHATSAPP or EMAIL',
    triggeredFrom: ['Cron / workers calling CommunicationAutomation.sendFollowUpReminder'],
    variables: [
      { name: 'title', description: 'Follow-up title' },
      { name: 'scheduledDate', description: 'Scheduled date (localized)' },
      { name: 'companyName', description: 'Lead/client company' },
      { name: 'contactName', description: 'Recipient full name' },
      { name: 'name', description: 'Alias of contactName (for short templates)' },
      { name: 'senderName', description: 'Assigned user full name' },
    ],
  },
  {
    id: 'interview_reminder_automation',
    title: 'Interview reminder',
    templateType: 'INTERVIEW_REMINDER',
    channel: 'WHATSAPP or EMAIL',
    triggeredFrom: ['CommunicationAutomation.sendInterviewReminder'],
    variables: [
      { name: 'candidateName', description: 'Client full name' },
      { name: 'clientName', description: 'Same as candidateName' },
      { name: 'jobTitle', description: 'Job title' },
      { name: 'company', description: 'Company name' },
      { name: 'interviewDate', description: 'Date string' },
      { name: 'interviewTime', description: 'Time or “TBD”' },
    ],
  },
  {
    id: 'offer_letter_automation',
    title: 'Offer letter',
    templateType: 'OFFER_LETTER',
    channel: 'EMAIL (default) or WHATSAPP',
    triggeredFrom: ['CommunicationAutomation.sendOfferLetter'],
    variables: [
      { name: 'candidateName', description: 'Client full name' },
      { name: 'clientName', description: 'Same as candidateName' },
      { name: 'jobTitle', description: 'Role title' },
      { name: 'company', description: 'Company' },
      { name: 'salary', description: 'Salary range or TBD' },
      { name: 'startDate', description: 'Start date string' },
    ],
  },
  {
    id: 'meeting_reminder_tidycal',
    title: 'Meeting reminder (TidyCal)',
    templateType: 'MEETING_REMINDER',
    channel: 'EMAIL',
    triggeredFrom: ['processMeetingReminders (cron)', 'scripts/ensure-meeting-reminder-template.ts'],
    variables: [
      { name: 'leadName', description: 'Lead full name' },
      { name: 'clientName', description: 'Alias of leadName for shared wording' },
      { name: 'meetingTitle', description: 'Meeting title' },
      { name: 'meetingDate', description: 'Long date' },
      { name: 'meetingTime', description: 'Local time' },
      { name: 'reminderLabel', description: 'e.g. “24 hours”, “1 hour”, “15 minutes”' },
      { name: 'assignedUserName', description: 'Recruiter name' },
    ],
  },
]

/** User picks template by ID in UI */
export const MANUAL_SELECTION_FLOWS: TemplateFlowDefinition[] = [
  {
    id: 'client_resume_email',
    title: 'Send resume to client (email)',
    templateType: 'CUSTOM (typical)',
    channel: 'EMAIL',
    triggeredFrom: ['Client detail → Send resume email', 'POST /api/messages/send'],
    notes:
      'The resume public URL is always appended after the template body by the server. You do not need {{resumeViewUrl}} in the template; link placeholders in the body are ignored for rendering when the append block is used.',
    variables: [
      { name: 'clientName', description: 'Full name' },
      { name: 'firstName', description: 'First name' },
      { name: 'lastName', description: 'Last name' },
      { name: 'fullName', description: 'Full name' },
      { name: 'email', description: 'Client email' },
      { name: 'resumeViewUrl', description: 'Public resume link' },
      { name: 'atsScore', description: 'Score or N/A' },
      { name: 'templateName', description: 'Resume template label' },
    ],
  },
  {
    id: 'client_report_email',
    title: 'Shared report notification (email)',
    templateType: 'CUSTOM (typical)',
    channel: 'EMAIL',
    triggeredFrom: ['Client → Report modal → Update & Send Email', 'POST /api/clients/:id/report-snapshot'],
    notes:
      'The report URL is always appended after the template body. {{reportUrl}} / {{reportLink}} / {{link}} in the body are optional and blanked when the append block is sent so a broken placeholder cannot remove the link.',
    variables: [
      { name: 'clientName', description: 'Full name' },
      { name: 'firstName', description: 'First name' },
      { name: 'lastName', description: 'Last name' },
      { name: 'fullName', description: 'Full name' },
      { name: 'email', description: 'Client email' },
      { name: 'reportLink', description: 'Public report URL' },
      { name: 'reportUrl', description: 'Same as reportLink' },
      { name: 'link', description: 'Same as reportLink' },
      { name: 'reportSummary', description: 'Plain-text pipeline summary' },
      { name: 'reportSummaryHtml', description: 'HTML summary block' },
      { name: 'referralsSentCount', description: 'Saved “referrals sent” count (empty if not set)' },
      { name: 'connectionRequestsSentCount', description: 'Saved “connection requests sent” count (empty if not set)' },
      { name: 'outreachCustomSummary', description: 'Plain-text lines for user-defined outreach fields' },
      { name: 'outreachCustomSummaryHtml', description: 'HTML list for user-defined outreach fields' },
    ],
  },
  {
    id: 'lead_onboarding_email',
    title: 'Lead onboarding form (email)',
    templateType: 'CUSTOM (typical)',
    channel: 'EMAIL',
    triggeredFrom: ['Leads → Send onboarding', 'POST /api/leads/:id/send-onboarding'],
    notes:
      'The onboarding form URL is always appended after the template. {{formLink}} / {{onboardingLink}} in the body are optional; the working link is still delivered.',
    variables: [
      { name: 'clientName', description: 'Lead full name' },
      { name: 'firstName', description: 'First name' },
      { name: 'lastName', description: 'Last name' },
      { name: 'fullName', description: 'Full name' },
      { name: 'email', description: 'Lead email' },
      { name: 'onboardingLink', description: 'Form URL with lead id' },
      { name: 'formLink', description: 'Alias of onboardingLink' },
    ],
  },
  {
    id: 'whatsapp_resume_preview',
    title: 'Resume → WhatsApp (preview)',
    channel: 'WHATSAPP',
    triggeredFrom: ['Client resume modal → Send to WhatsApp', 'POST /api/messages/whatsapp-preview'],
    notes: 'Same variables as client resume email where applicable.',
    variables: [
      { name: 'clientName', description: 'Full name' },
      { name: 'firstName', description: 'First name' },
      { name: 'lastName', description: 'Last name' },
      { name: 'fullName', description: 'Full name' },
      { name: 'resumeViewUrl', description: 'Link' },
      { name: 'atsScore', description: 'Score' },
      { name: 'templateName', description: 'Label' },
    ],
  },
  {
    id: 'whatsapp_report_preview',
    title: 'Report → WhatsApp (preview)',
    channel: 'WHATSAPP',
    triggeredFrom: ['Report modal → Send to WhatsApp', 'POST /api/clients/:id/report-whatsapp-preview'],
    variables: [
      { name: 'clientName', description: 'Full name' },
      { name: 'reportLink', description: 'Report URL' },
      { name: 'reportSummary', description: 'Plain summary' },
      { name: 'reportSummaryHtml', description: 'HTML block' },
      { name: 'referralsSentCount', description: 'Referrals sent count' },
      { name: 'connectionRequestsSentCount', description: 'Connection requests sent count' },
      { name: 'outreachCustomSummary', description: 'Custom outreach lines (plain)' },
      { name: 'outreachCustomSummaryHtml', description: 'Custom outreach (HTML)' },
    ],
  },
  {
    id: 'whatsapp_lead_onboarding_preview',
    title: 'Lead onboarding → WhatsApp (preview)',
    channel: 'WHATSAPP',
    triggeredFrom: ['POST /api/leads/:id/whatsapp-preview'],
    variables: [
      { name: 'clientName', description: 'Lead full name' },
      { name: 'firstName', description: 'First name' },
      { name: 'lastName', description: 'Last name' },
      { name: 'fullName', description: 'Full name' },
      { name: 'onboardingLink', description: 'Form URL' },
      { name: 'formLink', description: 'Alias' },
    ],
  },
  {
    id: 'application_job_approval',
    title: 'Job approval (sourced jobs)',
    triggeredFrom: ['Application stage → PENDING_CLIENT_APPROVAL (applications/service)'],
    notes: 'Currently hardcoded HTML/text in code — not DB templates yet. Planned: migrate to CUSTOM templates.',
    variables: [
      { name: '(hardcoded)', description: 'Uses client firstName, job list, approval link in code' },
    ],
  },
  {
    id: 'manual_generic',
    title: 'Generic manual send',
    templateType: 'Any',
    channel: 'Any',
    triggeredFrom: ['POST /api/messages with body', 'Admin experiments'],
    notes:
      'Optional `appendedEmailHtml` / `appendedChannelText` on the request body: appended after the rendered template; when set for EMAIL, standard link {{placeholders}} in the body are blanked so the template cannot strip the link.',
    variables: [
      { name: '…', description: 'Whatever you pass in the variables object' },
    ],
  },
]

export const ALL_TEMPLATE_FLOWS: TemplateFlowDefinition[] = [
  ...AUTOMATION_TEMPLATE_FLOWS,
  ...MANUAL_SELECTION_FLOWS,
]

/** Short list for TemplateBuilder sidebar */
export const COMMON_PLACEHOLDERS = [
  'clientName',
  'firstName',
  'lastName',
  'fullName',
  'email',
  'companyName',
  'contactName',
  'name',
  'senderName',
  'reportLink',
  'reportSummary',
  'reportSummaryHtml',
  'referralsSentCount',
  'connectionRequestsSentCount',
  'outreachCustomSummary',
  'outreachCustomSummaryHtml',
  'resumeViewUrl',
  'onboardingLink',
  'formLink',
  'leadName',
  'meetingTitle',
  'meetingDate',
  'meetingTime',
  'reminderLabel',
  'assignedUserName',
  'jobTitle',
  'company',
  'candidateName',
  'salary',
  'startDate',
  'interviewDate',
  'interviewTime',
] as const
