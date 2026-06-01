import { logger } from '@/lib/logger'
import { google, drive_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { v4 as uuidv4 } from 'uuid'

function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'https://localhost:3000/api/auth/callback/google'

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars must be set')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function createDriveClient(accessToken: string): drive_v3.Drive {
  const auth = createOAuthClient()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: 'v3', auth })
}

export interface WatchResponse {
  channelId: string
  resourceId: string
  expiration: string
}

export async function watchFile(
  accessToken: string,
  fileId: string,
  orgId: string
): Promise<WatchResponse> {
  const drive = createDriveClient(accessToken)

  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error('GOOGLE_DRIVE_WEBHOOK_URL env var must be set')
  }

  const channelId = uuidv4()

  const response = await drive.files.watch({
    fileId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      token: `kavachai-${orgId}`,
      expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  if (!response.data.resourceId || !response.data.expiration) {
    throw new Error('Drive watch setup returned incomplete response')
  }

  logger.info(`[GoogleDrive] Watching file ${fileId} for org ${orgId}, channel=${channelId}`)

  return {
    channelId,
    resourceId: response.data.resourceId,
    expiration: response.data.expiration,
  }
}

export async function getFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const drive = createDriveClient(accessToken)

  // First get file metadata to determine mimeType
  const metaResponse = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,size',
  })

  const mimeType = metaResponse.data.mimeType ?? ''

  // Google Docs: export as plain text
  if (mimeType === 'application/vnd.google-apps.document') {
    const exportResponse = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'text' }
    )
    return String(exportResponse.data)
  }

  // Google Sheets: export as CSV
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    const exportResponse = await drive.files.export(
      { fileId, mimeType: 'text/csv' },
      { responseType: 'text' }
    )
    return String(exportResponse.data)
  }

  // Binary or other — download raw if text-based
  const downloadResponse = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  )
  return String(downloadResponse.data)
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string
}

export async function listRecentFiles(accessToken: string): Promise<DriveFile[]> {
  const drive = createDriveClient(accessToken)

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const response = await drive.files.list({
    q: `modifiedTime > '${since}' and trashed = false`,
    fields: 'files(id,name,mimeType,modifiedTime,size)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
    spaces: 'drive',
  })

  return (response.data.files ?? []).map((f) => ({
    id: f.id ?? '',
    name: f.name ?? '',
    mimeType: f.mimeType ?? '',
    modifiedTime: f.modifiedTime ?? '',
    size: f.size ?? undefined,
  }))
}

export async function stopWatch(
  accessToken: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  const drive = createDriveClient(accessToken)

  await drive.channels.stop({
    requestBody: {
      id: channelId,
      resourceId,
    },
  })

  logger.info(`[GoogleDrive] Stopped watch channel=${channelId}`)
}
