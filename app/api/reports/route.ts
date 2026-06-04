import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import type { ReportType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const generateReportSchema = z.object({
  type: z.enum(['AUDIT', 'WEEKLY', 'MONTHLY', 'INCIDENT_SUMMARY']),
  // Accept date-only ("2026-05-01") from <input type="date"> as well as full
  // ISO datetimes — coerce both to Date.
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  title: z.string().min(1).max(200).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
    const skip = (page - 1) * limit

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where: { orgId: session.user.orgId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          period: true,
          periodStart: true,
          periodEnd: true,
          status: true,
          downloadUrl: true,
          metadata: true,
          generatedAt: true,
          createdAt: true,
        },
      }),
      db.report.count({ where: { orgId: session.user.orgId } }),
    ])

    return NextResponse.json({
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[reports GET] Error:', error)
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

    const body: unknown = await req.json()
    const parsed = generateReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const periodStart = new Date(data.periodStart)
    const periodEnd = new Date(data.periodEnd)

    if (periodStart >= periodEnd) {
      return NextResponse.json(
        { error: 'periodStart must be before periodEnd', code: 'INVALID_PERIOD' },
        { status: 400 }
      )
    }

    const period = `${format(periodStart, 'dd MMM yyyy')} – ${format(periodEnd, 'dd MMM yyyy')}`
    const title =
      data.title ??
      `${data.type.charAt(0) + data.type.slice(1).toLowerCase().replace(/_/g, ' ')} Report — ${period}`

    const report = await db.report.create({
      data: {
        orgId: session.user.orgId,
        type: data.type as ReportType,
        title,
        period,
        periodStart,
        periodEnd,
        // Reports are rendered on demand (live summary + browser print-to-PDF),
        // so they're ready immediately — no worker/Puppeteer/S3 dependency.
        status: 'READY',
        generatedAt: new Date(),
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('[reports POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
