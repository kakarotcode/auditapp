import { logger } from '@/lib/logger'
import { Job } from 'bullmq'
import crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { detectPii } from '@/lib/ai/pii-detector'
import { classifyContext } from '@/lib/ai/context-classifier'
import { scoreRisk } from '@/lib/ai/risk-scorer'
import { getRemediationSteps } from '@/lib/ai/remediation-engine'
import { RISK_EXPLANATION_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { updateOrgHealthScore } from '@/lib/compliance/health-score'
import { db } from '@/lib/db'
import { alertSenderQueue } from '@/lib/queue'
import { emitToOrg } from '@/lib/socket/server'
import type { DocumentScannerJobData } from '@/lib/queue'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BULK_PII_THRESHOLD = 5

interface RiskExplanationPayload {
  explanation: string
  penaltyRange: string
}

async function getRiskExplanation(
  violatedRuleCodes: string[],
  entityTypes: string[],
  severity: string,
  vertical: string
): Promise<string> {
  const payload = { violatedRuleCodes, entityTypes, severity, vertical, recipientType: 'UNKNOWN', hasConsent: false }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
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
    const parsed = JSON.parse(block.text) as RiskExplanationPayload
    return `${parsed.explanation}\n\nPenalty range: ${parsed.penaltyRange}`
  } catch {
    return block.text
  }
}

/**
 * Estimate the number of unique data subjects in a document.
 * Uses heuristic: count lines that contain an Aadhaar/PAN/mobile pattern
 * as a proxy for rows in a data dump.
 */
function estimateDataSubjectCount(content: string): number {
  const AADHAAR = /\b\d{4}\s?\d{4}\s?\d{4}\b/g
  const PAN = /\b[A-Z]{5}\d{4}[A-Z]\b/g
  const MOBILE = /\b(?:\+91|0)?[6-9]\d{9}\b/g

  const lines = content.split('\n')
  let subjectCount = 0

  for (const line of lines) {
    AADHAAR.lastIndex = 0
    PAN.lastIndex = 0
    MOBILE.lastIndex = 0

    if (AADHAAR.test(line) || PAN.test(line) || MOBILE.test(line)) {
      subjectCount++
    }
  }

  // At minimum 1 if PII was found
  return Math.max(subjectCount, 1)
}

