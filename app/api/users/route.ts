import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR', 'STAFF']),
})

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const users = await db.user.findMany({
      where: { orgId: session.user.orgId },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, lastLoginAt: true, createdAt: true,
        avatarUrl: true, whatsappNumber: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[users GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const allowedRoles: UserRole[] = ['OWNER', 'ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body: unknown = await req.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, name, role } = parsed.data

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered', code: 'DUPLICATE_EMAIL' }, { status: 409 })
    }

    // Generate temporary password for invited user
    const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!'
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const user = await db.user.create({
      data: {
        orgId: session.user.orgId,
        email: email.toLowerCase(),
        name,
        role: role as UserRole,
        passwordHash,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })

    await db.auditEvent.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        action: 'USER_INVITED',
        resource: 'User',
        resourceId: user.id,
        metadata: { email, role },
      },
    })

    return NextResponse.json({ user, tempPassword }, { status: 201 })
  } catch (error) {
    console.error('[users POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
