'use client'

import { useQuery } from '@tanstack/react-query'
import { ConnectSourceCard } from '@/components/sources/ConnectSourceCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

const SOURCE_TYPES = ['WHATSAPP', 'GMAIL', 'OUTLOOK', 'GOOGLE_DRIVE', 'ONEDRIVE'] as const
type SourceType = typeof SOURCE_TYPES[number]

interface DataSource {
  id: string; type: SourceType; status: string; displayName: string
  messagesScanned: number; lastScannedAt: string | null; errorMessage: string | null
}

export default function SourcesPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sources'],
    queryFn: () => fetch('/api/sources').then(r => r.json()),
  })

  const sources: DataSource[] = data?.sources ?? []

  const getConnectedSource = (type: SourceType) =>
    sources.find(s => s.type === type)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description="Connect your communication channels for real-time compliance monitoring"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SOURCE_TYPES.map(type => (
            <ConnectSourceCard
              key={type}
              sourceType={type}
              connectedSource={getConnectedSource(type)}
              onUpdate={refetch}
            />
          ))}
        </div>
      )}
    </div>
  )
}
