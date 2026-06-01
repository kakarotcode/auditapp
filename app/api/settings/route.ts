import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { UserRole, Framework } from '@prisma/client'

export const dynamic = 'force-dynamic'

function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

const patchOrgSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  gstin: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, 'Invalid GSTIN format')
    .nullable()
    .optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  size: z.enum(['MICRO', 'SMALL', 'MEDIUM']).optional(),
  activeFrameworks: z
    .array(z.enum(['DPDP', 'IT_ACT', 'RBI', 'SEBI', 'IRDAI', 'NMC', 'BAR_COUNCIL', 'LABOUR_LAW', 'POCSO']))
    .optional(),
})

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const org = await db.organisation.findUnique({
      where: { id: session.user.orgId },
      select: {
        id: true,
        name: true,
        gstin: true,
        vertical: true,
        size: true,
        city: true,
        state: true,
        activeFrameworks: true,
        plan: true,
        planStatus: true,
        trialEndsAt: true,
        subscriptionId: true,
        complianceScore: true,
        onboardingDone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organisation not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(org)
  } catch (error) {
    console.error('[settings GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!requireRole(session.user.role, ['OWNER', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body: unknown = await req.json()
    const parsed = patchOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATE' },
        { status: 400 }
      )
    }

    // Capture previous values for audit
    const previous = await db.organisation.findUnique({
      where: { id: session.user.orgId },
      select: {
        name: true,
        gstin: true,
        city: true,
        state: true,
        size: true,
        activeFrameworks: true,
      },
    })

    const updated = await db.organisation.update({
      where: { id: session.user.orgId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.gstin !== undefined && { gstin: data.gstin }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.activeFrameworks !== undefined && {
          activeFrameworks: data.activeFrameworks as Framework[],
        }),
      },
      select: {
        id: true,
        name: true,
        gstin: true,
        vertical: true,
        size: true,
        city: true,
        state: true,
        activeFrameworks: true,
        plan: true,
        planStatus: true,
        trialEndsAt: true,
        complianceScore: true,
        onboardingDone: true,
        updatedAt: true,
      },
    })

    // Create audit event
    await db.auditEvent.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        action: 'ORG_SETTINGS_UPDATED',
        resource: 'Organisation',
        resourceId: session.user.orgId,
        metadata: { changes: data, previous },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[settings PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
