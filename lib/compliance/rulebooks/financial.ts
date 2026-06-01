import type { ComplianceRule } from '@/lib/compliance/types'

export const financialRules: ComplianceRule[] = [
  {
    code: 'RBI-KYC-001',
    name: 'KYC Data Shared With Unauthorised Third Party',
    description:
      'Know Your Customer (KYC) data — including Aadhaar, PAN, passport details, address proof, and identity documents — has been shared with a party that is not authorised under the RBI Master Direction on KYC 2016. Regulated entities must treat KYC data as strictly confidential.',
    framework: 'RBI',
    section: 'RBI Master Direction – Know Your Customer (KYC) Direction 2016, Section 38',
    triggerConditions: [
      {
        entityTypes: ['AADHAAR_NUMBER', 'PAN_NUMBER', 'PASSPORT_NUMBER', 'BANK_ACCOUNT'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['KYC', 'identity document', 'verification', 'customer data', 'CKYC'],
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'RBI monetary penalty up to ₹1 crore per instance; DPDP Act penalty up to ₹250 crore',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['AADHAAR_NUMBER', 'PAN_NUMBER'],
    contextConditions: ['KYC data shared outside the authorised KYC ecosystem'],
  },
  {
    code: 'RBI-FPC-001',
    name: 'Customer Financial Data Shared Without Consent',
    description:
      'Customer financial data including account details, loan information, transaction history, or credit data has been shared with a third party without the customer\'s explicit consent. This violates RBI Fair Practices Code for lenders and the RBI Circular on Customer Protection.',
    framework: 'RBI',
    section: 'RBI Fair Practices Code; RBI Circular DOR.FSDC.COC/001/03.10.001/2023-24',
    triggerConditions: [
      {
        entityTypes: ['FINANCIAL_DATA', 'BANK_ACCOUNT'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'RBI monetary penalty + Banking Regulation Act penalties; DPDP Act up to ₹200 crore',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['FINANCIAL_DATA', 'BANK_ACCOUNT'],
    contextConditions: ['Financial data shared without documented customer consent'],
  },
  {
    code: 'RBI-DSG-001',
    name: 'Digital Payment Transaction Data Breach',
    description:
      'Sensitive transaction data from digital payment systems — including card numbers, UPI transaction IDs, netbanking credentials, or payment gateway data — has been exposed or transmitted insecurely. This violates RBI Guidelines on Digital Payment Security Controls (2021) and PCI DSS requirements.',
    framework: 'RBI',
    section: 'RBI Guidelines on Digital Payment Security Controls 2021; PCI DSS v4.0',
    triggerConditions: [
      {
        entityTypes: ['BANK_ACCOUNT', 'FINANCIAL_DATA'],
        keywords: ['UPI', 'card number', 'CVV', 'OTP', 'netbanking', 'wallet', 'payment', 'transaction', 'PIN'],
        recipientType: 'EXTERNAL',
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'RBI penalty up to ₹1 crore + Payment and Settlement Systems Act penalties',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['BANK_ACCOUNT', 'FINANCIAL_DATA'],
    contextConditions: ['Payment credential or transaction data exposed externally'],
  },
  {
    code: 'RBI-LFR-001',
    name: 'Loan Account Details Shared With Unauthorised Party',
    description:
      'A borrower\'s loan account number, outstanding balance, EMI schedule, credit limit, or default status has been shared with an unauthorised third party without the borrower\'s consent. This violates RBI\'s guidelines on credit information confidentiality and the Credit Information Companies Act.',
    framework: 'RBI',
    section: 'RBI Fair Practices Code; Credit Information Companies (Regulation) Act 2005, Section 20',
    triggerConditions: [
      {
        entityTypes: ['FINANCIAL_DATA', 'BANK_ACCOUNT', 'PERSON_NAME'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['loan', 'EMI', 'credit', 'NPA', 'default', 'outstanding', 'CIBIL', 'credit score'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'CICA 2005 penalties + RBI monetary penalties; DPDP Act up to ₹200 crore',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['FINANCIAL_DATA', 'BANK_ACCOUNT'],
    contextConditions: ['Loan or credit data disclosed to unauthorised external party'],
  },
  {
    code: 'RBI-NBFC-001',
    name: 'NBFC Borrower Data Shared Without Consent',
    description:
      'A Non-Banking Financial Company (NBFC) has shared borrower personal data, repayment history, or financial information with recovery agents, DSAs, or other third parties without the borrower\'s consent. RBI Master Directions for NBFCs and the DPDP Act require explicit consent for such disclosures.',
    framework: 'RBI',
    section: 'RBI Master Direction – Non-Banking Financial Company 2016; DPDP Act Section 7',
    triggerConditions: [
      {
        entityTypes: ['PERSON_NAME', 'MOBILE_NUMBER', 'FINANCIAL_DATA', 'BANK_ACCOUNT'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['NBFC', 'recovery agent', 'DSA', 'collection', 'debt recovery', 'loan recovery'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'RBI penalty + DPDP Act up to ₹200 crore; reputational damage and borrower litigation risk',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['FINANCIAL_DATA', 'PERSON_NAME'],
    contextConditions: ['NBFC borrower data shared with external agents without consent'],
  },
  {
    code: 'SEBI-IA-001',
    name: 'Client Investment Data Disclosed Without Authorisation',
    description:
      'A SEBI-registered Investment Adviser (IA) or Portfolio Manager has disclosed client investment portfolio data, trading strategy, financial goals, or risk profile to an unauthorised third party. SEBI (Investment Advisers) Regulations 2013 Regulation 19 imposes strict confidentiality obligations.',
    framework: 'SEBI',
    section: 'Regulation 19 — SEBI (Investment Advisers) Regulations 2013; SEBI (Portfolio Managers) Regulations 2020',
    triggerConditions: [
      {
        entityTypes: ['FINANCIAL_DATA', 'PERSON_NAME'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['portfolio', 'investment', 'trading', 'demat', 'client holdings', 'wealth', 'AUM'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'SEBI monetary penalties up to ₹25 crore or 3x unlawful gain; licence cancellation',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['FINANCIAL_DATA', 'PERSON_NAME'],
    contextConditions: ['Client investment data disclosed outside authorised purposes'],
  },
  {
    code: 'SEBI-PIT-001',
    name: 'Insider Information Disclosed via Messaging',
    description:
      'Unpublished price-sensitive information (UPSI) about a listed company has been communicated through messaging platforms to parties who could use it for trading. This is a violation of SEBI (Prohibition of Insider Trading) Regulations 2015 and constitutes a criminal offence.',
    framework: 'SEBI',
    section: 'Regulation 3(1) — SEBI (Prohibition of Insider Trading) Regulations 2015',
    triggerConditions: [
      {
        keywords: ['UPSI', 'insider', 'price sensitive', 'upcoming results', 'merger', 'acquisition', 'unpublished'],
        recipientType: 'EXTERNAL',
      },
    ],
    severity: 'CRITICAL',
    penaltyRange: 'SEBI penalty up to ₹25 crore or 3x profit + imprisonment up to 10 years (SCRA Section 24)',
    appliesTo: ['FINANCIAL'],
    contextConditions: ['UPSI communicated to persons outside the need-to-know list'],
  },
  {
    code: 'IRDAI-PP-001',
    name: 'Policyholder Data Shared Without Consent',
    description:
      'Personal or financial data of a policyholder — including health information, insurance policy details, premium payment history, or claim data — has been shared with a third party without the policyholder\'s explicit consent. IRDAI Protection of Policyholders\' Interests Regulations 2024 mandates strict data confidentiality.',
    framework: 'IRDAI',
    section: 'IRDAI (Protection of Policyholders\' Interests) Regulations 2024, Regulation 8',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'FINANCIAL_DATA', 'PERSON_NAME'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['policy', 'insurance', 'policyholder', 'premium', 'claim', 'nominee'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'IRDAI penalty up to ₹1 crore per violation + DPDP Act up to ₹200 crore',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['PERSON_NAME', 'FINANCIAL_DATA'],
    contextConditions: ['Policyholder data shared with external party without consent'],
  },
  {
    code: 'IRDAI-SB-001',
    name: 'Insurance Claim Data Disclosed to Unauthorised Third Party',
    description:
      'Details of an insurance claim — including the nature of the loss, health information included in a health claim, or financial compensation amounts — have been disclosed to a party not authorised by the policyholder. This is particularly sensitive for health and life insurance claims.',
    framework: 'IRDAI',
    section: 'IRDAI (Protection of Policyholders\' Interests) Regulations 2024; DPDP Act Section 7',
    triggerConditions: [
      {
        entityTypes: ['HEALTH_CONDITION', 'FINANCIAL_DATA', 'MEDICAL_RECORD'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['claim', 'settlement', 'loss', 'hospitalization', 'accident', 'payout', 'reimbursement'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'IRDAI regulatory action + DPDP Act penalty up to ₹200 crore',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['FINANCIAL_DATA', 'HEALTH_CONDITION'],
    contextConditions: ['Insurance claim details shared with unauthorised external party'],
  },
  {
    code: 'SEBI-AMC-001',
    name: 'Mutual Fund Investor Data Disclosed Without Authorisation',
    description:
      'A SEBI-registered Asset Management Company (AMC) or mutual fund distributor has disclosed investor data — including folio numbers, NAV holdings, SIP mandates, or KYC details — to an unauthorised party. SEBI (Mutual Funds) Regulations 1996 and AMFI code impose strict investor data confidentiality.',
    framework: 'SEBI',
    section: 'SEBI (Mutual Funds) Regulations 1996, Regulation 30; AMFI Code of Conduct',
    triggerConditions: [
      {
        entityTypes: ['FINANCIAL_DATA', 'PAN_NUMBER', 'BANK_ACCOUNT'],
        recipientType: 'EXTERNAL',
        hasConsent: false,
        keywords: ['mutual fund', 'SIP', 'folio', 'NAV', 'AMC', 'distributor', 'investor', 'redemption'],
      },
    ],
    severity: 'HIGH',
    penaltyRange: 'SEBI monetary penalties + licence action; DPDP Act up to ₹200 crore',
    appliesTo: ['FINANCIAL'],
    requiredEntities: ['FINANCIAL_DATA', 'PAN_NUMBER'],
    contextConditions: ['Mutual fund investor data disclosed to unauthorised parties'],
  },
]
