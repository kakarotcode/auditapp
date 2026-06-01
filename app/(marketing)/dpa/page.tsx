import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Data Processing Agreement — KavachAI',
  description: 'How KavachAI processes personal data on behalf of customers under the DPDP Act 2023.',
}

export default function DPAPage() {
  return (
    <LegalPageLayout
      title="Data Processing Agreement"
      subtitle="The terms under which KavachAI processes personal data on behalf of your organisation."
      lastUpdated="31 May 2026"
      sections={[
        {
          heading: 'Roles of the parties',
          body: [
            'Where KavachAI processes personal data contained in your connected sources, your organisation is the Data Fiduciary and KavachAI acts as a Data Processor under the DPDP Act 2023.',
            'KavachAI processes such data only on documented instructions from you, as set out in this agreement and the Terms of Service.',
          ],
        },
        {
          heading: 'Scope and purpose of processing',
          body: [
            'Processing is limited to scanning connected communication channels and documents to detect compliance risks, generate incidents, and produce reports.',
            'KavachAI applies data minimisation: detected personal data is reduced to entity-type classifications, and raw values are not persisted in our primary datastore.',
          ],
        },
        {
          heading: 'Sub-processors',
          body: [
            'We engage vetted sub-processors to deliver the service, including cloud hosting (AWS, ap-south-1 region), and the Anthropic Claude API for AI classification.',
            'We maintain a current list of sub-processors and will give you notice of material changes so you may object.',
          ],
        },
        {
          heading: 'Security measures',
          body: [
            'KavachAI implements technical and organisational measures including encryption of access tokens at rest (AES-256-GCM), TLS in transit, role-based access control, and comprehensive audit logging.',
            'These measures are described further on our Security page.',
          ],
        },
        {
          heading: 'Data breach notification',
          body: [
            'In the event of a personal data breach affecting your data, KavachAI will notify you without undue delay and provide information reasonably necessary for you to meet your obligations to the Data Protection Board of India.',
          ],
        },
        {
          heading: 'Return and deletion of data',
          body: [
            'Upon termination, KavachAI will delete or return personal data processed on your behalf within a commercially reasonable period, subject to legal retention requirements.',
            'To execute a signed DPA for your organisation, contact legal@kavachai.in.',
          ],
        },
      ]}
    />
  )
}
