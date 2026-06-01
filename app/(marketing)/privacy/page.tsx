import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — KavachAI',
  description: 'How KavachAI collects, uses, and protects personal data under the DPDP Act 2023.',
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect personal data in line with India's Digital Personal Data Protection Act, 2023."
      lastUpdated="31 May 2026"
      sections={[
        {
          heading: 'Who we are',
          body: [
            'KavachAI Technologies Pvt. Ltd. ("KavachAI", "we", "us") provides an AI-powered compliance monitoring platform that helps Indian organisations detect and remediate data-protection risks across their communication channels.',
            'For the purposes of the DPDP Act 2023, when we process your account information we act as a Data Fiduciary; when we process data on behalf of your organisation through connected sources, we act as a Data Processor under your instructions.',
          ],
        },
        {
          heading: 'Information we collect',
          body: [
            'Account data: name, work email, organisation details, role, and authentication credentials.',
            'Usage data: log-in activity, feature usage, device and browser metadata, and IP address for security and audit purposes.',
            'Connected-source metadata: to detect violations we analyse message and document metadata. We store only entity classifications (for example "AADHAAR_NUMBER" or "HEALTH_CONDITION") — never the underlying personal data values themselves.',
          ],
        },
        {
          heading: 'How we use information',
          body: [
            'To provide the service: monitoring, incident detection, alerting, reporting, and billing.',
            'To secure the platform: fraud prevention, abuse detection, and audit logging.',
            'To communicate with you about incidents, service changes, and support requests.',
            'We do not sell your data, and we never use your organisation’s client data to train AI models.',
          ],
        },
        {
          heading: 'Your rights as a Data Principal',
          body: [
            'Under the DPDP Act you have the right to access, correct, and erase your personal data, to nominate a representative, and to grievance redressal.',
            'To exercise these rights, contact our Data Protection Officer at dpo@kavachai.in. We respond to verified requests within the timelines prescribed by law.',
          ],
        },
        {
          heading: 'Data retention and security',
          body: [
            'We retain account data for the duration of your subscription and for a limited period thereafter to meet legal and audit obligations.',
            'All third-party access tokens are encrypted at rest using AES-256-GCM, and data in transit is protected with TLS. See our Security page for more detail.',
          ],
        },
        {
          heading: 'Contact',
          body: [
            'Questions about this policy can be sent to dpo@kavachai.in or by post to KavachAI Technologies Pvt. Ltd., Mumbai, Maharashtra, India.',
          ],
        },
      ]}
    />
  )
}
