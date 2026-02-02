/**
 * WhatsApp Business API Service
 * Integrates with WhatsApp Business API via Meta Graph API
 */

interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'document' | 'image'
  text?: { body: string }
  template?: {
    name: string
    language: { code: string }
    components?: Array<{
      type: string
      parameters?: Array<{ type: string; text?: string }>
    }>
  }
  document?: {
    link: string
    filename: string
  }
  image?: {
    link: string
    caption?: string
  }
}

interface WhatsAppResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export class WhatsAppService {
  private apiUrl: string
  private phoneNumberId: string
  private accessToken: string
  private version: string

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com'
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.version = process.env.WHATSAPP_API_VERSION || 'v18.0'
  }

  /**
   * Send text message
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<string> {
    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'text',
      text: { body: message },
    }

    return this.sendMessage(payload)
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    languageCode: string = 'en',
    parameters?: string[]
  ): Promise<string> {
    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(parameters && parameters.length > 0 && {
          components: [
            {
              type: 'body',
              parameters: parameters.map((param) => ({
                type: 'text',
                text: param,
              })),
            },
          ],
        }),
      },
    }

    return this.sendMessage(payload)
  }

  /**
   * Send document
   */
  async sendDocument(
    phoneNumber: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<string> {
    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'document',
      document: {
        link: documentUrl,
        filename,
      },
    }

    return this.sendMessage(payload)
  }

  /**
   * Send image
   */
  async sendImage(phoneNumber: string, imageUrl: string, caption?: string): Promise<string> {
    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    }

    return this.sendMessage(payload)
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/${this.version}/${messageId}?access_token=${this.accessToken}`
      )

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        status: data.status || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error fetching WhatsApp message status:', error)
      throw error
    }
  }

  /**
   * Send message via WhatsApp API
   */
  private async sendMessage(payload: WhatsAppMessage): Promise<string> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp credentials not configured')
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/${this.version}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
      }

      const data: WhatsAppResponse = await response.json()
      return data.messages[0]?.id || ''
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  /**
   * Format phone number (remove +, spaces, etc.)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '')

    // If starts with +, keep it, otherwise assume country code
    if (!formatted.startsWith('+')) {
      // Add default country code if not present (you may want to make this configurable)
      formatted = `+91${formatted}` // Default to India
    }

    return formatted
  }

  /**
   * Validate phone number
   */
  isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone)
    // Basic validation: should be 10-15 digits after country code
    return /^\+\d{10,15}$/.test(formatted)
  }
}

export const whatsappService = new WhatsAppService()

