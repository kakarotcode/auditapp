'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SourceStatusBadge } from './SourceStatusBadge'
import { OAuthConnectButton } from './OAuthConnectButton'
import { toast } from 'sonner'
import { MessageSquare, Mail, FolderOpen, RefreshCw, Trash2, AlertCircle, Lock } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface DataSource {
  id: string
  type: string
  status: string
  displayName: string
  messagesScanned: number
  lastScannedAt: string | null
  errorMessage: string | null
}

interface Props {
  sourceType: string
  connectedSource?: DataSource
  onUpdate?: () => void
  locked?: boolean
}

const CHANNEL_META: Record<string, {
  icon: React.ReactNode
  label: string
  guide: string[]
}> = {
  WHATSAPP: {
    icon: <MessageSquare className="h-5 w-5 text-green-600" />,
    label: 'WhatsApp Business',
    guide: [
      'Go to Meta Business Manager → WhatsApp → API Setup',
      'Copy your Phone Number ID and API access token',
      'Set webhook URL to: https://yourdomain.com/api/webhooks/whatsapp',
      'Subscribe to messages and message_deliveries events',
      'Paste the verify token from your KavachAI settings',
    ],
  },
  GMAIL: {
    icon: <Mail className="h-5 w-5 text-red-500" />,
    label: 'Gmail / Google Workspace',
    guide: [
      'Click Connect to authorise via Google OAuth',
      'Grant the requested Gmail read-only permissions',
      'KavachAI will scan incoming emails in real time via push notifications',
      'No email content is stored — only entity type classifications',
    ],
  },
  OUTLOOK: {
    icon: <Mail className="h-5 w-5 text-blue-600" />,
    label: 'Microsoft Outlook',
    guide: [
      'Click Connect to authorise via Microsoft OAuth',
      'Grant Mail.Read permissions for your organisation',
      'KavachAI uses Microsoft Graph webhook subscriptions',
      'Subscriptions auto-renew every hour',
    ],
  },
  GOOGLE_DRIVE: {
    icon: <FolderOpen className="h-5 w-5 text-yellow-500" />,
    label: 'Google Drive',
    guide: [
      'Click Connect to authorise via Google OAuth',
      'Grant Drive read-only permissions',
      'KavachAI scans new and modified documents for bulk PII exposure',
      'Supports Google Docs, Sheets, and uploaded files',
    ],
  },
  ONEDRIVE: {
    icon: <FolderOpen className="h-5 w-5 text-blue-500" />,
    label: 'OneDrive / SharePoint',
    guide: [
      'Click Connect to authorise via Microsoft OAuth',
      'Grant Files.Read.All permissions',
      'New files and edits trigger automatic scans',
      'Encrypted content references are stored in S3',
    ],
  },
}

export function ConnectSourceCard({ sourceType, connectedSource, onUpdate, locked = false }: Props) {
  const qc = useQueryClient()
  const meta = CHANNEL_META[sourceType] ?? {
    icon: <FolderOpen className="h-5 w-5 text-gray-400" />,
    label: sourceType,
    guide: [],
  }

  const disconnectMutation = useMutation({
    mutationFn: () => fetch(`/api/sources/${connectedSource!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Source disconnected')
      qc.invalidateQueries({ queryKey: ['sources'] })
      onUpdate?.()
    },
    onError: () => toast.error('Failed to disconnect'),
  })

  const syncMutation = useMutation({
    mutationFn: () => fetch(`/api/sources/${connectedSource!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' }),
    }),
    onSuccess: () => {
      toast.success('Sync triggered')
      qc.invalidateQueries({ queryKey: ['sources'] })
      onUpdate?.()
    },
    onError: () => toast.error('Failed to sync'),
  })

  const isConnected = !!connectedSource && connectedSource.status !== 'REVOKED'
  const status = connectedSource?.status ?? 'DISCONNECTED'

  return (
    <Card className={`overflow-hidden ${locked ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
              {locked ? <Lock className="h-5 w-5 text-gray-400" /> : meta.icon}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{meta.label}</p>
              {connectedSource?.lastScannedAt && (
                <p className="text-xs text-gray-400">Last sync {timeAgo(connectedSource.lastScannedAt)}</p>
              )}
              {!connectedSource && (
                <p className="text-xs text-gray-400">Not connected</p>
              )}
            </div>
          </div>
          <SourceStatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats — only shown when connected */}
        {connectedSource && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {connectedSource.messagesScanned.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Messages scanned</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-[#0F2B5B] tabular-nums">
                {status === 'ACTIVE' ? '✓' : '—'}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">{status === 'ACTIVE' ? 'Monitoring' : 'Inactive'}</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {connectedSource?.errorMessage && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{connectedSource.errorMessage}</p>
          </div>
        )}

        {/* Locked — plan upgrade required */}
        {locked ? (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Upgrade your plan to connect this source</p>
          </div>
        ) : (
          /* Actions */
          <div className="flex flex-wrap gap-2">
            {!isConnected ? (
              <OAuthConnectButton
                channel={sourceType}
                orgId=""
                onConnected={() => {
                  qc.invalidateQueries({ queryKey: ['sources'] })
                  onUpdate?.()
                }}
              />
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Disconnect
                </Button>
              </>
            )}
          </div>
        )}

        {/* Setup guide */}
        {meta.guide.length > 0 && !locked && (
          <Accordion type="single" collapsible>
            <AccordionItem value="guide" className="border-0">
              <AccordionTrigger className="text-xs text-gray-500 hover:text-gray-700 py-2">
                Setup guide
              </AccordionTrigger>
              <AccordionContent>
                <ol className="space-y-1.5 list-decimal list-inside">
                  {meta.guide.map((step, i) => (
                    <li key={i} className="text-xs text-gray-600">{step}</li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
