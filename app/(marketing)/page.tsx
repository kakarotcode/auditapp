'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  Shield,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCircle,
  BarChart2,
  FileText,
  Bell,
  Lock,
  Users,
  Zap,
} from 'lucide-react'

// FAQ Accordion Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800">{question}</span>
        <ChevronDown
          className={cn('w-5 h-5 text-gray-500 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

const faqs = [
  {
    question: 'What is the DPDP Act and why does it matter for my business?',
    answer:
      'The Digital Personal Data Protection Act 2023 is India\'s landmark data privacy law. It requires businesses to obtain explicit consent before processing personal data, appoint a Data Protection Officer if processing sensitive data, and report breaches within 72 hours. Non-compliance can result in fines of up to ₹250 crore per violation. The act becomes fully enforceable from May 2027.',
  },
  {
    question: 'How does KavachAI monitor my communications?',
    answer:
      'KavachAI connects to your business channels (WhatsApp Business API, Gmail, Google Drive) via OAuth and API integrations. Our AI engine scans all outgoing and incoming communications in real-time, flagging any that contain personal data shared without proper consent, sensitive financial or health information, or language that could constitute a DPDP violation.',
  },
  {
    question: 'Is KavachAI suitable for small businesses and CA firms?',
    answer:
      'Absolutely. KavachAI is purpose-built for Indian SMBs — CA firms, clinics, NBFCs, law firms, and HR tech companies. Our Starter plan at ₹2,999/month covers up to 3 communication channels and 2 team members, making compliance affordable for businesses of all sizes.',
  },
  {
    question: 'How is the compliance score calculated?',
    answer:
      'Your compliance score starts at 100 and deductions are applied based on open incidents. Critical incidents (potential ₹250 crore fine exposure) deduct 15 points, high severity deducts 10, medium deducts 5, and low deducts 2. Resolving incidents restores your score. The score is recalculated every hour.',
  },
  {
    question: 'Can I export reports for my clients or auditors?',
    answer:
      'Yes. KavachAI generates PDF compliance reports that can be shared with clients, statutory auditors, or regulators. Professional and Guardian plans include white-labelled reports with your firm\'s branding. Reports are available for any date range and can be scheduled to auto-generate monthly.',
  },
  {
    question: 'What happens to my data? Is it stored on Indian servers?',
    answer:
      'All data is stored on AWS Mumbai (ap-south-1) servers, ensuring data residency within India as required by the DPDP Act. We never train our AI models on your data. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). We hold SOC 2 Type II certification and are ISO 27001 compliant.',
  },
]

const features = [
  {
    icon: <Bell className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Real-time Incident Alerts',
    desc: 'Instant notifications via WhatsApp, email, or Slack when a potential DPDP violation is detected in your communications.',
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Live Compliance Score',
    desc: 'A dynamic score from 0–100 that reflects your real-time risk posture. Track trends weekly and monthly.',
  },
  {
    icon: <FileText className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Automated PDF Reports',
    desc: 'Generate audit-ready compliance reports for any period. Branded reports for CA firms. Schedule monthly auto-reports.',
  },
  {
    icon: <Lock className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Multi-Framework Rulebook',
    desc: 'Covers DPDP Act, IT Act 2000, RBI Guidelines, SEBI Regulations, IRDAI, NMC, Bar Council, and more.',
  },
  {
    icon: <Users className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Team & Role Management',
    desc: 'Assign DPO, Compliance Officer, and Analyst roles. Granular access control with full audit trail.',
  },
  {
    icon: <Zap className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'One-click Integrations',
    desc: 'Connect WhatsApp Business, Gmail, Google Drive in minutes. No developer required. Works with existing tools.',
  },
]

const steps = [
  {
    num: '01',
    icon: <Shield className="w-8 h-8 text-white" />,
    title: 'Connect your channels',
    desc: 'Link your WhatsApp Business, Gmail, and Google Drive in under 5 minutes with our OAuth wizard.',
  },
  {
    num: '02',
    icon: <Zap className="w-8 h-8 text-white" />,
    title: 'AI scans in real-time',
    desc: 'Our DPDP-trained AI model reviews every message and file, flagging violations instantly.',
  },
  {
    num: '03',
    icon: <CheckCircle className="w-8 h-8 text-white" />,
    title: 'Stay audit-ready',
    desc: 'Resolve incidents, track your score, and generate reports — all from one dashboard.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: '₹2,999',
    period: '/month',
    highlight: false,
    features: [
      '3 communication channels',
      '2 team members',
      'DPDP Act rulebook',
      'Email alerts',
      'Monthly PDF report',
      'Community support',
    ],
  },
  {
    name: 'Professional',
    price: '₹6,999',
    period: '/month',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '10 communication channels',
      '10 team members',
      'All frameworks',
      'WhatsApp + Email + Slack alerts',
      'Weekly branded reports',
      'Priority support',
      'Custom rule overrides',
      'API access',
    ],
  },
  {
    name: 'Guardian',
    price: '₹12,999',
    period: '/month',
    highlight: false,
    features: [
      'Unlimited channels',
      'Unlimited team members',
      'All frameworks + custom',
      'All alert channels',
      'Daily reports',
      'Dedicated CSM',
      'SLA: 4-hour response',
      'On-premise option',
      'White-label reports',
    ],
  },
]

const testimonials = [
  {
    quote:
      'KavachAI has transformed how we handle client data compliance. We caught 3 potential DPDP violations in the first week alone. Our clients trust us more because we can show them a compliance score.',
    name: 'Priya Sharma',
    role: 'Senior Partner',
    company: 'Sharma & Associates, CA Firm, Mumbai',
  },
  {
    quote:
      "As a small clinic, we couldn't afford a full-time DPO. KavachAI gives us the monitoring and reporting we need at a price that makes sense. Setup took less than 20 minutes.",
    name: 'Dr. Rajan Mehta',
    role: 'Director',
    company: 'Mehta Wellness Clinic, Bengaluru',
  },
  {
    quote:
      'Our NBFC was already worried about RBI and SEBI compliance. Finding a tool that covers DPDP on top of those frameworks — and does it automatically — was a game changer.',
    name: 'Vikram Nair',
    role: 'Chief Compliance Officer',
    company: 'Nair Capital Finance, Chennai',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F2B5B] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#0F2B5B] tracking-tight">KavachAI</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium transition-colors">
                About
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-[#0F2B5B] transition-colors"
              >
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

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#0F2B5B] to-[#1E6FD9] text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>DPDP Act enforcement: May 2027</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
                India&apos;s DPDP compliance guardian for growing businesses.
              </h1>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                The Digital Personal Data Protection Act deadline is May 2027 — and fines can reach
                ₹250 crore. KavachAI monitors your WhatsApp, Gmail, and cloud storage in real-time,
                catching violations before they become costly penalties.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="bg-white text-[#0F2B5B] font-bold px-6 py-3 rounded-lg text-sm hover:bg-blue-50 transition-colors text-center"
                >
                  Start 14-day free trial
                </Link>
                <Link
                  href="#how-it-works"
                  className="border border-white/40 text-white font-semibold px-6 py-3 rounded-lg text-sm hover:bg-white/10 transition-colors text-center"
                >
                  See how it works
                </Link>
              </div>
              <p className="text-blue-200 text-xs mt-4">No credit card required. Setup in 5 minutes.</p>
            </div>

            {/* Score Badge Mock */}
            <div className="flex justify-center lg:justify-end">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-blue-200 font-medium">Compliance Score</span>
                  <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full">
                    Needs Attention
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10"
                      />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none" stroke="#34d399" strokeWidth="10"
                        strokeDasharray={`${78 * 2.64} 264`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-black text-white">78</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Acme Corp Ltd</p>
                    <p className="text-blue-200 text-sm">3 open incidents</p>
                    <p className="text-blue-200 text-sm">-22 pts deducted</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'PAN shared on WhatsApp', sev: 'Critical', color: 'bg-red-500' },
                    { label: 'Aadhaar in email body', sev: 'High', color: 'bg-orange-400' },
                    { label: 'Missing consent banner', sev: 'Medium', color: 'bg-yellow-400' },
                  ].map((inc) => (
                    <div key={inc.label} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', inc.color)} />
                      <span className="text-xs text-white flex-1 truncate">{inc.label}</span>
                      <span className="text-xs text-blue-200">{inc.sev}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 text-xs text-blue-200 text-center">
                  Last scanned: 2 minutes ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-gray-50 border-y border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-6 font-medium">
            Trusted by CA firms, clinics, and NBFCs across India
          </p>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            {[
              'Sharma & Associates',
              'MedCare Clinics',
              'NovaNBFC Ltd',
              'LexPartners LLP',
              'TalentEdge HR',
            ].map((name) => (
              <span
                key={name}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The cost of DPDP non-compliance is real
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Indian businesses face an unprecedented compliance challenge. Most SMBs have no
              affordable solution.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <DollarSign className="w-8 h-8 text-red-500" />,
                bg: 'bg-red-50',
                title: 'Fines up to ₹250 crore',
                desc: 'The DPDP Act allows the Data Protection Board to impose penalties of up to ₹250 crore per violation — even for SMBs. A single Aadhaar mishandling can trigger a complaint.',
              },
              {
                icon: <Clock className="w-8 h-8 text-orange-500" />,
                bg: 'bg-orange-50',
                title: '40+ hrs/month manual compliance',
                desc: 'Compliance officers at mid-size firms spend over 40 hours monthly reviewing communications, updating consent registers, and preparing audit reports — all manually.',
              },
              {
                icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
                bg: 'bg-yellow-50',
                title: 'No affordable tool for SMBs',
                desc: 'Enterprise compliance platforms cost ₹5–20 lakh/year and require dedicated IT teams. Until now, SMBs had no practical option for real-time DPDP monitoring.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-4', card.bg)}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How KavachAI works</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Three simple steps to turn compliance from a liability into a competitive advantage.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0F2B5B] flex items-center justify-center shadow-lg">
                    {step.icon}
                  </div>
                </div>
                <div className="text-4xl font-black text-gray-100 absolute top-0 right-8 select-none">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to stay compliant
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built specifically for Indian regulatory frameworks, KavachAI goes beyond generic
              compliance tools.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-[#1E6FD9]/30 transition-all"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              All plans include a 14-day free trial. No credit card required. Prices exclusive of
              18% GST.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'rounded-2xl border p-8 flex flex-col relative',
                  plan.highlight
                    ? 'bg-[#0F2B5B] border-[#0F2B5B] text-white shadow-2xl scale-105'
                    : 'bg-white border-gray-200 text-gray-900 hover:shadow-lg transition-shadow'
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E6FD9] text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <h3 className={cn('text-lg font-bold mb-1', plan.highlight ? 'text-white' : 'text-gray-900')}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className={cn('text-sm', plan.highlight ? 'text-blue-200' : 'text-gray-500')}>
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm">
                        <CheckCircle
                          className={cn(
                            'w-4 h-4 mt-0.5 flex-shrink-0',
                            plan.highlight ? 'text-green-400' : 'text-[#1E6FD9]'
                          )}
                        />
                        <span className={plan.highlight ? 'text-blue-100' : 'text-gray-600'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/register"
                  className={cn(
                    'mt-auto w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors',
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

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by compliance teams across India
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F2B5B] flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role} — {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-[#0F2B5B] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Start your 14-day free trial today
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            Join 200+ Indian businesses that use KavachAI to stay ahead of DPDP compliance.
            No credit card. Cancel anytime.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-[#0F2B5B] font-bold px-8 py-4 rounded-xl text-base hover:bg-blue-50 transition-colors shadow-lg"
          >
            Get started free — no credit card needed
          </Link>
          <p className="text-blue-300 text-sm mt-4">
            Have questions? Email us at{' '}
            <a href="mailto:hello@kavachai.in" className="underline">
              hello@kavachai.in
            </a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#1E6FD9] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">KavachAI</span>
              </div>
              <p className="text-sm leading-relaxed">
                Real-time DPDP compliance monitoring built for Indian businesses.
              </p>
              <p className="text-xs mt-3 text-gray-500">GSTIN: 27AABCK1234Z1ZQ</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Free Trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/dpa" className="hover:text-white transition-colors">Data Processing Agreement</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:hello@kavachai.in" className="hover:text-white transition-colors">hello@kavachai.in</a></li>
                <li><a href="tel:+918000000000" className="hover:text-white transition-colors">+91 80000 00000</a></li>
                <li className="text-xs text-gray-500">Registered: Mumbai, Maharashtra</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <p>© 2026 KavachAI Technologies Pvt Ltd. All rights reserved.</p>
            <p className="text-gray-500">Made in India 🇮🇳 for Indian businesses</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
