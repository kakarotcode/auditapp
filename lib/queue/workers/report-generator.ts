import { logger } from '@/lib/logger'
import { Job } from 'bullmq'
import { generateReport } from '@/lib/pdf/generate-report'
import { sendReportReadyEmail } from '@/lib/email/sender'
import { db } from '@/lib/db'
import { emitToOrg } from '@/lib/socket/server'
import type { ReportGeneratorJobData } from '@/lib/queue'

export async function generateReportJob(job: Job<ReportGeneratorJobData>): Promise<void> {
  const { reportId, orgId } = job.data

  logger.info(`[ReportGenerator] Generating report ${reportId} for org ${orgId}`)

  // Mark report as generating
  await db.report.update({
    where: { id: reportId },
    data: { status: 'GENERATING' },
  })

  let s3Key: string
  let downloadUrl: string

  try {
    // 1. Generate PDF and upload to S3
    const result = await generateReport(reportId, orgId)
    s3Key = result.s3Key
    downloadUrl = result.downloadUrl
  } catch (err) {
    // Mark as failed and rethrow
    await db.report.update({
      where: { id: reportId },
      data: { status: 'FAILED' },
    }).catch(() => {
      // Non-fatal — already throwing
    })

    logger.error(`[ReportGenerator] PDF generation failed for report ${reportId}:`, { err })
    throw err
  }

  // 2. Fetch report title for notifications
  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { title: true },
  })

  const reportTitle = report?.title ?? `Report ${reportId}`

  // 3. Update Report record: status=READY
  await db.report.update({
    where: { id: reportId },
    data: {
      status: 'READY',
      s3Key,
      downloadUrl,
      generatedAt: new Date(),
    },
  })

  // 4. Log audit event
  await db.auditEvent.create({
    data: {
      orgId,
      action: 'REPORT_GENERATED',
      resource: 'Report',
      resourceId: reportId,
      metadata: { s3Key, reportTitle },
    },
  })

  // 5. Send email notification to compliance officers and admins
  const notifyUsers = await db.user.findMany({
    where: {
      orgId,
      role: { in: ['OWNER', 'ADMIN', 'COMPLIANCE_OFFICER'] },
      isActive: true,
    },
    select: { email: true, name: true },
  })

  await Promise.allSettled(
    notifyUsers.map((user) =>
      sendReportReadyEmail(user.email, {
        title: reportTitle,
        downloadUrl,
      }).catch((err: Error) => {
        logger.error(`[ReportGenerator] Email to ${user.email} failed: ${err.message}`)
      })
    )
  )

  // 6. Emit socket event
  emitToOrg(orgId, 'report_ready', {
    reportId,
    reportTitle,
    downloadUrl,
    generatedAt: new Date().toISOString(),
  })

  logger.info(`[ReportGenerator] Report ${reportId} complete — s3Key=${s3Key}`)
}
