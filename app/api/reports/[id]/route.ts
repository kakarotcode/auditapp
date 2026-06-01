import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const report = await db.report.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('[reports/[id] GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
