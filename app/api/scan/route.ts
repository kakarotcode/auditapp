import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { runComplianceScan } from '@/lib/scan/run-scan'
import type { SourceType } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const scanSchema = z.object({
  content: z.string().min(1, 'Message text is required').max(5000),
  channel: z.enum(['WHATSAPP', 'GMAIL', 'OUTLOOK', 'GOOGLE_DRIVE', 'ONEDRIVE']).default('WHATSAPP'),
  isExternalRecipient: z.boolean().default(true),
})

/**
 * Synchronous compliance scan of a single message (no background worker).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const parsed = scanSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', code: 'BAD_REQUEST', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI is not configured. Add ANTHROPIC_API_KEY in the environment.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    const org = await db.organisation.findUnique({
      where: { id: session.user.orgId },
      select: { vertical: true },
    })
    if (!org) {
      return NextResponse.json({ error: 'Organisation not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const result = await runComplianceScan({
      orgId: session.user.orgId,
      vertical: org.vertical,
      content: parsed.data.content,
      channel: parsed.data.channel as SourceType,
      isExternalRecipient: parsed.data.isExternalRecipient,
    })

    if (result.saved && result.incidentId) {
      await db.auditEvent.create({
        data: {
          orgId: session.user.orgId,
          userId: session.user.id,
          action: 'MANUAL_SCAN_INCIDENT_CREATED',
          resource: 'Incident',
          resourceId: result.incidentId,
          metadata: { ruleCode: result.ruleCode, severity: result.severity },
        },
      }).catch(() => {})
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error('[api/scan] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const isAuth = /authentication|api key|x-api-key/i.test(msg)
    return NextResponse.json(
      {
        error: isAuth ? 'AI authentication failed — check ANTHROPIC_API_KEY.' : 'Scan failed. Please try again.',
        code: isAuth ? 'AI_AUTH_FAILED' : 'INTERNAL_ERROR',
      },
      { status: isAuth ? 503 : 500 }
    )
  }
}
