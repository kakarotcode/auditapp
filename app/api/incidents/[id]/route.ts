import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { type UserRole, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

const patchIncidentSchema = z.object({
  status: z
    .enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE', 'ESCALATED'])
    .optional(),
  assignedToId: z.string().nullable().optional(),
  resolutionNote: z.string().optional(),
  resolution: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const incident = await db.incident.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
      include: {
        staffMember: true,
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        resolvedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        source: { select: { id: true, type: true, displayName: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error('[incidents/[id] GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = patchIncidentSchema.safeParse(body)
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

    const data = parsed.data
    const timelineEvents: Array<{ type: string; description: string; userId: string; metadata?: Record<string, unknown> }> = []

    if (data.status && data.status !== existing.status) {
      timelineEvents.push({
        type: 'STATUS_CHANGE',
        description: `Status changed from ${existing.status} to ${data.status}`,
        userId: session.user.id,
        metadata: { from: existing.status, to: data.status },
      })
    }

    if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
      if (data.assignedToId) {
        const assignee = await db.user.findFirst({
          where: { id: data.assignedToId, orgId: session.user.orgId },
          select: { name: true },
        })
        timelineEvents.push({
          type: 'ASSIGNED',
          description: `Incident assigned to ${assignee?.name ?? 'user'}`,
          userId: session.user.id,
          metadata: { assignedToId: data.assignedToId },
        })
      } else {
        timelineEvents.push({
          type: 'UNASSIGNED',
          description: 'Incident unassigned',
          userId: session.user.id,
        })
      }
    }

    const updated = await db.incident.update({
      where: { id: params.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.resolutionNote !== undefined && { resolutionNote: data.resolutionNote }),
        ...(data.resolution !== undefined && { resolution: data.resolution }),
        timeline:
          timelineEvents.length > 0
            ? { createMany: { data: timelineEvents as unknown as Prisma.IncidentTimelineEventCreateManyIncidentInput[] } }
            : undefined,
      },
      include: {
        staffMember: true,
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        resolvedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[incidents/[id] PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!requireRole(session.user.role, ['OWNER'])) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const existing = await db.incident.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Incident not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    await db.incident.delete({ where: { id: params.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[incidents/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
