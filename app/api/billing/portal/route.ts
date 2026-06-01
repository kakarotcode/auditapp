import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { orgId } = session.user
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [org, sourcesCount, usersCount, incidentsThisMonth, invoices] = await Promise.all([
      db.organisation.findUnique({
        where: { id: orgId },
        select: {
          plan: true,
          planStatus: true,
          trialEndsAt: true,
          subscriptionId: true,
        },
      }),
      db.dataSource.count({ where: { orgId } }),
      db.user.count({ where: { orgId, isActive: true } }),
      db.incident.count({
        where: { orgId, occurredAt: { gte: monthStart, lte: monthEnd } },
      }),
      db.invoice.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          gstAmount: true,
          totalAmount: true,
          status: true,
          billingPeriod: true,
          paidAt: true,
          createdAt: true,
        },
      }),
    ])

    if (!org) {
      return NextResponse.json({ error: 'Organisation not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Try to get next billing date from Razorpay if subscription is active
    let nextBillingDate: string | null = null
    if (org.subscriptionId && org.planStatus === 'ACTIVE') {
      try {
        const Razorpay = (await import('razorpay')).default
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID ?? '',
          key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
        })
        const subscription = await razorpay.subscriptions.fetch(org.subscriptionId)
        if (subscription.charge_at) {
          nextBillingDate = new Date(
            (subscription.charge_at as number) * 1000
          ).toISOString()
        }
      } catch (razorpayError) {
        logger.warn('[billing/portal] Could not fetch Razorpay subscription:', razorpayError)
      }
    }

    return NextResponse.json({
      // Field names must match the billing page's expected contract
      // (app/(dashboard)/settings/billing/page.tsx → BillingData).
      plan: org.plan,
      planStatus: org.planStatus,
      trialEndsAt: org.trialEndsAt,
      subscriptionId: org.subscriptionId,
      nextBillingDate,
      usage: {
        sources: sourcesCount,
        users: usersCount,
        incidentsThisMonth,
      },
      invoices,
    })
  } catch (error) {
    logger.error('[billing/portal GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
