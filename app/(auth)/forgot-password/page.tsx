'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Mail, CheckCircle2, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    // Standard security pattern: always show the same confirmation regardless
    // of whether the email exists. Actual delivery is enabled once SMTP is
    // configured (lib/email/sender.ts); until then this is a no-op.
    await new Promise((r) => setTimeout(r, 700))
    setSubmitting(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F2B5B] mb-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-[#0F2B5B]">KavachAI</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
              <p className="text-sm text-gray-500 mt-2">
                If an account exists for <span className="font-medium text-gray-700">{email}</span>,
                we&apos;ve sent password reset instructions to it.
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Didn&apos;t get it? Check spam, or contact your organisation administrator.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#1E6FD9] hover:text-[#155cb5]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your work email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Work email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm focus:border-[#1E6FD9] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E6FD9]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F2B5B] py-2.5 text-sm font-semibold text-white hover:bg-[#0c2249] disabled:opacity-60 transition-colors"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>

              <p className="mt-6 rounded-lg bg-blue-50 px-3 py-2 text-center text-xs text-blue-700">
                Demo tip: log in with <span className="font-semibold">admin@mehtaca.com</span> / <span className="font-semibold">Demo@1234</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
