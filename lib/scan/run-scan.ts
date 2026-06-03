import { db } from '@/lib/db'
import { detectPii } from '@/lib/ai/pii-detector'
import { classifyContext } from '@/lib/ai/context-classifier'
import { scoreRisk } from '@/lib/ai/risk-scorer'
import { getRemediationSteps } from '@/lib/ai/remediation-engine'
import type { SourceType, Vertical } from '@prisma/client'

const FRAMEWORK_MAP: Record<string, string> = {
  DPDP: 'DPDP', IT: 'IT_ACT', NMC: 'NMC', RBI: 'RBI',
  SEBI: 'SEBI', IRDAI: 'IRDAI', BCI: 'BAR_COUNCIL', LL: 'LABOUR_LAW',
}

export interface RunScanInput {
  orgId: string
  vertical: Vertical
  content: string
  channel: SourceType
  isExternalRecipient: boolean
  /** Optional human-readable origin for the incident summary (e.g. an email subject). */
  sourceLabel?: string
}

export interface RunScanOutcome {
  violation: boolean
  saved: boolean
  hasPersonalData: boolean
  incidentId?: string
  severity?: string
  framework?: string
  ruleCode?: string
  entities?: string[]
  summary?: string
  reasoning?: string
  remediationSteps?: string[]
  message?: string
}

/**
 * Runs the full AI compliance pipeline on a single piece of text and (if it's a
 * violation) creates an Incident. Shared by the manual scan endpoint and the
 * Gmail inbox scanner so both behave identically — no background worker needed.
 */
export async function runComplianceScan(input: RunScanInput): Promise<RunScanOutcome> {
  const { orgId, vertical, content, channel, isExternalRecipient, sourceLabel } = input

  const piiResult = await detectPii(content)
  if (!piiResult.hasPersonalData) {
    return { violation: false, saved: false, hasPersonalData: false, message: 'No personal data detected.' }
  }

  const recipientType = isExternalRecipient ? 'EXTERNAL' : 'INTERNAL'
  const classification = await classifyContext({
    piiResult,
    senderRole: 'STAFF',
    recipientType,
    hasConsentRecord: false,
    additionalContext: `Channel: ${channel}${sourceLabel ? ` — ${sourceLabel}` : ''}`,
  })

  if (!classification.isViolation) {
    return {
      violation: false,
      saved: false,
      hasPersonalData: true,
      entities: piiResult.entities.map((e) => e.type),
      reasoning: classification.reasoning,
      message: 'Personal data found, but classified as compliant.',
    }
  }

  const riskResult = scoreRisk({
    classification,
    entities: piiResult.entities.map((e) => e.type),
    isRepeatOffender: false,
    dataSubjectCount: 1,
  })

  const remediationSteps = await getRemediationSteps(
    classification.applicableRules,
    piiResult.entities.map((e) => e.type),
    vertical
  ).catch(() => [] as string[])

  const primaryRuleCode = classification.applicableRules[0] ?? 'DPDP-S7B-001'
  const framework = (FRAMEWORK_MAP[primaryRuleCode.split('-')[0]] ?? 'DPDP') as
    'DPDP' | 'IT_ACT' | 'NMC' | 'RBI' | 'SEBI' | 'IRDAI' | 'BAR_COUNCIL' | 'LABOUR_LAW' | 'POCSO'

  const source =
    (await db.dataSource.findFirst({ where: { orgId, type: channel }, select: { id: true } })) ??
    (await db.dataSource.findFirst({ where: { orgId }, select: { id: true } }))

  const base = {
    violation: true as const,
    hasPersonalData: true,
    severity: riskResult.severity,
    framework,
    ruleCode: primaryRuleCode,
    entities: piiResult.entities.map((e) => e.type),
    summary: piiResult.rawSummary,
    reasoning: classification.reasoning,
    remediationSteps,
  }

  if (!source) {
    return { ...base, saved: false, message: 'Violation detected, but no data source exists to attach it to.' }
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
      channel,
      entityTypes: piiResult.entities.map((e) => e.type),
      entityCount: piiResult.entities.length,
      contextSummary: piiResult.rawSummary,
      remediationSteps,
      riskExplanation: classification.reasoning,
      occurredAt: new Date(),
    },
    select: { id: true },
  })

  return { ...base, saved: true, incidentId: incident.id }
}
