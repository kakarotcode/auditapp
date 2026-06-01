import { Worker, type Job } from 'bullmq'
import {
  redisConnection,
  messageProcessorQueue,
  alertSenderQueue,
  reportGeneratorQueue,
  healthScoreQueue,
  documentScannerQueue,
  type MessageProcessorJobData,
  type AlertSenderJobData,
  type ReportGeneratorJobData,
  type HealthScoreJobData,
  type DocumentScannerJobData,
} from '@/lib/queue'
import { processMessage } from '@/lib/queue/workers/message-processor'
import { sendAlerts } from '@/lib/queue/workers/alert-sender'
import { generateReportJob } from '@/lib/queue/workers/report-generator'
import { updateHealthScore } from '@/lib/queue/workers/health-score-updater'
import { scanDocument } from '@/lib/queue/workers/document-scanner'
import { startScheduler } from '@/lib/queue/scheduler'
import { logger } from '@/lib/logger'

// ─── Worker concurrency settings ─────────────────────────────────────────────

const CONCURRENCY = {
  messageProcessor: 5,
  alertSender: 3,
  reportGenerator: 2,
  healthScore: 10,
  documentScanner: 3,
}

// ─── Create workers ───────────────────────────────────────────────────────────

const messageProcessorWorker = new Worker<MessageProcessorJobData>(
  messageProcessorQueue.name,
  async (job: Job<MessageProcessorJobData>) => processMessage(job),
  {
    connection: redisConnection,
    concurrency: CONCURRENCY.messageProcessor,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  }
)

const alertSenderWorker = new Worker<AlertSenderJobData>(
  alertSenderQueue.name,
  async (job: Job<AlertSenderJobData>) => sendAlerts(job),
  {
    connection: redisConnection,
    concurrency: CONCURRENCY.alertSender,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 250 },
  }
)

const reportGeneratorWorker = new Worker<ReportGeneratorJobData>(
  reportGeneratorQueue.name,
  async (job: Job<ReportGeneratorJobData>) => generateReportJob(job),
  {
    connection: redisConnection,
    concurrency: CONCURRENCY.reportGenerator,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  }
)

const healthScoreWorker = new Worker<HealthScoreJobData>(
  healthScoreQueue.name,
  async (job: Job<HealthScoreJobData>) => updateHealthScore(job),
  {
    connection: redisConnection,
    concurrency: CONCURRENCY.healthScore,
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 500 },
  }
)

const documentScannerWorker = new Worker<DocumentScannerJobData>(
  documentScannerQueue.name,
  async (job: Job<DocumentScannerJobData>) => scanDocument(job),
  {
    connection: redisConnection,
    concurrency: CONCURRENCY.documentScanner,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 250 },
  }
)

const allWorkers = [
  messageProcessorWorker,
  alertSenderWorker,
  reportGeneratorWorker,
  healthScoreWorker,
  documentScannerWorker,
]

// ─── Event handlers ───────────────────────────────────────────────────────────

for (const worker of allWorkers) {
  worker.on('completed', (job: Job) => {
    logger.debug(`[Worker:${worker.name}] Job ${job.id} completed`)
  })

  worker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`[Worker:${worker.name}] Job ${job?.id ?? 'unknown'} failed: ${err.message}`)
  })

  worker.on('error', (err: Error) => {
    logger.error(`[Worker:${worker.name}] Worker error: ${err.message}`)
  })

  worker.on('stalled', (jobId: string) => {
    logger.warn(`[Worker:${worker.name}] Job ${jobId} stalled`)
  })
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

let isShuttingDown = false

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`\n[Workers] Received ${signal}. Gracefully shutting down...`)

  try {
    await Promise.all(allWorkers.map((w) => w.close()))
    logger.info('[Workers] All workers closed')

    await redisConnection.quit()
    logger.info('[Workers] Redis connection closed')

    process.exit(0)
  } catch (err) {
    logger.error('[Workers] Error during shutdown:', String(err))
    process.exit(1)
  }
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => void gracefulShutdown('SIGINT'))

// ─── Start scheduler ──────────────────────────────────────────────────────────

startScheduler()
  .then((schedulerWorker) => {
    allWorkers.push(schedulerWorker as unknown as typeof allWorkers[0])
    logger.info('[Workers] Scheduler started')
  })
  .catch((err: Error) => {
    logger.error(`[Workers] Failed to start scheduler: ${err.message}`)
  })

// ─── Startup log ─────────────────────────────────────────────────────────────

logger.info('KavachAI Worker Process Starting', {
  messageProcessor: CONCURRENCY.messageProcessor,
  alertSender: CONCURRENCY.alertSender,
  reportGenerator: CONCURRENCY.reportGenerator,
  healthScore: CONCURRENCY.healthScore,
  documentScanner: CONCURRENCY.documentScanner,
  redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
  env: process.env.NODE_ENV ?? 'development',
})
