'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { Mail, Shield, Building2, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const user = session?.user as
    | { name?: string; email?: string; role?: string; image?: string | null }
    | undefined

  const name = user?.name ?? 'User'
  const email = user?.email ?? '—'
  const role = (user?.role ?? 'STAFF').toString()
  const roleLabel = role.toLowerCase().replace(/_/g, ' ')

  const roleColor =
    role === 'OWNER'
      ? 'bg-purple-100 text-purple-700'
      : role === 'ADMIN'
        ? 'bg-blue-100 text-blue-700'
        : role === 'COMPLIANCE_OFFICER'
          ? 'bg-green-100 text-green-700'
          : role === 'AUDITOR'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-700'

  return (
    <div className="space-y-6">
      <PageHeader title="Your Profile" description="Your account details on KavachAI" />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-gray-100">
              {user?.image && <AvatarImage src={user.image} alt={name} />}
              <AvatarFallback className="bg-gradient-kavach text-white text-lg font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{name}</h2>
              <p className="text-sm text-gray-500 truncate">{email}</p>
              <Badge className={`mt-1.5 capitalize ${roleColor}`}>{roleLabel}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Detail icon={<User className="h-4 w-4" />} label="Full name" value={name} />
          <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
          <Detail icon={<Shield className="h-4 w-4" />} label="Role" value={roleLabel} capitalize />
          <Detail
            icon={<Building2 className="h-4 w-4" />}
            label="Organisation"
            value="Manage your organisation in Settings"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Need to update organisation info?</p>
            <p className="text-xs text-gray-500">Org name, GSTIN, team members and billing live in Settings.</p>
          </div>
          <Link href="/settings">
            <Button variant="outline">Go to Settings</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function Detail({
  icon,
  label,
  value,
  capitalize = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-400">{icon}</span>
        {label}
      </div>
      <span className={`text-sm font-medium text-gray-900 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  )
}
