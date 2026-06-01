import type { ComplianceRule } from '@/lib/compliance/types'

export const edtechRules: ComplianceRule[] = [
  {
    code: 'DPDP-S12-ET-001',
    name: 'Student Under 18 Data Processed Without Parental Consent',
    description:
      'Personal data of a student under 18 years of age is being collected and processed without verifiable parental or legal guardian consent. DPDP Act Section 12 imposes the strictest obligations for children\'s data — including mandatory age verification, parental consent mechanisms, and prohibition on tracking or profiling minors.',
    framework: 'DPDP',
    section: 'Section 12(1) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'DATE_OF_BIRTH', 'EMAIL_ADDRESS', 'MOBILE_NUMBER'],
        hasConsent: false,
        keywords: ['student', 'school', 'class', 'grade', 'standard', 'minor', 'child', 'pupil', 'learner'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹200 crore per instance (DPDP Act Schedule, Item 2)',
    appliesTo: ['EDTECH'],
    requiredEntities: ['DATE_OF_BIRTH', 'PERSON_NAME'],
    contextConditions: ['Student is under 18 years of age', 'No verifiable parental consent on record'],
  },
  {
    code: 'DPDP-S12-ET-002',
    name: 'Behavioural Profiling of Students Under 18',
    description:
      'The edtech platform is conducting behavioural profiling, tracking learning patterns, monitoring engagement for advertising, or creating psychographic profiles of students under 18 years. DPDP Act Section 12(3) explicitly prohibits behavioural monitoring of children, even if parental consent exists for core educational processing.',
    framework: 'DPDP',
    section: 'Section 12(3) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        entityTypes: ['DATE_OF_BIRTH', 'LOCATION_DATA'],
        keywords: ['behavioral tracking', 'engagement analytics', 'student profiling', 'learning analytics', 'recommendation engine', 'attention tracking'],
        hasConsent: false,
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹200 crore per instance (DPDP Act Schedule); potential POCSO referral',
    appliesTo: ['EDTECH'],
    requiredEntities: ['DATE_OF_BIRTH'],
    contextConditions: ['Tracking or profiling is applied to users under 18'],
  },
  {
    code: 'DPDP-S12-ET-003',
    name: 'Age-Gating Bypass Allowing Children to Register',
    description:
      'The platform\'s age verification or age-gating mechanism is inadequate, easily bypassed, or absent, resulting in children under 18 registering and having their personal data processed without verifiable parental consent. DPDP Act Section 12 requires meaningful, not nominal, age verification.',
    framework: 'DPDP',
    section: 'Section 12(2) — Digital Personal Data Protection Act 2023',
    triggerConditions: [
      {
        keywords: ['age bypass', 'no age check', 'self-declared age', 'age verification failed', 'underage registration'],
        hasConsent: false,
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'Up to ₹200 crore (DPDP Act) + potential POCSO Act implications if sexual content involved',
    appliesTo: ['EDTECH'],
    contextConditions: ['Age verification mechanism is absent or trivially bypassable'],
  },
  {
    code: 'DPDP-ET-001',
    name: 'Student Performance Data Shared With Third-Party Advertisers',
    description:
      'Academic performance data, assessment scores, learning progress, or course completion data of students has been shared with advertising networks, marketing platforms, or data brokers. This constitutes a serious misuse of educational data and a violation of DPDP Act Section 8(1) (purpose limitation).',
    framework: 'DPDP',
    section: 'DPDP Act Section 8(1); Section 12 for students under 18',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'EMAIL_ADDRESS'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['performance', 'grades', 'score', 'progress report', 'assessment', 'test result', 'marksheet'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'DPDP Act up to ₹250 crore; UGC/AICTE regulatory action; reputational harm',
    appliesTo: ['EDTECH'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['Student academic data shared with advertising or marketing third parties'],
  },
  {
    code: 'DPDP-ET-002',
    name: 'Student Contact Data Shared Without Parental Consent',
    description:
      'Contact information of a student under 18 — including phone number, email address, or home address — has been shared with external tutors, coaching centres, or third-party service providers without verified parental consent. DPDP Act Section 12 requires parental consent for all processing of children\'s contact data.',
    framework: 'DPDP',
    section: 'Section 12(1) — DPDP Act 2023; IT (SPDI) Rules 2011',
    triggerConditions: [
      {
        entityTypes: ['MOBILE_NUMBER', 'EMAIL_ADDRESS', 'LOCATION_DATA'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['student contact', 'parent contact', 'home address', 'phone number', 'under 18', 'school student'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'DPDP Act up to ₹200 crore; UGC/DIT regulatory scrutiny',
    appliesTo: ['EDTECH'],
    requiredEntities: ['MOBILE_NUMBER', 'EMAIL_ADDRESS'],
    contextConditions: ['Student is under 18', 'Contact data shared with external party without parental consent'],
  },
  {
    code: 'DPDP-ET-003',
    name: 'Student Location or Attendance Data Shared Externally',
    description:
      'Physical attendance records, biometric attendance data, GPS location tracking, or geofencing data of students has been shared with external parties without consent. Location and attendance data can be misused to track the physical movements of minors.',
    framework: 'DPDP',
    section: 'DPDP Act Section 7(b); Section 12 for minors; IT (SPDI) Rules 2011',
    triggerConditions: [
      {
        entityTypes: ['LOCATION_DATA', 'DATE_OF_BIRTH'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['attendance', 'location', 'GPS', 'biometric', 'geofence', 'check-in', 'tracking'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'DPDP Act up to ₹200 crore + potential child safety implications',
    appliesTo: ['EDTECH'],
    requiredEntities: ['LOCATION_DATA'],
    contextConditions: ['Student location or attendance data transmitted to external parties'],
  },
  {
    code: 'UGC-DR-001',
    name: 'University Student Records Disclosed Without Consent',
    description:
      'Academic records, mark sheets, degree certificates, migration certificates, or disciplinary records of a university student have been disclosed to a third party — such as an employer, another institution, or a government agency — without the student\'s specific, written consent. UGC regulations and DPDP Act jointly govern such disclosures.',
    framework: 'DPDP',
    section: 'DPDP Act Section 7; UGC Regulations; IT Act Section 43A',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'DATE_OF_BIRTH', 'SENSITIVE_CATEGORY'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['transcript', 'marksheet', 'degree', 'certificate', 'academic record', 'migration', 'university'],
      },
    ],
    severity: 'MEDIUM',
    penaltyRange: 'DPDP Act penalty up to ₹50 crore; UGC disciplinary action against institution',
    appliesTo: ['EDTECH'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['University academic records shared without student consent'],
  },
  {
    code: 'DPDP-ET-004',
    name: 'Student Biometric or Attendance Data Shared',
    description:
      'Biometric data used for student identification or attendance — fingerprints, iris scans, facial recognition data — has been shared with or accessible to an external party. Biometric data is irreplaceable sensitive personal data; once compromised it cannot be changed.',
    framework: 'DPDP',
    section: 'DPDP Act Section 7(b); IT (SPDI) Rules 2011, Rule 3(iii); Aadhaar Act provisions on biometrics',
    triggerConditions: [
      {
        entityTypes: ['SENSITIVE_CATEGORY'],
        recipientType: 'EXTERNAL',
        keywords: ['biometric', 'fingerprint', 'iris', 'facial recognition', 'face scan', 'retina', 'biometric attendance'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'DPDP Act up to ₹250 crore; Aadhaar Act penalties for biometric misuse',
    appliesTo: ['EDTECH'],
    requiredEntities: ['SENSITIVE_CATEGORY'],
    contextConditions: ['Biometric data transmitted to or accessible by external parties'],
  },
]
