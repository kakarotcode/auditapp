'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import io from 'socket.io-client'
import { Shield } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openIncidentsCount, setOpenIncidentsCount] = useState(0)

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(r => r.json()),
    enabled: !!session,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (stats?.openIncidents?.total != null) setOpenIncidentsCount(stats.openIncidents.total)
  }, [stats])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    if (!socketUrl) return

    const socket = io(socketUrl, {
      auth: { orgId: (session.user as { orgId?: string })?.orgId },
    })

    socket.on('new_incident', (data: { incident: { severity: string; ruleName: string } }) => {
      const { severity, ruleName } = data.incident
      const severityEmoji = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '⚪' }[severity] ?? '⚪'
      toast.error(`${severityEmoji} ${severity}: ${ruleName}`, {
        description: 'New compliance incident detected',
        duration: 6000,
      })
      setOpenIncidentsCount(prev => prev + 1)
    })

    socket.on('score_updated', (data: { newScore: number }) => {
      toast.info(`Compliance score updated: ${data.newScore}`)
    })

    return () => { socket.disconnect() }
  }, [session])

  const handleSignOut = () => signOut({ callbackUrl: '/login' })

  /* ── Polished loading screen ── */
  if (status === 'loading') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-kavach-dark">
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E6FD9]" style={{ boxShadow: '0 0 32px rgba(30,111,217,0.5)' }}>
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -inset-3 rounded-2xl border border-[#1E6FD9]/25 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-white tracking-wide">KavachAI</p>
            <p className="text-xs text-blue-300/50">Loading your dashboard…</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-blue-400/40 animate-bounce"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const user = session?.user ? {
    name: (session.user as { name?: string }).name ?? 'User',
    email: (session.user as { email?: string }).email ?? '',
    role: (session.user as { role?: string }).role ?? 'MEMBER',
    avatarUrl: (session.user as { image?: string }).image ?? null,
  } : undefined

  return (
    <div className="flex h-screen overflow-hidden bg-mesh">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-[260px] transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          openIncidentsCount={openIncidentsCount}
          user={user}
          complianceScore={stats?.complianceScore}
          onMobileClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          onMobileMenuClick={() => setSidebarOpen((open) => !open)}
          user={user}
          onSignOut={handleSignOut}
          notifications={stats?.notifications ?? []}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6 scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  )
}
