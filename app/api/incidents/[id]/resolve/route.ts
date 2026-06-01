import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const resolveSchema = z.object({
  resolution: z.string().min(1, 'Resolution is required'),
  resolutionNote: z.string().min(1, 'Resolution note is required'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = resolveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await db.incident.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Incident not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    if (existing.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Incident is already resolved', code: 'ALREADY_RESOLVED' },
        { status: 409 }
      )
    }

    const now = new Date()
    const { resolution, resolutionNote } = parsed.data

    const updated = await db.incident.update({
      where: { id: params.id },
      data: {
        status: 'RESOLVED',
        resolvedById: session.user.id,
        resolvedAt: now,
        resolution,
        resolutionNote,
        timeline: {
          create: {
            type: 'RESOLVED',
            description: `Incident resolved by ${session.user.name ?? session.user.email ?? 'user'}`,
            userId: session.user.id,
            metadata: { resolution, resolutionNote },
          },
        },
      },
      include: {
        staffMember: true,
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        resolvedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    })

    // Trigger health score recalculation asynchronously
    // We do a fire-and-forget queue enqueue — errors here shouldn't fail the response
    try {
      const { healthScoreQueue } = await import('@/lib/queue')
      await healthScoreQueue.add('recalculate-score', {
        orgId: session.user.orgId,
        reason: `incident-resolved:${params.id}`,
      })
    } catch (queueError) {
      console.warn('[incidents/resolve] Queue not available, skipping score recalculation:', queueError)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[incidents/[id]/resolve POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