export async function scanDocument(job: Job<DocumentScannerJobData>): Promise<void> {
  const {
    orgId,
    sourceId,
    sourceType,
    fileId,
    fileName,
    fileContent,
  } = job.data

  logger.info(`[DocumentScanner] Processing job ${job.id} — org=${orgId} file=${fileName}`)

  // 1. Load org
  const org = await db.organisation.findUnique({
    where: { id: orgId },
    select: { id: true, vertical: true, ruleOverrides: true },
  })

  if (!org) {
    throw new Error(`Organisation ${orgId} not found`)
  }

  // 2. Detect PII (scan first 3000 chars for API efficiency; full file for subject count)
  const scanChunk = fileContent.slice(0, 3000)
  const piiResult = await detectPii(scanChunk)

  // 3. If no PII, log and exit
  if (!piiResult.hasPersonalData) {
    await db.auditEvent.create({
      data: {
        orgId,
        action: 'DOCUMENT_SCANNED_CLEAN',
        resource: 'DataSource',
        resourceId: sourceId,
        metadata: { fileId, fileName, sourceType, processingMs: piiResult.processingMs },
      },
    })
    return
  }

  // 4. Estimate data subject count from full content
  const dataSubjectCount = estimateDataSubjectCount(fileContent)
  const isBulkPii = dataSubjectCount > BULK_PII_THRESHOLD

  // 5. Classify context
  const classification = await classifyContext({
    piiResult,
    senderRole: 'STAFF',
    recipientType: 'UNKNOWN',
    hasConsentRecord: false,
    additionalContext: `Document: ${fileName}, Source: ${sourceType}, DataSubjects: ${dataSubjectCount}`,
  })

  // 6. If not a violation, log and exit
  if (!classification.isViolation) {
    await db.auditEvent.create({
      data: {
        orgId,
        action: 'DOCUMENT_SCANNED_NO_VIOLATION',
        resource: 'DataSource',
        resourceId: sourceId,
        metadata: {
          fileId,
          fileName,
          entities: piiResult.entities.map((e) => e.type),
          reasoning: classification.reasoning,
        },
      },
    })
    return
  }

  // 7. Score risk — upgrade severity for bulk PII
  const existingIncidents = await db.incident.count({
    where: {
      orgId,
      ruleCode: { in: classification.applicableRules },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  })

  const riskResult = scoreRisk({
    classification,
    entities: piiResult.entities.map((e) => e.type),
    isRepeatOffender: existingIncidents > 0,
    dataSubjectCount,
  })

  // If bulk PII, ensure at least HIGH severity
  const SEVERITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
  type SeverityType = (typeof SEVERITY_ORDER)[number]

  let finalSeverity: SeverityType = riskResult.severity as SeverityType
  if (isBulkPii) {
    const currentIdx = SEVERITY_ORDER.indexOf(finalSeverity)
    const minIdx = SEVERITY_ORDER.indexOf('HIGH')
    if (currentIdx < minIdx) {
      finalSeverity = 'HIGH'
      logger.info(`[DocumentScanner] Severity upgraded to HIGH due to bulk PII (${dataSubjectCount} subjects)`)
    }
  }

  // 8. Get remediation steps
  const remediationSteps = await getRemediationSteps(
    classification.applicableRules,
    piiResult.entities.map((e) => e.type),
    org.vertical
  )

  // 9. Get risk explanation
  const riskExplanation = await getRiskExplanation(
    classification.applicableRules,
    piiResult.entities.map((e) => e.type),
    finalSeverity,
    org.vertical
  ).catch((err: Error) => {
    logger.warn('[DocumentScanner] Risk explanation failed (non-fatal):', { err: err.message })
    return classification.reasoning
  })

  // 10. Find or create StaffMember (use fileId as pseudo-identifier for document sources)
  const hashedIdentifier = crypto
    .createHash('sha256')
    .update(`${orgId}:document:${fileId}`)
    .digest('hex')

  let staffMember = await db.staffMember.findUnique({ where: { hashedIdentifier } })

  if (!staffMember) {
    staffMember = await db.staffMember.create({
      data: {
        orgId,
        name: `Document Owner (${fileName})`,
        hashedIdentifier,
        totalIncidents: 0,
      },
    })
  }

  // Determine primary rule and framework
  const primaryRuleCode = classification.applicableRules[0] ?? 'DPDP-S7B-001'
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

  // 11. Create Incident
  const incident = await db.incident.create({
    data: {
      orgId,
      sourceId,
      ruleId: primaryRuleCode,
      ruleCode: primaryRuleCode,
      ruleName: primaryRuleCode,
      framework,
      severity: finalSeverity,
      status: 'OPEN',
      channel: sourceType,
      entityTypes: piiResult.entities.map((e) => e.type),
      entityCount: dataSubjectCount,
      contextSummary: isBulkPii
        ? `Bulk PII detected in document "${fileName}": ${dataSubjectCount} data subjects. ${piiResult.rawSummary}`
        : `PII detected in document "${fileName}". ${piiResult.rawSummary}`,
      staffMemberId: staffMember.id,
      staffIdentifier: hashedIdentifier,
      remediationSteps,
      riskExplanation,
      occurredAt: new Date(),
    },
  })

  // Update staff member
  await db.staffMember.update({
    where: { id: staffMember.id },
    data: { totalIncidents: { increment: 1 }, lastIncidentAt: new Date() },
  })

  // 12. Update health score
  await updateOrgHealthScore(
    orgId,
    `Document scan ${finalSeverity} incident: ${fileName} (${dataSubjectCount} subjects)`
  ).catch((err: Error) => logger.error('[DocumentScanner] Health score update failed:', { err: err.message }))

  // 13. Enqueue alert
  await alertSenderQueue.add(
    'send-alert',
    { incidentId: incident.id, orgId },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  )

  // 14. Emit socket event
  emitToOrg(orgId, 'new_incident', {
    incidentId: incident.id,
    severity: finalSeverity,
    ruleCode: primaryRuleCode,
    channel: sourceType,
    fileName,
    isBulkPii,
    dataSubjectCount,
    occurredAt: incident.occurredAt,
  })

  logger.info(
    `[DocumentScanner] Incident created: ${incident.id} (${finalSeverity}) — bulk=${isBulkPii} subjects=${dataSubjectCount}`
  )
}
