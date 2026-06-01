import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { UserRole, Framework } from '@prisma/client'

export const dynamic = 'force-dynamic'

function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

interface ComplianceRule {
  code: string
  name: string
  description: string
  framework: string
  section: string
  severity: string
  penaltyRange: string
  appliesTo: string[]
}

interface RuleWithOverride extends ComplianceRule {
  overrideAction: string | null
  overrideReason: string | null
  overrideExpiresAt: Date | null
  overrideId: string | null
}

const ruleOverrideSchema = z.object({
  ruleCode: z.string().min(1),
  action: z.enum(['MUTE', 'ELEVATE', 'DOWNGRADE']),
  reason: z.string().min(1, 'Reason is required'),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const org = await db.organisation.findUnique({
      where: { id: session.user.orgId },
      select: { activeFrameworks: true, vertical: true },
    })
    if (!org) {
      return NextResponse.json({ error: 'Organisation not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const overrides = await db.ruleOverride.findMany({
      where: { orgId: session.user.orgId },
      select: { id: true, ruleCode: true, action: true, reason: true, expiresAt: true },
    })

    const overrideMap = new Map(overrides.map((o) => [o.ruleCode, o]))

    // Load compliance rules
    let allRules: ComplianceRule[] = []
    try {
      const { COMPLIANCE_RULES } = await import('@/lib/compliance/rules')
      allRules = COMPLIANCE_RULES as ComplianceRule[]
    } catch {
      // Rules module may not exist yet — return empty rulebook
    }

    const activeFrameworks = new Set(org.activeFrameworks as string[])
    const applicableRules = allRules.filter(
      (rule) =>
        activeFrameworks.has(rule.framework) ||
        rule.appliesTo?.includes(org.vertical as string) ||
        rule.appliesTo?.includes('GENERAL')
    )

    const now = new Date()
    const rulesWithOverrides: RuleWithOverride[] = applicableRules.map((rule) => {
      const override = overrideMap.get(rule.code)
      // Treat expired overrides as absent
      const isActive = override && (!override.expiresAt || override.expiresAt > now)
      return {
        ...rule,
        overrideAction: isActive ? override!.action : null,
        overrideReason: isActive ? override!.reason : null,
        overrideExpiresAt: isActive ? override!.expiresAt : null,
        overrideId: isActive ? override!.id : null,
      }
    })

    // Framework breakdown
    const frameworkBreakdown: Record<string, number> = {}
    for (const rule of rulesWithOverrides) {
      frameworkBreakdown[rule.framework] = (frameworkBreakdown[rule.framework] ?? 0) + 1
    }

    return NextResponse.json({
      rules: rulesWithOverrides,
      totalCount: rulesWithOverrides.length,
      frameworkBreakdown,
    })
  } catch (error) {
    console.error('[rulebook GET] Error:', error)
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

    if (!requireRole(session.user.role, ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER'])) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body: unknown = await req.json()
    const parsed = ruleOverrideSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const override = await db.ruleOverride.upsert({
      where: { orgId_ruleCode: { orgId: session.user.orgId, ruleCode: data.ruleCode } },
      update: {
        action: data.action,
        reason: data.reason,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      create: {
        orgId: session.user.orgId,
        ruleCode: data.ruleCode,
        action: data.action,
        reason: data.reason,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    return NextResponse.json(override, { status: 201 })
  } catch (error) {
    console.error('[rulebook POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
