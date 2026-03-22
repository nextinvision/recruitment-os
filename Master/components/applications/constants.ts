import { ApplicationStage } from '@prisma/client'

export const STAGES: string[] = [
  ApplicationStage.PENDING_CLIENT_APPROVAL,
  ApplicationStage.IDENTIFIED,
  ApplicationStage.RESUME_UPDATED,
  ApplicationStage.COLD_MESSAGE_SENT,
  ApplicationStage.CONNECTION_ACCEPTED,
  ApplicationStage.APPLIED,
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'FINAL_FOLLOW_UP',
  'NO_RESPONSE',
  'INTERVIEW_PREPARATION',
  ApplicationStage.INTERVIEW_SCHEDULED,
  ApplicationStage.OFFER,
  ApplicationStage.REJECTED,
  ApplicationStage.CLOSED,
]

export const STAGE_LABELS: Record<string, string> = {
  PENDING_CLIENT_APPROVAL: 'Pending Approval',
  IDENTIFIED: 'Identified',
  RESUME_UPDATED: 'Resume Updated',
  COLD_MESSAGE_SENT: 'Cold Message Sent',
  CONNECTION_ACCEPTED: 'Connection Accepted',
  APPLIED: 'Applied',
  FOLLOW_UP_1: 'Follow-up 1',
  FOLLOW_UP_2: 'Follow-up 2',
  FINAL_FOLLOW_UP: 'Final Follow-up',
  NO_RESPONSE: 'No Response',
  INTERVIEW_PREPARATION: 'Interview Preparation',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
}

export const JOB_SEARCH_DEBOUNCE_MS = 300
