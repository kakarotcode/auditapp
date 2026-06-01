import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Vertical, Framework, Plan } from '@prisma/client'

export const dynamic = 'force-dynamic'

const onboardingOrgSchema = z.object({
  name: z.string().min(1).max(200),
  gstin: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, 'Invalid GSTIN format')
    .optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  size: z.enum(['MICRO', 'SMALL', 'MEDIUM']),
  vertical: z.enum(['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL']),
  activeFrameworks: z.array(
    z.enum(['DPDP', 'IT_ACT', 'RBI', 'SEBI', 'IRDAI', 'NMC', 'BAR_COUNCIL', 'LABOUR_LAW', 'POCSO'])
  ).min(1, 'At least one framework must be selected'),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'GUARDIAN']).default('STARTER'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = onboardingOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Trial ends 14 days from now if starting fresh
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const updated = await db.organisation.update({
      where: { id: session.user.orgId },
      data: {
        name: data.name,
        gstin: data.gstin ?? null,
        city: data.city,
        state: data.state,
        size: data.size,
        vertical: data.vertical as Vertical,
        activeFrameworks: data.activeFrameworks as Framework[],
        plan: data.plan as Plan,
        onboardingDone: true,
        trialEndsAt,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[onboarding/org POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
