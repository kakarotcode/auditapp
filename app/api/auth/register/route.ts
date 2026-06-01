import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { Framework } from '@prisma/client'

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2).max(200),
  vertical: z.enum(['CA_FIRM', 'HEALTHCARE', 'FINANCIAL', 'LEGAL', 'EDTECH', 'HR_TECH', 'GENERAL']),
  city: z.string().optional(),
})

const verticalFrameworks: Record<string, string[]> = {
  CA_FIRM: ['DPDP', 'IT_ACT', 'SEBI'],
  HEALTHCARE: ['DPDP', 'IT_ACT', 'NMC'],
  FINANCIAL: ['DPDP', 'IT_ACT', 'RBI'],
  LEGAL: ['DPDP', 'IT_ACT', 'BAR_COUNCIL'],
  EDTECH: ['DPDP', 'IT_ACT', 'POCSO'],
  HR_TECH: ['DPDP', 'IT_ACT', 'LABOUR_LAW'],
  GENERAL: ['DPDP', 'IT_ACT'],
}

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json())

    const existing = await db.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(body.password, 12)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const result = await db.$transaction(async (tx) => {
      const org = await tx.organisation.create({
        data: {
          name: body.orgName,
          vertical: body.vertical,
          size: 'MICRO',
          city: body.city ?? null,
          activeFrameworks: (verticalFrameworks[body.vertical] ?? ['DPDP', 'IT_ACT']) as Framework[],
          plan: 'STARTER',
          planStatus: 'TRIAL',
          trialEndsAt,
        },
      })

      const user = await tx.user.create({
        data: {
          orgId: org.id,
          email: body.email,
          name: body.name,
          passwordHash,
          role: 'OWNER',
        },
      })

      return { userId: user.id, orgId: org.id }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
