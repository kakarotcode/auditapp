'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['Plan', 'Profile', 'Frameworks', 'Connect', 'Team']

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry',
  'Jammu & Kashmir','Ladakh',
]

const FRAMEWORKS = [
  { value: 'DPDP', label: 'DPDP Act 2023', desc: 'India\'s primary data protection law — applies to all organisations' },
  { value: 'IT_ACT', label: 'IT Act 2000', desc: 'Information Technology Act — cybersecurity and digital compliance' },
  { value: 'RBI', label: 'RBI Guidelines', desc: 'Reserve Bank of India — banks, NBFCs, payment companies' },
  { value: 'SEBI', label: 'SEBI Regulations', desc: 'Securities and Exchange Board — investment advisors, brokers' },
  { value: 'IRDAI', label: 'IRDAI Guidelines', desc: 'Insurance Regulatory Authority — insurance companies' },
  { value: 'NMC', label: 'NMC Code', desc: 'National Medical Commission — doctors, clinics, hospitals' },
  { value: 'BAR_COUNCIL', label: 'Bar Council Rules', desc: 'Bar Council of India — law firms and advocates' },
  { value: 'LABOUR_LAW', label: 'Labour Laws', desc: 'PF Act, POSH Act, Contract Labour Act — all employers' },
  { value: 'POCSO', label: 'POCSO Act', desc: 'Child protection data rules — edtech and children\'s platforms' },
]

