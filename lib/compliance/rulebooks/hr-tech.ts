import type { ComplianceRule } from '@/lib/compliance/types'

export const hrTechRules: ComplianceRule[] = [
  {
    code: 'LL-PF-001',
    name: 'Employee PF or Salary Data Shared Without Consent',
    description:
      'Employee Provident Fund (EPF) account details, salary breakdowns, or compensation data has been shared with an unauthorised third party — such as a competitor, recruitment agency, or external vendor — without the employee\'s consent. This violates DPDP Act Section 7 and the Employees\' Provident Funds and Miscellaneous Provisions Act 1952 confidentiality provisions.',
    framework: 'LABOUR_LAW',
    section: 'EPF & MP Act 1952; DPDP Act Section 7(b); Payment of Wages Act 1936',
    triggerConditions: [
      {
        entityTypes: ['FINANCIAL_DATA', 'BANK_ACCOUNT', 'PERSON_NAME'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['PF', 'provident fund', 'EPF', 'salary', 'CTC', 'payslip', 'salary slip', 'compensation'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'EPF Act penalties + DPDP Act up to ₹200 crore; employee civil suit for damages',
    appliesTo: ['HR_TECH'],
    requiredEntities: ['FINANCIAL_DATA', 'PERSON_NAME'],
    contextConditions: ['Employee compensation or PF data transmitted to external party without consent'],
  },
  {
    code: 'DPDP-HR-001',
    name: 'Employee Personal Data Processed for Non-HR Purposes',
    description:
      'Personal data collected from employees for HR purposes (payroll, benefits, attendance) is being used for secondary purposes — such as marketing, profiling, or selling to third parties — without explicit employee consent. DPDP Act Section 8(1) prohibits purpose creep.',
    framework: 'DPDP',
    section: 'DPDP Act Section 8(1) — Purpose Limitation; DPDP Act Section 7',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'EMAIL_ADDRESS', 'MOBILE_NUMBER', 'LOCATION_DATA'],
        hasConsent: false,
        keywords: ['marketing', 'profiling', 'analytics', 'secondary use', 'sell data', 'advertising'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'DPDP Act up to ₹200 crore; Industrial Disputes Act implications; employee litigation',
    appliesTo: ['HR_TECH'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['Employee data used for purposes beyond the original HR processing purpose'],
  },
  {
    code: 'DPDP-HR-002',
    name: 'Employee Health Data Shared With Unauthorised Party',
    description:
      'An employee\'s health-related data — medical certificates, fitness certificates, insurance claims, sick leave records, disability status, or COVID vaccination status — has been shared with an unauthorised party without the employee\'s explicit consent. Health data is sensitive personal data under DPDP Act.',
    framework: 'DPDP',
    section: 'DPDP Act Section 7(b); Factories Act 1948 health record provisions',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'MEDICAL_RECORD'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['medical certificate', 'sick leave', 'health record', 'disability', 'vaccination', 'fitness'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'DPDP Act up to ₹250 crore; Factories Act penalties; employee discrimination litigation risk',
    appliesTo: ['HR_TECH'],
    requiredEntities: ['HEALTH_CONDITION', 'MEDICAL_RECORD'],
    contextConditions: ['Employee health data disclosed to unauthorised external party'],
  },
  {
    code: 'LL-POSH-001',
    name: 'POSH Complaint Data Disclosed Without Authorisation',
    description:
      'Information pertaining to a sexual harassment complaint under the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act 2013 — including the identity of the complainant, the accused, witnesses, or the content of the inquiry — has been disclosed in violation of Section 16 of the POSH Act, which mandates strict confidentiality.',
    framework: 'LABOUR_LAW',
    section: 'Section 16 — Sexual Harassment of Women at Workplace (POSH) Act 2013; DPDP Act Section 7',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'SENSITIVE_CATEGORY'],
        hasConsent: false,
        keywords: ['POSH', 'sexual harassment', 'ICC complaint', 'harassment complaint', 'complainant', 'accused employee'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'POSH Act Section 16 penalty (₹50,000); DPDP Act up to ₹250 crore; criminal liability',
    appliesTo: ['HR_TECH'],
    requiredEntities: ['PERSON_NAME', 'SENSITIVE_CATEGORY'],
    contextConditions: ['POSH complaint data disclosed outside the ICC or authorised HR personnel'],
  },
  {
    code: 'DPDP-HR-003',
    name: 'Candidate Resume Data Shared Without Consent',
    description:
      'The personal data in a job applicant\'s resume or application — including name, contact details, educational history, professional experience, or references — has been shared with third parties such as other employers, job boards, or data brokers without the candidate\'s knowledge or consent.',
    framework: 'DPDP',
    section: 'DPDP Act Section 7(a) and 7(b)',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'MOBILE_NUMBER', 'EMAIL_ADDRESS', 'DATE_OF_BIRTH'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['resume', 'CV', 'candidate', 'applicant', 'job seeker', 'application', 'profile'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'DPDP Act up to ₹200 crore; candidate civil suit for misuse of personal data',
    appliesTo: ['HR_TECH'],
    requiredEntities: ['PERSON_NAME', 'EMAIL_ADDRESS'],
    contextConditions: ['Candidate data shared with parties outside the hiring process without consent'],
  },
  {
    code: 'DPDP-HR-004',
    name: 'Employee Monitoring Data Not Disclosed in Employment Contract',
    description:
      'The employer is monitoring employee communications, computer usage, location, or biometric data without disclosing this in the employment contract or a separate signed consent form. Under DPDP Act Section 7(a), employees must receive a clear consent notice specifying the nature and purpose of any monitoring.',
    framework: 'DPDP',
    section: 'DPDP Act Section 7(a); IT Act Section 43A; Industrial Employment (Standing Orders) Act 1946',
    triggerConditions: [
      {
        keywords: ['monitoring', 'surveillance', 'keylogger', 'screen capture', 'location tracking', 'email monitoring', 'call recording'],
        hasConsent: false,
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'DPDP Act up to ₹200 crore; IT Act civil liability; employee litigation for invasion of privacy',
    appliesTo: ['HR_TECH'],
    contextConditions: ['Employee monitoring conducted without disclosure in employment terms'],
  },
  {
    code: 'LL-CLRA-001',
    name: 'Contract Labour Data Shared With Unauthorised Contractor',
    description:
      'Personal data of contract labourers — including identity documents, wage details, PF contribution details, or work history — has been shared with a contractor or principal employer who is not authorised to receive it under the Contract Labour (Regulation and Abolition) Act 1970 or the relevant registered contract.',
    framework: 'LABOUR_LAW',
    section: 'Contract Labour (Regulation and Abolition) Act 1970, Section 12; DPDP Act Section 7',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'AADHAAR_NUMBER', 'BANK_ACCOUNT', 'FINANCIAL_DATA'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['contract labour', 'contractor', 'labour contractor', 'outsourced worker', 'third-party employee'],
      },
    ],
    severity: 'MEDIUM',
    penaltyRange: 'CLRA Act penalties + DPDP Act up to ₹50 crore; labour commissioner action',
    appliesTo: ['HR_TECH'],
    requiredEntities: ['PERSON_NAME', 'AADHAAR_NUMBER'],
    contextConditions: ['Contract labour data shared with unauthorised contractor or principal employer'],
  },
  {
    code: 'DPDP-HR-005',
    name: 'Background Check Data Retained Beyond Necessity',
    description:
      'Background verification data — including police verification reports, credit checks, reference check records, or identity verification results — is being retained beyond the period necessary for the hiring decision. DPDP Act Section 9 requires erasure once the processing purpose is fulfilled.',
    framework: 'DPDP',
    section: 'DPDP Act Section 9(1) — Storage Limitation',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'AADHAAR_NUMBER', 'PAN_NUMBER', 'FINANCIAL_DATA'],
        keywords: ['background check', 'police verification', 'credit check', 'reference check', 'BGV', 'background verification'],
      },
    ],
    severity: 'MEDIUM',
    penaltyRange: 'DPDP Act up to ₹150 crore (Section 9 violation)',
    appliesTo: ['HR_TECH'],
    requiredEntities: ['PERSON_NAME', 'AADHAAR_NUMBER'],
    contextConditions: ['Background check data retained after candidate rejection or beyond hiring decision period'],
  },
]
