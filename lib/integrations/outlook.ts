import { logger } from '@/lib/logger'
import { Client, Options, AuthProviderCallback } from '@microsoft/microsoft-graph-client'

export interface MicrosoftGraphMessage {
  id?: string
  subject?: string
  body?: {
    contentType?: string
    content?: string
  }
  bodyPreview?: string
  from?: {
    emailAddress?: {
      name?: string
      address?: string
    }
  }
  toRecipients?: Array<{
    emailAddress?: {
      name?: string
      address?: string
    }
  }>
  receivedDateTime?: string
  sentDateTime?: string
  isRead?: boolean
  importance?: string
  conversationId?: string
}

export interface GraphSubscription {
  id: string
  resource: string
  changeType: string
  notificationUrl: string
  expirationDateTime: string
  clientState?: string
}

export interface RefreshedTokens {
  accessToken: string
  expiresAt: Date
}

export function createGraphClient(accessToken: string): Client {
  const options: Options = {
    authProvider: (done: AuthProviderCallback) => {
      done(null, accessToken)
    },
  }
  return Client.init(options)
}

export async function getRecentMessages(
  accessToken: string,
  messageId: string
): Promise<MicrosoftGraphMessage> {
  const client = createGraphClient(accessToken)

  const message = await client
    .api(`/me/messages/${messageId}`)
    .select('id,subject,body,bodyPreview,from,toRecipients,receivedDateTime,sentDateTime,isRead,importance,conversationId')
    .get() as MicrosoftGraphMessage

  return message
}

export async function createWebhookSubscription(
  accessToken: string,
  orgId: string
): Promise<GraphSubscription> {
  const client = createGraphClient(accessToken)

  const notificationUrl = process.env.OUTLOOK_WEBHOOK_URL
  if (!notificationUrl) {
    throw new Error('OUTLOOK_WEBHOOK_URL env var must be set')
  }

  // Subscriptions last max 4320 minutes (3 days) for mail
  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  const subscription = await client.api('/subscriptions').post({
    changeType: 'created,updated',
    notificationUrl,
    resource: '/me/mailFolders(\'Inbox\')/messages',
    expirationDateTime,
    clientState: `kavachai-${orgId}`,
  }) as GraphSubscription

  logger.info(`[Outlook] Webhook subscription created for org ${orgId}: ${subscription.id}`)

  return subscription
}

export async function renewSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<GraphSubscription> {
  const client = createGraphClient(accessToken)

  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  const updated = await client
    .api(`/subscriptions/${subscriptionId}`)
    .patch({ expirationDateTime }) as GraphSubscription

  logger.info(`[Outlook] Subscription renewed: ${subscriptionId}`)

  return updated
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens> {
  const tenantId = process.env.AZURE_AD_TENANT_ID ?? 'common'
  const clientId = process.env.AZURE_AD_CLIENT_ID
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('AZURE_AD_CLIENT_ID and AZURE_AD_CLIENT_SECRET env vars must be set')
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: 'https://graph.microsoft.com/.default offline_access',
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to refresh Microsoft token (${response.status}): ${errorText}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number }

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

export function extractMessageText(message: MicrosoftGraphMessage): string {
  if (!message.body) {
    return message.bodyPreview ?? ''
  }

  const { contentType, content } = message.body

  if (!content) return message.bodyPreview ?? ''

  if (contentType === 'html') {
    return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return content.trim()
}
