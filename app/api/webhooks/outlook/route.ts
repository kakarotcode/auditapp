import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface GraphChangeNotification {
  subscriptionId: string
  subscriptionExpirationDateTime: string
  changeType: string
  resource: string
  resourceData?: {
    '@odata.type': string
    '@odata.id': string
    '@odata.etag'?: string
    id: string
  }
  clientState?: string
  tenantId?: string
  encryptedContent?: Record<string, string>
}

interface GraphNotificationPayload {
  value: GraphChangeNotification[]
}

export async function POST(req: NextRequest) {
  // Microsoft Graph subscription validation: if validationToken is present, echo it back as text
  const { searchParams } = new URL(req.url)
  const validationToken = searchParams.get('validationToken')
  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  let payload: GraphNotificationPayload
  try {
    payload = (await req.json()) as GraphNotificationPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(payload.value)) {
    return new NextResponse(null, { status: 202 })
  }

  // Process asynchronously
  processNotifications(payload.value).catch((err) =>
    console.error('[webhooks/outlook] Async processing error:', err)
  )

  return new NextResponse(null, { status: 202 })
}

async function processNotifications(notifications: GraphChangeNotification[]): Promise<void> {
  const expectedClientState = process.env.OUTLOOK_WEBHOOK_CLIENT_STATE ?? ''

  for (const notification of notifications) {
    // Validate clientState to ensure notification is from our subscription
    if (expectedClientState && notification.clientState !== expectedClientState) {
      console.warn(
        `[webhooks/outlook] clientState mismatch for subscription ${notification.subscriptionId}`
      )
      continue
    }

    try {
      await enqueueNotification(notification)
    } catch (err) {
      console.error('[webhooks/outlook] Failed to enqueue notification:', err)
    }
  }
}

async function enqueueNotification(notification: GraphChangeNotification): Promise<void> {
  // Find DataSource by subscription ID stored in metadata or webhookId
  const source = await db.dataSource.findFirst({
    where: {
      type: { in: ['OUTLOOK', 'ONEDRIVE'] },
      status: 'ACTIVE',
      OR: [
        { webhookId: notification.subscriptionId },
        {
          metadata: {
            path: ['subscriptionId'],
            equals: notification.subscriptionId,
          },
        },
      ],
    },
    select: { id: true, type: true },
  })

  if (!source) {
    console.warn(
      `[webhooks/outlook] No active source found for subscription: ${notification.subscriptionId}`
    )
    return
  }

  const { messageProcessorQueue } = await import('@/lib/queue')
  await messageProcessorQueue.add('process-outlook-notification', {
    orgId: '', // worker will resolve from sourceId
    sourceId: source.id,
    sourceType: source.type,
    messageId: notification.resourceData?.id ?? `graph-${Date.now()}`,
    fromIdentifier: notification.resource,
    toIdentifier: '',
    content: JSON.stringify({ changeType: notification.changeType, resource: notification.resource }),
    timestamp: new Date().toISOString(),
    isExternalRecipient: false,
  })
}
