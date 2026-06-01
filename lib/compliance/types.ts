export type Vertical = 'CA_FIRM' | 'HEALTHCARE' | 'FINANCIAL' | 'LEGAL' | 'EDTECH' | 'HR_TECH' | 'GENERAL'
export type Framework = 'DPDP' | 'IT_ACT' | 'RBI' | 'SEBI' | 'IRDAI' | 'NMC' | 'BAR_COUNCIL' | 'LABOUR_LAW' | 'POCSO'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EntityType =
  | 'PERSON_NAME'
  | 'MOBILE_NUMBER'
  | 'EMAIL_ADDRESS'
  | 'AADHAAR_NUMBER'
  | 'PAN_NUMBER'
  | 'GSTIN'
  | 'BANK_ACCOUNT'
  | 'FINANCIAL_DATA'
  | 'HEALTH_CONDITION'
  | 'MEDICAL_RECORD'
  | 'LOCATION_DATA'
  | 'DATE_OF_BIRTH'
  | 'PASSPORT_NUMBER'
  | 'VOTER_ID'
  | 'SENSITIVE_CATEGORY'

export type TriggerCondition = {
  entityTypes?: EntityType[]
  recipientType?: 'INTERNAL' | 'EXTERNAL' | 'UNKNOWN'
  hasConsent?: boolean
  keywords?: string[]
}

export interface ComplianceRule {
  code: string
  name: string
  description: string
  framework: Framework
  section: string
  triggerConditions: TriggerCondition[]
  severity: Severity
  penaltyRange: string
  appliesTo: Vertical[]
  requiredEntities?: EntityType[]
  contextConditions?: string[]
}

export interface ClassificationResult {
  isViolation: boolean
  confidence: number
  reasoning: string
  applicableRules: string[]
}

export interface DetectedEntity {
  type: EntityType
  confidence: number
}

export type DataCategory =
  | 'PERSONAL_DATA'
  | 'SENSITIVE_PERSONAL_DATA'
  | 'FINANCIAL_DATA'
  | 'HEALTH_DATA'
  | 'CHILDREN_DATA'

export interface PiiDetectionResult {
  hasPersonalData: boolean
  entities: DetectedEntity[]
  dataCategories: DataCategory[]
  rawSummary: string
  detectionMethod: 'LOCAL' | 'AI' | 'BOTH'
  processingMs: number
}
