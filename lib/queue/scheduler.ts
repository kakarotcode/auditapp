import { Worker, Job } from 'bullmq'
import { db } from '@/lib/db'
import {
  reportGeneratorQueue,
  healthScoreQueue,
  redisConnection,
} from '@/lib/queue'
import { refreshAccessToken as refreshGoogleToken } from '@/lib/integrations/gmail'
import { refreshAccessToken as refreshMicrosoftToken } from '@/lib/integrations/outlook'
import { renewSubscription as renewOutlookSubscription } from '@/lib/integrations/outlook'
import { renewSubscription as renewOneDriveSubscription } from '@/lib/integrations/onedrive'
import { logger } from '@/lib/logger'

// ─── Scheduler job data types ─────────────────────────────────────────────────

interface SchedulerJobData {
  type: 'weekly-reports' | 'daily-score-sweep' | 'token-refresh' | 'graph-subscription-renewal'
}

// ─── Handler: weekly reports ──────────────────────────────────────────────────

async function handleWeeklyReports(): Promise<void> {
  logger.info('[Scheduler] Running weekly-reports job')

  const activeOrgs = await db.organisation.findMany({
    where: { planStatus: { in: ['ACTIVE', 'TRIAL'] } },
    select: { id: true, name: true },
  })

  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(now.getDate() - 7)

  for (const org of activeOrgs) {
    try {
      const report = await db.report.create({
        data: {
          orgId: org.id,
          type: 'WEEKLY',
          title: `Weekly Compliance Report — ${org.name}`,
          period: `Week of ${periodStart.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
          periodStart,
          periodEnd: now,
          status: 'GENERATING',
        },
      })

      await reportGeneratorQueue.add(
        'generate-weekly-report',
        { reportId: report.id, orgId: org.id },
        { attempts: 2, backoff: { type: 'fixed', delay: 30000 } }
      )

      logger.info(`[Scheduler] Weekly report queued for org ${org.id}: reportId=${report.id}`)
    } catch (err) {
      logger.error(`[Scheduler] Failed to create weekly report for org ${org.id}:`, err)
    }
  }

  logger.info(`[Scheduler] weekly-reports: queued ${activeOrgs.length} reports`)
}

// ─── Handler: daily score sweep ───────────────────────────────────────────────

async function handleDailyScoreSweep(): Promise<void> {
  logger.info('[Scheduler] Running daily-score-sweep job')

  const activeOrgs = await db.organisation.findMany({
    where: { planStatus: { in: ['ACTIVE', 'TRIAL'] } },
    select: { id: true },
  })

  for (const org of activeOrgs) {
    await healthScoreQueue.add(
      'daily-score-recalculate',
      { orgId: org.id, reason: 'Daily compliance score recalculation' },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    )
  }

  logger.info(`[Scheduler] daily-score-sweep: queued ${activeOrgs.length} score updates`)
}

// ─── Handler: token refresh ───────────────────────────────────────────────────

async function handleTokenRefresh(): Promise<void> {
  logger.info('[Scheduler] Running token-refresh job')

  const expiryThreshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const sources = await db.dataSource.findMany({
    where: {
      status: 'ACTIVE',
      tokenExpiresAt: { lte: expiryThreshold },
      encryptedRefreshToken: { not: null },
      type: { in: ['GMAIL', 'OUTLOOK', 'GOOGLE_DRIVE', 'ONEDRIVE'] },
    },
    select: {
      id: true,
      type: true,
      encryptedRefreshToken: true,
      tokenExpiresAt: true,
    },
  })

  logger.info(`[Scheduler] token-refresh: found ${sources.length} sources needing refresh`)

  for (const source of sources) {
    try {
      if (!source.encryptedRefreshToken) continue

      // NOTE: In production, decryption of the stored token is required here.
      // The refresh token is stored encrypted; decrypt it using your key management
      // before passing to the OAuth refresh functions.
      const refreshToken = source.encryptedRefreshToken // placeholder — decrypt in production

      let newAccessToken: string
      let expiresAt: Date

      if (source.type === 'GMAIL' || source.type === 'GOOGLE_DRIVE') {
        const refreshed = await refreshGoogleToken(refreshToken)
        newAccessToken = refreshed.accessToken
        expiresAt = refreshed.expiresAt
      } else if (source.type === 'OUTLOOK' || source.type === 'ONEDRIVE') {
        const refreshed = await refreshMicrosoftToken(refreshToken)
        newAccessToken = refreshed.accessToken
        expiresAt = refreshed.expiresAt
      } else {
        continue
      }

      // Store new token (encrypted in production)
      await db.dataSource.update({
        where: { id: source.id },
        data: {
          encryptedToken: newAccessToken, // encrypt before storing in production
          tokenExpiresAt: expiresAt,
          errorMessage: null,
        },
      })

      logger.info(`[Scheduler] Token refreshed for source ${source.id} (${source.type})`)
    } catch (err) {
      logger.error(`[Scheduler] Token refresh failed for source ${source.id}:`, err)

      await db.dataSource.update({
        where: { id: source.id },
        data: { errorMessage: `Token refresh failed: ${(err as Error).message}` },
      }).catch(() => {
        // Non-fatal
      })
    }
  }
}

// ─── Handler: graph subscription renewal ─────────────────────────────────────

async function handleGraphSubscriptionRenewal(): Promise<void> {
  logger.info('[Scheduler] Running graph-subscription-renewal job')

  const renewalThreshold = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days

  // Find sources with metadata containing a subscriptionExpiry approaching
  const sources = await db.dataSource.findMany({
    where: {
      status: 'ACTIVE',
      type: { in: ['OUTLOOK', 'ONEDRIVE'] },
      webhookId: { not: null },
    },
    select: {
      id: true,
      type: true,
      webhookId: true,
      encryptedToken: true,
      metadata: true,
    },
  })

  let renewedCount = 0

  for (const source of sources) {
    try {
      if (!source.webhookId || !source.encryptedToken) continue

      // Check subscription expiry from metadata
      const metadata = source.metadata as { subscriptionExpiry?: string } | null
      if (metadata?.subscriptionExpiry) {
        const expiry = new Date(metadata.subscriptionExpiry)
        if (expiry > renewalThreshold) continue // Not expiring soon
      }

      const accessToken = source.encryptedToken // decrypt in production

      let updatedSubscription: { id: string; expirationDateTime: string }

      if (source.type === 'OUTLOOK') {
        updatedSubscription = await renewOutlookSubscription(accessToken, source.webhookId)
      } else {
        updatedSubscription = await renewOneDriveSubscription(accessToken, source.webhookId)
      }

      await db.dataSource.update({
        where: { id: source.id },
        data: {
          metadata: {
            ...(source.metadata as object ?? {}),
            subscriptionExpiry: updatedSubscription.expirationDateTime,
          },
          errorMessage: null,
        },
      })

      renewedCount++
      logger.info(`[Scheduler] Subscription renewed for source ${source.id} (${source.type})`)
    } catch (err) {
      logger.error(`[Scheduler] Subscription renewal failed for source ${source.id}:`, err)

      await db.dataSource.update({
        where: { id: source.id },
        data: { errorMessage: `Subscription renewal failed: ${(err as Error).message}` },
      }).catch(() => {
        // Non-fatal
      })
    }
  }

  logger.info(`[Scheduler] graph-subscription-renewal: renewed ${renewedCount}/${sources.length} subscriptions`)
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

async function handleSchedulerJob(job: Job<SchedulerJobData>): Promise<void> {
  switch (job.data.type) {
    case 'weekly-reports':
      await handleWeeklyReports()
      break
    case 'daily-score-sweep':
      await handleDailyScoreSweep()
      break
    case 'token-refresh':
      await handleTokenRefresh()
      break
    case 'graph-subscription-renewal':
      await handleGraphSubscriptionRenewal()
      break
    default:
      logger.warn(`[Scheduler] Unknown job type: ${(job.data as SchedulerJobData).type}`)
  }
}

// ─── Queue + repeatable job definitions ──────────────────────────────────────

import { Queue } from 'bullmq'

const schedulerQueue = new Queue<SchedulerJobData>('scheduler', { connection: redisConnection })

export async function startScheduler(): Promise<Worker<SchedulerJobData>> {
  // Register repeatable jobs
  await schedulerQueue.upsertJobScheduler(
    'weekly-reports',
    { pattern: '0 8 * * 1', tz: 'Asia/Kolkata' },
    { name: 'weekly-reports', data: { type: 'weekly-reports' } }
  )

  await schedulerQueue.upsertJobScheduler(
    'daily-score-sweep',
    { pattern: '0 0 * * *', tz: 'Asia/Kolkata' },
    { name: 'daily-score-sweep', data: { type: 'daily-score-sweep' } }
  )

  await schedulerQueue.upsertJobScheduler(
    'token-refresh',
    { every: 6 * 60 * 60 * 1000 }, // every 6 hours in ms
    { name: 'token-refresh', data: { type: 'token-refresh' } }
  )

  await schedulerQueue.upsertJobScheduler(
    'graph-subscription-renewal',
    { every: 60 * 60 * 1000 }, // every hour in ms
    { name: 'graph-subscription-renewal', data: { type: 'graph-subscription-renewal' } }
  )

  const worker = new Worker<SchedulerJobData>('scheduler', handleSchedulerJob, {
    connection: redisConnection,
    concurrency: 1,
  })

  worker.on('completed', (job: Job<SchedulerJobData>) => {
    logger.info(`[Scheduler] Job completed: ${job.name}`)
  })

  worker.on('failed', (job: Job<SchedulerJobData> | undefined, err: Error) => {
    logger.error(`[Scheduler] Job failed: ${job?.name ?? 'unknown'}`, err.message)
  })

  logger.info('[Scheduler] Repeatable jobs registered and worker started')
  return worker
}
