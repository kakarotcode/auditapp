import Link from 'next/link'
import { Shield } from 'lucide-react'

interface LegalSection {
  heading: string
  body: string[]
}

interface LegalPageLayoutProps {
  title: string
  subtitle: string
  lastUpdated: string
  sections: LegalSection[]
}

/**
 * Shared shell for KavachAI legal / policy pages (Privacy, Terms, DPA,
 * Security). Renders the marketing nav, a hero header, the policy body and
 * the standard footer so every legal route looks consistent.
 */
export function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  sections,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F2B5B]">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#0F2B5B]">KavachAI</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#features" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium">Pricing</Link>
              <Link href="/about" className="text-gray-600 hover:text-[#0F2B5B] text-sm font-medium">About</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#0F2B5B]">Login</Link>
              <Link href="/register" className="rounded-lg bg-[#0F2B5B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c2249] transition-colors">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-b from-[#0F2B5B] to-[#15356b] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-blue-100/90 text-base sm:text-lg">{subtitle}</p>
          <p className="mt-4 text-xs uppercase tracking-wider text-blue-200/70">
            Last updated: {lastUpdated}
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-[#0F2B5B] mb-3">
                {i + 1}. {section.heading}
              </h2>
              <div className="space-y-3">
                {section.body.map((para, j) => (
                  <p key={j} className="text-[15px] leading-relaxed text-gray-700">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            This document is provided as a template for KavachAI and should be
            reviewed by qualified legal counsel before being relied upon. For
            questions, contact{' '}
            <a href="mailto:legal@kavachai.in" className="font-semibold underline">
              legal@kavachai.in
            </a>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E6FD9]">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">KavachAI</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/dpa" className="hover:text-white transition-colors">Data Processing Agreement</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} KavachAI Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
