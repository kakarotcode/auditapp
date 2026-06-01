'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { IncidentDetail } from '@/components/incidents/IncidentDetail'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetch(`/api/incidents/${id}`).then(r => r.json()),
    enabled: !!id,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/incidents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Incidents
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        </div>
      ) : error || !data?.id ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600 font-medium">Incident not found</p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/incidents">Return to incidents</Link>
          </Button>
        </div>
      ) : (
        <IncidentDetail incident={data} onUpdate={refetch} />
      )}
    </div>
  )
}
