import type { ClassificationResult, EntityType, Severity } from '@/lib/compliance/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskScoreResult {
  severity: Severity
  score: number
  factors: string[]
}

export interface RiskScorerInput {
  classification: ClassificationResult
  entities: EntityType[]
  isRepeatOffender: boolean
  dataSubjectCount: number
}

// ---------------------------------------------------------------------------
// Entity sensitivity classification
// ---------------------------------------------------------------------------

const CRITICAL_ENTITY_TYPES = new Set<EntityType>([
  'AADHAAR_NUMBER',
  'PAN_NUMBER',
  'HEALTH_CONDITION',
  'MEDICAL_RECORD',
  'FINANCIAL_DATA',
  'BANK_ACCOUNT',
  'SENSITIVE_CATEGORY',
  'PASSPORT_NUMBER',
])

const HIGH_ENTITY_TYPES = new Set<EntityType>([
  'MOBILE_NUMBER',
  'EMAIL_ADDRESS',
  'VOTER_ID',
  'LOCATION_DATA',
  'DATE_OF_BIRTH',
  'GSTIN',
])

// ---------------------------------------------------------------------------
// Severity ordering (for upgrade logic)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function upgradeSeverity(current: Severity, levels = 1): Severity {
  const idx = SEVERITY_ORDER.indexOf(current)
  const next = Math.min(idx + levels, SEVERITY_ORDER.length - 1)
  return SEVERITY_ORDER[next]
}

// ---------------------------------------------------------------------------
// Base severity determination
// ---------------------------------------------------------------------------

interface BaseAssessment {
  severity: Severity
  baseScore: number
  reasons: string[]
}

function determineBaseSeverity(
  classification: ClassificationResult,
  entities: EntityType[],
): BaseAssessment {
  const reasons: string[] = []

  // If Claude classified as non-violation, start at LOW
  if (!classification.isViolation || classification.confidence < 0.50) {
    return {
      severity: 'LOW',
      baseScore: 10,
      reasons: ['Classification confidence below threshold — minor risk only'],
    }
  }

  const hasCriticalEntity = entities.some(e => CRITICAL_ENTITY_TYPES.has(e))
  const hasHighEntity = entities.some(e => HIGH_ENTITY_TYPES.has(e))

  // Derive recipient type from applicable rules (rules with external transmission codes)
  const externalTransmissionRules = [
    'DPDP-S7B-001', 'DPDP-S7B-002', 'DPDP-S7B-003', 'DPDP-S7C-001',
    'IT-S72A-001', 'RBI-KYC-001', 'NMC-R14-002', 'BCI-R22-001',
  ]
  const isExternalTransmission = classification.applicableRules.some(r =>
    externalTransmissionRules.includes(r),
  )

  // CRITICAL: external transmission of highly sensitive data without consent
  if (isExternalTransmission && hasCriticalEntity && classification.confidence >= 0.80) {
    reasons.push('Critical personal data (Aadhaar/PAN/health/financial) transmitted externally without consent')
    reasons.push(`Violated rules: ${classification.applicableRules.join(', ')}`)
    return { severity: 'CRITICAL', baseScore: 95, reasons }
  }

  // CRITICAL: public channel transmission (S7C rule)
  if (classification.applicableRules.includes('DPDP-S7C-001')) {
    reasons.push('Personal data shared on public channel or group without consent')
    return { severity: 'CRITICAL', baseScore: 90, reasons }
  }

  // CRITICAL: children's data
  if (
    classification.applicableRules.some(r => r.includes('S12')) &&
    classification.confidence >= 0.75
  ) {
    reasons.push("Children's data processed without verifiable parental consent (DPDP Act Section 12)")
    return { severity: 'CRITICAL', baseScore: 90, reasons }
  }

  // HIGH: external transmission of any personal data without consent
  if (isExternalTransmission && !hasCriticalEntity && hasHighEntity) {
    reasons.push('Personal data transmitted to external party without documented consent')
    return { severity: 'HIGH', baseScore: 70, reasons }
  }

  // HIGH: external + critical entity but lower confidence
  if (isExternalTransmission && hasCriticalEntity && classification.confidence >= 0.60) {
    reasons.push('Sensitive personal data possibly transmitted externally — confidence moderate')
    return { severity: 'HIGH', baseScore: 65, reasons }
  }

  // HIGH: internal transmission of clearly sensitive data
  if (!isExternalTransmission && hasCriticalEntity && classification.confidence >= 0.80) {
    reasons.push('Sensitive personal data transmitted internally without clear consent record')
    return { severity: 'HIGH', baseScore: 60, reasons }
  }

  // MEDIUM: internal transmission with unclear consent, borderline external
  if (hasCriticalEntity || (hasHighEntity && classification.confidence >= 0.60)) {
    reasons.push('Personal data transmission with unclear consent — borderline violation')
    return { severity: 'MEDIUM', baseScore: 40, reasons }
  }

  // LOW: minor process gap
  reasons.push('Minor process gap — consent documentation or procedural issue')
  return { severity: 'LOW', baseScore: 20, reasons }
}

// ---------------------------------------------------------------------------
// Main scoring function (pure — no API calls)
// ---------------------------------------------------------------------------

export function scoreRisk(input: RiskScorerInput): RiskScoreResult {
  const { classification, entities, isRepeatOffender, dataSubjectCount } = input
  const factors: string[] = []

  const base = determineBaseSeverity(classification, entities)
  factors.push(...base.reasons)

  let { severity } = base
  let { baseScore: score } = base

  // Multiplier 1: bulk data subject exposure
  if (dataSubjectCount > 5) {
    severity = upgradeSeverity(severity)
    score = Math.min(score + 15, 100)
    factors.push(`Bulk exposure: ${dataSubjectCount} data subjects affected (threshold: >5) — severity upgraded`)
  }

  // Multiplier 2: repeat offender
  if (isRepeatOffender) {
    severity = upgradeSeverity(severity)
    score = Math.min(score + 10, 100)
    factors.push('Repeat offender: organisation has prior violations of the same rule — severity upgraded')
  }

  // Score nudges for specific entity types
  const criticalEntityCount = entities.filter(e => CRITICAL_ENTITY_TYPES.has(e)).length
  if (criticalEntityCount > 1) {
    score = Math.min(score + criticalEntityCount * 3, 100)
    factors.push(`Multiple sensitive entity types detected: ${criticalEntityCount} critical categories`)
  }

  // Confidence factor: reduce score for low-confidence classifications
  if (classification.confidence < 0.70) {
    score = Math.max(score - 10, 5)
    factors.push(`Confidence factor: classification confidence is ${(classification.confidence * 100).toFixed(0)}% — score reduced`)
  }

  // Cap severity at CRITICAL (already handled by upgradeSeverity, but explicit guard)
  const finalSeverity: Severity = severity

  return {
    severity: finalSeverity,
    score: Math.round(score),
    factors,
  }
}
