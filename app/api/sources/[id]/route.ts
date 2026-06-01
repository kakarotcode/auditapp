import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { safeDecrypt } from '@/lib/crypto'
import type { SourceStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const patchSourceSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'ERROR', 'REVOKED', 'EXPIRED']).optional(),
  metadata: z.record(z.unknown()).optional(),
  errorMessage: z.string().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const source = await db.dataSource.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
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
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Source not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(source)
  } catch (error) {
    console.error('[sources/[id] GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = patchSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await db.dataSource.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Source not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const data = parsed.data
    const updated = await db.dataSource.update({
      where: { id: params.id },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.status !== undefined && { status: data.status as SourceStatus }),
        ...(data.metadata !== undefined && { metadata: data.metadata as never }),
        ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
      },
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
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[sources/[id] PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const source = await db.dataSource.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    })
    if (!source) {
      return NextResponse.json({ error: 'Source not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Attempt to revoke OAuth token with provider
    if (source.encryptedToken) {
      const accessToken = safeDecrypt(source.encryptedToken)
      if (accessToken) {
        try {
          await revokeOAuthToken(source.type, accessToken)
        } catch (revokeError) {
          // Log but don't fail the deletion
          console.warn(`[sources/[id] DELETE] Token revocation failed for ${source.type}:`, revokeError)
        }
      }
    }

    await db.dataSource.delete({ where: { id: params.id } })

    // Create audit event
    await db.auditEvent.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        action: 'SOURCE_DISCONNECTED',
        resource: 'DataSource',
        resourceId: params.id,
        metadata: { type: source.type, displayName: source.displayName },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[sources/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

async function revokeOAuthToken(sourceType: string, accessToken: string): Promise<void> {
  switch (sourceType) {
    case 'GMAIL':
    case 'GOOGLE_DRIVE': {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      break
    }
    case 'OUTLOOK':
    case 'ONEDRIVE': {
      // Microsoft tokens are revoked by signing out via their endpoint
      // In practice this is handled via the refresh token revocation API
      await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${encodeURIComponent(accessToken)}`,
      })
      break
    }
    default:
      // WhatsApp and other sources don't use standard OAuth revocation
      break
  }
}
