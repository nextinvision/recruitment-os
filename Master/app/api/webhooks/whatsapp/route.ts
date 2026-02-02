import { NextRequest, NextResponse } from 'next/server'
import { messageService } from '@/modules/communications/message.service'
import { MessageStatus } from '@prisma/client'

/**
 * WhatsApp Webhook Handler
 * Handles status updates from WhatsApp Business API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // WhatsApp webhook structure
    // https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (value?.statuses) {
      // Handle message status updates
      for (const status of value.statuses) {
        const messageId = status.id
        const statusValue = status.status

        // Find message by external ID
        const message = await messageService.getMessageByExternalId(messageId)

        if (message) {
          let newStatus: MessageStatus

          switch (statusValue) {
            case 'sent':
              newStatus = MessageStatus.SENT
              break
            case 'delivered':
              newStatus = MessageStatus.DELIVERED
              break
            case 'read':
              newStatus = MessageStatus.READ
              break
            case 'failed':
              newStatus = MessageStatus.FAILED
              break
            default:
              continue
          }

          await messageService.updateMessageStatus(message.id, newStatus, messageId)
        }
      }
    }

    // Verify webhook (for initial setup)
    if (body['hub.mode'] === 'subscribe' && body['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return NextResponse.json(parseInt(body['hub.challenge'] || '0'), { status: 200 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json(parseInt(challenge || '0'), { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

