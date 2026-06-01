'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  BellOff,
  Clock,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
  title?: string
  onMobileMenuClick?: () => void
  notifications?: NotificationItem[]
  user?: {
    name: string
    email: string
    role: string
    avatarUrl?: string | null
  }
  onSignOut?: () => void
}

interface NotificationItem {
  id: string
  title: string
  description: string
  read: boolean
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function Topbar({
  title,
  onMobileMenuClick,
  notifications = [],
  user,
  onSignOut,
}: TopbarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowNotifications(false)
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/incidents?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="header-glass sticky top-0 z-20 flex h-14 items-center gap-3 px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuClick}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="hidden lg:block text-base font-semibold text-gray-900 truncate mr-2">
          {title}
        </h1>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xs ml-auto lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search incidents…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full rounded-lg border py-2 pl-8 pr-14 text-sm transition-all duration-150 placeholder:text-gray-400',
              searchFocused
                ? 'border-[#1E6FD9] bg-white ring-2 ring-[#1E6FD9]/15 outline-none'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            )}
          />
          <kbd className={cn(
            'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity duration-150',
            searchFocused ? 'opacity-0' : 'opacity-60',
            'border border-gray-200 bg-white text-gray-500'
          )}>
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              showNotifications
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            )}
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="notification-dot absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-70" />
              </span>
            )}
          </button>

          {/* Notifications panel */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 z-30 animate-scale-in">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-kavach-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#1E6FD9]">
                      {unreadCount} new
                    </span>
                  ) : null}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50/80">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                        <BellOff className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">All caught up</p>
                      <p className="text-xs text-gray-400 mt-0.5">No new notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 hover:bg-gray-50/80 cursor-pointer transition-colors',
                          !n.read && 'bg-blue-50/40'
                        )}
                      >
                        <div className={cn(
                          'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                          n.read ? 'bg-transparent' : 'bg-[#1E6FD9]'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 line-clamp-1">{n.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.description}</p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(n.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="border-t border-gray-50 px-4 py-2.5">
                    <button
                      onClick={() => { setShowNotifications(false); router.push('/settings/notifications') }}
                      className="w-full text-center text-xs font-semibold text-[#1E6FD9] hover:text-[#155cb5] transition-colors py-0.5"
                    >
                      View all notifications →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 mx-0.5" />

        {/* User menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9]">
                <Avatar className="h-7 w-7 ring-1 ring-gray-200">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                  <AvatarFallback className="bg-gradient-kavach text-white text-[10px] font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-gray-800 leading-none">{user.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                </div>
                <ChevronDown className="hidden md:block h-3.5 w-3.5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-kavach-lg border-gray-100">
              <DropdownMenuLabel className="pb-2">
                <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                <p className="text-xs text-gray-400 font-normal mt-0.5 truncate">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="rounded-lg text-sm">
                <User className="h-3.5 w-3.5 mr-2 text-gray-400" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg text-sm">
                <Settings className="h-3.5 w-3.5 mr-2 text-gray-400" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem
                onClick={onSignOut}
                className="rounded-lg text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-7 w-7 rounded-full bg-gray-100 animate-pulse" />
          </div>
        )}
      </div>
    </header>
  )
}
