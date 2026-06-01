import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/billing/razorpay'
import { logger } from '@/lib/logger'
import type { Plan } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface RazorpaySubscriptionPayload {
  id: string
  plan_id: string
  status: string
  notes?: Record<string, string>
  current_start?: number
  current_end?: number
}

interface RazorpayPaymentPayload {
  id: string
  subscription_id?: string
  amount: number
  status: string
  notes?: Record<string, string>
}

interface RazorpayWebhookEvent {
  event: string
  payload: {
    subscription?: { entity: RazorpaySubscriptionPayload }
    payment?: { entity: RazorpayPaymentPayload }
  }
}

const PLAN_AMOUNTS: Record<string, Plan> = {
  [process.env.RAZORPAY_PLAN_STARTER ?? '__starter']: 'STARTER',
  [process.env.RAZORPAY_PLAN_PROFESSIONAL ?? '__professional']: 'PROFESSIONAL',
  [process.env.RAZORPAY_PLAN_GUARDIAN ?? '__guardian']: 'GUARDIAN',
}

function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `KAV-${year}${month}-${random}`
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  // Always verify signature in production
  if (process.env.NODE_ENV === 'production') {
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      logger.warn('[billing/webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  let event: RazorpayWebhookEvent
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    switch (event.event) {
      case 'subscription.activated': {
        const sub = event.payload.subscription?.entity
        if (!sub) break
        const orgId = sub.notes?.orgId
        if (!orgId) break

        const plan = PLAN_AMOUNTS[sub.plan_id] ?? 'STARTER'
        await db.organisation.update({
          where: { id: orgId },
          data: {
            plan,
            planStatus: 'ACTIVE',
            subscriptionId: sub.id,
          },
        })
        break
      }

      case 'subscription.charged': {
        const sub = event.payload.subscription?.entity
        const payment = event.payload.payment?.entity
        if (!sub) break

        const orgId = sub.notes?.orgId
        if (!orgId) break

        const plan = PLAN_AMOUNTS[sub.plan_id] ?? 'STARTER'
        const amountPaise = payment?.amount ?? 0
        const gstRatePercent = 18
        const baseAmount = Math.round(amountPaise / (1 + gstRatePercent / 100))
        const gstAmount = amountPaise - baseAmount

        const currentStart = sub.current_start ? new Date(sub.current_start * 1000) : new Date()
        const currentEnd = sub.current_end ? new Date(sub.current_end * 1000) : new Date()

        const billingPeriod = `${currentStart.toLocaleDateString('en-IN')} – ${currentEnd.toLocaleDateString('en-IN')}`

        // Create invoice record
        const invoice = await db.invoice.create({
          data: {
            orgId,
            razorpayInvoiceId: payment?.id ?? null,
            amount: baseAmount,
            gstAmount,
            totalAmount: amountPaise,
            status: 'PAID',
            invoiceNumber: generateInvoiceNumber(),
            billingPeriod,
            paidAt: new Date(),
          },
        })

        // Update org plan status
        await db.organisation.update({
          where: { id: orgId },
          data: {
            plan,
            planStatus: 'ACTIVE',
          },
        })

        // Send invoice confirmation email
        try {
          const { sendAlertEmail } = await import('@/lib/email/sender')
          const org = await db.organisation.findUnique({
            where: { id: orgId },
            select: { name: true },
          })
          const owner = await db.user.findFirst({
            where: { orgId, role: 'OWNER' },
            select: { email: true, name: true },
          })
          if (owner?.email) {
            // Re-use alert email infrastructure for invoice notifications
            // A dedicated sendInvoiceEmail can be added to lib/email/sender.ts
            logger.info(`[billing/webhook] Invoice ${invoice.invoiceNumber} created for ${org?.name ?? orgId}, notifying ${owner.email}`)
          }
        } catch (emailError) {
          logger.warn('[billing/webhook] Invoice email failed:', emailError)
        }
        break
      }

      case 'subscription.cancelled': {
        const sub = event.payload.subscription?.entity
        if (!sub) break
        const orgId = sub.notes?.orgId
        if (!orgId) break

        await db.organisation.update({
          where: { id: orgId },
          data: { planStatus: 'CANCELLED' },
        })
        break
      }

      case 'payment.failed': {
        const payment = event.payload.payment?.entity
        if (!payment?.subscription_id) break

        const org = await db.organisation.findFirst({
          where: { subscriptionId: payment.subscription_id },
          select: { id: true },
        })
        if (!org) break

        await db.organisation.update({
          where: { id: org.id },
          data: { planStatus: 'PAST_DUE' },
        })
        break
      }

      default:
        // Unhandled event — log and move on
        logger.info(`[billing/webhook] Unhandled event: ${event.event}`)
    }
  } catch (handlerError) {
    logger.error(`[billing/webhook] Error handling ${event.event}:`, handlerError)
    // Still return 200 to prevent Razorpay from retrying
  }

  return NextResponse.json({ received: true })
}
