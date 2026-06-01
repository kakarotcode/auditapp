/**
 * Aggregated export of all compliance rules across frameworks.
 * Used by the dashboard stats API for framework coverage calculation.
 */

import { dpdpBaseRules } from './rulebooks/dpdp-base'
import { healthcareRules } from './rulebooks/healthcare'
import { financialRules } from './rulebooks/financial'
import { legalRules } from './rulebooks/legal'
import { edtechRules } from './rulebooks/edtech'
import { hrTechRules } from './rulebooks/hr-tech'

export const COMPLIANCE_RULES = [
  ...dpdpBaseRules,
  ...healthcareRules,
  ...financialRules,
  ...legalRules,
  ...edtechRules,
  ...hrTechRules,
]

export type { ComplianceRule } from './types'
