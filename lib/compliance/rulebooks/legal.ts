import type { ComplianceRule } from '@/lib/compliance/types'

export const legalRules: ComplianceRule[] = [
  {
    code: 'BCI-R22-001',
    name: 'Client Privileged Information Disclosed',
    description:
      'Confidential communication between a lawyer and their client — including legal advice, matter details, or case strategy — has been disclosed to a third party without the client\'s explicit waiver of privilege. Bar Council of India Rule 22 prohibits advocates from disclosing client confidences without consent, and legal professional privilege is a cornerstone of the adversarial justice system.',
    framework: 'BAR_COUNCIL',
    section: 'Rule 22 — Bar Council of India Rules (Part VI, Chapter II); Evidence Act 1872 Section 126',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'FINANCIAL_DATA'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['client matter', 'legal advice', 'privileged', 'confidential', 'case strategy', 'settlement'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'BCI disciplinary proceedings including suspension/removal from Bar rolls; DPDP Act up to ₹250 crore',
    appliesTo: ['LEGAL'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['Disclosed information is covered by legal professional privilege'],
  },
  {
    code: 'BCI-R33-001',
    name: 'Client Matter Discussed on Unsecured Channel',
    description:
      'Confidential client matter details have been discussed or transmitted via an unsecured communication channel — such as plain text email, unencrypted messaging, or a public forum — without appropriate safeguards. BCI Rule 33 requires advocates to maintain professional standards including confidentiality in all client communications.',
    framework: 'BAR_COUNCIL',
    section: 'Rule 33 — Bar Council of India Rules (Part VI, Chapter II)',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'FINANCIAL_DATA', 'AADHAAR_NUMBER', 'PAN_NUMBER'],
        keywords: ['whatsapp', 'SMS', 'plain email', 'unencrypted', 'public forum', 'social media'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'BCI disciplinary action; IT Act Section 43A civil liability; DPDP Act up to ₹200 crore',
    appliesTo: ['LEGAL'],
    contextConditions: ['Client communication transmitted via unsecured channel'],
  },
  {
    code: 'DPDP-LG-001',
    name: 'Client Personal Data Shared With Opposing Counsel Without Consent',
    description:
      'A client\'s personal data — including financial details, identity documents, or sensitive personal information — has been shared with opposing counsel or the opposing party without the client\'s informed consent. This constitutes both a breach of legal professional duty and a DPDP Act violation.',
    framework: 'BAR_COUNCIL',
    section: 'BCI Rule 22; DPDP Act Section 7(b)',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'AADHAAR_NUMBER', 'PAN_NUMBER', 'FINANCIAL_DATA', 'BANK_ACCOUNT'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['opposing counsel', 'opposite party', 'respondent', 'defendant', 'plaintiff', 'adversary'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'BCI disciplinary action + DPDP Act penalty up to ₹250 crore + civil suit for breach',
    appliesTo: ['LEGAL'],
    requiredEntities: ['PERSON_NAME', 'AADHAAR_NUMBER'],
    contextConditions: ['Recipient is opposing counsel or the adverse party'],
  },
  {
    code: 'BCI-R22-002',
    name: "Client Financial Information Transmitted Insecurely",
    description:
      'A client\'s financial information — bank account details, asset valuation, income details, tax records, or transaction data — has been transmitted via an insecure channel or shared with an unauthorised party. Financial data in legal matters is particularly sensitive as it can be misused for fraud or commercial espionage.',
    framework: 'BAR_COUNCIL',
    section: 'BCI Rule 22; IT Act Section 43A; DPDP Act Section 7(b)',
    triggerConditions: [
      {
        entityTypes: ['FINANCIAL_DATA', 'BANK_ACCOUNT', 'PAN_NUMBER'],
        hasConsent: false,
        keywords: ['bank details', 'account number', 'assets', 'property value', 'income', 'tax return', 'ITR'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'BCI disciplinary action + IT Act civil liability + DPDP Act up to ₹200 crore',
    appliesTo: ['LEGAL'],
    requiredEntities: ['FINANCIAL_DATA', 'BANK_ACCOUNT'],
    contextConditions: ['Financial data transmitted without adequate security or authorisation'],
  },
  {
    code: 'DPDP-LG-002',
    name: 'Witness Personal Data Disclosed',
    description:
      'The personal data of a witness — including name, address, contact details, or identity information — has been disclosed to an unauthorised party. Witness data is particularly sensitive as its exposure can lead to intimidation, tampering, or harm to the witness.',
    framework: 'BAR_COUNCIL',
    section: 'DPDP Act Section 7(b); Evidence Act 1872; CrPC/BNSS witness protection provisions',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'MOBILE_NUMBER', 'EMAIL_ADDRESS', 'LOCATION_DATA'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['witness', 'deponent', 'affiant', 'witness statement', 'testimony'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'DPDP Act penalty up to ₹250 crore; potential obstruction of justice charges; BCI action',
    appliesTo: ['LEGAL'],
    requiredEntities: ['PERSON_NAME', 'LOCATION_DATA'],
    contextConditions: ['Recipient is an unauthorised party who could misuse witness identity'],
  },
  {
    code: 'BCI-R15-001',
    name: 'Court Documents With Personal Data Shared Externally',
    description:
      'Pleadings, affidavits, or court documents containing the personal data of parties, witnesses, or third parties have been shared with external parties who are not participants in the proceedings and do not have a legitimate legal right to receive them.',
    framework: 'BAR_COUNCIL',
    section: 'BCI Rule 15; DPDP Act Section 7; Civil Procedure Code Order 7; Criminal Procedure Code provisions',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'AADHAAR_NUMBER', 'PAN_NUMBER', 'MOBILE_NUMBER', 'LOCATION_DATA'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['plaint', 'affidavit', 'petition', 'vakalatnama', 'court filing', 'pleading', 'FIR'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'BCI disciplinary action + DPDP Act penalty up to ₹200 crore',
    appliesTo: ['LEGAL'],
    contextConditions: ['Court document shared with non-party external recipient'],
  },
  {
    code: 'DPDP-LG-003',
    name: 'Client Communication Forwarded to Unauthorised Party',
    description:
      'Confidential communication between a client and their legal representative — including emails, letters, notes, or messages — has been forwarded to an unauthorised third party without the client\'s consent. This undermines the fundamental trust relationship in the attorney-client relationship.',
    framework: 'BAR_COUNCIL',
    section: 'BCI Rules Part VI Chapter II; DPDP Act Section 7; Evidence Act 1872 Section 126',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['forwarded', 'CC', 'shared', 'forwarding', 'client email', 'client letter'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'BCI suspension + DPDP Act up to ₹200 crore + civil liability for breach of confidence',
    appliesTo: ['LEGAL'],
    requiredEntities: ['PERSON_NAME'],
    contextConditions: ['Client-lawyer communication forwarded without client consent'],
  },
  {
    code: 'BCI-R22-003',
    name: 'Personal Data in Legal Documents Not Redacted',
    description:
      'Legal documents, submissions, or public filings contain unredacted personal data — Aadhaar numbers, PAN numbers, bank account details, or home addresses — that should have been masked or anonymised before filing or sharing, especially for documents that may enter the public domain.',
    framework: 'BAR_COUNCIL',
    section: 'BCI Rule 22; DPDP Act Section 8; Supreme Court of India Practice Direction on Anonymisation',
    triggerConditions: [
      {
        entityTypes: ['AADHAAR_NUMBER', 'PAN_NUMBER', 'BANK_ACCOUNT', 'MOBILE_NUMBER', 'LOCATION_DATA'],
        keywords: ['court filing', 'submission', 'petition', 'affidavit', 'annexure', 'exhibit'],
      },
    ],
    severity: 'MEDIUM',
    penaltyRange: 'BCI professional misconduct + DPDP Act penalty up to ₹50 crore',
    appliesTo: ['LEGAL'],
    requiredEntities: ['AADHAAR_NUMBER', 'PAN_NUMBER'],
    contextConditions: ['Sensitive identifiers not redacted in documents that may become public'],
  },
]
