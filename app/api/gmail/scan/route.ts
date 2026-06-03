import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { createGmailClient, extractMessageText, refreshAccessToken } from '@/lib/integrations/gmail'
import { runComplianceScan } from '@/lib/scan/run-scan'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Keep small — each scanned email triggers AI calls (cost + time).
const MAX_EMAILS = 3

/**
 * Scans the signed-in user's most recent Gmail messages for DPDP violations.
 * Uses the Google OAuth token stored when they logged in with Google
 * (gmail.readonly scope). Runs the synchronous AI pipeline per email — no
 * background worker required.
 */
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.orgId || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI is not configured.', code: 'AI_NOT_CONFIGURED' }, { status: 503 })
    }

    const org = await db.organisation.findUnique({
      where: { id: session.user.orgId },
      select: { vertical: true },
    })
    if (!org) return NextResponse.json({ error: 'Organisation not found', code: 'NOT_FOUND' }, { status: 404 })

    // Find the Google OAuth account for this user (created on Google login).
    const account = await db.account.findFirst({
      where: { userId: session.user.id, provider: 'google' },
    })
    if (!account?.access_token) {
      return NextResponse.json(
        {
          error: 'Gmail not connected. Log out and use "Continue with Google" to grant Gmail access.',
          code: 'GMAIL_NOT_CONNECTED',
        },
        { status: 400 }
      )
    }
    if (account.scope && !account.scope.includes('gmail.readonly')) {
      return NextResponse.json(
        {
          error: 'Gmail read permission not granted. Log out and sign in with Google again, allowing Gmail access.',
          code: 'GMAIL_SCOPE_MISSING',
        },
        { status: 400 }
      )
    }

    // Refresh the token if expired.
    let accessToken = account.access_token
    const nowSec = Math.floor(Date.now() / 1000)
    if (account.expires_at && account.expires_at < nowSec + 60 && account.refresh_token) {
      try {
        const refreshed = await refreshAccessToken(account.refresh_token)
        accessToken = refreshed.accessToken
        await db.account.update({
          where: { id: account.id },
          data: {
            access_token: refreshed.accessToken,
            expires_at: Math.floor(refreshed.expiresAt.getTime() / 1000),
          },
        })
      } catch (e) {
        logger.warn('[gmail/scan] token refresh failed', { e: (e as Error).message })
        return NextResponse.json(
          { error: 'Gmail session expired. Sign in with Google again.', code: 'GMAIL_TOKEN_EXPIRED' },
          { status: 400 }
        )
      }
    }

    const gmail = createGmailClient(accessToken)

    const list = await gmail.users.messages.list({
      userId: 'me',
      maxResults: MAX_EMAILS,
      q: 'newer_than:60d -in:chats',
    })
    const ids = (list.data.messages ?? []).map((m) => m.id).filter(Boolean) as string[]

    const results: Array<{ subject: string; outcome: Awaited<ReturnType<typeof runComplianceScan>> }> = []
    let violations = 0
    let incidents = 0

    for (const id of ids) {
      const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' })
      const headers = msg.data.payload?.headers ?? []
      const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? '(no subject)'
      const body = extractMessageText(msg.data)
      const text = `${subject}\n\n${body}`.trim()
      if (!text) continue

      const outcome = await runComplianceScan({
        orgId: session.user.orgId,
        vertical: org.vertical,
        content: text.slice(0, 5000),
        channel: 'GMAIL',
        isExternalRecipient: true,
        sourceLabel: `Email: ${subject}`,
      })
      if (outcome.violation) violations++
      if (outcome.saved) incidents++
      results.push({ subject, outcome })
    }

    return NextResponse.json({
      scanned: results.length,
      violations,
      incidentsCreated: incidents,
      results: results.map((r) => ({
        subject: r.subject,
        violation: r.outcome.violation,
        severity: r.outcome.severity ?? null,
        ruleCode: r.outcome.ruleCode ?? null,
        incidentId: r.outcome.incidentId ?? null,
      })),
    })
  } catch (error) {
    logger.error('[gmail/scan] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const isAuth = /invalid_grant|unauthorized|401|invalid credentials/i.test(msg)
    return NextResponse.json(
      {
        error: isAuth
          ? 'Gmail access failed — sign in with Google again to reconnect.'
          : 'Could not scan Gmail. Please try again.',
        code: isAuth ? 'GMAIL_AUTH_FAILED' : 'INTERNAL_ERROR',
      },
      { status: isAuth ? 400 : 500 }
    )
  }
}
