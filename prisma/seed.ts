/**
 * KavachAI — Database Seed
 *
 * Creates demo data for Mehta & Associates (CA firm).
 * Run with: npm run db:seed
 */

import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'

const db = new PrismaClient()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  console.log('🌱  Starting KavachAI seed...')

  // -------------------------------------------------------------------------
  // 1. Clean slate (order matters due to FK constraints)
  // -------------------------------------------------------------------------
  await db.$transaction([
    db.incidentTimelineEvent.deleteMany(),
    db.incident.deleteMany(),
    db.staffMember.deleteMany(),
    db.report.deleteMany(),
    db.invoice.deleteMany(),
    db.scoreHistory.deleteMany(),
    db.auditEvent.deleteMany(),
    db.ruleOverride.deleteMany(),
    db.dataSource.deleteMany(),
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.user.deleteMany(),
    db.organisation.deleteMany(),
  ])

  console.log('  Cleaned existing data.')

  // -------------------------------------------------------------------------
  // 2. Organisation
  // -------------------------------------------------------------------------
  const org = await db.organisation.create({
    data: {
      name: 'Mehta & Associates',
      gstin: '27AAAFM1234C1ZQ',
      vertical: 'CA_FIRM',
      size: 'SMALL',
      city: 'Mumbai',
      state: 'Maharashtra',
      activeFrameworks: ['DPDP', 'IT_ACT', 'SEBI'],
      plan: 'PROFESSIONAL',
      planStatus: 'ACTIVE',
      trialEndsAt: null,
      subscriptionId: 'sub_demo_001',
      complianceScore: 78,
      onboardingDone: true,
    },
  })

  console.log(`  Created org: ${org.name} (${org.id})`)

  // -------------------------------------------------------------------------
  // 3. Users
  // -------------------------------------------------------------------------
  const [adminUser, complianceUser, auditorUser, staffUser] = await Promise.all([
    db.user.create({
      data: {
        orgId: org.id,
        email: 'admin@mehtaca.com',
        name: 'Rajesh Mehta',
        passwordHash: await hashPassword('Demo@1234'),
        role: 'OWNER',
        whatsappNumber: '+919876543210',
        isActive: true,
        lastLoginAt: daysAgo(1),
      },
    }),
    db.user.create({
      data: {
        orgId: org.id,
        email: 'compliance@mehtaca.com',
        name: 'Priya Sharma',
        passwordHash: await hashPassword('Demo@1234'),
        role: 'COMPLIANCE_OFFICER',
        whatsappNumber: '+919876543211',
        isActive: true,
        lastLoginAt: daysAgo(2),
      },
    }),
    db.user.create({
      data: {
        orgId: org.id,
        email: 'auditor@mehtaca.com',
        name: 'Vikram Nair',
        passwordHash: await hashPassword('Demo@1234'),
        role: 'AUDITOR',
        isActive: true,
        lastLoginAt: daysAgo(5),
      },
    }),
    db.user.create({
      data: {
        orgId: org.id,
        email: 'staff@mehtaca.com',
        name: 'Anita Desai',
        passwordHash: await hashPassword('Demo@1234'),
        role: 'STAFF',
        isActive: true,
        lastLoginAt: daysAgo(7),
      },
    }),
  ])

  console.log('  Created 4 users.')

  // -------------------------------------------------------------------------
  // 4. Data sources
  // -------------------------------------------------------------------------
  const [gmailSource, whatsappSource] = await Promise.all([
    db.dataSource.create({
      data: {
        orgId: org.id,
        type: 'GMAIL',
        status: 'ACTIVE',
        displayName: 'admin@mehtaca.com (Gmail)',
        encryptedToken:
          'a1b2c3d4e5f6:0102030405060708091011121314151617:deadbeefcafebabe0102030405060708',
        encryptedRefreshToken:
          'b2c3d4e5f6a1:1112131415161718191011121314151617:cafebabe0102030405060708deadbeef',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        webhookId: 'gwatch_mehta_001',
        metadata: {
          historyId: '1234567',
          email: 'admin@mehtaca.com',
        },
        lastScannedAt: daysAgo(0),
        messagesScanned: 4812,
      },
    }),
    db.dataSource.create({
      data: {
        orgId: org.id,
        type: 'WHATSAPP',
        status: 'ACTIVE',
        displayName: 'WhatsApp Business (+91 98765 43210)',
        encryptedToken:
          'c3d4e5f6a1b2:2122232425262728292021222324252617:0102030405060708deadbeefcafebabe',
        metadata: {
          phoneNumberId: '120364123456789',
          displayPhoneNumber: '+91 98765 43210',
          wabaId: 'waba_mehta_001',
        },
        lastScannedAt: daysAgo(0),
        messagesScanned: 2347,
      },
    }),
  ])

  console.log('  Created 2 data sources.')

  // -------------------------------------------------------------------------
  // 5. Staff members
  // -------------------------------------------------------------------------
  const staffMembers = await Promise.all([
    db.staffMember.create({
      data: {
        orgId: org.id,
        name: 'Suresh Patel',
        role: 'Senior Associate',
        department: 'Audit',
        hashedIdentifier: hashIdentifier('suresh.patel@mehtaca.com'),
        totalIncidents: 6,
        lastIncidentAt: daysAgo(3),
      },
    }),
    db.staffMember.create({
      data: {
        orgId: org.id,
        name: 'Kavya Reddy',
        role: 'Associate',
        department: 'Tax',
        hashedIdentifier: hashIdentifier('kavya.reddy@mehtaca.com'),
        totalIncidents: 4,
        lastIncidentAt: daysAgo(8),
      },
    }),
    db.staffMember.create({
      data: {
        orgId: org.id,
        name: 'Amit Joshi',
        role: 'Article Clerk',
        department: 'Accounts',
        hashedIdentifier: hashIdentifier('amit.joshi@mehtaca.com'),
        totalIncidents: 2,
        lastIncidentAt: daysAgo(15),
      },
    }),
    db.staffMember.create({
      data: {
        orgId: org.id,
        name: 'Deepika Menon',
        role: 'Manager',
        department: 'Advisory',
        hashedIdentifier: hashIdentifier('deepika.menon@mehtaca.com'),
        totalIncidents: 2,
        lastIncidentAt: daysAgo(12),
      },
    }),
    db.staffMember.create({
      data: {
        orgId: org.id,
        name: 'Ravi Kumar',
        role: 'Intern',
        department: 'Audit',
        hashedIdentifier: hashIdentifier('ravi.kumar@mehtaca.com'),
        totalIncidents: 1,
        lastIncidentAt: daysAgo(20),
      },
    }),
  ])

  console.log('  Created 5 staff members.')

  // -------------------------------------------------------------------------
  // 6. Incidents (15 total: 5 OPEN, 7 RESOLVED, 3 ESCALATED)
  // -------------------------------------------------------------------------

  type IncidentInput = {
    ruleCode: string
    ruleName: string
    framework: 'DPDP' | 'IT_ACT' | 'SEBI'
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    status: 'OPEN' | 'RESOLVED' | 'ESCALATED'
    channel: 'GMAIL' | 'WHATSAPP'
    entityTypes: Array<
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
    >
    entityCount: number
    contextSummary: string
    staffIdx: number
    staffIdentifier: string
    daysAgoOccurred: number
    resolution?: string
    resolutionNote?: string
    resolvedById?: string
    remediationSteps: string[]
    riskExplanation: string
  }

  const incidentDefs: IncidentInput[] = [
    // ---- OPEN (5) ----
    {
      ruleCode: 'DPDP-001',
      ruleName: 'Aadhaar Number in Unencrypted Channel',
      framework: 'DPDP',
      severity: 'CRITICAL',
      status: 'OPEN',
      channel: 'WHATSAPP',
      entityTypes: ['AADHAAR_NUMBER', 'PERSON_NAME'],
      entityCount: 2,
      contextSummary:
        'Staff member shared a client\'s Aadhaar card scan (masked copy) via WhatsApp Business group chat with 8 members. The image contained partial Aadhaar number and full name.',
      staffIdx: 0,
      staffIdentifier: 'suresh.patel@mehtaca.com',
      daysAgoOccurred: 1,
      remediationSteps: [
        'Immediately recall or delete the message from the WhatsApp group',
        'Notify the affected client under DPDP Act Section 8(6) within 72 hours',
        'Document the incident in the breach register',
        'Conduct a training session on handling Aadhaar data per UIDAI guidelines',
        'Restrict Aadhaar document sharing to encrypted email only',
      ],
      riskExplanation:
        'Aadhaar numbers are classified as sensitive personal data under DPDP Act 2023. Sharing via unencrypted messaging channels violates Section 8(4) which mandates technical safeguards. A breach involving Aadhaar can attract penalties up to ₹250 crore.',
    },
    {
      ruleCode: 'DPDP-007',
      ruleName: 'PAN + Bank Account Combination Exposure',
      framework: 'DPDP',
      severity: 'HIGH',
      status: 'OPEN',
      channel: 'GMAIL',
      entityTypes: ['PAN_NUMBER', 'BANK_ACCOUNT', 'FINANCIAL_DATA'],
      entityCount: 3,
      contextSummary:
        'Email thread found containing client PAN (ABCDE1234F) and HDFC bank account number (XXXX-XXXX-2847) sent to an external CA for consultation without data sharing agreement.',
      staffIdx: 1,
      staffIdentifier: 'kavya.reddy@mehtaca.com',
      daysAgoOccurred: 3,
      remediationSteps: [
        'Request the external CA to delete the email and confirm in writing',
        'Execute a retrospective data processing agreement (DPA) with the external CA',
        'Revoke or limit data access for future inter-CA consultations',
        'Update the email policy to require DPAs before sending financial identifiers',
        'Mask PAN and bank account numbers in email threads (show only last 4 digits)',
      ],
      riskExplanation:
        'The combination of PAN and bank account constitutes financial personal data under DPDP Act. Sharing with a third party without a contractual agreement violates the consent and purpose-limitation principles (Sections 6 and 8).',
    },
    {
      ruleCode: 'SEBI-LODR-004',
      ruleName: 'Unpublished Price-Sensitive Information Leak',
      framework: 'SEBI',
      severity: 'CRITICAL',
      status: 'OPEN',
      channel: 'WHATSAPP',
      entityTypes: ['FINANCIAL_DATA', 'PERSON_NAME'],
      entityCount: 1,
      contextSummary:
        'Message detected discussing Q2 net profit figures of a listed client (Sunrise Textiles Ltd) before board declaration. Sent from firm WhatsApp to a personal number.',
      staffIdx: 3,
      staffIdentifier: 'deepika.menon@mehtaca.com',
      daysAgoOccurred: 2,
      remediationSteps: [
        'Preserve the WhatsApp message as evidence immediately',
        'Escalate to the firm\'s Compliance Officer and SEBI-designated person',
        'Notify the listed company\'s Compliance Officer about the potential UPSI leak',
        'Initiate an internal investigation under SEBI PIT Regulations 2015',
        'Review and tighten access control for UPSI — implement Chinese walls',
        'Consider voluntary disclosure to SEBI if insider trading laws apply',
      ],
      riskExplanation:
        'Sharing Unpublished Price Sensitive Information (UPSI) via an unsecured channel violates SEBI (Prohibition of Insider Trading) Regulations 2015 and potentially Section 12A of the SEBI Act. Penalties can include imprisonment up to 10 years and fines up to ₹25 crore.',
    },
    {
      ruleCode: 'IT-ACT-043B',
      ruleName: 'Sensitive Personal Data Without Consent',
      framework: 'IT_ACT',
      severity: 'MEDIUM',
      status: 'OPEN',
      channel: 'GMAIL',
      entityTypes: ['HEALTH_CONDITION', 'PERSON_NAME', 'DATE_OF_BIRTH'],
      entityCount: 2,
      contextSummary:
        'Email attachment contained medical fitness certificate of an employee with health condition details, forwarded to client HR team without redacting health information.',
      staffIdx: 2,
      staffIdentifier: 'amit.joshi@mehtaca.com',
      daysAgoOccurred: 5,
      remediationSteps: [
        'Notify the recipient HR team to delete the unredacted attachment',
        'Send a replacement version with health condition fields redacted',
        'Obtain explicit consent from the employee for any future medical disclosures',
        'Update the document handling SOP to mandate redaction of health data',
      ],
      riskExplanation:
        'Health conditions are "sensitive personal data or information" (SPDI) under IT Act Section 43A and the SPDI Rules 2011. Sharing without consent can result in compensation claims and regulatory action.',
    },
    {
      ruleCode: 'DPDP-003',
      ruleName: 'Excessive Data Collection — Purpose Violation',
      framework: 'DPDP',
      severity: 'LOW',
      status: 'OPEN',
      channel: 'GMAIL',
      entityTypes: ['PERSON_NAME', 'EMAIL_ADDRESS', 'MOBILE_NUMBER', 'DATE_OF_BIRTH'],
      entityCount: 15,
      contextSummary:
        'Client onboarding form collected date of birth, full address, and emergency contact number which are not required for GST filing services. Data sent to cloud storage without encryption.',
      staffIdx: 4,
      staffIdentifier: 'ravi.kumar@mehtaca.com',
      daysAgoOccurred: 7,
      remediationSteps: [
        'Review the onboarding form and remove fields not necessary for GST services',
        'Delete excessive data already collected from non-consenting clients',
        'Update the privacy notice to accurately describe data collected and purpose',
        'Enable encryption at rest for cloud storage of client documents',
      ],
      riskExplanation:
        'DPDP Act Section 6(1) requires data to be collected only for a lawful purpose with explicit consent. Collecting more data than necessary violates the data minimisation principle and can attract notices from the Data Protection Board.',
    },

    // ---- RESOLVED (7) ----
    {
      ruleCode: 'DPDP-002',
      ruleName: 'Client Data Shared with Third Party Without Agreement',
      framework: 'DPDP',
      severity: 'HIGH',
      status: 'RESOLVED',
      channel: 'GMAIL',
      entityTypes: ['PERSON_NAME', 'PAN_NUMBER', 'EMAIL_ADDRESS'],
      entityCount: 4,
      contextSummary:
        'Client portfolio details shared with a cloud printing vendor for bulk mailer generation without a data processing agreement in place.',
      staffIdx: 0,
      staffIdentifier: 'suresh.patel@mehtaca.com',
      daysAgoOccurred: 12,
      resolution: 'Data Processing Agreement executed with the vendor. Mailer data purged.',
      resolutionNote:
        'DPA signed on ' + new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0] + '. Vendor confirmed data deletion.',
      resolvedById: complianceUser.id,
      remediationSteps: [
        'Execute a Data Processing Agreement (DPA) with the vendor immediately',
        'Request vendor to purge all client data used in the mailer run',
        'Obtain vendor\'s data deletion certificate',
        'Add vendor to the approved data processor registry',
      ],
      riskExplanation:
        'DPDP Act Section 8(2) requires data fiduciaries to ensure processors contractually handle data per the act\'s standards.',
    },
    {
      ruleCode: 'IT-ACT-072',
      ruleName: 'Password Transmitted in Plaintext',
      framework: 'IT_ACT',
      severity: 'HIGH',
      status: 'RESOLVED',
      channel: 'WHATSAPP',
      entityTypes: ['PERSON_NAME'],
      entityCount: 1,
      contextSummary:
        'System login credentials (username + password) for the client\'s MCA portal sent in plain text via WhatsApp to the client.',
      staffIdx: 1,
      staffIdentifier: 'kavya.reddy@mehtaca.com',
      daysAgoOccurred: 15,
      resolution: 'Client notified to change password. Secure password manager implemented.',
      resolutionNote: 'Dashlane team subscription activated for all staff. SOP updated.',
      resolvedById: adminUser.id,
      remediationSteps: [
        'Instruct client to change the password immediately',
        'Rotate all credentials that were shared via plaintext channels',
        'Adopt a password manager for credential sharing with one-time secure links',
        'Update the communication policy to prohibit plaintext credential sharing',
      ],
      riskExplanation:
        'Transmitting passwords in plaintext over messaging apps violates IT Act Section 43A reasonable security practice obligations. If the credentials are used maliciously, the firm may be held liable for the resulting breach.',
    },
    {
      ruleCode: 'DPDP-009',
      ruleName: 'Retention Period Exceeded — Client Tax Records',
      framework: 'DPDP',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      channel: 'GMAIL',
      entityTypes: ['PERSON_NAME', 'FINANCIAL_DATA', 'PAN_NUMBER'],
      entityCount: 23,
      contextSummary:
        'Automated scan found 2019-20 client tax records with full financial data still in active email folders, exceeding the firm\'s 5-year retention policy.',
      staffIdx: 2,
      staffIdentifier: 'amit.joshi@mehtaca.com',
      daysAgoOccurred: 18,
      resolution: 'Records archived to encrypted cold storage. Active copies deleted.',
      resolutionNote:
        '23 client files archived to S3 Glacier. Email attachments purged. Retention automation enabled.',
      resolvedById: complianceUser.id,
      remediationSteps: [
        'Archive records beyond the retention period to encrypted cold storage',
        'Delete active copies from email and working folders',
        'Implement an automated retention enforcement policy',
        'Update clients on the new data lifecycle management approach',
      ],
      riskExplanation:
        'DPDP Act Section 8(7) mandates erasure of personal data once the purpose is served or the retention period (as specified in the privacy notice) has lapsed.',
    },
    {
      ruleCode: 'SEBI-LODR-009',
      ruleName: 'Insider Trading Risk — Pre-announcement Communication',
      framework: 'SEBI',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      channel: 'WHATSAPP',
      entityTypes: ['PERSON_NAME', 'FINANCIAL_DATA'],
      entityCount: 1,
      contextSummary:
        'Message referencing upcoming dividend announcement for a listed client sent from partner\'s personal number before SEBI disclosure.',
      staffIdx: 3,
      staffIdentifier: 'deepika.menon@mehtaca.com',
      daysAgoOccurred: 20,
      resolution:
        'Message deleted; involved persons briefed. Designated persons list updated.',
      resolutionNote: 'No external leak confirmed. SEBI Compliance Officer for the listed company informed.',
      resolvedById: adminUser.id,
      remediationSteps: [
        'Delete the message and confirm with recipient',
        'Notify the listed company\'s Compliance Officer',
        'Brief all partners and senior staff on PIT Regulations pre-announcement blackout periods',
        'Restrict UPSI communication to the SEBI-registered email system only',
      ],
      riskExplanation:
        'Pre-announcement communication of dividend information is UPSI. Even internal sharing in a non-compliant channel constitutes a violation of SEBI PIT Regulations 2015.',
    },
    {
      ruleCode: 'DPDP-005',
      ruleName: 'Minor\'s Data Processed Without Parental Consent',
      framework: 'DPDP',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      channel: 'GMAIL',
      entityTypes: ['PERSON_NAME', 'DATE_OF_BIRTH', 'AADHAAR_NUMBER'],
      entityCount: 1,
      contextSummary:
        'ITR filed for a 16-year-old client using Aadhaar-linked data without verifiable parental consent documentation on file.',
      staffIdx: 0,
      staffIdentifier: 'suresh.patel@mehtaca.com',
      daysAgoOccurred: 22,
      resolution:
        'Parental consent form collected and verified. Consent record stored in compliance vault.',
      resolutionNote:
        'Physical consent form signed by parent obtained and digitally stored. Process updated for all minor clients.',
      resolvedById: complianceUser.id,
      remediationSteps: [
        'Obtain verifiable parental consent immediately from the minor\'s parent/guardian',
        'Review all other minor client accounts for consent documentation',
        'Create a mandatory "parental consent" checkpoint in the client onboarding workflow',
        'Store consent records in the compliance vault with audit trail',
      ],
      riskExplanation:
        'DPDP Act Section 9 prohibits processing of children\'s personal data without verifiable parental consent. Minors are a specially protected class. Violations can attract penalties up to ₹200 crore.',
    },
    {
      ruleCode: 'IT-ACT-066A',
      ruleName: 'Phishing Email Containing Client Credentials',
      framework: 'IT_ACT',
      severity: 'HIGH',
      status: 'RESOLVED',
      channel: 'GMAIL',
      entityTypes: ['EMAIL_ADDRESS', 'PERSON_NAME'],
      entityCount: 3,
      contextSummary:
        'Staff member clicked a phishing link in a fake Income Tax Department email, potentially exposing 3 client portal credentials stored in the browser.',
      staffIdx: 4,
      staffIdentifier: 'ravi.kumar@mehtaca.com',
      daysAgoOccurred: 25,
      resolution: 'All affected passwords rotated. MFA enabled on all client portals.',
      resolutionNote:
        'Browser credential store cleared. All 3 clients notified and passwords reset. MFA enforced via policy.',
      resolvedById: adminUser.id,
      remediationSteps: [
        'Immediately rotate all potentially exposed credentials',
        'Run an antivirus and malware scan on the affected machine',
        'Enable multi-factor authentication on all government portals',
        'Notify affected clients about the potential exposure',
        'Conduct phishing awareness training for all staff',
      ],
      riskExplanation:
        'Phishing-related data exposure can attract liability under IT Act Sections 43 and 66. If client credentials are misused, the firm may face compensation claims. CERT-In reporting may be required within 6 hours under the 2022 directions.',
    },
    {
      ruleCode: 'DPDP-011',
      ruleName: 'Unmasked Financial Data in Email Subject Line',
      framework: 'DPDP',
      severity: 'LOW',
      status: 'RESOLVED',
      channel: 'GMAIL',
      entityTypes: ['FINANCIAL_DATA', 'PERSON_NAME'],
      entityCount: 1,
      contextSummary:
        'Email subject line read "Ramesh Jain — Taxable Income ₹48,72,000 — ITR Filing". Subject lines are not encrypted and visible in transit.',
      staffIdx: 1,
      staffIdentifier: 'kavya.reddy@mehtaca.com',
      daysAgoOccurred: 28,
      resolution: 'Staff trained on email subject line hygiene. Template library updated.',
      resolutionNote:
        'New subject line format adopted: "ITR Filing — Client Ref #MA-2847". Template updated in Outlook.',
      resolvedById: complianceUser.id,
      remediationSteps: [
        'Update email templates to use client reference codes instead of financial figures',
        'Train staff on email metadata hygiene',
        'Implement an email DLP rule to flag subject lines containing financial patterns',
      ],
      riskExplanation:
        'Financial data in unencrypted email metadata (subject/headers) constitutes improper data handling under DPDP Act and IT Act SPDI Rules, as metadata is transmitted in plaintext across email servers.',
    },

    // ---- ESCALATED (3) ----
    {
      ruleCode: 'DPDP-015',
      ruleName: 'Data Breach — Unauthorised Access to Client Files',
      framework: 'DPDP',
      severity: 'CRITICAL',
      status: 'ESCALATED',
      channel: 'GMAIL',
      entityTypes: ['PERSON_NAME', 'PAN_NUMBER', 'AADHAAR_NUMBER', 'FINANCIAL_DATA', 'BANK_ACCOUNT'],
      entityCount: 47,
      contextSummary:
        'Former employee\'s Gmail OAuth token found still active. Access logs show 47 client files downloaded from Google Drive 3 days after their resignation.',
      staffIdx: 2,
      staffIdentifier: 'amit.joshi@mehtaca.com',
      daysAgoOccurred: 6,
      remediationSteps: [
        'Revoke the former employee\'s OAuth token and all active sessions immediately',
        'Conduct a forensic audit of all files accessed by the former employee',
        'Notify the Data Protection Board under DPDP Act within 72 hours',
        'Notify all 47 affected clients individually',
        'Review and update the employee offboarding checklist to include immediate OAuth revocation',
        'Implement automated token revocation on HR offboarding trigger',
        'Consider filing a complaint with cyber police under IT Act Section 66',
      ],
      riskExplanation:
        'Unauthorised access to personal data by a former employee constitutes a personal data breach under DPDP Act Section 8(6). Mandatory reporting to the Data Protection Board is required. With 47 data principals affected, this is a significant breach potentially attracting penalties up to ₹250 crore and reputational damage.',
    },
    {
      ruleCode: 'SEBI-IA-006',
      ruleName: 'Investment Advice via Unregistered Channel',
      framework: 'SEBI',
      severity: 'HIGH',
      status: 'ESCALATED',
      channel: 'WHATSAPP',
      entityTypes: ['PERSON_NAME', 'FINANCIAL_DATA'],
      entityCount: 8,
      contextSummary:
        'WhatsApp broadcast message sent to 8 HNI clients with equity portfolio rebalancing suggestions, constituting investment advice without SEBI IA registration.',
      staffIdx: 3,
      staffIdentifier: 'deepika.menon@mehtaca.com',
      daysAgoOccurred: 9,
      remediationSteps: [
        'Immediately clarify to recipients that the message was informational and not regulated advice',
        'Cease all investment advisory communications through unregistered channels',
        'Evaluate whether the firm needs to register as an Investment Adviser under SEBI IA Regulations 2013',
        'Brief all partners on the boundary between permissible CA services and SEBI-regulated investment advice',
        'Engage a SEBI-registered IA firm for referral partnership if investment advice is a service offering',
      ],
      riskExplanation:
        'Providing investment advice without SEBI IA registration violates SEBI IA Regulations 2013. The penalty is ₹1 lakh per day of violation or ₹1 crore, whichever is higher. WhatsApp broadcasts to multiple clients amplifies the violation.',
    },
    {
      ruleCode: 'DPDP-019',
      ruleName: 'Cross-Border Data Transfer Without Safeguards',
      framework: 'DPDP',
      severity: 'HIGH',
      status: 'ESCALATED',
      channel: 'GMAIL',
      entityTypes: ['PERSON_NAME', 'PAN_NUMBER', 'FINANCIAL_DATA', 'EMAIL_ADDRESS'],
      entityCount: 12,
      contextSummary:
        'Client financial data sent to a Singapore-based accounting software vendor (Xero) for reconciliation without checking if the country is on India\'s approved cross-border transfer list.',
      staffIdx: 0,
      staffIdentifier: 'suresh.patel@mehtaca.com',
      daysAgoOccurred: 11,
      remediationSteps: [
        'Review if Singapore is on MeitY\'s list of countries with adequate data protection',
        'Execute a cross-border data transfer agreement (Standard Contractual Clauses equivalent)',
        'Add the Xero transfer to the firm\'s Record of Processing Activities (RoPA)',
        'Update the client privacy notice to disclose cross-border transfers',
        'Evaluate whether data can be processed locally using Xero\'s India data residency option',
      ],
      riskExplanation:
        'DPDP Act Section 16 restricts transfer of personal data to countries not approved by the Central Government. Singapore\'s status is pending MeitY notification. Unauthorised cross-border transfers can attract penalties up to ₹150 crore and mandatory data repatriation orders.',
    },
  ]

  // Create incidents and their timelines
  const sourceMap: Record<string, typeof gmailSource> = {
    GMAIL: gmailSource,
    WHATSAPP: whatsappSource,
  }

  for (let i = 0; i < incidentDefs.length; i++) {
    const def = incidentDefs[i]
    const source = sourceMap[def.channel]
    const staff = staffMembers[def.staffIdx]

    const incident = await db.incident.create({
      data: {
        orgId: org.id,
        sourceId: source.id,
        ruleId: `rule_${def.ruleCode.toLowerCase().replace(/-/g, '_')}`,
        ruleCode: def.ruleCode,
        ruleName: def.ruleName,
        framework: def.framework,
        severity: def.severity,
        status: def.status,
        channel: def.channel,
        entityTypes: def.entityTypes,
        entityCount: def.entityCount,
        contextSummary: def.contextSummary,
        staffMemberId: staff.id,
        staffIdentifier: hashIdentifier(def.staffIdentifier),
        resolvedById: def.resolvedById ?? null,
        assignedToId: def.status === 'OPEN' ? complianceUser.id : null,
        resolvedAt: def.resolution ? daysAgo(def.daysAgoOccurred - 2) : null,
        resolution: def.resolution ?? null,
        resolutionNote: def.resolutionNote ?? null,
        remediationSteps: { steps: def.remediationSteps },
        riskExplanation: def.riskExplanation,
        occurredAt: daysAgo(def.daysAgoOccurred),
      },
    })

    // Timeline events
    const timelineEvents: Array<{
      incidentId: string
      type: string
      description: string
      userId?: string
      metadata?: Record<string, unknown>
      createdAt: Date
    }> = [
      {
        incidentId: incident.id,
        type: 'DETECTED',
        description: `Incident auto-detected by KavachAI scan. Rule triggered: ${def.ruleName}`,
        createdAt: daysAgo(def.daysAgoOccurred),
      },
    ]

    if (def.status === 'OPEN') {
      timelineEvents.push({
        incidentId: incident.id,
        type: 'ASSIGNED',
        description: `Assigned to Priya Sharma (Compliance Officer) for investigation`,
        userId: complianceUser.id,
        createdAt: new Date(daysAgo(def.daysAgoOccurred).getTime() + 30 * 60 * 1000),
      })
    }

    if (def.status === 'RESOLVED' && def.resolvedById) {
      timelineEvents.push(
        {
          incidentId: incident.id,
          type: 'ASSIGNED',
          description: 'Assigned to Compliance Officer for investigation',
          userId: complianceUser.id,
          createdAt: new Date(daysAgo(def.daysAgoOccurred).getTime() + 60 * 60 * 1000),
        },
        {
          incidentId: incident.id,
          type: 'NOTE',
          description: 'Investigation started. Gathering context and affected records.',
          userId: complianceUser.id,
          createdAt: new Date(daysAgo(def.daysAgoOccurred).getTime() + 4 * 60 * 60 * 1000),
        },
        {
          incidentId: incident.id,
          type: 'RESOLVED',
          description: def.resolution ?? 'Incident resolved.',
          userId: def.resolvedById,
          metadata: { resolutionNote: def.resolutionNote },
          createdAt: daysAgo(def.daysAgoOccurred - 2),
        }
      )
    }

    if (def.status === 'ESCALATED') {
      timelineEvents.push(
        {
          incidentId: incident.id,
          type: 'ASSIGNED',
          description: 'Escalated to Rajesh Mehta (Owner) due to critical severity',
          userId: adminUser.id,
          createdAt: new Date(daysAgo(def.daysAgoOccurred).getTime() + 2 * 60 * 60 * 1000),
        },
        {
          incidentId: incident.id,
          type: 'ESCALATED',
          description:
            'Incident escalated — requires senior management intervention and possible regulatory notification',
          userId: adminUser.id,
          metadata: { escalationReason: 'Critical severity + potential regulatory obligation' },
          createdAt: new Date(daysAgo(def.daysAgoOccurred).getTime() + 3 * 60 * 60 * 1000),
        }
      )
    }

    await db.incidentTimelineEvent.createMany({ data: timelineEvents as unknown as Prisma.IncidentTimelineEventCreateManyInput[] })
  }

  console.log('  Created 15 incidents with timeline events.')

  // -------------------------------------------------------------------------
  // 7. Score history
  // -------------------------------------------------------------------------
  await db.scoreHistory.createMany({
    data: [
      {
        orgId: org.id,
        score: 95,
        delta: 0,
        reason: 'Initial compliance score at onboarding',
        recordedAt: daysAgo(30),
      },
      {
        orgId: org.id,
        score: 88,
        delta: -7,
        reason: '3 HIGH incidents detected in email channels. Remediation in progress.',
        recordedAt: daysAgo(15),
      },
      {
        orgId: org.id,
        score: 78,
        delta: -10,
        reason:
          '2 CRITICAL incidents raised: unauthorised data breach by former employee and minor data processing violation.',
        recordedAt: daysAgo(5),
      },
    ],
  })

  console.log('  Created 3 score history records.')

  // -------------------------------------------------------------------------
  // 8. Reports
  // -------------------------------------------------------------------------
  const weekStart = daysAgo(7)
  const weekEnd = daysAgo(0)
  const monthStart = daysAgo(30)
  const monthEnd = daysAgo(0)

  await db.report.createMany({
    data: [
      {
        orgId: org.id,
        type: 'WEEKLY',
        title: 'Weekly Compliance Report — W21 2026',
        period: 'W21-2026',
        periodStart: weekStart,
        periodEnd: weekEnd,
        status: 'READY',
        s3Key: 'reports/mehta-associates/weekly-w21-2026.pdf',
        downloadUrl:
          'https://kavachai-storage.s3.ap-south-1.amazonaws.com/reports/mehta-associates/weekly-w21-2026.pdf',
        metadata: {
          incidentCount: 7,
          criticalCount: 2,
          avgResolutionHours: 18,
          scoreChange: -10,
        },
        generatedAt: daysAgo(0),
        createdAt: daysAgo(1),
      },
      {
        orgId: org.id,
        type: 'MONTHLY',
        title: 'Monthly Compliance Report — April 2026',
        period: 'APR-2026',
        periodStart: monthStart,
        periodEnd: monthEnd,
        status: 'READY',
        s3Key: 'reports/mehta-associates/monthly-apr-2026.pdf',
        downloadUrl:
          'https://kavachai-storage.s3.ap-south-1.amazonaws.com/reports/mehta-associates/monthly-apr-2026.pdf',
        metadata: {
          incidentCount: 15,
          criticalCount: 4,
          resolvedCount: 7,
          escalatedCount: 3,
          avgResolutionHours: 22,
          scoreChange: -17,
          topFramework: 'DPDP',
          topChannel: 'GMAIL',
        },
        generatedAt: daysAgo(0),
        createdAt: daysAgo(2),
      },
    ],
  })

  console.log('  Created 2 reports.')

  // -------------------------------------------------------------------------
  // 9. Invoices
  // -------------------------------------------------------------------------
  await db.invoice.createMany({
    data: [
      {
        orgId: org.id,
        razorpayInvoiceId: 'inv_demo_march_2026',
        amount: 699900, // ₹6,999 in paise
        gstAmount: 125982, // 18% GST
        totalAmount: 825882,
        status: 'PAID',
        invoiceNumber: 'KAV/2025-26/0014',
        billingPeriod: 'MAR-2026',
        paidAt: daysAgo(55),
        createdAt: daysAgo(56),
        pdfS3Key: 'invoices/mehta-associates/KAV-2025-26-0014.pdf',
      },
      {
        orgId: org.id,
        razorpayInvoiceId: 'inv_demo_april_2026',
        amount: 699900,
        gstAmount: 125982,
        totalAmount: 825882,
        status: 'PAID',
        invoiceNumber: 'KAV/2026-27/0001',
        billingPeriod: 'APR-2026',
        paidAt: daysAgo(25),
        createdAt: daysAgo(26),
        pdfS3Key: 'invoices/mehta-associates/KAV-2026-27-0001.pdf',
      },
    ],
  })

  console.log('  Created 2 invoices.')

  // -------------------------------------------------------------------------
  // 10. Audit events (sample trail)
  // -------------------------------------------------------------------------
  await db.auditEvent.createMany({
    data: [
      {
        orgId: org.id,
        userId: adminUser.id,
        action: 'ORGANISATION_ONBOARDED',
        resource: 'Organisation',
        resourceId: org.id,
        ipAddress: '122.161.72.14',
        createdAt: daysAgo(30),
      },
      {
        orgId: org.id,
        userId: adminUser.id,
        action: 'DATA_SOURCE_CONNECTED',
        resource: 'DataSource',
        resourceId: gmailSource.id,
        ipAddress: '122.161.72.14',
        metadata: { sourceType: 'GMAIL' },
        createdAt: daysAgo(29),
      },
      {
        orgId: org.id,
        userId: adminUser.id,
        action: 'DATA_SOURCE_CONNECTED',
        resource: 'DataSource',
        resourceId: whatsappSource.id,
        ipAddress: '122.161.72.14',
        metadata: { sourceType: 'WHATSAPP' },
        createdAt: daysAgo(29),
      },
      {
        orgId: org.id,
        userId: complianceUser.id,
        action: 'INCIDENT_RESOLVED',
        resource: 'Incident',
        ipAddress: '106.51.88.201',
        metadata: { ruleCode: 'DPDP-002', severity: 'HIGH' },
        createdAt: daysAgo(10),
      },
      {
        orgId: org.id,
        userId: adminUser.id,
        action: 'REPORT_DOWNLOADED',
        resource: 'Report',
        ipAddress: '122.161.72.14',
        metadata: { reportType: 'WEEKLY', period: 'W21-2026' },
        createdAt: daysAgo(1),
      },
    ],
  })

  console.log('  Created audit trail events.')

  console.log('\n✅  Seed completed successfully!')
  console.log('\n  Demo login credentials:')
  console.log('  ┌────────────────────────────────────┬──────────────────────┬────────────────────┐')
  console.log('  │ Email                              │ Password             │ Role               │')
  console.log('  ├────────────────────────────────────┼──────────────────────┼────────────────────┤')
  console.log('  │ admin@mehtaca.com                  │ Demo@1234            │ OWNER              │')
  console.log('  │ compliance@mehtaca.com             │ Demo@1234            │ COMPLIANCE_OFFICER │')
  console.log('  │ auditor@mehtaca.com                │ Demo@1234            │ AUDITOR            │')
  console.log('  │ staff@mehtaca.com                  │ Demo@1234            │ STAFF              │')
  console.log('  └────────────────────────────────────┴──────────────────────┴────────────────────┘')
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
