import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Razorpay from 'razorpay'
import { logger } from '@/lib/logger'
import type { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

// Razorpay plan IDs — set these in your Razorpay dashboard and add to env
const PLAN_IDS: Record<string, string> = {
  STARTER: process.env.RAZORPAY_PLAN_STARTER ?? '',
  PROFESSIONAL: process.env.RAZORPAY_PLAN_PROFESSIONAL ?? '',
  GUARDIAN: process.env.RAZORPAY_PLAN_GUARDIAN ?? '',
}

const createSubscriptionSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'GUARDIAN']),
})

function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!requireRole(session.user.role, ['OWNER', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body: unknown = await req.json()
    const parsed = createSubscriptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { plan } = parsed.data
    const planId = PLAN_IDS[plan]
    if (!planId) {
      return NextResponse.json(
        { error: `Razorpay plan ID for ${plan} is not configured`, code: 'PLAN_NOT_CONFIGURED' },
        { status: 500 }
      )
    }

    const org = await db.organisation.findUnique({
      where: { id: session.user.orgId },
      select: { subscriptionId: true, planStatus: true },
    })
    if (!org) {
      return NextResponse.json({ error: 'Organisation not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const razorpay = getRazorpayClient()

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 billing cycles
      quantity: 1,
      customer_notify: 1,
      notes: {
        orgId: session.user.orgId,
        plan,
        userId: session.user.id,
      },
    })

    // Store the pending subscription ID on the org
    await db.organisation.update({
      where: { id: session.user.orgId },
      data: { subscriptionId: subscription.id },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID ?? '',
    })
  } catch (error) {
    logger.error('[billing/create-subscription POST] Error:', error)
    if (error instanceof Error && error.message === 'Razorpay credentials not configured') {
      return NextResponse.json(
        { error: 'Payment gateway not configured', code: 'PAYMENT_NOT_CONFIGURED' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
