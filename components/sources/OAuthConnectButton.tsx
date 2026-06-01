'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ExternalLink, Loader2 } from 'lucide-react'

interface Props {
  channel: string
  orgId: string
  onConnected?: () => void
}

const OAUTH_URLS: Record<string, string> = {
  GMAIL: '/api/oauth/google?scope=gmail',
  GOOGLE_DRIVE: '/api/oauth/google?scope=drive',
  OUTLOOK: '/api/oauth/microsoft?scope=outlook',
  ONEDRIVE: '/api/oauth/microsoft?scope=onedrive',
}

export function OAuthConnectButton({ channel, orgId, onConnected }: Props) {
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    const url = OAUTH_URLS[channel]
    if (!url) {
      toast.info('Connect WhatsApp from the WhatsApp Business Manager')
      return
    }
    setLoading(true)
    const popup = window.open(
      `${url}&org=${orgId}`,
      'oauth_connect',
      'width=600,height=700,scrollbars=yes',
    )
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer)
        setLoading(false)
        onConnected?.()
      }
    }, 500)
  }

  return (
    <Button
      size="sm"
      className="bg-[#0F2B5B] hover:bg-[#1a3d7a] text-white"
      onClick={handleConnect}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ExternalLink className="h-4 w-4 mr-1.5" />}
      Connect
    </Button>
  )
}
