import type { ComplianceRule } from '@/lib/compliance/types'

export const healthcareRules: ComplianceRule[] = [
  {
    code: 'NMC-R14-001',
    name: 'Patient Data Shared With Unauthorised Medical Professional',
    description:
      'Clinical data, diagnosis, or treatment information of a patient has been shared with a medical professional who is not part of the treating team and who does not have the patient\'s consent for such disclosure. This violates NMC Ethics Regulations 2023 Regulation 14 and the patient\'s right to medical confidentiality.',
    framework: 'NMC',
    section: 'Regulation 14 — NMC Ethics and Registration of Medical Practitioners Regulations 2023',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'MEDICAL_RECORD', 'PERSON_NAME'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['doctor', 'physician', 'specialist', 'referral', 'consultation'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'NMC disciplinary action including suspension/cancellation of medical registration',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['HEALTH_CONDITION', 'MEDICAL_RECORD'],
    contextConditions: ['Recipient doctor is not part of the treating team'],
  },
  {
    code: 'NMC-R14-002',
    name: 'Clinical Data Transmitted Without Patient Consent',
    description:
      'Patient clinical data including diagnosis, prescription, lab results, or treatment history has been transmitted to any party — medical or non-medical — without the patient\'s explicit written consent. NMC Regulation 14 requires doctors to maintain strict medical confidentiality and obtain consent before disclosure.',
    framework: 'NMC',
    section: 'Regulation 14 — NMC Ethics Regulations 2023; DPDP Act Section 7(b)',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'MEDICAL_RECORD'],
        hasConsent: false,
      },
      {
        entityTypes: ['HEALTH_CONDITION', 'MEDICAL_RECORD'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'NMC licence suspension + DPDP Act penalty up to ₹250 crore',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['HEALTH_CONDITION', 'MEDICAL_RECORD'],
    contextConditions: ['No consent record exists for clinical data transmission'],
  },
  {
    code: 'CEA-S12-001',
    name: 'Patient Records Not Maintained Per Clinical Establishments Act',
    description:
      'Patient medical records are not being maintained in the format, duration, or security standard prescribed by the Clinical Establishments (Registration and Regulation) Act 2010 and associated State rules. This creates compliance gaps under both CEA and DPDP Act Section 8.',
    framework: 'NMC',
    section: 'Section 12 — Clinical Establishments (Registration and Regulation) Act 2010',
    triggerConditions: [
      {
        keywords: ['missing record', 'incomplete record', 'no discharge summary', 'records not kept', 'deleted records'],
        entityTypes: ['MEDICAL_RECORD'],
      },
    ],
    severity: 'MEDIUM',
    penaltyRange: 'CEA penalties including cancellation of clinical establishment registration',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['MEDICAL_RECORD'],
    contextConditions: ['Clinical records are incomplete, improperly stored, or missing'],
  },
  {
    code: 'DPDP-HC-001',
    name: 'Medical Diagnosis Shared Via Public Messaging Channel',
    description:
      'A patient\'s medical diagnosis, health condition, or treatment details have been shared through a public messaging platform, WhatsApp group, or broadcast channel. This constitutes a CRITICAL violation under DPDP Act and NMC Ethics Regulations as it exposes sensitive health data to an unlimited audience.',
    framework: 'NMC',
    section: 'DPDP Act Section 7(b); NMC Ethics Regulations 2023 Regulation 14',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'MEDICAL_RECORD', 'PERSON_NAME'],
        recipientType: 'UNKNOWN',
        hasConsent: false,
        keywords: ['group', 'broadcast', 'forward', 'whatsapp group', 'telegram channel'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'DPDP Act penalty up to ₹250 crore + NMC licence action',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['HEALTH_CONDITION', 'PERSON_NAME'],
    contextConditions: ['Message sent to a group or public channel'],
  },
  {
    code: 'DPDP-HC-002',
    name: 'Patient Pharmacy or Lab Data Shared Without Consent',
    description:
      'Prescription data, pharmacy dispensing records, or laboratory test results of a patient have been shared with a third party (pharmacy chain, insurance company, employer, family member) without the patient\'s explicit consent. Health data is classified as sensitive personal data under DPDP Act.',
    framework: 'NMC',
    section: 'DPDP Act Section 7(b); Drugs and Cosmetics Act 1940 Schedule H provisions',
    triggerConditions: [
      {
        entityTypes: ['MEDICAL_RECORD', 'HEALTH_CONDITION'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['pharmacy', 'lab report', 'test result', 'pathology', 'prescription', 'dispensing'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'DPDP Act penalty up to ₹200 crore + pharmacy licence implications',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['MEDICAL_RECORD', 'HEALTH_CONDITION'],
    contextConditions: ['Pharmacy or lab data disclosed to external party without consent'],
  },
  {
    code: 'NMC-R22-001',
    name: 'Doctor-Patient Communication Recorded Without Consent',
    description:
      'A consultation between a doctor and patient has been audio or video recorded without the patient\'s explicit prior consent. NMC Regulation 22 prohibits secret recording of consultations, and such recordings constitute sensitive personal data under DPDP Act.',
    framework: 'NMC',
    section: 'Regulation 22 — NMC Ethics Regulations 2023; DPDP Act Section 7(a)',
    triggerConditions: [
      {
        keywords: ['recorded', 'recording', 'audio', 'video', 'transcript', 'call recorded'],
        hasConsent: false,
        entityTypes: ['HEALTH_CONDITION', 'PERSON_NAME'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'NMC disciplinary action + DPDP Act penalty up to ₹200 crore',
    appliesTo: ['HEALTHCARE'],
    contextConditions: ['Consultation was recorded without patient awareness or consent'],
  },
  {
    code: 'DPDP-HC-003',
    name: "Mental Health Data Disclosed to Employer",
    description:
      'An individual\'s mental health diagnosis, psychiatric history, or psychological assessment has been disclosed to their employer or prospective employer without consent. Mental health data is classified as sensitive personal data and is additionally protected under the Mental Healthcare Act 2017 Section 23.',
    framework: 'NMC',
    section: 'DPDP Act Section 7(b); Mental Healthcare Act 2017 Section 23; NMC Ethics Reg 14',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'SENSITIVE_CATEGORY'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['mental health', 'psychiatric', 'depression', 'anxiety', 'bipolar', 'schizophrenia', 'counselling'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'DPDP Act penalty up to ₹250 crore + Mental Healthcare Act Section 23 penalties',
    appliesTo: ['HEALTHCARE', 'HR_TECH'],
    requiredEntities: ['HEALTH_CONDITION'],
    contextConditions: ['Mental health data disclosed to employer or third party without consent'],
  },
  {
    code: 'CEA-S15-001',
    name: 'Medical Records Shared With Insurance Without Patient Consent',
    description:
      'A patient\'s medical records, investigation reports, or clinical summaries have been shared with an insurance company without the patient\'s specific, informed consent for that disclosure. IRDAI also mandates explicit consent for health data sharing.',
    framework: 'NMC',
    section: 'Section 15 — CEA 2010; DPDP Act Section 7(b); IRDAI Health Insurance Regulations 2016',
    triggerConditions: [
      {
        entityTypes: ['MEDICAL_RECORD', 'HEALTH_CONDITION'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['insurance', 'TPA', 'claim', 'underwriting', 'mediclaim', 'health policy'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'DPDP Act penalty up to ₹200 crore + NMC action + IRDAI penalties',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['MEDICAL_RECORD', 'HEALTH_CONDITION'],
    contextConditions: ['Insurance company or TPA received medical data without patient consent'],
  },
  {
    code: 'DPDP-HC-004',
    name: 'HIV/AIDS Status Disclosed Without Consent',
    description:
      'The HIV or AIDS status of an individual has been disclosed to any party without their explicit consent. This is a dual violation: under DPDP Act as sensitive personal data disclosure, and under the HIV and AIDS (Prevention and Control) Act 2017 Section 35, which criminalises disclosure of HIV status.',
    framework: 'NMC',
    section: 'DPDP Act Section 7(b); HIV and AIDS (Prevention and Control) Act 2017 Section 35',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'SENSITIVE_CATEGORY'],
        hasConsent: false,
        keywords: ['HIV', 'AIDS', 'HIV positive', 'HIV status', 'seropositive', 'antiretroviral'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'HLPA imprisonment up to 2 years + fine; DPDP Act penalty up to ₹250 crore',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['HEALTH_CONDITION'],
    contextConditions: ['HIV/AIDS status disclosed to any unauthorised party without consent'],
  },
  {
    code: 'DPDP-HC-005',
    name: 'Minor Patient Data Shared Without Guardian Consent',
    description:
      'Medical data, health records, or treatment information of a patient under 18 years of age has been shared without the consent of their parent or legal guardian. DPDP Act Section 12 requires verifiable parental consent for processing children\'s data.',
    framework: 'NMC',
    section: 'DPDP Act Section 12; NMC Ethics Regulations 2023 Regulation 14',
    triggerConditions: [
      {
        entityTypes: ['MEDICAL_RECORD', 'HEALTH_CONDITION', 'DATE_OF_BIRTH'],
        hasConsent: false,
        keywords: ['minor', 'child', 'pediatric', 'paediatric', 'under 18', 'juvenile', 'school age'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'DPDP Act penalty up to ₹200 crore + NMC disciplinary action',
    appliesTo: ['HEALTHCARE'],
    requiredEntities: ['MEDICAL_RECORD', 'DATE_OF_BIRTH'],
    contextConditions: ['Patient is under 18 years old', 'No guardian consent obtained'],
  },
]
