import Razorpay from 'razorpay'
import crypto from 'crypto'
import type { Plan } from '@prisma/client'
import { logger } from '@/lib/logger'

// ─── Razorpay client singleton ────────────────────────────────────────────────

const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

if (!keyId || !keySecret) {
  logger.warn('[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set — billing features disabled')
}

export const razorpay: Razorpay | null = keyId && keySecret
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null

// ─── Plan → Razorpay plan ID mapping ─────────────────────────────────────────

const PLAN_ENV_KEYS: Record<Extract<Plan, 'STARTER' | 'PROFESSIONAL' | 'GUARDIAN'>, string> = {
  STARTER: 'RAZORPAY_PLAN_ID_STARTER',
  PROFESSIONAL: 'RAZORPAY_PLAN_ID_PROFESSIONAL',
  GUARDIAN: 'RAZORPAY_PLAN_ID_GUARDIAN',
}

export function getPlanIdForPlan(
  plan: Extract<Plan, 'STARTER' | 'PROFESSIONAL' | 'GUARDIAN'>
): string {
  const envKey = PLAN_ENV_KEYS[plan]
  const planId = process.env[envKey]
  if (!planId) {
    throw new Error(`${envKey} env var is not set — cannot create subscription for plan ${plan}`)
  }
  return planId
}

// ─── Create subscription ──────────────────────────────────────────────────────

export interface RazorpaySubscription {
  id: string
  plan_id: string
  status: string
  quantity: number
  total_count: number
  paid_count: number
  short_url: string
  notes: Record<string, string>
}

export async function createSubscription(
  planId: string,
  orgId: string
): Promise<RazorpaySubscription> {
  if (!razorpay) throw new Error('Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET')
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 12, // 12-month billing cycle
    quantity: 1,
    notes: {
      orgId,
      platform: 'kavachai',
    },
  })

  return subscription as unknown as RazorpaySubscription
}

// ─── Webhook signature verification ──────────────────────────────────────────

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('[Razorpay] RAZORPAY_WEBHOOK_SECRET not set — webhook signature verification skipped')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    )
  } catch {
    return false
  }
}

// ─── Invoice number generator ─────────────────────────────────────────────────
// Format: KAV/YYYY-YY/NNNN (Indian financial year, e.g. KAV/2026-27/0001)

export function generateInvoiceNumber(sequence: number): string {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-based
  const year = now.getFullYear()

  // Indian financial year: April (month 4) to March
  const fyStart = month >= 4 ? year : year - 1
  const fyEnd = fyStart + 1

  const fyLabel = `${fyStart}-${String(fyEnd).slice(-2)}`
  const seq = String(sequence).padStart(4, '0')

  return `KAV/${fyLabel}/${seq}`
}

// ─── GST calculation ──────────────────────────────────────────────────────────
// KavachAI is registered in Karnataka (state code 29)
// Same-state = CGST + SGST (9% + 9%)
// Different state = IGST (18%)

export interface GstBreakdown {
  baseAmount: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export function calculateGST(
  amount: number,
  isSameState: boolean
): GstBreakdown {
  const GST_RATE = 0.18 // 18% GST on SaaS services

  if (isSameState) {
    const cgst = Math.round(amount * (GST_RATE / 2) * 100) / 100
    const sgst = Math.round(amount * (GST_RATE / 2) * 100) / 100
    return {
      baseAmount: amount,
      cgst,
      sgst,
      igst: 0,
      total: amount + cgst + sgst,
    }
  }

  const igst = Math.round(amount * GST_RATE * 100) / 100
  return {
    baseAmount: amount,
    cgst: 0,
    sgst: 0,
    igst,
    total: amount + igst,
  }
}
