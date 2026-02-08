/**
 * Email Service
 * Uses Nodemailer with SMTP for reliable email delivery
 */

import nodemailer from 'nodemailer'

interface EmailMessage {
  to: string | string[]
  from?: string
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    type?: string
  }>
}

interface EmailResponse {
  messageId: string
  status: string
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private fromEmail: string
  private fromName: string
  private smtpConfig: {
    host: string
    port: number
    secure: boolean
    auth?: {
      user: string
      pass: string
    }
  }

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@recruitment-os.com'
    this.fromName = process.env.EMAIL_FROM_NAME || 'Recruitment OS'
    
    // SMTP Configuration
    this.smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      ...(process.env.SMTP_USER && process.env.SMTP_PASS && {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
    }

    // Initialize transporter
    this.initializeTransporter()
  }

  /**
   * Initialize Nodemailer transporter
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        auth: this.smtpConfig.auth,
        // Additional options for better compatibility
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
      })

      // Verify connection (async, but don't block)
      this.transporter.verify().then(() => {
        console.log('[Email Service] SMTP connection verified successfully')
      }).catch((error) => {
        console.warn('[Email Service] SMTP verification failed:', error.message)
        console.warn('[Email Service] Email sending may fail. Check your SMTP configuration.')
      })
    } catch (error) {
      console.error('[Email Service] Failed to initialize transporter:', error)
      this.transporter = null
    }
  }

  /**
   * Send email via SMTP
   */
  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    if (!this.transporter) {
      throw new Error(
        'Email transporter not initialized. Check SMTP configuration in environment variables.'
      )
    }

    // Validate SMTP credentials
    if (!this.smtpConfig.auth?.user || !this.smtpConfig.auth?.pass) {
      throw new Error(
        'SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.'
      )
    }

    try {
      const recipients = Array.isArray(message.to) ? message.to : [message.to]
      
      // Prepare mail options
      const mailOptions: nodemailer.SendMailOptions = {
        from: message.from || `${this.fromName} <${this.fromEmail}>`,
        to: recipients.join(', '),
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.attachments && {
          attachments: message.attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.type,
          })),
        }),
      }

      // Send email
      const result = await this.transporter.sendMail(mailOptions)

      return {
        messageId: result.messageId || `smtp-${Date.now()}`,
        status: 'sent',
      }
    } catch (error) {
      console.error('[Email Service] Error sending email:', error)
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid login')) {
          throw new Error('SMTP authentication failed. Check your SMTP_USER and SMTP_PASS credentials.')
        }
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(`Cannot connect to SMTP server at ${this.smtpConfig.host}:${this.smtpConfig.port}. Check SMTP_HOST and SMTP_PORT.`)
        }
        if (error.message.includes('timeout')) {
          throw new Error('SMTP connection timeout. Check your network connection and SMTP server settings.')
        }
        throw new Error(`Failed to send email: ${error.message}`)
      }
      
      throw new Error('Failed to send email: Unknown error')
    }
  }

  /**
   * Get the configured from email address
   */
  getFromEmail(): string {
    return this.fromEmail
  }

  /**
   * Get the configured from name
   */
  getFromName(): string {
    return this.fromName
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Render HTML template with variables
   */
  renderTemplate(template: string, variables: Record<string, unknown>): string {
    let rendered = template

    // Replace {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })

    return rendered
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Transporter not initialized',
      }
    }

    try {
      await this.transporter.verify()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const emailService = new EmailService()
