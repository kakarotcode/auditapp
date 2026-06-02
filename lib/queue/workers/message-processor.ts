import { logger } from '@/lib/logger'
import { Job } from 'bullmq'
import crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { detectPii } from '@/lib/ai/pii-detector'
import { classifyContext } from '@/lib/ai/context-classifier'
import { scoreRisk } from '@/lib/ai/risk-scorer'
import { getRemediationSteps } from '@/lib/ai/remediation-engine'
import { RISK_EXPLANATION_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { extractJson } from '@/lib/ai/json'
import { updateOrgHealthScore } from '@/lib/compliance/health-score'
import { db } from '@/lib/db'
import { alertSenderQueue } from '@/lib/queue'
import { emitToOrg } from '@/lib/socket/server'
import type { MessageProcessorJobData } from '@/lib/queue'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface RiskExplanationPayload {
  explanation: string
  penaltyRange: string
}

async function getRiskExplanation(
  violatedRuleCodes: string[],
  entityTypes: string[],
  severity: string,
  vertical: string,
  recipientType: string,
  hasConsent: boolean
): Promise<string> {
  const payload = { violatedRuleCodes, entityTypes, severity, vertical, recipientType, hasConsent }

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 400,
    system: RISK_EXPLANATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Explain the risk for this compliance violation:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') return 'Risk explanation unavailable.'

  try {
    const parsed = extractJson<RiskExplanationPayload>(block.text)
    return `${parsed.explanation}\n\nPenalty range: ${parsed.penaltyRange}`
  } catch {
    return block.text
  }
}

export async function processMessage(job: Job<MessageProcessorJobData>): Promise<void> {
  const {
    orgId,
    sourceId,
    sourceType,
    messageId,
    fromIdentifier,
    toIdentifier,
    content,
    timestamp,
    isExternalRecipient,
  } = job.data

  logger.info(`[MessageProcessor] Processing job ${job.id} — org=${orgId} source=${sourceType} msgId=${messageId}`)

  // 1. Load org with rulebook overrides
  const org = await db.organisation.findUnique({
    where: { id: orgId },
    include: { ruleOverrides: true },
  })

  if (!org) {
    throw new Error(`Organisation ${orgId} not found`)
  }

  // 2. Detect PII
  const piiResult = await detectPii(content)

  // 3. If no PII, log clean audit event and exit
  if (!piiResult.hasPersonalData) {
    await db.auditEvent.create({
      data: {
        orgId,
        action: 'MESSAGE_SCANNED_CLEAN',
        resource: 'DataSource',
        resourceId: sourceId,
        metadata: {
          messageId,
          sourceType,
          processingMs: piiResult.processingMs,
        },
      },
    })
    await db.dataSource.update({
      where: { id: sourceId },
      data: { messagesScanned: { increment: 1 }, lastScannedAt: new Date() },
    })
    return
  }

  // 4. Classify context
  const recipientType: 'INTERNAL' | 'EXTERNAL' | 'UNKNOWN' = isExternalRecipient
    ? 'EXTERNAL'
    : 'INTERNAL'

  const classification = await classifyContext({
    piiResult,
    senderRole: 'STAFF',
    recipientType,
    hasConsentRecord: false,
    additionalContext: `Channel: ${sourceType}`,
  })

  // 5. If not a violation, log and exit
  if (!classification.isViolation) {
    await db.auditEvent.create({
      data: {
        orgId,
        action: 'MESSAGE_SCANNED_NO_VIOLATION',
        resource: 'DataSource',
        resourceId: sourceId,
        metadata: {
          messageId,
          sourceType,
          entities: piiResult.entities.map((e) => e.type),
          reasoning: classification.reasoning,
        },
      },
    })
    await db.dataSource.update({
      where: { id: sourceId },
      data: { messagesScanned: { increment: 1 }, lastScannedAt: new Date() },
    })
    return
  }

  // 6. Score risk
  const existingIncidents = await db.incident.count({
    where: {
      orgId,
      ruleCode: { in: classification.applicableRules },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  })
  const isRepeatOffender = existingIncidents > 0

  const riskResult = scoreRisk({
    classification,
    entities: piiResult.entities.map((e) => e.type),
    isRepeatOffender,
    dataSubjectCount: 1,
  })

  // 7. Get remediation steps
  const remediationSteps = await getRemediationSteps(
    classification.applicableRules,
    piiResult.entities.map((e) => e.type),
    org.vertical
  )

  // 8. Get risk explanation from Claude
  const riskExplanation = await getRiskExplanation(
    classification.applicableRules,
    piiResult.entities.map((e) => e.type),
    riskResult.severity,
    org.vertical,
    recipientType,
    false
  ).catch((err: Error) => {
    logger.warn('[MessageProcessor] Risk explanation failed (non-fatal):', { err: err.message })
    return classification.reasoning
  })

  // 9. Find or create StaffMember by hashed identifier
  const hashedIdentifier = crypto
    .createHash('sha256')
    .update(`${orgId}:${fromIdentifier}`)
    .digest('hex')

  let staffMember = await db.staffMember.findUnique({
    where: { hashedIdentifier },
  })

  if (!staffMember) {
    staffMember = await db.staffMember.create({
      data: {
        orgId,
        name: fromIdentifier.includes('@') ? fromIdentifier.split('@')[0] : fromIdentifier,
        hashedIdentifier,
        totalIncidents: 0,
      },
    })
  }

  // Pick primary applicable rule (first one)
  const primaryRuleCode = classification.applicableRules[0] ?? 'DPDP-S7B-001'

  // Determine framework from rule code prefix
  const frameworkMap: Record<string, string> = {
    DPDP: 'DPDP',
    IT: 'IT_ACT',
    NMC: 'NMC',
    RBI: 'RBI',
    SEBI: 'SEBI',
    IRDAI: 'IRDAI',
    BCI: 'BAR_COUNCIL',
    LL: 'LABOUR_LAW',
  }
  const prefix = primaryRuleCode.split('-')[0]
  const framework = (frameworkMap[prefix] ?? 'DPDP') as 'DPDP' | 'IT_ACT' | 'NMC' | 'RBI' | 'SEBI' | 'IRDAI' | 'BAR_COUNCIL' | 'LABOUR_LAW' | 'POCSO'

  // 10. Create Incident in DB
  const incident = await db.incident.create({
    data: {
      orgId,
      sourceId,
      ruleId: primaryRuleCode,
      ruleCode: primaryRuleCode,
      ruleName: primaryRuleCode,
      framework,
      severity: riskResult.severity,
      status: 'OPEN',
      channel: sourceType,
      entityTypes: piiResult.entities.map((e) => e.type),
      entityCount: piiResult.entities.length,
      contextSummary: piiResult.rawSummary,
      staffMemberId: staffMember.id,
      staffIdentifier: hashedIdentifier,
      remediationSteps,
      riskExplanation,
      occurredAt: new Date(timestamp),
    },
  })

  // Update staff member incident count
  await db.staffMember.update({
    where: { id: staffMember.id },
    data: {
      totalIncidents: { increment: 1 },
      lastIncidentAt: new Date(),
    },
  })

  // Update datasource scan count
  await db.dataSource.update({
    where: { id: sourceId },
    data: { messagesScanned: { increment: 1 }, lastScannedAt: new Date() },
  })

  // 11. Update org health score
  await updateOrgHealthScore(orgId, `New ${riskResult.severity} incident detected (${primaryRuleCode})`).catch(
    (err: Error) => logger.error('[MessageProcessor] Health score update failed:', { err: err.message })
  )

  // 12. Add to alertSenderQueue
  await alertSenderQueue.add(
    'send-alert',
    { incidentId: incident.id, orgId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  )

  // 13. Emit socket event
  emitToOrg(orgId, 'new_incident', {
    incidentId: incident.id,
    severity: riskResult.severity,
    ruleCode: primaryRuleCode,
    channel: sourceType,
    occurredAt: incident.occurredAt,
  })

  logger.info(`[MessageProcessor] Incident created: ${incident.id} (${riskResult.severity}) for org ${orgId}`)
}
