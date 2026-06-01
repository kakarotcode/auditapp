import nodemailer, { type Transporter } from 'nodemailer'
import { logger } from '@/lib/logger'

// ─── Singleton transporter ────────────────────────────────────────────────────

let transporter: Transporter | null = null

function createTransport(): Transporter {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    logger.warn('[Email] SMTP_HOST, SMTP_USER, or SMTP_PASS env vars not set — email sending disabled')
    // Return a no-op transport in development
    transporter = nodemailer.createTransport({ jsonTransport: true })
    return transporter
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
  })

  return transporter
}

// ─── Header sanitisation ──────────────────────────────────────────────────────

/**
 * Strips CR/LF, tabs and other control characters from any string that will be
 * placed into an email header (To, From, Subject). CR/LF in a header value is
 * the root of SMTP header / command injection — the same class flagged by
 * GHSA-vvjj-xcjg-gr5g / GHSA-c7w3-x93f-qmm8 for which there is currently no
 * upstream nodemailer fix. Neutralising it here makes those advisories
 * unreachable regardless of the transport layer's internal handling, and
 * protects against org-supplied values (e.g. organisation name) reaching a
 * header.
 */
function sanitizeHeader(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
}

/**
 * Single delivery path for all outbound mail. Every header-bound value is
 * sanitised here so individual senders cannot accidentally bypass it.
 */
