import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/integrations/whatsapp'

export const dynamic = 'force-dynamic'

interface WhatsAppTextMessage {
  id: string
  from: string
  timestamp: string
  type: 'text'
  text: { body: string }
}

interface WhatsAppImageMessage {
  id: string
  from: string
  timestamp: string
  type: 'image'
  image: { id: string; mime_type: string; sha256: string; caption?: string }
}

interface WhatsAppDocumentMessage {
  id: string
  from: string
  timestamp: string
  type: 'document'
  document: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string }
}

type WhatsAppMessage = WhatsAppTextMessage | WhatsAppImageMessage | WhatsAppDocumentMessage

interface WhatsAppContact {
  profile: { name: string }
  wa_id: string
}

interface WhatsAppValue {
  messaging_product: string
  metadata: { display_phone_number: string; phone_number_id: string }
  contacts?: WhatsAppContact[]
  messages?: WhatsAppMessage[]
  statuses?: Array<{ id: string; recipient_id: string; status: string; timestamp: string }>
}

interface WhatsAppChange {
  value: WhatsAppValue
  field: string
}

interface WhatsAppEntry {
  id: string
  changes: WhatsAppChange[]
}

interface WhatsAppPayload {
  object: string
  entry: WhatsAppEntry[]
}

// GET — webhook verification (hub challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — incoming message handler
export async function POST(req: NextRequest) {
  // Read raw body BEFORE any parsing for signature verification
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256') ?? ''

  // Verify HMAC-SHA256 signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[webhooks/whatsapp] Invalid signature')
    // Return 200 anyway — Meta will retry on non-200 responses which wastes quota
    return NextResponse.json({ received: true })
  }

  let payload: WhatsAppPayload
  try {
    payload = JSON.parse(rawBody) as WhatsAppPayload
  } catch {
    return NextResponse.json({ received: true })
  }

  if (payload.object !== 'whatsapp_business_account') {
    return NextResponse.json({ received: true })
  }

  // Process asynchronously — never block this response
  processPayload(payload).catch((err) =>
    console.error('[webhooks/whatsapp] Async processing error:', err)
  )

  return NextResponse.json({ received: true })
}

async function processPayload(payload: WhatsAppPayload): Promise<void> {
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue
      const messages = change.value.messages ?? []
      const phoneNumberId = change.value.metadata.phone_number_id

      for (const message of messages) {
        try {
          await enqueueMessage({ message, phoneNumberId, entry })
        } catch (err) {
          console.error('[webhooks/whatsapp] Failed to enqueue message:', err)
        }
      }
    }
  }
}

async function enqueueMessage({
  message,
  phoneNumberId,
  entry,
}: {
  message: WhatsAppMessage
  phoneNumberId: string
  entry: WhatsAppEntry
}): Promise<void> {
  const { messageProcessorQueue } = await import('@/lib/queue')

  // Look up the DataSource by phoneNumberId stored in metadata
  const { db } = await import('@/lib/db')
  const source = await db.dataSource.findFirst({
    where: {
      type: 'WHATSAPP',
      status: 'ACTIVE',
      OR: [
        { webhookId: phoneNumberId },
        { metadata: { path: ['phoneNumberId'], equals: phoneNumberId } },
      ],
    },
    select: { id: true, orgId: true },
  })

  if (!source) {
    console.warn(`[webhooks/whatsapp] No active WHATSAPP source for phoneNumberId: ${phoneNumberId}`)
    return
  }

  const content = message.type === 'text'
    ? (message as WhatsAppTextMessage).text.body
    : `[${message.type.toUpperCase()} media]`

  await messageProcessorQueue.add('process-whatsapp-message', {
    orgId: source.orgId,
    sourceId: source.id,
    sourceType: 'WHATSAPP',
    messageId: message.id,
    fromIdentifier: message.from,
    toIdentifier: phoneNumberId,
    content,
    timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
    isExternalRecipient: true,
  })
}
