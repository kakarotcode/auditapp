import crypto from 'crypto'
import { logger } from '@/lib/logger'

const BASE_URL = 'https://graph.facebook.com/v20.0'

function getToken(): string {
  const token = process.env.META_WHATSAPP_TOKEN
  if (!token) {
    throw new Error('META_WHATSAPP_TOKEN env var is not set')
  }
  return token
}

export function getPhoneNumberId(): string {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID
  if (!phoneNumberId) {
    throw new Error('META_PHONE_NUMBER_ID env var is not set')
  }
  return phoneNumberId
}

export async function sendMessage(to: string, message: string): Promise<void> {
  const token = getToken()
  const phoneNumberId = getPhoneNumberId()

  const url = `${BASE_URL}/${phoneNumberId}/messages`

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: message,
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `WhatsApp API error (${response.status}): ${errorText}`
    )
  }
}

export interface AlertPayload {
  severity: string
  ruleName: string
  incidentId: string
  occurredAt: Date
}

export async function sendAlertMessage(
  to: string,
  alert: AlertPayload
): Promise<void> {
  const severityEmoji: Record<string, string> = {
    CRITICAL: '🚨',
    HIGH: '⚠️',
    MEDIUM: '🔶',
    LOW: '🔵',
  }

  const emoji = severityEmoji[alert.severity] ?? '⚠️'
  const occurredAtStr = alert.occurredAt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const message = [
    `${emoji} *KavachAI Compliance Alert*`,
    ``,
    `*Severity:* ${alert.severity}`,
    `*Rule:* ${alert.ruleName}`,
    `*Incident ID:* ${alert.incidentId}`,
    `*Occurred At:* ${occurredAtStr} IST`,
    ``,
    `Please review this incident in the KavachAI dashboard immediately.`,
    ``,
    `_This is an automated alert under DPDP Act monitoring. Do not reply to this message._`,
  ].join('\n')

  await sendMessage(to, message)
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret) {
    logger.warn('META_APP_SECRET is not set; webhook signature verification skipped')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex')

  const expected = `sha256=${expectedSignature}`

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expected, 'utf8')
    )
  } catch {
    return false
  }
}
