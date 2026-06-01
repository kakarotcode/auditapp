'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { CheckCircle, Crown } from 'lucide-react'
import { formatINR, formatDate } from '@/lib/utils'

const PLANS = [
  { name: 'STARTER', label: 'Starter', price: 299900, features: ['1 compliance framework', '1 data source', 'Up to 15 users', 'Email alerts', 'Basic reports'] },
  { name: 'PROFESSIONAL', label: 'Professional', price: 699900, features: ['3 frameworks', 'All data sources', 'Up to 75 users', 'WhatsApp + email alerts', 'Full PDF reports'], popular: true },
  { name: 'GUARDIAN', label: 'Guardian', price: 1299900, features: ['Unlimited frameworks', 'All data sources', 'Unlimited users', 'Priority support', 'Custom rulebooks'] },
]

interface BillingData {
  plan: string; planStatus: string; subscriptionId: string | null
  nextBillingAmount: number
  usage: { sources: number; users: number; incidentsThisMonth: number }
  invoices: Array<{ id: string; invoiceNumber: string; totalAmount: number; status: string; createdAt: string; paidAt: string | null; billingPeriod: string }>
}

export default function BillingPage() {
  const { data, isLoading } = useQuery<{ plan: string; planStatus: string; subscriptionId: string | null; nextBillingAmount: number; usage: { sources: number; users: number; incidentsThisMonth: number }; invoices: BillingData['invoices'] }>({
    queryKey: ['billing'],
    queryFn: () => fetch('/api/billing/portal').then(r => r.json()),
  })

  async function subscribe(planName: string) {
    try {
      const res = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName }),
      })
      const json = await res.json() as { subscriptionId?: string; keyId?: string }
      if (!json.subscriptionId) { toast.error('Failed to create subscription'); return }

      const Razorpay = (window as Window & { Razorpay?: new (opts: object) => { open: () => void } }).Razorpay
      if (!Razorpay) { toast.error('Razorpay not loaded. Add <script src="https://checkout.razorpay.com/v1/checkout.js"> to your page.'); return }

      const rzp = new Razorpay({
        key: json.keyId,
        subscription_id: json.subscriptionId,
        name: 'KavachAI',
        description: `${planName} Plan Subscription`,
        handler: () => { toast.success('Subscription activated!'); window.location.reload() },
      })
      rzp.open()
    } catch {
      toast.error('Failed to initiate payment')
    }
  }

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  )

  const currentPlan = data?.plan ?? 'STARTER'
  const status = data?.planStatus ?? 'TRIAL'

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Subscription" description="Manage your KavachAI plan" />

      {/* Current plan */}
      <Card className="border-[#0F2B5B]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#0F2B5B]" />
              Current Plan: {currentPlan}
            </CardTitle>
            <Badge className={status === 'ACTIVE' ? 'bg-green-100 text-green-700' : status === 'TRIAL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{data?.usage.sources ?? 0}</p>
              <p className="text-xs text-gray-500">Sources connected</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{data?.usage.users ?? 0}</p>
              <p className="text-xs text-gray-500">Active users</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{data?.usage.incidentsThisMonth ?? 0}</p>
              <p className="text-xs text-gray-500">Incidents this month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map(plan => (
          <Card key={plan.name} className={plan.popular ? 'border-[#1E6FD9] shadow-md relative' : ''}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E6FD9] text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-base">{plan.label}</CardTitle>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(plan.price / 100)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {currentPlan === plan.name ? (
                <Button variant="outline" className="w-full" disabled>Current Plan</Button>
              ) : (
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} onClick={() => subscribe(plan.name)}>
                  {plan.price > (PLANS.find(p => p.name === currentPlan)?.price ?? 0) ? 'Upgrade' : 'Downgrade'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice history */}
      {(data?.invoices?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inv.billingPeriod}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatINR(inv.totalAmount / 100)}</td>
                    <td className="px-4 py-3">
                      <Badge className={inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
