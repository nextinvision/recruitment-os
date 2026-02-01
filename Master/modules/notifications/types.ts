export interface NotificationData {
  userId: string
  type: 'FOLLOW_UP_REMINDER' | 'INTERVIEW_ALERT' | 'OVERDUE_TASK' | 'AI_INSIGHT' | 'JOB_SCRAPE_CONFIRMATION'
  channel: 'WHATSAPP' | 'EMAIL' | 'IN_APP'
  title: string
  message: string
  metadata?: Record<string, any>
}

export interface WhatsAppMessage {
  to: string
  message: string
  template?: string
}

export interface EmailMessage {
  to: string
  subject: string
  body: string
  html?: string
}

