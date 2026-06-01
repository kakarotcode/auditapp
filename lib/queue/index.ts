import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { SourceType } from '@prisma/client'

export const redisConnection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// ─── Job Data Types ───────────────────────────────────────────────────────────

export interface MessageProcessorJobData {
  orgId: string
  sourceId: string
  sourceType: SourceType
  messageId: string
  fromIdentifier: string
  toIdentifier: string
  content: string
  timestamp: string // ISO 8601
  isExternalRecipient: boolean
}

export interface AlertSenderJobData {
  incidentId: string
  orgId: string
}

export interface ReportGeneratorJobData {
  reportId: string
  orgId: string
}

export interface HealthScoreJobData {
  orgId: string
  reason: string
}

export interface DocumentScannerJobData {
  orgId: string
  sourceId: string
  sourceType: SourceType
  fileId: string
  fileName: string
  fileContent: string
}

// ─── Queue Definitions ────────────────────────────────────────────────────────

export const messageProcessorQueue = new Queue<MessageProcessorJobData>(
  'message-processor',
  { connection: redisConnection }
)

export const alertSenderQueue = new Queue<AlertSenderJobData>(
  'alert-sender',
  { connection: redisConnection }
)

export const reportGeneratorQueue = new Queue<ReportGeneratorJobData>(
  'report-generator',
  { connection: redisConnection }
)

export const healthScoreQueue = new Queue<HealthScoreJobData>(
  'health-score',
  { connection: redisConnection }
)

export const documentScannerQueue = new Queue<DocumentScannerJobData>(
  'document-scanner',
  { connection: redisConnection }
)
