'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings as SettingsIcon, CreditCard, Users, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'General', href: '/settings', icon: SettingsIcon },
  { label: 'Team', href: '/settings/team', icon: Users },
  { label: 'Billing', href: '/settings/billing', icon: CreditCard },
  { label: 'Notifications', href: '/settings/notifications', icon: Bell },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      {/* Settings sub-navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Settings sections">
          {tabs.map((tab) => {
            // Exact match for /settings (General); prefix match for the rest so
            // it stays highlighted on nested routes.
            const isActive =
              tab.href === '/settings'
                ? pathname === '/settings'
                : pathname.startsWith(tab.href)
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-[#1E6FD9] text-[#0F2B5B]'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
