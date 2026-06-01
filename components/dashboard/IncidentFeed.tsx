'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Mail, HardDrive, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn, timeAgo } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LiveIndicator } from '@/components/shared/LiveIndicator'

export interface IncidentSummary {
  id: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ruleName: string
  ruleCode: string
  channel: string
  occurredAt: string
  status: string
}

interface IncidentFeedProps {
  initialIncidents: IncidentSummary[]
}

const SEVERITY_CONFIG = {
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  MEDIUM: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-600 border-gray-200' },
} as const

function ChannelIcon({ channel }: { channel: string }) {
  const ch = channel.toUpperCase()
  if (ch === 'WHATSAPP') {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
        <MessageCircle className="h-3.5 w-3.5 text-green-600" />
      </div>
    )
  }
  if (ch === 'GMAIL') {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
        <Mail className="h-3.5 w-3.5 text-red-600" />
      </div>
    )
  }
  if (ch === 'OUTLOOK') {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
        <Mail className="h-3.5 w-3.5 text-blue-600" />
      </div>
    )
  }
  if (ch === 'DRIVE' || ch === 'GOOGLE_DRIVE') {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100">
        <HardDrive className="h-3.5 w-3.5 text-yellow-600" />
      </div>
    )
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
      <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
    </div>
  )
}

export function IncidentFeed({ initialIncidents }: IncidentFeedProps) {
  const [incidents, setIncidents] = useState<IncidentSummary[]>(
    initialIncidents.slice(0, 5)
  )
  const [hasNew, setHasNew] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Connect to socket for live updates
    let socket: ReturnType<typeof import('socket.io-client').io> | null = null

    const connectSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        socket = io({ path: '/api/socket' })

        socket.on('connect', () => {
          setConnected(true)
        })

        socket.on('disconnect', () => {
          setConnected(false)
        })

        socket.on('incident:new', (incident: IncidentSummary) => {
          setHasNew(true)
          setIncidents((prev) => [incident, ...prev].slice(0, 5))
          // Clear the "new" indicator after 3 seconds
          setTimeout(() => setHasNew(false), 3000)
        })
      } catch {
        // Socket not available, gracefully degrade
      }
    }

    connectSocket()

    return () => {
      socket?.disconnect()
    }
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Incident Feed</CardTitle>
          <div className="flex items-center gap-2">
            {hasNew && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"
              >
                New!
              </motion.span>
            )}
            <LiveIndicator connected={connected} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          <AnimatePresence initial={false}>
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center px-4">
                <p className="text-sm text-gray-400">No incidents yet</p>
              </div>
            ) : (
              incidents.map((incident, index) => {
                const severity = SEVERITY_CONFIG[incident.severity] ?? SEVERITY_CONFIG.LOW
                return (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, delay: index === 0 ? 0 : 0 }}
                    className="overflow-hidden"
                  >
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <ChannelIcon channel={incident.channel} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {incident.ruleName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {incident.ruleCode} &middot;{' '}
                          {timeAgo(incident.occurredAt)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          severity.className
                        )}
                      >
                        {severity.label}
                      </span>
                    </Link>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
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
