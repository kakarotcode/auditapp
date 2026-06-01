'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertTriangle,
  Database,
  FileText,
  Settings,
  Shield,
  Users,
  BookOpen,
  X,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidents',        href: '/incidents',  icon: AlertTriangle   },
  { label: 'Data Sources',     href: '/sources',    icon: Database        },
  { label: 'Reports',          href: '/reports',    icon: FileText        },
  { label: 'Staff',            href: '/staff',      icon: Users           },
  { label: 'Compliance Rules', href: '/rulebook',   icon: BookOpen        },
  { label: 'Settings',         href: '/settings',   icon: Settings        },
]

interface SidebarProps {
  openIncidentsCount: number
  user?: { name: string; email: string; role: string; avatarUrl?: string | null }
  complianceScore?: number
  onMobileClose?: () => void
}

function ScoreRing({ score }: { score: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score))
  const dash = (pct / 100) * circ
  const color = pct >= 75 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171'

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease-out' }}
      />
      <text
        x="22" y="22"
        dominantBaseline="middle"
        textAnchor="middle"
        className="rotate-90"
        style={{ transform: 'rotate(90deg)', transformOrigin: '22px 22px', fill: color, fontSize: '10px', fontWeight: 700 }}
      >
        {score}
      </text>
    </svg>
  )
}

export function Sidebar({
  openIncidentsCount,
  user,
  complianceScore = 0,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-kavach-dark">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
        <Link href="/dashboard" onClick={onMobileClose} className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E6FD9] shadow-glow-blue-sm group-hover:scale-105 transition-transform duration-200">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-white tracking-tight">KavachAI</span>
            <p className="text-[9px] text-blue-400/70 font-semibold tracking-[0.2em] uppercase -mt-0.5">
              DPDP Compliance
            </p>
          </div>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Compliance score strip */}
      {complianceScore > 0 && (
        <div className="mx-4 mt-4 mb-1">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.07] px-3 py-2.5">
            <ScoreRing score={complianceScore} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-0.5">
                Compliance
              </p>
              <p className={cn(
                'text-sm font-bold',
                complianceScore >= 75 ? 'text-green-400' : complianceScore >= 50 ? 'text-amber-400' : 'text-red-400'
              )}>
                {complianceScore >= 75 ? 'Compliant' : complianceScore >= 50 ? 'Needs Review' : 'At Risk'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section label */}
      <p className="px-5 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
        Navigation
      </p>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto sidebar-scroll scrollbar-none">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          const badgeCount = item.href === '/incidents' ? openIncidentsCount : undefined

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'nav-item',
                isActive
                  ? 'nav-item-active text-blue-200'
                  : 'text-white/45 hover:text-white/90'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors duration-150',
                  isActive ? 'text-blue-300' : 'text-white/35 group-hover:text-white/70'
                )}
              />
              <span className="flex-1 truncate text-[13px]">{item.label}</span>
              {badgeCount !== undefined && badgeCount > 0 && (
                <span className="relative flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
                  <span className="relative">{badgeCount > 99 ? '99+' : badgeCount}</span>
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.06] p-4">
        {user ? (
          <Link href="/settings" className="flex items-center gap-3 group rounded-xl px-2 py-2 hover:bg-white/[0.05] transition-colors">
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/10">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-[#1E6FD9] text-white text-xs font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-white/35 truncate capitalize">
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <Settings className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
          </Link>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 rounded-full bg-white/10 animate-pulse w-20" />
              <div className="h-2 rounded-full bg-white/5 animate-pulse w-14" />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <aside className="flex h-full w-full flex-col">
      {sidebarContent}
    </aside>
  )
}
