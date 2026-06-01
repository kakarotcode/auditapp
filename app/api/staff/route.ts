import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)))
    const skip = (page - 1) * limit
    const search = searchParams.get('search')
    const department = searchParams.get('department')

    const where: Prisma.StaffMemberWhereInput = { orgId: session.user.orgId }

    if (department) where.department = { equals: department, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [members, total] = await Promise.all([
      db.staffMember.findMany({
        where,
        orderBy: [{ totalIncidents: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              incidents: {
                where: { status: { in: ['OPEN', 'INVESTIGATING', 'ESCALATED'] } },
              },
            },
          },
        },
      }),
      db.staffMember.count({ where }),
    ])

    const staffWithCounts = members.map((m) => ({
      id: m.id,
      orgId: m.orgId,
      name: m.name,
      role: m.role,
      department: m.department,
      totalIncidents: m.totalIncidents,
      openIncidents: m._count.incidents,
      lastIncidentAt: m.lastIncidentAt,
      createdAt: m.createdAt,
    }))

    return NextResponse.json({
      staff: staffWithCounts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[staff GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
