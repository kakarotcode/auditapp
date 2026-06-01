import { dpdpBaseRules } from './rulebooks/dpdp-base'
import { healthcareRules } from './rulebooks/healthcare'
import { financialRules } from './rulebooks/financial'
import { legalRules } from './rulebooks/legal'
import { edtechRules } from './rulebooks/edtech'
import { hrTechRules } from './rulebooks/hr-tech'
import type { ComplianceRule, Framework, Vertical } from './types'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Global rule registry — built once at module initialisation
// ---------------------------------------------------------------------------

const ALL_RULES: Map<string, ComplianceRule> = new Map()
;[
  ...dpdpBaseRules,
  ...healthcareRules,
  ...financialRules,
  ...legalRules,
  ...edtechRules,
  ...hrTechRules,
].forEach(r => ALL_RULES.set(r.code, r))

// ---------------------------------------------------------------------------
// Framework → rule mapping
// ---------------------------------------------------------------------------

const FRAMEWORK_RULES: Record<Framework, ComplianceRule[]> = {
  DPDP: [
    ...dpdpBaseRules.filter(r => r.framework === 'DPDP'),
    ...healthcareRules.filter(r => r.framework === 'DPDP'),
    ...edtechRules.filter(r => r.framework === 'DPDP'),
    ...hrTechRules.filter(r => r.framework === 'DPDP'),
    ...legalRules.filter(r => r.framework === 'DPDP'),
  ],
  IT_ACT: dpdpBaseRules.filter(r => r.framework === 'IT_ACT'),
  RBI: financialRules.filter(r => r.framework === 'RBI'),
  SEBI: financialRules.filter(r => r.framework === 'SEBI'),
  IRDAI: financialRules.filter(r => r.framework === 'IRDAI'),
  NMC: healthcareRules.filter(r => r.framework === 'NMC'),
  BAR_COUNCIL: legalRules.filter(r => r.framework === 'BAR_COUNCIL'),
  LABOUR_LAW: hrTechRules.filter(r => r.framework === 'LABOUR_LAW'),
  POCSO: [
    ...edtechRules.filter(r => r.framework === 'POCSO'),
    // Include children's data rules that have POCSO implications
    ...dpdpBaseRules.filter(r => r.code.includes('S12')),
    ...edtechRules.filter(r => r.code.includes('S12')),
  ],
}

// ---------------------------------------------------------------------------
// Vertical → default applicable frameworks
// (used as fallback when org has no explicit activeFrameworks config)
// ---------------------------------------------------------------------------

const VERTICAL_DEFAULT_FRAMEWORKS: Record<Vertical, Framework[]> = {
  CA_FIRM: ['DPDP', 'IT_ACT'],
  HEALTHCARE: ['DPDP', 'NMC', 'IT_ACT', 'IRDAI'],
  FINANCIAL: ['DPDP', 'RBI', 'SEBI', 'IRDAI', 'IT_ACT'],
  LEGAL: ['DPDP', 'BAR_COUNCIL', 'IT_ACT'],
  EDTECH: ['DPDP', 'POCSO', 'IT_ACT'],
  HR_TECH: ['DPDP', 'LABOUR_LAW', 'IT_ACT'],
  GENERAL: ['DPDP', 'IT_ACT'],
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up a single rule by its code.
 */
export function getRuleByCode(code: string): ComplianceRule | undefined {
  return ALL_RULES.get(code)
}

/**
 * Retrieve the full deduplicated rulebook for an organisation based on its
 * active frameworks and vertical.
 */
export async function getRulebookForOrg(orgId: string): Promise<ComplianceRule[]> {
  const org = await db.organisation.findUnique({
    where: { id: orgId },
    select: { activeFrameworks: true, vertical: true },
  })

  if (!org) return []

  const frameworks: Framework[] =
    org.activeFrameworks.length > 0
      ? (org.activeFrameworks as Framework[])
      : VERTICAL_DEFAULT_FRAMEWORKS[org.vertical as Vertical] ?? ['DPDP']

  const ruleMap = new Map<string, ComplianceRule>()
  for (const fw of frameworks) {
    const fwRules = FRAMEWORK_RULES[fw] ?? []
    for (const rule of fwRules) {
      ruleMap.set(rule.code, rule)
    }
  }

  return Array.from(ruleMap.values())
}

/**
 * Return the count of active rules for an organisation (used for dashboard stats).
 */
export async function getActiveRulesCount(orgId: string): Promise<number> {
  const rules = await getRulebookForOrg(orgId)
  return rules.length
}

/**
 * Resolve a list of rule codes to full ComplianceRule objects.
 * Silently ignores unknown codes.
 */
export function getRulesForViolation(ruleCodes: string[]): ComplianceRule[] {
  return ruleCodes
    .map(code => ALL_RULES.get(code))
    .filter((r): r is ComplianceRule => r !== undefined)
}

/**
 * Return all rules that apply to a specific vertical, across all frameworks.
 */
export function getRulesForVertical(vertical: Vertical): ComplianceRule[] {
  const result = new Map<string, ComplianceRule>()
  ALL_RULES.forEach(rule => {
    if (rule.appliesTo.includes(vertical)) {
      result.set(rule.code, rule)
    }
  })
  return Array.from(result.values())
}

/**
 * Return all rules for a given framework.
 */
export function getRulesForFramework(framework: Framework): ComplianceRule[] {
  return FRAMEWORK_RULES[framework] ?? []
}

/**
 * Return the total number of rules in the global registry (for system health checks).
 */
export function getTotalRulesCount(): number {
  return ALL_RULES.size
}
