import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Severity, Framework, IncidentStatus, SourceType, UserRole, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

const createIncidentSchema = z.object({
  sourceId: z.string().min(1),
  ruleId: z.string().min(1),
  ruleCode: z.string().min(1),
  ruleName: z.string().min(1),
  framework: z.enum(['DPDP', 'IT_ACT', 'RBI', 'SEBI', 'IRDAI', 'NMC', 'BAR_COUNCIL', 'LABOUR_LAW', 'POCSO']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  channel: z.enum(['WHATSAPP', 'GMAIL', 'OUTLOOK', 'GOOGLE_DRIVE', 'ONEDRIVE']),
  entityTypes: z.array(z.string()).default([]),
  entityCount: z.number().int().min(1).default(1),
  contextSummary: z.string().min(1),
  staffMemberId: z.string().optional(),
  staffIdentifier: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  remediationSteps: z.record(z.unknown()).optional(),
  riskExplanation: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { orgId } = session.user
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)))
    const skip = (page - 1) * limit

    const severity = searchParams.get('severity') as Severity | null
    const status = searchParams.get('status') as IncidentStatus | null
    const framework = searchParams.get('framework') as Framework | null
    const channel = searchParams.get('channel') as SourceType | null
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Prisma.IncidentWhereInput = { orgId }

    if (severity) where.severity = severity
    if (status) where.status = status
    if (framework) where.framework = framework
    if (channel) where.channel = channel
    if (search) {
      where.OR = [
        { ruleName: { contains: search, mode: 'insensitive' } },
        { contextSummary: { contains: search, mode: 'insensitive' } },
        { ruleCode: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (dateFrom || dateTo) {
      where.occurredAt = {}
      if (dateFrom) where.occurredAt.gte = new Date(dateFrom)
      if (dateTo) where.occurredAt.lte = new Date(dateTo)
    }

    const [incidents, total] = await Promise.all([
      db.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
        include: {
          staffMember: true,
          assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
          resolvedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      db.incident.count({ where }),
    ])

    return NextResponse.json({
      incidents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[incidents GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!requireRole(session.user.role, ['OWNER', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body: unknown = await req.json()
    const parsed = createIncidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const { orgId } = session.user

    // Verify source belongs to this org
    const source = await db.dataSource.findFirst({
      where: { id: data.sourceId, orgId },
    })
    if (!source) {
      return NextResponse.json({ error: 'Data source not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const incident = await db.incident.create({
      data: {
        orgId,
        sourceId: data.sourceId,
        ruleId: data.ruleId,
        ruleCode: data.ruleCode,
        ruleName: data.ruleName,
        framework: data.framework as Framework,
        severity: data.severity as Severity,
        channel: data.channel as SourceType,
        entityTypes: data.entityTypes as never,
        entityCount: data.entityCount,
        contextSummary: data.contextSummary,
        staffMemberId: data.staffMemberId,
        staffIdentifier: data.staffIdentifier,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        remediationSteps: data.remediationSteps as Prisma.InputJsonValue,
        riskExplanation: data.riskExplanation,
        timeline: {
          create: {
            type: 'CREATED',
            description: 'Incident created manually',
            userId: session.user.id,
          },
        },
      },
      include: {
        staffMember: true,
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    console.error('[incidents POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
