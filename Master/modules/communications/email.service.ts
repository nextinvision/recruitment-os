/**
 * Email Service
 * Supports both AWS SES and SendGrid
 */

interface EmailMessage {
  to: string | string[]
  from: string
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
  private provider: 'ses' | 'sendgrid'
  private fromEmail: string
  private fromName: string
  private sesRegion?: string
  private sendGridApiKey?: string

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as 'ses' | 'sendgrid') || 'sendgrid'
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@recruitment-os.com'
    this.fromName = process.env.EMAIL_FROM_NAME || 'Recruitment OS'
    this.sesRegion = process.env.AWS_SES_REGION || 'us-east-1'
    this.sendGridApiKey = process.env.SENDGRID_API_KEY
  }

  /**
   * Send email
   */
  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    if (this.provider === 'sendgrid') {
      return this.sendViaSendGrid(message)
    } else {
      return this.sendViaSES(message)
    }
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(message: EmailMessage): Promise<EmailResponse> {
    if (!this.sendGridApiKey) {
      throw new Error('SendGrid API key not configured')
    }

    try {
      const recipients = Array.isArray(message.to) ? message.to : [message.to]

      const payload = {
        personalizations: recipients.map((to) => ({
          to: [{ email: to }],
        })),
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: message.subject,
        content: [
          ...(message.text
            ? [{ type: 'text/plain', value: message.text }]
            : []),
          ...(message.html
            ? [{ type: 'text/html', value: message.html }]
            : []),
        ],
        ...(message.attachments && {
          attachments: message.attachments.map((att) => ({
            content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
            filename: att.filename,
            type: att.type || 'application/octet-stream',
            disposition: 'attachment',
          })),
        }),
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sendGridApiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${error}`)
      }

      // SendGrid doesn't return message ID in v3 API, so we generate one
      const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`

      return {
        messageId,
        status: 'sent',
      }
    } catch (error) {
      console.error('Error sending email via SendGrid:', error)
      throw error
    }
  }

  /**
   * Send via AWS SES
   * Uses @aws-sdk/client-ses (AWS SDK v3)
   * Note: @aws-sdk/client-ses must be installed separately: npm install @aws-sdk/client-ses
   */
  private async sendViaSES(message: EmailMessage): Promise<EmailResponse> {
    try {
      // Check for AWS credentials first
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error(
          'AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
        )
      }

      // Check AWS credentials are defined
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

      if (!accessKeyId || !secretAccessKey) {
        throw new Error(
          'AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
        )
      }

      // Dynamically import AWS SDK v3 to avoid build-time dependency
      let awsSdk: {
        SESClient: new (config: { region: string; credentials: { accessKeyId: string; secretAccessKey: string } }) => {
          send: (command: unknown) => Promise<{ MessageId?: string }>
        }
        SendEmailCommand: new (params: unknown) => unknown
      }

      try {
        // Dynamic import - module may not be installed
        // This is marked as external in next.config.ts via serverExternalPackages
        // Turbopack may show a warning, but it's harmless - the module is resolved at runtime
        // @ts-expect-error - Module '@aws-sdk/client-ses' may not be installed, handled at runtime
        awsSdk = await import('@aws-sdk/client-ses')
      } catch (importError: unknown) {
        const errorMessage = importError instanceof Error ? importError.message : 'Unknown error'
        throw new Error(
          `AWS SES SDK not installed. Install it with: npm install @aws-sdk/client-ses\n` +
          `Or set EMAIL_PROVIDER=sendgrid to use SendGrid instead.\n` +
          `Error: ${errorMessage}`
        )
      }

      const { SESClient, SendEmailCommand } = awsSdk

      // Create SES client
      const sesClient = new SESClient({
        region: this.sesRegion || 'us-east-1',
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      // Prepare email parameters
      const recipients = Array.isArray(message.to) ? message.to : [message.to]

      const emailParams = {
        Source: `${this.fromName} <${this.fromEmail}>`,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: message.subject,
            Charset: 'UTF-8',
          },
          Body: {
            ...(message.text && {
              Text: {
                Data: message.text,
                Charset: 'UTF-8',
              },
            }),
            ...(message.html && {
              Html: {
                Data: message.html,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      }

      // Send email
      const command = new SendEmailCommand(emailParams)
      const result = await sesClient.send(command)

      return {
        messageId: result.MessageId || `ses-${Date.now()}`,
        status: 'sent',
      }
    } catch (error) {
      console.error('Error sending email via SES:', error)
      throw error
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
   * Render HTML template
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
}

export const emailService = new EmailService()

