import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { detectPii } from '@/lib/ai/pii-detector'
import { classifyContext } from '@/lib/ai/context-classifier'
import { scoreRisk } from '@/lib/ai/risk-scorer'
import { getRemediationSteps } from '@/lib/ai/remediation-engine'
import type { SourceType } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const scanSchema = z.object({
  content: z.string().min(1, 'Message text is required').max(5000),
  channel: z
    .enum(['WHATSAPP', 'GMAIL', 'OUTLOOK', 'GOOGLE_DRIVE', 'ONEDRIVE'])
    .default('WHATSAPP'),
  isExternalRecipient: z.boolean().default(true),
})

const FRAMEWORK_MAP: Record<string, string> = {
  DPDP: 'DPDP', IT: 'IT_ACT', NMC: 'NMC', RBI: 'RBI',
  SEBI: 'SEBI', IRDAI: 'IRDAI', BCI: 'BAR_COUNCIL', LL: 'LABOUR_LAW',
}

/**
 * Synchronous compliance scan. Runs the full AI pipeline in-process (no
 * background worker needed), so the deployed web app can use the AI directly:
 * detect PII → classify → score → remediate → create an Incident.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const { orgId } = session.user

    const body = await req.json().catch(() => null)
    const parsed = scanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', code: 'BAD_REQUEST', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { content, channel, isExternalRecipient } = parsed.data

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI is not configured. Add ANTHROPIC_API_KEY in the environment.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    const org = await db.organisation.findUnique({ where: { id: orgId }, select: { vertical: true } })
    if (!org) {
      return NextResponse.json({ error: 'Organisation not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // 1. Detect PII
    const piiResult = await detectPii(content)
    if (!piiResult.hasPersonalData) {
      return NextResponse.json({
        violation: false,
        hasPersonalData: false,
        message: 'No personal data detected — this message looks clean.',
      })
    }

    // 2. Classify context
    const recipientType = isExternalRecipient ? 'EXTERNAL' : 'INTERNAL'
    const classification = await classifyContext({
      piiResult,
      senderRole: 'STAFF',
      recipientType,
      hasConsentRecord: false,
      additionalContext: `Channel: ${channel} (manual scan)`,
    })

    if (!classification.isViolation) {
      return NextResponse.json({
        violation: false,
        hasPersonalData: true,
        entities: piiResult.entities.map((e) => e.type),
        reasoning: classification.reasoning,
        message: 'Personal data found, but this use was classified as compliant.',
      })
    }

    // 3. Score risk
    const riskResult = scoreRisk({
      classification,
      entities: piiResult.entities.map((e) => e.type),
      isRepeatOffender: false,
      dataSubjectCount: 1,
    })

    // 4. Remediation steps
    const remediationSteps = await getRemediationSteps(
      classification.applicableRules,
      piiResult.entities.map((e) => e.type),
      org.vertical
    ).catch(() => [] as string[])

    // 5. Create the incident (reuse the org's first active source, if any)
    const primaryRuleCode = classification.applicableRules[0] ?? 'DPDP-S7B-001'
    const framework = (FRAMEWORK_MAP[primaryRuleCode.split('-')[0]] ?? 'DPDP') as
      'DPDP' | 'IT_ACT' | 'NMC' | 'RBI' | 'SEBI' | 'IRDAI' | 'BAR_COUNCIL' | 'LABOUR_LAW' | 'POCSO'

    const source = await db.dataSource.findFirst({
      where: { orgId, type: channel as SourceType },
      select: { id: true },
    }) ?? await db.dataSource.findFirst({ where: { orgId }, select: { id: true } })

    if (!source) {
      // No data source to attach to — return the analysis without persisting.
      return NextResponse.json({
        violation: true,
        saved: false,
        severity: riskResult.severity,
        framework,
        ruleCode: primaryRuleCode,
        entities: piiResult.entities.map((e) => e.type),
        summary: piiResult.rawSummary,
        reasoning: classification.reasoning,
        remediationSteps,
        message: 'Violation detected, but no data source exists to attach the incident to. Connect a source first.',
      })
    }

    const incident = await db.incident.create({
      data: {
        orgId,
        sourceId: source.id,
        ruleId: primaryRuleCode,
        ruleCode: primaryRuleCode,
        ruleName: primaryRuleCode,
        framework,
        severity: riskResult.severity,
        status: 'OPEN',
        channel: channel as SourceType,
        entityTypes: piiResult.entities.map((e) => e.type),
        entityCount: piiResult.entities.length,
        contextSummary: piiResult.rawSummary,
        remediationSteps,
        riskExplanation: classification.reasoning,
        occurredAt: new Date(),
      },
      select: { id: true },
    })

    await db.auditEvent.create({
      data: {
        orgId,
        userId: session.user.id,
        action: 'MANUAL_SCAN_INCIDENT_CREATED',
        resource: 'Incident',
        resourceId: incident.id,
        metadata: { ruleCode: primaryRuleCode, severity: riskResult.severity, channel },
      },
    }).catch(() => {})

    return NextResponse.json({
      violation: true,
      saved: true,
      incidentId: incident.id,
      severity: riskResult.severity,
      framework,
      ruleCode: primaryRuleCode,
      entities: piiResult.entities.map((e) => e.type),
      summary: piiResult.rawSummary,
      reasoning: classification.reasoning,
      remediationSteps,
    })
  } catch (error) {
    logger.error('[api/scan] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const isAuth = /authentication|api key|x-api-key/i.test(msg)
    return NextResponse.json(
      {
        error: isAuth
          ? 'AI authentication failed — check ANTHROPIC_API_KEY.'
          : 'Scan failed. Please try again.',
        code: isAuth ? 'AI_AUTH_FAILED' : 'INTERNAL_ERROR',
      },
      { status: isAuth ? 503 : 500 }
    )
  }
}
