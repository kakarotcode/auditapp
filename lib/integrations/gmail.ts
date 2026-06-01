import { logger } from '@/lib/logger'
import { google, gmail_v1 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata',
]

function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'https://localhost:3000/api/auth/callback/google'

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars must be set')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function createGmailClient(accessToken: string): gmail_v1.Gmail {
  const auth = createOAuthClient()
  auth.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth })
}

export interface GmailMessage {
  id: string
  threadId: string
  snippet?: string | null
  internalDate?: string | null
  payload?: gmail_v1.Schema$MessagePart | null
}

export async function getMessagesSinceHistory(
  accessToken: string,
  historyId: string
): Promise<GmailMessage[]> {
  const gmail = createGmailClient(accessToken)

  const historyResponse = await gmail.users.history.list({
    userId: 'me',
    startHistoryId: historyId,
    historyTypes: ['messageAdded'],
  })

  const historyItems = historyResponse.data.history ?? []
  const messageIds = new Set<string>()

  for (const item of historyItems) {
    for (const added of item.messagesAdded ?? []) {
      if (added.message?.id) {
        messageIds.add(added.message.id)
      }
    }
  }

  const messages: GmailMessage[] = []

  for (const messageId of Array.from(messageIds)) {
    const msgResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })
    if (msgResponse.data) {
      messages.push({
        id: msgResponse.data.id ?? messageId,
        threadId: msgResponse.data.threadId ?? '',
        snippet: msgResponse.data.snippet,
        internalDate: msgResponse.data.internalDate,
        payload: msgResponse.data.payload,
      })
    }
  }

  return messages
}

export async function setupPushNotifications(
  accessToken: string,
  orgId: string
): Promise<{ historyId: string; expiration: string }> {
  const gmail = createGmailClient(accessToken)

  const topicName = process.env.GOOGLE_PUBSUB_TOPIC
  if (!topicName) {
    throw new Error('GOOGLE_PUBSUB_TOPIC env var must be set')
  }

  const response = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      labelIds: ['INBOX', 'SENT'],
      topicName,
    },
  })

  if (!response.data.historyId || !response.data.expiration) {
    throw new Error('Gmail watch setup returned incomplete response')
  }

  logger.info(`[Gmail] Push notifications set up for org ${orgId}, historyId=${response.data.historyId}`)

  return {
    historyId: response.data.historyId,
    expiration: response.data.expiration,
  }
}

export interface RefreshedTokens {
  accessToken: string
  expiresAt: Date
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens> {
  const oauth2Client = createOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token: no access_token returned')
  }

  return {
    accessToken: credentials.access_token,
    expiresAt: credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000),
  }
}

export function extractMessageText(message: gmail_v1.Schema$Message): string {
  const payload = message.payload
  if (!payload) return ''

  function decodeBase64Url(encoded: string): string {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    return Buffer.from(base64, 'base64').toString('utf-8')
  }

  function extractFromPart(part: gmail_v1.Schema$MessagePart): string {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBase64Url(part.body.data)
    }

    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = decodeBase64Url(part.body.data)
      // Strip HTML tags
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }

    if (part.parts && part.parts.length > 0) {
      // Prefer plain text
      const plain = part.parts.find((p) => p.mimeType === 'text/plain')
      if (plain) return extractFromPart(plain)

      for (const child of part.parts) {
        const text = extractFromPart(child)
        if (text) return text
      }
    }

    return ''
  }

  return extractFromPart(payload)
}
