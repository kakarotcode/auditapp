import { logger } from '@/lib/logger'
import { Job } from 'bullmq'
import { updateOrgHealthScore, calculateHealthScore } from '@/lib/compliance/health-score'
import { emitToOrg } from '@/lib/socket/server'
import type { HealthScoreJobData } from '@/lib/queue'

export async function updateHealthScore(job: Job<HealthScoreJobData>): Promise<void> {
  const { orgId, reason } = job.data

  logger.info(`[HealthScoreUpdater] Updating score for org ${orgId} — reason: ${reason}`)

  await updateOrgHealthScore(orgId, reason)

  // Fetch the new score for the socket event
  const newScore = await calculateHealthScore(orgId)

  emitToOrg(orgId, 'score_updated', {
    orgId,
    score: newScore,
    reason,
    updatedAt: new Date().toISOString(),
  })

  logger.info(`[HealthScoreUpdater] Score updated for org ${orgId}: ${newScore}`)
}
