import Link from 'next/link'
import { CheckCircle, X, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  { name: 'Starter', price: '₹2,999', color: 'text-gray-900' },
  { name: 'Professional', price: '₹6,999', color: 'text-[#0F2B5B]', highlight: true },
  { name: 'Guardian', price: '₹12,999', color: 'text-gray-900' },
]

type FeatureValue = boolean | string

interface FeatureRow {
  category: string
  features: {
    label: string
    starter: FeatureValue
    professional: FeatureValue
    guardian: FeatureValue
    tooltip?: string
  }[]
}

const featureTable: FeatureRow[] = [
  {
    category: 'Channels & Integrations',
    features: [
      { label: 'Communication channels', starter: '3', professional: '10', guardian: 'Unlimited' },
      { label: 'WhatsApp Business', starter: true, professional: true, guardian: true },
      { label: 'Gmail integration', starter: true, professional: true, guardian: true },
      { label: 'Google Drive scanning', starter: false, professional: true, guardian: true },
      { label: 'Slack integration', starter: false, professional: true, guardian: true },
      { label: 'Microsoft Teams', starter: false, professional: false, guardian: true },
      { label: 'Custom API sources', starter: false, professional: true, guardian: true },
    ],
  },
  {
    category: 'AI Monitoring',
    features: [
      { label: 'Real-time message scanning', starter: true, professional: true, guardian: true },
      { label: 'Scan frequency', starter: 'Every 15 min', professional: 'Every 5 min', guardian: 'Real-time' },
      { label: 'PII detection (Aadhaar, PAN, etc.)', starter: true, professional: true, guardian: true },
      { label: 'Sensitive data classification', starter: 'Basic', professional: 'Advanced', guardian: 'Advanced + Custom' },
      { label: 'Consent monitoring', starter: false, professional: true, guardian: true },
      { label: 'Cross-channel correlation', starter: false, professional: true, guardian: true },
    ],
  },
  {
    category: 'Compliance Frameworks',
    features: [
      { label: 'DPDP Act 2023', starter: true, professional: true, guardian: true },
      { label: 'IT Act 2000', starter: true, professional: true, guardian: true },
      { label: 'RBI Guidelines', starter: false, professional: true, guardian: true },
      { label: 'SEBI Regulations', starter: false, professional: true, guardian: true },
      { label: 'IRDAI Guidelines', starter: false, professional: true, guardian: true },
      { label: 'NMC / Medical Council Code', starter: false, professional: true, guardian: true },
      { label: 'Bar Council Rules', starter: false, professional: true, guardian: true },
      { label: 'POCSO compliance', starter: false, professional: true, guardian: true },
      { label: 'Custom frameworks', starter: false, professional: false, guardian: true },
    ],
  },
  {
    category: 'Incident Management',
    features: [
      { label: 'Incident dashboard', starter: true, professional: true, guardian: true },
      { label: 'Incident history retention', starter: '90 days', professional: '1 year', guardian: 'Unlimited' },
      { label: 'Bulk incident actions', starter: false, professional: true, guardian: true },
      { label: 'Custom incident workflows', starter: false, professional: false, guardian: true },
      { label: 'Rule override capability', starter: false, professional: true, guardian: true },
    ],
  },
  {
    category: 'Alerts & Notifications',
    features: [
      { label: 'Email alerts', starter: true, professional: true, guardian: true },
      { label: 'WhatsApp alerts', starter: false, professional: true, guardian: true },
      { label: 'Slack notifications', starter: false, professional: true, guardian: true },
      { label: 'SMS alerts', starter: false, professional: false, guardian: true },
      { label: 'Custom alert thresholds', starter: false, professional: true, guardian: true },
      { label: 'Alert escalation rules', starter: false, professional: false, guardian: true },
    ],
  },
  {
    category: 'Reports & Audit',
    features: [
      { label: 'Compliance score', starter: true, professional: true, guardian: true },
      { label: 'PDF reports', starter: 'Monthly', professional: 'Weekly', guardian: 'Daily' },
      { label: 'Scheduled auto-reports', starter: false, professional: true, guardian: true },
      { label: 'White-label reports', starter: false, professional: false, guardian: true },
      { label: 'Export to Excel/CSV', starter: false, professional: true, guardian: true },
      { label: 'Audit trail', starter: '90 days', professional: '1 year', guardian: 'Unlimited' },
    ],
  },
  {
    category: 'Team & Access',
    features: [
      { label: 'Team members', starter: '2', professional: '10', guardian: 'Unlimited' },
      { label: 'Role-based access (RBAC)', starter: 'Basic', professional: 'Advanced', guardian: 'Advanced' },
      { label: 'DPO designation', starter: false, professional: true, guardian: true },
      { label: 'SSO / SAML', starter: false, professional: false, guardian: true },
      { label: 'IP allowlisting', starter: false, professional: false, guardian: true },
    ],
  },
  {
    category: 'Support & SLA',
    features: [
      { label: 'Support channel', starter: 'Community', professional: 'Priority email', guardian: 'Dedicated CSM' },
      { label: 'Response time SLA', starter: '5 business days', professional: '24 hours', guardian: '4 hours' },
      { label: 'Onboarding assistance', starter: 'Self-serve docs', professional: 'Video walkthrough', guardian: 'Personalized session' },
      { label: 'On-premise deployment', starter: false, professional: false, guardian: true },
    ],
  },
]

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
  }
  if (value === false) {
    return <X className="w-4 h-4 text-gray-300 mx-auto" />
  }
  return <span className="text-xs text-gray-700 font-medium">{value}</span>
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F2B5B] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#0F2B5B] tracking-tight">KavachAI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#0F2B5B]">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-[#0F2B5B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1E6FD9] transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gradient-to-br from-[#0F2B5B] to-[#1E6FD9] py-16 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold mb-4">Pricing Plans</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Simple, transparent pricing for every size of Indian business. All plans include a
            14-day free trial. Prices are exclusive of 18% GST.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'rounded-2xl border p-6 text-center',
                  plan.highlight
                    ? 'bg-[#0F2B5B] border-[#0F2B5B] text-white shadow-xl'
                    : 'bg-white border-gray-200 shadow-sm'
                )}
              >
                {plan.highlight && (
                  <span className="inline-block bg-[#1E6FD9] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    Most Popular
                  </span>
                )}
                <h2
                  className={cn(
                    'text-xl font-bold mb-1',
                    plan.highlight ? 'text-white' : 'text-gray-900'
                  )}
                >
                  {plan.name}
                </h2>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span
                    className={cn(
                      'text-3xl font-black',
                      plan.highlight ? 'text-white' : 'text-[#0F2B5B]'
                    )}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      plan.highlight ? 'text-blue-200' : 'text-gray-500'
                    )}
                  >
                    /month
                  </span>
                </div>
                <Link
                  href="/register"
                  className={cn(
                    'w-full block py-2.5 rounded-lg font-semibold text-sm transition-colors',
                    plan.highlight
                      ? 'bg-white text-[#0F2B5B] hover:bg-blue-50'
                      : 'bg-[#0F2B5B] text-white hover:bg-[#1E6FD9]'
                  )}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Full feature comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 w-1/2">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.name}
                      className={cn(
                        'px-4 py-4 font-bold text-center w-[16.66%]',
                        plan.highlight ? 'text-[#0F2B5B]' : 'text-gray-900'
                      )}
                    >
                      {plan.name}
                      {plan.highlight && (
                        <span className="ml-2 text-xs bg-[#1E6FD9] text-white px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureTable.map((section) => (
                  <>
                    <tr key={section.category} className="bg-gray-50 border-y border-gray-200">
                      <td
                        colSpan={4}
                        className="px-6 py-3 font-bold text-gray-800 text-xs uppercase tracking-wide"
                      >
                        {section.category}
                      </td>
                    </tr>
                    {section.features.map((row, rowIdx) => (
                      <tr
                        key={row.label}
                        className={cn(
                          'border-b border-gray-100',
                          rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        )}
                      >
                        <td className="px-6 py-3 text-gray-700">{row.label}</td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCell value={row.starter} />
                        </td>
                        <td className="px-4 py-3 text-center bg-blue-50/30">
                          <FeatureCell value={row.professional} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCell value={row.guardian} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Note */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently asked pricing questions</h3>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              {
                q: 'Is GST included in the pricing?',
                a: 'No. All prices shown are exclusive of 18% GST. Your final invoice will include GST as applicable under Indian tax law.',
              },
              {
                q: 'Can I change plans mid-cycle?',
                a: 'Yes. You can upgrade at any time — changes take effect immediately and billing is prorated. Downgrades take effect at the next billing cycle.',
              },
              {
                q: 'Do you offer annual billing discounts?',
                a: 'Yes. Annual billing provides a 20% discount equivalent to 2 months free. Contact us for an annual invoice.',
              },
              {
                q: 'What payment methods are accepted?',
                a: 'We accept UPI, credit/debit cards, net banking, and bank transfer (NEFT/RTGS) via Razorpay. We can also raise PO-backed invoices.',
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="font-semibold text-gray-900 text-sm mb-2">{item.q}</p>
                <p className="text-gray-600 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F2B5B] py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to become compliant?
          </h2>
          <p className="text-blue-200 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-[#0F2B5B] font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2026 KavachAI Technologies Pvt Ltd. All rights reserved. GSTIN: 27AABCK1234Z1ZQ</p>
        </div>
      </footer>
    </div>
  )
}
