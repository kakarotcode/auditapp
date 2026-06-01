import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface PubSubMessage {
  data: string        // base64-encoded JSON
  messageId: string
  publishTime: string
  attributes?: Record<string, string>
}

interface PubSubPayload {
  message: PubSubMessage
  subscription: string
}

interface GmailNotificationData {
  emailAddress: string
  historyId: string
}

export async function POST(req: NextRequest) {
  let payload: PubSubPayload

  try {
    payload = (await req.json()) as PubSubPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Decode the base64 message data
  if (!payload.message?.data) {
    return NextResponse.json({ received: true })
  }

  let data: GmailNotificationData
  try {
    const decoded = Buffer.from(payload.message.data, 'base64').toString('utf-8')
    data = JSON.parse(decoded) as GmailNotificationData
  } catch {
    console.warn('[webhooks/gmail] Failed to decode Pub/Sub message data')
    return NextResponse.json({ received: true })
  }

  const { emailAddress, historyId } = data

  if (!emailAddress || !historyId) {
    return NextResponse.json({ received: true })
  }

  // Process asynchronously — always return 200 immediately
  processGmailNotification({ emailAddress, historyId }).catch((err) =>
    console.error('[webhooks/gmail] Async processing error:', err)
  )

  return NextResponse.json({ received: true })
}

async function processGmailNotification({
  emailAddress,
  historyId,
}: {
  emailAddress: string
  historyId: string
}): Promise<void> {
  // Find the DataSource by email address stored in metadata
  // Metadata is stored as JSON with a field like { email: "user@example.com" }
  const sources = await db.dataSource.findMany({
    where: {
      type: 'GMAIL',
      status: 'ACTIVE',
    },
    select: { id: true, metadata: true },
  })

  let matchedSourceId: string | null = null
  for (const source of sources) {
    const meta = source.metadata as Record<string, unknown> | null
    if (meta && (meta.email === emailAddress || meta.emailAddress === emailAddress)) {
      matchedSourceId = source.id
      break
    }
  }

  if (!matchedSourceId) {
    console.warn(`[webhooks/gmail] No active GMAIL source found for email: ${emailAddress}`)
    return
  }

  const { messageProcessorQueue } = await import('@/lib/queue')
  // messageProcessorQueue expects: orgId, sourceId, sourceType, messageId, fromIdentifier, toIdentifier, content, timestamp, isExternalRecipient
  // For history-based processing, we use a special job name so the worker can handle it differently
  await messageProcessorQueue.add('process-gmail-history', {
    orgId: '', // worker will resolve from sourceId
    sourceId: matchedSourceId,
    sourceType: 'GMAIL',
    messageId: `gmail-history-${historyId}`,
    fromIdentifier: emailAddress,
    toIdentifier: emailAddress,
    content: historyId, // pass historyId in content field; worker reads this
    timestamp: new Date().toISOString(),
    isExternalRecipient: false,
  })
}