async function deliver(opts: {
  to: string
  subject: string
  html: string
  fromName: string
}): Promise<void> {
  const t = createTransport()
  const fromAddr = sanitizeHeader(
    process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@kavachai.in'
  )
  await t.sendMail({
    from: `"${sanitizeHeader(opts.fromName)}" <${fromAddr}>`,
    to: sanitizeHeader(opts.to),
    subject: sanitizeHeader(opts.subject),
    html: opts.html,
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IncidentAlertData {
  incidentId: string
  ruleName: string
  ruleCode: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  channel: string
  contextSummary: string
  occurredAt: Date
  orgName: string
  dashboardUrl?: string
}

// ─── Shared HTML utilities ────────────────────────────────────────────────────

const KAVACH_NAVY = '#0F2B5B'
const KAVACH_GOLD = '#C9A84C'

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MEDIUM: '#D97706',
  LOW: '#2563EB',
}

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: '🚨 CRITICAL',
  HIGH: '⚠️ HIGH',
  MEDIUM: '🔶 MEDIUM',
  LOW: '🔵 LOW',
}

function htmlWrapper(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background-color: ${KAVACH_NAVY}; padding: 24px 32px; }
    .header-logo { color: ${KAVACH_GOLD}; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header-sub { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px; }
    .body { padding: 32px; }
    .footer { background-color: #F9FAFB; padding: 20px 32px; border-top: 1px solid #E5E7EB; }
    .footer-text { color: #9CA3AF; font-size: 12px; line-height: 1.6; }
    .btn { display: inline-block; background-color: ${KAVACH_NAVY}; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">KavachAI</div>
      <div class="header-sub">DPDP Compliance Monitoring Platform</div>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      <p class="footer-text">
        This is an automated notification from KavachAI — India's DPDP Act compliance monitoring platform.<br />
        <strong>Powered by KavachAI</strong> | Under the Digital Personal Data Protection Act 2023<br />
        To unsubscribe from compliance alerts, contact your organisation admin.
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── Alert email ──────────────────────────────────────────────────────────────

export async function sendAlertEmail(
  to: string,
  incident: IncidentAlertData
): Promise<void> {
  const color = SEVERITY_COLOR[incident.severity] ?? SEVERITY_COLOR.MEDIUM
  const label = SEVERITY_LABEL[incident.severity] ?? incident.severity
  const occurredAt = incident.occurredAt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'medium',
  })

  const dashboardLink = incident.dashboardUrl
    ? `<a href="${incident.dashboardUrl}" class="btn">Review Incident in Dashboard →</a>`
    : ''

  const body = `
    <h2 style="color: ${KAVACH_NAVY}; margin-top: 0;">Compliance Alert Detected</h2>
    <div style="border-left: 4px solid ${color}; background: #FEF2F2; padding: 16px 20px; border-radius: 0 6px 6px 0; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 700; color: ${color};">${label}</div>
      <div style="color: #374151; margin-top: 4px;">${incident.ruleName}</div>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #6B7280; width: 150px;">Incident ID</td>
        <td style="padding: 8px 0; color: #111827; font-family: monospace;">${incident.incidentId}</td>
      </tr>
      <tr style="border-top: 1px solid #F3F4F6;">
        <td style="padding: 8px 0; color: #6B7280;">Rule Code</td>
        <td style="padding: 8px 0; color: #111827; font-family: monospace;">${incident.ruleCode}</td>
      </tr>
      <tr style="border-top: 1px solid #F3F4F6;">
        <td style="padding: 8px 0; color: #6B7280;">Channel</td>
        <td style="padding: 8px 0; color: #111827;">${incident.channel}</td>
      </tr>
      <tr style="border-top: 1px solid #F3F4F6;">
        <td style="padding: 8px 0; color: #6B7280;">Occurred At</td>
        <td style="padding: 8px 0; color: #111827;">${occurredAt} IST</td>
      </tr>
      <tr style="border-top: 1px solid #F3F4F6;">
        <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Summary</td>
        <td style="padding: 8px 0; color: #111827;">${incident.contextSummary}</td>
      </tr>
    </table>
    <p style="color: #374151; font-size: 14px; margin-top: 24px;">
      This incident has been logged in the KavachAI evidence repository and requires your immediate review as per your organisation's compliance obligations under the <strong>Digital Personal Data Protection Act 2023</strong>.
    </p>
    ${dashboardLink}
  `

  await deliver({
    fromName: 'KavachAI Compliance',
    to,
    subject: `[${incident.severity}] Compliance Alert: ${incident.ruleName} — ${incident.orgName}`,
    html: htmlWrapper('KavachAI Compliance Alert', body),
  })
}

// ─── Report ready email ───────────────────────────────────────────────────────

export async function sendReportReadyEmail(
  to: string,
  report: { title: string; downloadUrl: string }
): Promise<void> {
  const body = `
    <h2 style="color: ${KAVACH_NAVY}; margin-top: 0;">Your Compliance Report is Ready</h2>
    <p style="color: #374151; font-size: 15px;">
      Your KavachAI compliance report "<strong>${report.title}</strong>" has been generated and is ready for download.
    </p>
    <p style="color: #6B7280; font-size: 13px;">
      This report serves as verifiable evidence of your organisation's DPDP Act compliance posture and can be submitted to auditors or regulatory bodies.
    </p>
    <a href="${report.downloadUrl}" class="btn">Download Report PDF →</a>
    <p style="color: #9CA3AF; font-size: 12px; margin-top: 16px;">
      This download link is valid for 7 days. The report is digitally signed and tamper-proof.
    </p>
  `

  await deliver({
    fromName: 'KavachAI Reports',
    to,
    subject: `Report Ready: ${report.title}`,
    html: htmlWrapper('KavachAI Report Ready', body),
  })
}

// ─── Invite email ─────────────────────────────────────────────────────────────

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  orgName: string,
  role: string
): Promise<void> {
  const inviteUrl = `${process.env.NEXTAUTH_URL ?? 'https://app.kavachai.in'}/invite?email=${encodeURIComponent(to)}`

  const body = `
    <h2 style="color: ${KAVACH_NAVY}; margin-top: 0;">You've been invited to KavachAI</h2>
    <p style="color: #374151; font-size: 15px;">
      <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong>'s compliance workspace on KavachAI as a <strong>${role}</strong>.
    </p>
    <p style="color: #374151; font-size: 14px;">
      KavachAI helps your organisation monitor, detect, and remediate data privacy compliance issues under India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>.
    </p>
    <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
    <p style="color: #9CA3AF; font-size: 12px; margin-top: 16px;">
      This invitation link expires in 72 hours. If you did not expect this invitation, please ignore this email.
    </p>
  `

  await deliver({
    fromName: 'KavachAI',
    to,
    subject: `${inviterName} invited you to ${orgName} on KavachAI`,
    html: htmlWrapper('KavachAI Invitation', body),
  })
}

// ─── Welcome email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? 'https://app.kavachai.in'}/dashboard`

  const body = `
    <h2 style="color: ${KAVACH_NAVY}; margin-top: 0;">Welcome to KavachAI, ${name}!</h2>
    <p style="color: #374151; font-size: 15px;">
      Your organisation's DPDP compliance monitoring is now active. KavachAI will continuously scan your connected communication channels and alert you to potential data privacy violations under India's Digital Personal Data Protection Act 2023.
    </p>
    <div style="background: #F0F4FF; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: ${KAVACH_NAVY};">Getting started checklist:</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
        <li>Connect your Gmail or Outlook account</li>
        <li>Connect Google Drive or OneDrive for document scanning</li>
        <li>Add your compliance team members</li>
        <li>Set your WhatsApp number for real-time alerts</li>
        <li>Review your initial compliance health score</li>
      </ul>
    </div>
    <a href="${dashboardUrl}" class="btn">Go to Dashboard →</a>
    <p style="color: #374151; font-size: 13px; margin-top: 24px;">
      If you have any questions, reply to this email or contact our support team at support@kavachai.in.
    </p>
  `

  await deliver({
    fromName: 'KavachAI',
    to,
    subject: `Welcome to KavachAI — Your DPDP compliance shield is active`,
    html: htmlWrapper('Welcome to KavachAI', body),
  })
}
