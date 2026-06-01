import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Extract Google Drive push notification headers
  const channelId = req.headers.get('x-goog-channel-id')
  const resourceId = req.headers.get('x-goog-resource-id')
  const resourceState = req.headers.get('x-goog-resource-state')
  const channelToken = req.headers.get('x-goog-channel-token')

  // Always respond 200 immediately — Google will retry on non-200
  // Process the notification asynchronously

  if (!channelId || !resourceId) {
    return new NextResponse(null, { status: 200 })
  }

  // 'sync' state is just the initial handshake notification — not a real change
  if (resourceState === 'sync') {
    return new NextResponse(null, { status: 200 })
  }

  processGoogleDriveNotification({
    channelId,
    resourceId,
    resourceState: resourceState ?? 'change',
    channelToken: channelToken ?? null,
  }).catch((err) => logger.error('[webhooks/drive] Async processing error:', err))

  return new NextResponse(null, { status: 200 })
}

async function processGoogleDriveNotification({
  channelId,
  resourceId,
  resourceState,
  channelToken,
}: {
  channelId: string
  resourceId: string
  resourceState: string
  channelToken: string | null
}): Promise<void> {
  // Look up watch subscription by channelId
  // The channelId is stored in the DataSource metadata or webhookId field
  const source = await db.dataSource.findFirst({
    where: {
      type: 'GOOGLE_DRIVE',
      status: 'ACTIVE',
      OR: [
        { webhookId: channelId },
        {
          metadata: {
            path: ['channelId'],
            equals: channelId,
          },
        },
      ],
    },
    select: { id: true, orgId: true, metadata: true },
  })

  if (!source) {
    logger.warn(`[webhooks/drive] No active GOOGLE_DRIVE source found for channel: ${channelId}`)
    return
  }

  // Validate channel token if set
  const expectedToken = process.env.GOOGLE_DRIVE_CHANNEL_TOKEN
  if (expectedToken && channelToken !== expectedToken) {
    logger.warn(`[webhooks/drive] Channel token mismatch for channel: ${channelId}`)
    return
  }

  const { documentScannerQueue } = await import('@/lib/queue')
  // Queue type doesn't expose .add() directly, cast needed
  await (documentScannerQueue as unknown as { add: (name: string, data: Record<string, unknown>) => Promise<void> }).add('process-drive-change', {
    source: 'GOOGLE_DRIVE',
    sourceId: source.id,
    orgId: source.orgId,
    channelId,
    resourceId,
    resourceState,
  })
}
