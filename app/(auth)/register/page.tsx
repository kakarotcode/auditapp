'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

const step1Schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

const step2Schema = z.object({
  orgName: z.string().min(2, 'Organisation name required'),
  vertical: z.enum(['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL']),
  city: z.string().optional(),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>

const VERTICALS = [
  { value: 'CA_FIRM', label: 'CA / Accounting Firm' },
  { value: 'HEALTHCARE', label: 'Healthcare / Clinic / Hospital' },
  { value: 'FINANCIAL', label: 'Financial Services / NBFC / Bank' },
  { value: 'LEGAL', label: 'Law Firm / Legal Services' },
  { value: 'EDTECH', label: 'EdTech / Education Platform' },
  { value: 'HR_TECH', label: 'HR Tech / Staffing' },
  { value: 'GENERAL', label: 'Other / General Business' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1 | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) })

  async function onStep1(data: Step1) {
    setStep1Data(data)
    setStep(2)
  }

  async function onStep2(data: Step2) {
    if (!step1Data) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...step1Data, ...data }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) { toast.error(json.error ?? 'Registration failed'); return }

      await signIn('credentials', { email: step1Data.email, password: step1Data.password, redirect: false })
      router.push('/onboarding')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0F2B5B]">KavachAI</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(n => (
            <div key={n} className={`flex-1 h-1.5 rounded-full transition-colors ${n <= step ? 'bg-[#0F2B5B]' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-8">
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Your details</h2>

              <div>
                <Label>Full Name</Label>
                <Input {...form1.register('name')} placeholder="Rajesh Sharma" />
                {form1.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form1.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input {...form1.register('email')} type="email" placeholder="rajesh@company.com" />
                {form1.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form1.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input {...form1.register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form1.formState.errors.password && <p className="text-xs text-red-500 mt-1">{form1.formState.errors.password.message}</p>}
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input {...form1.register('confirmPassword')} type="password" placeholder="Repeat password" />
                {form1.formState.errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{form1.formState.errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-[#0F2B5B] hover:bg-[#1a3d7a]">Continue →</Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
                <h2 className="text-lg font-semibold text-gray-900">Your organisation</h2>
              </div>

              <div>
                <Label>Organisation Name</Label>
                <Input {...form2.register('orgName')} placeholder="Mehta & Associates" />
                {form2.formState.errors.orgName && <p className="text-xs text-red-500 mt-1">{form2.formState.errors.orgName.message}</p>}
              </div>
              <div>
                <Label>Industry / Vertical</Label>
                <Select onValueChange={v => form2.setValue('vertical', v as Step2['vertical'])}>
                  <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent>
                    {VERTICALS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form2.formState.errors.vertical && <p className="text-xs text-red-500 mt-1">{form2.formState.errors.vertical.message}</p>}
              </div>
              <div>
                <Label>City (optional)</Label>
                <Input {...form2.register('city')} placeholder="Mumbai" />
              </div>

              <Button type="submit" className="w-full bg-[#0F2B5B] hover:bg-[#1a3d7a]" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1E6FD9] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
