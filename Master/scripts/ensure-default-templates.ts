/**
 * Ensures default MessageTemplates exist for automation + common manual flows.
 * Safe to run multiple times — only creates records that are missing (by type + channel + name).
 *
 * Run: npm run db:ensure-templates
 */
import { PrismaClient, MessageTemplateType, MessageChannel } from '@prisma/client'

const prisma = new PrismaClient()

type Def = {
  name: string
  type: MessageTemplateType
  channel: MessageChannel
  subject: string | null
  content: string
  variables: string[]
}

const DEFAULTS: Def[] = [
  {
    name: 'Interview reminder — Email',
    type: MessageTemplateType.INTERVIEW_REMINDER,
    channel: MessageChannel.EMAIL,
    subject: 'Interview reminder: {{jobTitle}} at {{company}}',
    content: `<p>Hi {{clientName}},</p>
<p>This is a reminder about your upcoming interview for <strong>{{jobTitle}}</strong> at <strong>{{company}}</strong>.</p>
<p><strong>Date:</strong> {{interviewDate}}<br/><strong>Time:</strong> {{interviewTime}}</p>
<p>Good luck!<br/>— Careerist Team</p>`,
    variables: ['candidateName', 'clientName', 'jobTitle', 'company', 'interviewDate', 'interviewTime'],
  },
  {
    name: 'Job offer — Client email',
    type: MessageTemplateType.OFFER_LETTER,
    channel: MessageChannel.EMAIL,
    subject: 'Congratulations — Offer: {{jobTitle}} at {{company}}',
    content: `<p>Dear {{clientName}},</p>
<p>We’re pleased to share an offer for <strong>{{jobTitle}}</strong> at <strong>{{company}}</strong>.</p>
<p><strong>Compensation:</strong> {{salary}}<br/><strong>Start:</strong> {{startDate}}</p>
<p>Reply to this email if you have questions.</p>
<p>Best regards,<br/>Careerist Team</p>`,
    variables: ['candidateName', 'clientName', 'jobTitle', 'company', 'salary', 'startDate'],
  },
  {
    name: 'Job offer — WhatsApp',
    type: MessageTemplateType.OFFER_LETTER,
    channel: MessageChannel.WHATSAPP,
    subject: null,
    content: `Hi {{clientName}}, great news — offer for *{{jobTitle}}* at *{{company}}*. Compensation: {{salary}}. Start: {{startDate}}. — Careerist Team`,
    variables: ['candidateName', 'clientName', 'jobTitle', 'company', 'salary', 'startDate'],
  },
  {
    name: 'Resume share — Client (email)',
    type: MessageTemplateType.CUSTOM,
    channel: MessageChannel.EMAIL,
    subject: 'Your tailored resume is ready — {{clientName}}',
    content: `<p>Dear {{clientName}},</p>
<p>Your tailored resume is ready. Open the link below to preview, download, and accept or reject.</p>
<p><a href="{{resumeViewUrl}}">{{resumeViewUrl}}</a></p>
<p>ATS score (if available): {{atsScore}}</p>
<p>— Careerist Team</p>`,
    variables: ['clientName', 'firstName', 'lastName', 'fullName', 'email', 'resumeViewUrl', 'atsScore', 'templateName'],
  },
  {
    name: 'Shared report — Client notification (email)',
    type: MessageTemplateType.CUSTOM,
    channel: MessageChannel.EMAIL,
    subject: 'Your job search report — {{clientName}}',
    content: `<p>Hi {{firstName}},</p>
<p>Your live report is available here: <a href="{{reportLink}}">{{reportLink}}</a></p>
<div>{{reportSummaryHtml}}</div>
<p>— Careerist Team</p>`,
    variables: [
      'clientName',
      'firstName',
      'lastName',
      'fullName',
      'email',
      'reportLink',
      'reportUrl',
      'link',
      'reportSummary',
      'reportSummaryHtml',
    ],
  },
  {
    name: 'Lead onboarding — Form link (email)',
    type: MessageTemplateType.CUSTOM,
    channel: MessageChannel.EMAIL,
    subject: 'Complete your onboarding — {{clientName}}',
    content: `<p>Hi {{clientName}},</p>
<p>Please complete your onboarding form:</p>
<p><a href="{{onboardingLink}}">{{onboardingLink}}</a></p>
<p>— Careerist Team</p>`,
    variables: ['clientName', 'firstName', 'lastName', 'fullName', 'email', 'onboardingLink', 'formLink'],
  },
  {
    name: 'Application update — Rejection (email)',
    type: MessageTemplateType.REJECTION,
    channel: MessageChannel.EMAIL,
    subject: 'Update on your application',
    content: `<p>Hi {{clientName}},</p>
<p>Thank you for your interest. We wanted to share an update on your application.</p>
<p>— Careerist Team</p>`,
    variables: ['clientName', 'firstName', 'lastName', 'fullName', 'email', 'jobTitle', 'company'],
  },
  {
    name: 'Application update — Rejection (WhatsApp)',
    type: MessageTemplateType.REJECTION,
    channel: MessageChannel.WHATSAPP,
    subject: null,
    content: `Hi {{clientName}}, thank you for your interest. We have an update on your application for {{jobTitle}} at {{company}}. — Careerist Team`,
    variables: ['clientName', 'firstName', 'lastName', 'jobTitle', 'company'],
  },
]

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  if (!admin) {
    console.error('No ADMIN user found. Run npm run db:seed first.')
    process.exit(1)
  }

  let created = 0
  for (const def of DEFAULTS) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { type: def.type, channel: def.channel, name: def.name },
    })
    if (existing) continue

    await prisma.messageTemplate.create({
      data: {
        name: def.name,
        type: def.type,
        channel: def.channel,
        subject: def.subject,
        content: def.content,
        variables: JSON.stringify(def.variables),
        enabled: true,
        createdBy: admin.id,
      },
    })
    created++
    console.log(`Created: ${def.name} (${def.type} / ${def.channel})`)
  }

  console.log(created === 0 ? 'All default templates already present.' : `Done. Created ${created} template(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
