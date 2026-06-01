import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Security — KavachAI',
  description: 'How KavachAI secures your data: encryption, access control, and privacy-by-design.',
}

export default function SecurityPage() {
  return (
    <LegalPageLayout
      title="Security"
      subtitle="Security is foundational to a compliance platform. Here is how we protect your data."
      lastUpdated="31 May 2026"
      sections={[
        {
          heading: 'Privacy by design',
          body: [
            'KavachAI is built so that sensitive personal data never needs to be stored. When a violation is detected, we persist only the entity classification (for example "PAN_NUMBER") and an AI-generated context summary — never the underlying value.',
            'We never use your organisation’s data to train AI models.',
          ],
        },
        {
          heading: 'Encryption',
          body: [
            'All third-party OAuth and access tokens are encrypted at rest using AES-256-GCM with keys held outside the application database.',
            'All data in transit is protected with TLS 1.2+ . Internal service-to-service traffic is likewise encrypted.',
          ],
        },
        {
          heading: 'Access control',
          body: [
            'The platform enforces role-based access control (Owner, Admin, Compliance Officer, Auditor, Staff), so users see only what their role permits.',
            'Administrative access to production systems is restricted, logged, and reviewed.',
          ],
        },
        {
          heading: 'Webhook and API security',
          body: [
            'All inbound webhooks (WhatsApp, Google, Microsoft, Razorpay) are verified using HMAC-SHA256 signatures or validation tokens before any processing occurs.',
            'Public API endpoints are rate-limited, and all mutating requests are validated and authenticated.',
          ],
        },
        {
          heading: 'Auditability',
          body: [
            'Significant actions — log-ins, source connections, incident resolutions, report downloads — are recorded in a tamper-evident audit log to support your regulatory obligations.',
          ],
        },
        {
          heading: 'Reporting a vulnerability',
          body: [
            'If you believe you have found a security issue, please email security@kavachai.in. We investigate all legitimate reports and appreciate responsible disclosure.',
          ],
        },
      ]}
    />
  )
}
