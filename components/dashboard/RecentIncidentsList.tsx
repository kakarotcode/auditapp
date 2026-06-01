'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, Mail, HardDrive, ExternalLink } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RecentIncident {
  id: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ruleName: string
  ruleCode: string
  channel: string
  occurredAt: string
  status: string
}

interface RecentIncidentsListProps {
  initialIncidents: RecentIncident[]
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200',
    label: 'Critical',
  },
  HIGH: {
    dot: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'High',
  },
  MEDIUM: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'Medium',
  },
  LOW: {
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    label: 'Low',
  },
}

const STATUS_CONFIG: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  INVESTIGATING: 'bg-purple-50 text-purple-700',
  RESOLVED: 'bg-green-50 text-green-700',
  FALSE_POSITIVE: 'bg-gray-50 text-gray-600',
  ESCALATED: 'bg-red-50 text-red-700',
}

function ChannelInfo({ channel }: { channel: string }) {
  const ch = channel.toUpperCase()
  if (ch === 'WHATSAPP') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <MessageCircle className="h-3 w-3 text-green-500" />
        WhatsApp
      </span>
    )
  }
  if (ch === 'GMAIL') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Mail className="h-3 w-3 text-red-500" />
        Gmail
      </span>
    )
  }
  if (ch === 'OUTLOOK') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Mail className="h-3 w-3 text-blue-500" />
        Outlook
      </span>
    )
  }
  if (ch === 'DRIVE' || ch === 'GOOGLE_DRIVE') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <HardDrive className="h-3 w-3 text-yellow-500" />
        Drive
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <ExternalLink className="h-3 w-3 text-gray-400" />
      {channel}
    </span>
  )
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export function RecentIncidentsList({ initialIncidents }: RecentIncidentsListProps) {
  const recent = initialIncidents.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Incidents</CardTitle>
          <span className="text-xs text-gray-400">{initialIncidents.length} total</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center px-4">
            <p className="text-sm text-gray-400">No incidents to display</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-50"
          >
            {recent.map((incident) => {
              const severity =
                SEVERITY_CONFIG[incident.severity] ?? SEVERITY_CONFIG.LOW
              const statusClass =
                STATUS_CONFIG[incident.status] ?? STATUS_CONFIG.OPEN
              return (
                <motion.div key={incident.id} variants={itemVariants}>
                  <Link
                    href={`/incidents/${incident.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Severity dot */}
                    <div
                      className={cn(
                        'h-2.5 w-2.5 shrink-0 rounded-full',
                        severity.dot
                      )}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#1E6FD9] transition-colors">
                          {incident.ruleName}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            severity.badge
                          )}
                        >
                          {severity.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-mono">
                          {incident.ruleCode}
                        </span>
                        <span className="text-gray-200">·</span>
                        <ChannelInfo channel={incident.channel} />
                        <span className="text-gray-200">·</span>
                        <span className="text-[11px] text-gray-400">
                          {timeAgo(incident.occurredAt)}
                        </span>
                      </div>
                    </div>

                    {/* Status chip */}
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                        statusClass
                      )}
                    >
                      {incident.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        <div className="border-t border-gray-100 px-4 py-3">
          <Link
            href="/incidents"
            className="text-xs font-medium text-[#1E6FD9] hover:text-[#1558B0] transition-colors"
          >
            View all incidents &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