const PLANS = [
  { name: 'STARTER', label: 'Starter', price: '₹2,999/mo', features: ['1 framework', '1 source', '15 users', 'Email alerts'] },
  { name: 'PROFESSIONAL', label: 'Professional', price: '₹6,999/mo', features: ['3 frameworks', 'All sources', '75 users', 'WhatsApp alerts'], popular: true },
  { name: 'GUARDIAN', label: 'Guardian', price: '₹12,999/mo', features: ['Unlimited frameworks', 'All sources', 'Unlimited users', 'Priority support'] },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const [data, setData] = useState({
    plan: 'PROFESSIONAL',
    gstin: '', state: '', size: 'MICRO',
    activeFrameworks: ['DPDP', 'IT_ACT'] as string[],
    inviteEmails: [''] as string[],
  })

  function toggleFramework(fw: string) {
    setData(p => ({
      ...p,
      activeFrameworks: p.activeFrameworks.includes(fw)
        ? p.activeFrameworks.filter(f => f !== fw)
        : [...p.activeFrameworks, fw],
    }))
  }

  async function complete() {
    setSaving(true)
    try {
      await fetch('/api/onboarding/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstin: data.gstin || undefined,
          state: data.state || undefined,
          size: data.size,
          activeFrameworks: data.activeFrameworks,
          plan: data.plan,
          onboardingDone: true,
        }),
      })
      setDone(true)
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <Shield className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">You&apos;re protected!</h1>
          <p className="text-gray-600">KavachAI is now monitoring your organisation for DPDP compliance violations in real time.</p>
          <Button className="bg-[#0F2B5B] hover:bg-[#1a3d7a] px-8" onClick={() => router.push('/dashboard')}>
            Go to Dashboard →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0F2B5B]">KavachAI</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your compliance guardian</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-[#0F2B5B] text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {i + 1 < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn('h-0.5 flex-1 mx-1', i + 1 < step ? 'bg-green-500' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Step 1: Plan */}
            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold">Choose your plan</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {PLANS.map(plan => (
                    <button
                      key={plan.name}
                      onClick={() => setData(p => ({ ...p, plan: plan.name }))}
                      className={cn('relative rounded-xl border p-4 text-left transition-all',
                        data.plan === plan.name ? 'border-[#0F2B5B] bg-[#0F2B5B]/5 ring-2 ring-[#0F2B5B]' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {plan.popular && <span className="absolute -top-2 right-3 bg-[#1E6FD9] text-white text-xs px-2 py-0.5 rounded-full">Popular</span>}
                      <p className="font-semibold text-gray-900">{plan.label}</p>
                      <p className="text-lg font-bold text-[#0F2B5B] mt-1">{plan.price}</p>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map(f => <li key={f} className="text-xs text-gray-500">✓ {f}</li>)}
                      </ul>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 text-center">14-day free trial. No credit card required.</p>
              </>
            )}

            {/* Step 2: Profile */}
            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold">Organisation profile</h2>
                <div className="space-y-4">
                  <div>
                    <Label>GSTIN (optional)</Label>
                    <Input className="font-mono" placeholder="27AABCK1234Z1ZQ" value={data.gstin} onChange={e => setData(p => ({ ...p, gstin: e.target.value }))} />
                    <p className="text-xs text-gray-400 mt-1">Required for GST-compliant invoices</p>
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={data.state} onValueChange={v => setData(p => ({ ...p, state: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Organisation Size</Label>
                    <Select value={data.size} onValueChange={v => setData(p => ({ ...p, size: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MICRO">Micro — 1 to 20 employees</SelectItem>
                        <SelectItem value="SMALL">Small — 21 to 75 employees</SelectItem>
                        <SelectItem value="MEDIUM">Medium — 76 to 200 employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Frameworks */}
            {step === 3 && (
              <>
                <h2 className="text-lg font-semibold">Compliance frameworks</h2>
                <p className="text-sm text-gray-500">Select all frameworks applicable to your organisation</p>
                <div className="space-y-2">
                  {FRAMEWORKS.map(fw => (
                    <button
                      key={fw.value}
                      onClick={() => fw.value !== 'DPDP' && fw.value !== 'IT_ACT' && toggleFramework(fw.value)}
                      className={cn('w-full rounded-lg border p-3 text-left transition-all',
                        data.activeFrameworks.includes(fw.value) ? 'border-[#0F2B5B] bg-[#0F2B5B]/5' : 'border-gray-200 hover:border-gray-300',
                        (fw.value === 'DPDP' || fw.value === 'IT_ACT') && 'cursor-not-allowed opacity-80'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{fw.label}</span>
                          {(fw.value === 'DPDP' || fw.value === 'IT_ACT') && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Required</span>}
                          <p className="text-xs text-gray-500 mt-0.5">{fw.desc}</p>
                        </div>
                        <div className={cn('h-5 w-5 rounded border-2 flex items-center justify-center shrink-0',
                          data.activeFrameworks.includes(fw.value) ? 'border-[#0F2B5B] bg-[#0F2B5B]' : 'border-gray-300'
                        )}>
                          {data.activeFrameworks.includes(fw.value) && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 4: Connect */}
            {step === 4 && (
              <>
                <h2 className="text-lg font-semibold">Connect a data source</h2>
                <p className="text-sm text-gray-500">Connect at least one source to start monitoring. You can add more later.</p>
                <div className="space-y-3">
                  {[
                    { name: 'WhatsApp Business', desc: 'Monitor WhatsApp messages for DPDP violations', icon: '💬' },
                    { name: 'Gmail / Google Workspace', desc: 'Monitor email for personal data sharing', icon: '📧' },
                    { name: 'Google Drive', desc: 'Scan documents for bulk personal data exposure', icon: '📁' },
                  ].map(src => (
                    <div key={src.name} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{src.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{src.name}</p>
                          <p className="text-xs text-gray-500">{src.desc}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast.info('Connect sources from the Data Sources page after setup')}>Connect</Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">You can connect all sources from the Data Sources page after completing setup.</p>
              </>
            )}

            {/* Step 5: Invite */}
            {step === 5 && (
              <>
                <h2 className="text-lg font-semibold">Invite your compliance team</h2>
                <p className="text-sm text-gray-500">Invite colleagues to help manage compliance. You can skip this step.</p>
                <div className="space-y-2">
                  {data.inviteEmails.map((email, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder={`colleague${i + 1}@company.com`}
                        value={email}
                        onChange={e => {
                          const emails = [...data.inviteEmails]
                          emails[i] = e.target.value
                          setData(p => ({ ...p, inviteEmails: emails }))
                        }}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setData(p => ({ ...p, inviteEmails: [...p.inviteEmails, ''] }))}>
                    + Add another
                  </Button>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(p => p - 1)}>← Back</Button>
              ) : <div />}
              {step < 5 ? (
                <Button className="bg-[#0F2B5B] hover:bg-[#1a3d7a]" onClick={() => setStep(p => p + 1)}>Continue →</Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={complete} disabled={saving}>Skip & Finish</Button>
                  <Button className="bg-[#0F2B5B] hover:bg-[#1a3d7a]" onClick={complete} disabled={saving}>
                    {saving ? 'Setting up…' : 'Complete Setup →'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
