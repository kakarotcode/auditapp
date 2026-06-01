import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types (mirroring Prisma schema — avoids circular imports)
// ---------------------------------------------------------------------------

type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface OpenIncident {
  severity: IncidentSeverity
}

// ---------------------------------------------------------------------------
// Scoring constants
// ---------------------------------------------------------------------------

const SEVERITY_DEDUCTIONS: Record<IncidentSeverity, number> = {
  CRITICAL: 15,
  HIGH: 8,
  MEDIUM: 4,
  LOW: 1,
}

const CLEAN_STREAK_BONUS = 5
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const SCORE_MIN = 0
const SCORE_MAX = 100

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * Recalculates the compliance health score for an organisation from scratch.
 *
 * Algorithm:
 * - Start at 100
 * - Deduct points for each open (OPEN | INVESTIGATING | ESCALATED) incident
 *   based on severity
 * - Add a +5 bonus if there have been no CRITICAL or HIGH incidents in the
 *   last 30 days (clean streak)
 * - Clamp result to [0, 100]
 */
export async function calculateHealthScore(orgId: string): Promise<number> {
  const openIncidents = await db.incident.findMany({
    where: {
      orgId,
      status: { in: ['OPEN', 'INVESTIGATING', 'ESCALATED'] },
    },
    select: { severity: true },
  })

  let score = SCORE_MAX

  for (const incident of openIncidents as OpenIncident[]) {
    score -= SEVERITY_DEDUCTIONS[incident.severity] ?? 1
  }

  // Clean streak bonus: no CRITICAL or HIGH incidents in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS)
  const recentCriticalHighCount = await db.incident.count({
    where: {
      orgId,
      severity: { in: ['CRITICAL', 'HIGH'] },
      occurredAt: { gte: thirtyDaysAgo },
    },
  })

  if (recentCriticalHighCount === 0) {
    score += CLEAN_STREAK_BONUS
  }

  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, score))
}

// ---------------------------------------------------------------------------
// Persistence + history
// ---------------------------------------------------------------------------

/**
 * Recalculates the health score and persists it atomically together with a
 * ScoreHistory record. Safe to call from any async context.
 *
 * @param orgId   - Organisation ID
 * @param reason  - Human-readable reason for the recalculation (e.g. "new incident created", "incident resolved")
 */
export async function updateOrgHealthScore(orgId: string, reason: string): Promise<void> {
  const newScore = await calculateHealthScore(orgId)

  const org = await db.organisation.findUnique({
    where: { id: orgId },
    select: { complianceScore: true },
  })

  const previousScore = org?.complianceScore ?? SCORE_MAX
  const delta = newScore - previousScore

  await db.$transaction([
    db.organisation.update({
      where: { id: orgId },
      data: { complianceScore: newScore },
    }),
    db.scoreHistory.create({
      data: {
        orgId,
        score: newScore,
        delta,
        reason,
      },
    }),
  ])
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a descriptive label for a given numeric compliance score.
 * Useful for dashboard status indicators.
 */
export function scoreToLabel(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
  if (score >= 90) return 'EXCELLENT'
  if (score >= 75) return 'GOOD'
  if (score >= 55) return 'FAIR'
  if (score >= 30) return 'POOR'
  return 'CRITICAL'
}

/**
 * Returns a CSS-friendly colour class based on the compliance score.
 * Designed to pair with Tailwind utility classes used in the KavachAI dashboard.
 */
export function scoreToColour(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 55) return 'text-yellow-600'
  if (score >= 30) return 'text-orange-600'
  return 'text-red-600'
}
