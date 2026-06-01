import { logger } from '@/lib/logger'
import { Job } from 'bullmq'
import { sendAlertMessage } from '@/lib/integrations/whatsapp'
import { sendAlertEmail } from '@/lib/email/sender'
import { db } from '@/lib/db'
import type { AlertSenderJobData } from '@/lib/queue'
import type { UserRole } from '@prisma/client'

const DASHBOARD_BASE_URL = process.env.NEXTAUTH_URL ?? 'https://app.kavachai.in'

// Roles that always receive alerts
const ALWAYS_ALERT_ROLES: UserRole[] = ['ADMIN', 'COMPLIANCE_OFFICER']
// Additional roles for CRITICAL incidents
const CRITICAL_ALERT_ROLES: UserRole[] = ['OWNER']

export async function sendAlerts(job: Job<AlertSenderJobData>): Promise<void> {
  const { incidentId, orgId } = job.data

  logger.info(`[AlertSender] Processing alert for incident ${incidentId}`)

  // 1. Load incident with related data
  const incident = await db.incident.findUnique({
    where: { id: incidentId },
    include: {
      org: { select: { name: true } },
      source: { select: { displayName: true, type: true } },
      staffMember: { select: { name: true } },
    },
  })

  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`)
  }

  // 2. Determine which roles to alert
  const rolesToAlert: UserRole[] = [...ALWAYS_ALERT_ROLES]
  if (incident.severity === 'CRITICAL') {
    rolesToAlert.push(...CRITICAL_ALERT_ROLES)
  }

  // 3. Load all active users in the org with those roles
  const users = await db.user.findMany({
    where: {
      orgId,
      role: { in: rolesToAlert },
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      whatsappNumber: true,
    },
  })

  if (users.length === 0) {
    logger.warn(`[AlertSender] No alertable users found for org ${orgId}`)
    return
  }

  const dashboardUrl = `${DASHBOARD_BASE_URL}/dashboard/incidents/${incidentId}`

  const alertPayload = {
    severity: incident.severity,
    ruleName: incident.ruleName,
    incidentId: incident.id,
    occurredAt: incident.occurredAt,
  }

  const emailPayload = {
    incidentId: incident.id,
    ruleName: incident.ruleName,
    ruleCode: incident.ruleCode,
    severity: incident.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    channel: incident.channel,
    contextSummary: incident.contextSummary,
    occurredAt: incident.occurredAt,
    orgName: incident.org.name,
    dashboardUrl,
  }

  // 4. Send alerts concurrently per user
  const results = await Promise.allSettled(
    users.map(async (user) => {
      const tasks: Promise<void>[] = []

      // WhatsApp alert (if number configured)
      if (user.whatsappNumber) {
        tasks.push(
          sendAlertMessage(user.whatsappNumber, alertPayload).catch((err: Error) => {
            logger.error(`[AlertSender] WhatsApp failed for user ${user.id}: ${err.message}`)
          })
        )
      }

      // Email alert
      tasks.push(
        sendAlertEmail(user.email, emailPayload).catch((err: Error) => {
          logger.error(`[AlertSender] Email failed for user ${user.id}: ${err.message}`)
        })
      )

      await Promise.all(tasks)
    })
  )

  // Count successes/failures
  const failed = results.filter((r) => r.status === 'rejected').length
  if (failed > 0) {
    logger.warn(`[AlertSender] ${failed}/${users.length} user alert batches had errors`)
  }

  // 5. Log to AuditEvent
  await db.auditEvent.create({
    data: {
      orgId,
      action: 'ALERTS_SENT',
      resource: 'Incident',
      resourceId: incidentId,
      metadata: {
        recipientCount: users.length,
        roles: rolesToAlert,
        severity: incident.severity,
        channels: users
          .map((u) => [
            'email',
            ...(u.whatsappNumber ? ['whatsapp'] : []),
          ])
          .flat()
          .filter((v, i, a) => a.indexOf(v) === i),
      },
    },
  })

  logger.info(
    `[AlertSender] Alerts dispatched for incident ${incidentId} — ${users.length} recipients, severity=${incident.severity}`
  )
}
