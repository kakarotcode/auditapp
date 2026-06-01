import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'
import type { SourceType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const connectSourceSchema = z.object({
  type: z.enum(['WHATSAPP', 'GMAIL', 'OUTLOOK', 'GOOGLE_DRIVE', 'ONEDRIVE']),
  displayName: z.string().min(1).max(100),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  webhookId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  tokenExpiresAt: z.string().datetime().optional(),
})

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const sources = await db.dataSource.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        displayName: true,
        webhookId: true,
        metadata: true,
        lastScannedAt: true,
        errorMessage: true,
        messagesScanned: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
        // Never return encrypted tokens
      },
    })

    return NextResponse.json({ sources })
  } catch (error) {
    console.error('[sources GET] Error:', error)
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
    const parsed = connectSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const { orgId } = session.user

    // Encrypt tokens before storing
    let encryptedToken: string | undefined
    let encryptedRefreshToken: string | undefined

    try {
      if (data.accessToken) encryptedToken = encrypt(data.accessToken)
      if (data.refreshToken) encryptedRefreshToken = encrypt(data.refreshToken)
    } catch (encryptError) {
      console.error('[sources POST] Encryption error:', encryptError)
      return NextResponse.json(
        { error: 'Failed to securely store credentials', code: 'ENCRYPTION_ERROR' },
        { status: 500 }
      )
    }

    const source = await db.dataSource.create({
      data: {
        orgId,
        type: data.type as SourceType,
        displayName: data.displayName,
        encryptedToken,
        encryptedRefreshToken,
        webhookId: data.webhookId,
        metadata: data.metadata as never,
        tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : undefined,
        status: 'PENDING',
      },
      select: {
        id: true,
        type: true,
        status: true,
        displayName: true,
        webhookId: true,
        metadata: true,
        lastScannedAt: true,
        messagesScanned: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create audit event
    await db.auditEvent.create({
      data: {
        orgId,
        userId: session.user.id,
        action: 'SOURCE_CONNECTED',
        resource: 'DataSource',
        resourceId: source.id,
        metadata: { type: data.type, displayName: data.displayName },
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error('[sources POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
