import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — KavachAI',
  description: 'The terms governing your use of the KavachAI compliance monitoring platform.',
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The agreement that governs your access to and use of the KavachAI platform."
      lastUpdated="31 May 2026"
      sections={[
        {
          heading: 'Acceptance of terms',
          body: [
            'By creating an account or using KavachAI you agree to these Terms of Service. If you are accepting on behalf of an organisation, you confirm you have authority to bind that organisation.',
          ],
        },
        {
          heading: 'The service',
          body: [
            'KavachAI provides automated monitoring of connected communication channels to detect potential data-protection compliance issues and generate audit-ready reports.',
            'KavachAI is a decision-support tool. It does not constitute legal advice, and it does not guarantee detection of every compliance issue. You remain responsible for your organisation’s regulatory obligations.',
          ],
        },
        {
          heading: 'Subscriptions and billing',
          body: [
            'Paid plans (Starter, Professional, Guardian) are billed monthly in Indian Rupees via Razorpay, inclusive of applicable GST.',
            'Subscriptions renew automatically until cancelled. You may cancel at any time; access continues until the end of the current billing period. Fees already paid are non-refundable except where required by law.',
          ],
        },
        {
          heading: 'Acceptable use',
          body: [
            'You agree not to misuse the service, attempt to gain unauthorised access, reverse-engineer the platform, or use it to violate any applicable law.',
            'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
          ],
        },
        {
          heading: 'Limitation of liability',
          body: [
            'To the maximum extent permitted by law, KavachAI’s aggregate liability arising from the service is limited to the fees paid by you in the twelve months preceding the claim.',
            'We are not liable for indirect, incidental, or consequential damages, including regulatory penalties imposed on your organisation.',
          ],
        },
        {
          heading: 'Governing law',
          body: [
            'These terms are governed by the laws of India, and disputes are subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.',
            'Questions can be sent to legal@kavachai.in.',
          ],
        },
      ]}
    />
  )
}
