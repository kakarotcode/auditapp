import type { ComplianceRule } from '@/lib/compliance/types'

export const dpdpBaseRules: ComplianceRule[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // DPDP Act 2023 — Section 7: Consent
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'DPDP-S7A-001',
    name: 'Processing Personal Data Without Valid Consent Notice',
    description:
      'Personal data is being processed without providing the data principal with a clear, itemised consent notice in plain language as required. The notice must specify the purpose of processing, the categories of data collected, and the rights of the data principal.',
    framework: 'DPDP',
    section: 'Section 7(a) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      { entityTypes: ['PERSON_NAME', 'MOBILE_NUMBER', 'EMAIL_ADDRESS'], hasConsent: false },
      {
        entityTypes: ['AADHAAR_NUMBER', 'PAN_NUMBER', 'HEALTH_CONDITION', 'MEDICAL_RECORD'],
        hasConsent: false,
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹250 crore per instance (DPDP Act Schedule, Item 1)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['No consent notice served before data collection'],
  },
  {
    code: 'DPDP-S7B-001',
    name: 'Sensitive Data Shared Externally Without Consent',
    description:
      'Health, financial, or government-identifier data (Aadhaar, PAN) has been transmitted to an external or unknown party without the data principal\'s explicit, free, and informed consent as mandated by DPDP Act Section 7(b).',
    framework: 'DPDP',
    section: 'Section 7(b) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'MEDICAL_RECORD', 'AADHAAR_NUMBER', 'PAN_NUMBER', 'FINANCIAL_DATA', 'BANK_ACCOUNT'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
      },
      {
        entityTypes: ['HEALTH_CONDITION', 'MEDICAL_RECORD', 'AADHAAR_NUMBER', 'PAN_NUMBER', 'FINANCIAL_DATA'],
        recipientType: 'UNKNOWN',
        hasConsent: false,
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹250 crore per instance (DPDP Act Schedule, Item 1)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    requiredEntities: ['AADHAAR_NUMBER', 'PAN_NUMBER', 'HEALTH_CONDITION', 'MEDICAL_RECORD', 'FINANCIAL_DATA'],
    contextConditions: ['Recipient is external', 'No consent record exists'],
  },
  {
    code: 'DPDP-S7B-002',
    name: 'Personal Data Shared With Unregistered Third Party',
    description:
      'Personal data has been shared with a third party that has not been registered as a data processor under a valid Data Processing Agreement. Under DPDP Act Section 7(b), sharing with an unregistered third party without valid consent constitutes a violation.',
    framework: 'DPDP',
    section: 'Section 7(b) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'MOBILE_NUMBER', 'EMAIL_ADDRESS', 'LOCATION_DATA'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹200 crore per instance (DPDP Act Schedule, Item 2)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['Third party has no Data Processing Agreement'],
  },
  {
    code: 'DPDP-S7B-003',
    name: 'Sensitive Personal Data Transmitted Via Unencrypted Channel',
    description:
      'Aadhaar numbers, PAN numbers, or other sensitive personal data have been transmitted over an unencrypted or insecure communication channel (e.g., plain SMS, unencrypted email, WhatsApp). This violates DPDP Act Section 7(b) and the IT (Reasonable Security Practices) Rules 2011.',
    framework: 'DPDP',
    section: 'Section 7(b) — DPDP Act 2023; IT (RSP&P) Rules 2011 Rule 8',
    triggerConditions: [
      {
        entityTypes: ['AADHAAR_NUMBER', 'PAN_NUMBER', 'BANK_ACCOUNT', 'FINANCIAL_DATA'],
        keywords: ['whatsapp', 'sms', 'unencrypted', 'plain email', 'forward'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹250 crore (DPDP Act) + civil compensation under IT Act Section 43A',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    requiredEntities: ['AADHAAR_NUMBER', 'PAN_NUMBER'],
    contextConditions: ['Channel is unencrypted or publicly accessible'],
  },
  {
    code: 'DPDP-S7C-001',
    name: 'Personal Data Shared on Public Channel or Group Without Consent',
    description:
      'Personal data has been posted or shared in a public channel, broadcast group, or social media platform without the data principal\'s consent. This creates uncontrolled exposure to an unlimited number of unknown recipients.',
    framework: 'DPDP',
    section: 'Section 7 — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'MOBILE_NUMBER', 'AADHAAR_NUMBER', 'HEALTH_CONDITION'],
        recipientType: 'UNKNOWN',
        hasConsent: false,
        keywords: ['group', 'broadcast', 'forward', 'public', 'post'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹250 crore (DPDP Act Schedule, Item 1)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['Message sent to a group or broadcast list'],
  },
  {
    code: 'DPDP-S7A-002',
    name: 'Consent Obtained Through Deceptive Means',
    description:
      'Evidence suggests that consent was obtained through coercion, deception, or as a condition of service where the data processing is not necessary for that service. Under DPDP Act Section 7, consent must be free, specific, informed, and unconditional.',
    framework: 'DPDP',
    section: 'Section 7 (Proviso) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['forced consent', 'no option', 'mandatory', 'bundled consent', 'pre-ticked'],
        hasConsent: false,
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹200 crore (DPDP Act Schedule)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Consent was bundled or obtained under duress'],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // DPDP Act — Section 8: Obligations of Data Fiduciary
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'DPDP-S8-001',
    name: 'Personal Data Processed Beyond Stated Purpose',
    description:
      'Personal data collected for a stated purpose is being used for a materially different purpose without obtaining fresh consent. DPDP Act Section 8(1) requires data fiduciaries to process personal data only for the purposes specified in the consent notice.',
    framework: 'DPDP',
    section: 'Section 8(1) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'EMAIL_ADDRESS', 'MOBILE_NUMBER', 'LOCATION_DATA'],
        keywords: ['marketing', 'profiling', 'resell', 'analytics', 'secondary use'],
        hasConsent: false,
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹200 crore per instance (DPDP Act Schedule, Item 2)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Data is being used for a purpose not stated in the original consent notice'],
  },
  {
    code: 'DPDP-S8-002',
    name: 'Personal Data Accuracy Not Maintained',
    description:
      'The data fiduciary has failed to take reasonable steps to ensure that personal data is accurate and up to date, as required by DPDP Act Section 8(3). Inaccurate data can cause harm to data principals in credit, healthcare, and legal contexts.',
    framework: 'DPDP',
    section: 'Section 8(3) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['outdated', 'incorrect data', 'wrong record', 'stale', 'obsolete'],
      },
    ],
    severity: 'MEDIUM',
    penaltyRange: 'Up to ₹50 crore (DPDP Act Schedule, Item 3)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Known inaccuracies in personal data have not been corrected'],
  },
  {
    code: 'DPDP-S8-003',
    name: 'Personal Data Processed for Profiling Without Explicit Consent',
    description:
      'Personal data is being used to create profiles, infer behaviour, or conduct automated decision-making about individuals without their explicit consent. This is particularly regulated for children under Section 12(3).',
    framework: 'DPDP',
    section: 'Section 8 read with Section 12(3) — DPDP Act 2023',
    triggerConditions: [
      {
        keywords: ['profiling', 'behavioral tracking', 'scoring', 'segmentation', 'automated decision'],
        hasConsent: false,
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹200 crore (DPDP Act Schedule)',
    appliesTo: ['FINANCIAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Profiling or automated decision-making without documented consent'],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // DPDP Act — Section 9: Retention
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'DPDP-S9-001',
    name: 'Data Retention Beyond Necessity Period',
    description:
      'Personal data is being retained beyond the period necessary for the purpose for which it was collected. DPDP Act Section 9(1) requires data fiduciaries to erase personal data as soon as the processing purpose is fulfilled and the legal retention period has lapsed.',
    framework: 'DPDP',
    section: 'Section 9(1) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['retention', 'archive', 'old records', 'expired consent', 'legacy data'],
      },
    ],
    severity: 'MEDIUM',
    penaltyRange: 'Up to ₹150 crore per instance (DPDP Act Schedule, Item 3)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Data is held beyond the stated or legally mandated retention period'],
  },
  {
    code: 'DPDP-S9-002',
    name: 'Personal Data Retained After Consent Withdrawal',
    description:
      'Personal data continues to be retained or processed after the data principal has withdrawn their consent. Upon consent withdrawal, DPDP Act Section 9 requires the data fiduciary to cease processing and erase the data unless a legitimate use or legal retention basis exists.',
    framework: 'DPDP',
    section: 'Section 9 read with Section 7(9) — DPDP Act 2023',
    triggerConditions: [
      {
        keywords: ['consent withdrawn', 'opt out', 'deletion request', 'erasure request'],
        hasConsent: false,
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹200 crore (DPDP Act Schedule)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Data principal has formally withdrawn consent'],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // DPDP Act — Section 11: Data Principal Rights
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'DPDP-S11-001',
    name: "Failure to Acknowledge Data Principal Rights Request Within 72 Hours",
    description:
      'The data fiduciary has failed to acknowledge a data principal\'s rights request (access, correction, erasure, grievance) within 72 hours as required by DPDP Act Section 11 and the forthcoming Data Protection Board regulations.',
    framework: 'DPDP',
    section: 'Section 11 — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['data request', 'access request', 'right to access', 'grievance', 'complaint', 'subject access'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹50 crore per instance (DPDP Act Schedule, Item 4)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['72+ hours elapsed since rights request without acknowledgement'],
  },
  {
    code: 'DPDP-S11-002',
    name: 'Data Principal Correction Request Ignored',
    description:
      'A data principal has requested correction of inaccurate or incomplete personal data and the data fiduciary has failed to respond or make the correction within a reasonable timeframe, violating Section 11(b) of the DPDP Act.',
    framework: 'DPDP',
    section: 'Section 11(b) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['correction request', 'update my data', 'wrong information', 'change record'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹50 crore (DPDP Act Schedule, Item 4)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Correction request not actioned within prescribed timeframe'],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // DPDP Act — Section 12: Children's Data
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'DPDP-S12-001',
    name: "Children's Data Processed Without Verifiable Parental Consent",
    description:
      'Personal data of an individual under 18 years of age is being processed without verifiable parental or guardian consent. DPDP Act Section 12 imposes strict obligations on data fiduciaries processing children\'s data, including age verification and parental consent mechanisms.',
    framework: 'DPDP',
    section: 'Section 12(1) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        entityTypes: ['DATE_OF_BIRTH', 'PERSON_NAME'],
        keywords: ['minor', 'child', 'student', 'under 18', 'school', 'juvenile'],
        hasConsent: false,
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹200 crore per instance (DPDP Act Schedule, Item 2)',
    appliesTo: ['EDTECH', 'HEALTHCARE', 'HR_TECH', 'GENERAL'],
    requiredEntities: ['DATE_OF_BIRTH'],
    contextConditions: ['Data subject is or may be under 18 years of age'],
  },
  {
    code: 'DPDP-S12-002',
    name: 'Behavioural Tracking of Children Under 18',
    description:
      'Behavioural monitoring, profiling, or targeted advertising is being conducted on individuals under 18 years of age. This is explicitly prohibited under DPDP Act Section 12(3) and applies to all digital platforms regardless of stated purpose.',
    framework: 'DPDP',
    section: 'Section 12(3) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['track', 'profile', 'behavioral', 'targeting', 'analytics', 'engagement score'],
        entityTypes: ['DATE_OF_BIRTH', 'LOCATION_DATA'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹200 crore (DPDP Act Schedule) + potential POCSO implications',
    appliesTo: ['EDTECH', 'GENERAL'],
    contextConditions: ['Activity involves tracking or profiling of users under 18'],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // DPDP Act — Section 16: Breach Notification
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'DPDP-S16-001',
    name: 'Failure to Notify Data Protection Board of Data Breach',
    description:
      'A personal data breach has occurred or is suspected, but the data fiduciary has not notified the Data Protection Board (and affected data principals) as required by DPDP Act Section 16. Notification must be made without undue delay.',
    framework: 'DPDP',
    section: 'Section 16 — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['breach', 'leak', 'unauthorized access', 'data stolen', 'hack', 'compromise', 'exposed'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹200 crore per instance (DPDP Act Schedule, Item 2)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Evidence of a data breach without corresponding DPB notification'],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // DPDP Act — Section 22A: DPIA
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'DPDP-S22A-001',
    name: 'Failure to Conduct Data Protection Impact Assessment',
    description:
      'A Significant Data Fiduciary (SDF) has failed to conduct a mandatory Data Protection Impact Assessment (DPIA) before implementing a high-risk processing activity as required by DPDP Act Section 22A. DPIAs are required for new processing activities involving sensitive data or large-scale processing.',
    framework: 'DPDP',
    section: 'Section 22A — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['new system', 'new process', 'large scale', 'high risk', 'AI processing', 'automated decision'],
        entityTypes: ['HEALTH_CONDITION', 'FINANCIAL_DATA', 'SENSITIVE_CATEGORY'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Up to ₹150 crore (DPDP Act Schedule)',
    appliesTo: ['HEALTHCARE', 'FINANCIAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Organisation is designated as a Significant Data Fiduciary'],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // IT Act 2000 / 2008
  // ─────────────────────────────────────────────────────────────────────────
  {
    code: 'IT-S43A-001',
    name: 'Failure to Maintain Reasonable Security Practices',
    description:
      'The body corporate has failed to implement and maintain reasonable security practices and procedures for protecting sensitive personal data as required by IT Act Section 43A and the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011.',
    framework: 'IT_ACT',
    section: 'Section 43A — Information Technology Act 2000 (as amended 2008)',
    triggerConditions: [
      {
        entityTypes: ['AADHAAR_NUMBER', 'PAN_NUMBER', 'HEALTH_CONDITION', 'BANK_ACCOUNT', 'FINANCIAL_DATA'],
        keywords: ['no encryption', 'plain text', 'unsecured', 'unprotected', 'no password'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Civil compensation as determined by adjudicating officer (no cap) + reputational damage',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    requiredEntities: ['AADHAAR_NUMBER', 'PAN_NUMBER', 'HEALTH_CONDITION', 'BANK_ACCOUNT'],
    contextConditions: ['Sensitive personal data stored or transmitted without adequate security controls'],
  },
  {
    code: 'IT-S72A-001',
    name: 'Disclosure of Information in Breach of Lawful Contract',
    description:
      'An intermediary or person who has secured access to personal information of another person under a lawful contract has disclosed that information without the person\'s consent and in breach of the lawful contract. This is a criminal offence under IT Act Section 72A.',
    framework: 'IT_ACT',
    section: 'Section 72A — Information Technology Act 2000 (as amended 2008)',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'MOBILE_NUMBER', 'EMAIL_ADDRESS', 'FINANCIAL_DATA'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['vendor', 'contractor', 'intermediary', 'third party', 'outsource'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'Imprisonment up to 3 years and/or fine up to ₹5 lakh (criminal offence)',
    appliesTo: ['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL'],
    contextConditions: ['Disclosure by an intermediary who accessed data under a contract'],
  },
  {
    code: 'IT-S69B-001',
    name: 'Monitoring or Interception Without Lawful Authority',
    description:
      'Electronic communications or personal data are being monitored, intercepted, or collected without lawful authority. Under IT Act Section 69B, only government agencies with proper authorisation under the prescribed procedure may intercept communications.',
    framework: 'IT_ACT',
    section: 'Section 69B — Information Technology Act 2000 (as amended 2008)',
    triggerConditions: [
      {
        keywords: ['intercept', 'monitor employee', 'spy', 'keylogger', 'screen capture', 'covert surveillance'],
        hasConsent: false,
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Imprisonment up to 3 years and/or fine (criminal offence under IT Act Section 69B(3))',
    appliesTo: ['HR_TECH', 'GENERAL', 'FINANCIAL', 'LEGAL'],
    contextConditions: ['Monitoring conducted without lawful authority or employee disclosure'],
  },
]
