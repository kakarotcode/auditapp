import { logger } from '@/lib/logger'
import { createGraphClient } from './outlook'

export interface OneDriveSubscription {
  id: string
  resource: string
  changeType: string
  notificationUrl: string
  expirationDateTime: string
  clientState?: string
}

export interface DriveItemDetails {
  id: string
  name: string
  size: number
  createdDateTime: string
  lastModifiedDateTime: string
  mimeType?: string
  webUrl?: string
  downloadUrl?: string
  file?: {
    mimeType: string
    hashes?: {
      sha256Hash?: string
    }
  }
  folder?: {
    childCount: number
  }
  parentReference?: {
    driveId: string
    driveType: string
    path: string
  }
}

export async function createSubscription(
  accessToken: string,
  orgId: string
): Promise<OneDriveSubscription> {
  const client = createGraphClient(accessToken)

  const notificationUrl = process.env.ONEDRIVE_WEBHOOK_URL
  if (!notificationUrl) {
    throw new Error('ONEDRIVE_WEBHOOK_URL env var must be set')
  }

  // OneDrive subscriptions last max 4230 minutes (~3 days)
  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  const subscription = await client.api('/subscriptions').post({
    changeType: 'updated,created',
    notificationUrl,
    resource: '/me/drive/root',
    expirationDateTime,
    clientState: `kavachai-${orgId}`,
  }) as OneDriveSubscription

  logger.info(`[OneDrive] Subscription created for org ${orgId}: ${subscription.id}`)

  return subscription
}

export async function getFileContent(
  accessToken: string,
  driveItemId: string
): Promise<string> {
  const client = createGraphClient(accessToken)

  // Get item metadata first
  const item = await client
    .api(`/me/drive/items/${driveItemId}`)
    .select('id,name,file,size,@microsoft.graph.downloadUrl')
    .get() as DriveItemDetails & { '@microsoft.graph.downloadUrl'?: string }

  const downloadUrl = item['@microsoft.graph.downloadUrl']
  if (!downloadUrl) {
    throw new Error(`No download URL available for drive item ${driveItemId}`)
  }

  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (
    contentType.startsWith('text/') ||
    contentType.includes('json') ||
    contentType.includes('csv') ||
    contentType.includes('xml')
  ) {
    return await response.text()
  }

  // For binary files, return a placeholder indicating binary content
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Try to detect UTF-8 text
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    return decoder.decode(bytes)
  } catch {
    return `[Binary file: ${item.name}, size: ${bytes.length} bytes]`
  }
}

export async function getDriveItemDetails(
  accessToken: string,
  driveItemId: string
): Promise<DriveItemDetails> {
  const client = createGraphClient(accessToken)

  const item = await client
    .api(`/me/drive/items/${driveItemId}`)
    .select('id,name,size,createdDateTime,lastModifiedDateTime,file,folder,webUrl,parentReference')
    .get() as DriveItemDetails

  return item
}

export async function renewSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<OneDriveSubscription> {
  const client = createGraphClient(accessToken)

  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  const updated = await client
    .api(`/subscriptions/${subscriptionId}`)
    .patch({ expirationDateTime }) as OneDriveSubscription

  logger.info(`[OneDrive] Subscription renewed: ${subscriptionId}`)

  return updated
}
