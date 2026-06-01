import Link from 'next/link'
import { Shield, Target, Heart, Users, Globe, Lock } from 'lucide-react'

const teamMembers = [
  {
    name: 'Arjun Kapoor',
    role: 'Co-founder & CEO',
    bio: 'Former DPO at a leading NBFC, Arjun spent 8 years navigating Indian financial regulations before founding KavachAI. He holds an LLB specialising in data privacy law from NLU Delhi.',
    initials: 'AK',
  },
  {
    name: 'Priya Rajan',
    role: 'Co-founder & CTO',
    bio: 'Priya led ML infrastructure at a Bengaluru unicorn before building the AI engine powering KavachAI. She holds a BTech from IIT Madras and an MS in ML from CMU.',
    initials: 'PR',
  },
  {
    name: 'Vikram Sinha',
    role: 'Head of Compliance',
    bio: 'A Chartered Accountant and Certified Information Systems Auditor, Vikram brings 12 years of SEBI and RBI compliance expertise from his time at a Big 4 advisory firm.',
    initials: 'VS',
  },
]

const values = [
  {
    icon: <Shield className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Privacy by design',
    desc: 'We build every feature with data minimisation and privacy-first principles. We never use your client data to train our models.',
  },
  {
    icon: <Target className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'India-first',
    desc: 'Built specifically for Indian regulatory frameworks, Indian languages, and Indian business workflows — not retrofitted from Western tools.',
  },
  {
    icon: <Heart className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'SMB affordability',
    desc: 'We believe every Indian business — not just large corporations — deserves affordable, enterprise-grade compliance protection.',
  },
  {
    icon: <Users className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Community-driven',
    desc: 'Our rulebook is updated with input from CA firms, lawyers, and compliance officers across India who form our advisory council.',
  },
  {
    icon: <Globe className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Radical transparency',
    desc: 'We publish our compliance methodology publicly. You always know exactly how your score is calculated and why incidents are flagged.',
  },
  {
    icon: <Lock className="w-6 h-6 text-[#1E6FD9]" />,
    title: 'Security first',
    desc: 'SOC 2 Type II certified, ISO 27001 compliant, and hosted on AWS Mumbai for complete Indian data residency.',
  },
]

const milestones = [
  { year: '2024', event: 'KavachAI founded in Mumbai. Seed round closed.' },
  { year: 'Q1 2025', event: 'Beta launched with 12 CA firms. First 100 incidents detected.' },
  { year: 'Q3 2025', event: 'WhatsApp Business integration launched. 500 organisations onboarded.' },
  { year: 'Q1 2026', event: 'Series A closed. ISO 27001 certification obtained.' },
  { year: 'Q2 2026', event: '1,000+ organisations monitoring compliance. Present milestone.' },
  { year: 'May 2027', event: 'DPDP Act full enforcement begins. We\'ll be ready for every client.' },
]

export default function AboutPage() {
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
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium">Pricing</Link>
              <Link href="/about" className="text-[#0F2B5B] text-sm font-semibold">About</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-700">Login</Link>
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

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F2B5B] to-[#1E6FD9] py-20 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-6">
            We built KavachAI so Indian businesses can grow without fear of compliance fines.
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Founded in 2024 in Mumbai, we are a team of compliance lawyers, engineers, and data
            privacy experts who believe DPDP compliance should be accessible to every Indian
            business — not just Fortune 500 companies.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our mission</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                India&apos;s Digital Personal Data Protection Act 2023 is the most significant
                privacy legislation since the IT Act 2000. When fully enforced in May 2027, it will
                fundamentally change how every Indian business handles personal data — with fines of
                up to ₹250 crore per violation for non-compliance.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Yet the compliance tools that exist today were designed for Western markets, cost
                lakhs of rupees annually, and require dedicated IT teams to operate. Small CA firms,
                clinics, NBFCs, and law firms — the backbone of India&apos;s economy — have no practical
                solution.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-[#0F2B5B]">KavachAI changes that.</strong> We built an
                AI-powered compliance guardian that monitors your business communications in
                real-time, explains every incident in plain language, and costs a fraction of what
                enterprise tools charge — starting at just ₹2,999 per month.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">KavachAI by the numbers</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { num: '1,000+', label: 'Organisations protected' },
                  { num: '₹12Cr+', label: 'Potential fines prevented' },
                  { num: '50,000+', label: 'Incidents detected' },
                  { num: '28', label: 'States & UTs covered' },
                  { num: '9', label: 'Regulatory frameworks' },
                  { num: '99.9%', label: 'Platform uptime SLA' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-black text-[#0F2B5B]">{stat.num}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why we built it */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Why we built KavachAI</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <p className="text-gray-700 leading-relaxed mb-4 text-lg italic border-l-4 border-[#1E6FD9] pl-4">
              &ldquo;My friend runs a mid-size CA firm in Pune. In 2024, a client complained that the
              firm had shared their PAN and Aadhaar details over WhatsApp without explicit consent.
              Under DPDP, that&apos;s a potential fine of crores. The firm had no monitoring, no
              audit trail, and no way to prove compliance. I decided to build the tool I wished
              existed.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-[#0F2B5B] flex items-center justify-center text-white font-bold">
                AK
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Arjun Kapoor</p>
                <p className="text-gray-500 text-xs">Co-founder & CEO, KavachAI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet the team</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Lawyers, engineers, and compliance experts united by a single mission: making DPDP
              compliance accessible to every Indian business.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0F2B5B] to-[#1E6FD9] flex items-center justify-center text-white text-2xl font-black mx-auto mb-4">
                  {member.initials}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-[#1E6FD9] text-sm font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  {v.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Our journey</h2>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#0F2B5B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 bg-gray-200 flex-1 mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <span className="text-sm font-bold text-[#1E6FD9]">{m.year}</span>
                  <p className="text-gray-700 mt-1">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investors / Backed By */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-6">Backed by</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Blume Ventures', 'Kalaari Capital', 'Surge (Sequoia)', 'Mumbai Angels'].map((inv) => (
              <span key={inv} className="bg-white border border-gray-200 rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm">
                {inv}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F2B5B] py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-white mb-4">Join 1,000+ compliant businesses</h2>
          <p className="text-blue-200 mb-8">Start your 14-day free trial. No credit card required.</p>
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
