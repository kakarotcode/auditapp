import puppeteer from 'puppeteer'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { uploadPdf, getPresignedDownloadUrl } from '@/lib/storage/s3'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncidentRow {
  id: string
  severity: string
  ruleName: string
  ruleCode: string
  framework: string
  channel: string
  status: string
  occurredAt: Date
  contextSummary: string
}

interface ReportSummary {
  total: number
  bySeverity: Record<string, number>
  byFramework: Record<string, number>
  resolvedCount: number
  openCount: number
  resolutionRate: string
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildReportHtml(
  reportId: string,
  orgName: string,
  reportTitle: string,
  period: string,
  periodStart: Date,
  periodEnd: Date,
  summary: ReportSummary,
  incidents: IncidentRow[],
  contentHash: string,
  generatedAt: Date
): string {
  const NAVY = '#0F2B5B'
  const GOLD = '#C9A84C'

  const severityColor: Record<string, string> = {
    CRITICAL: '#DC2626',
    HIGH: '#EA580C',
    MEDIUM: '#D97706',
    LOW: '#2563EB',
  }

  const statusColor: Record<string, string> = {
    OPEN: '#DC2626',
    INVESTIGATING: '#D97706',
    ESCALATED: '#7C3AED',
    RESOLVED: '#16A34A',
    FALSE_POSITIVE: '#6B7280',
  }

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const fmtDateTime = (d: Date) =>
    d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const summaryBoxes = [
    { label: 'Total Incidents', value: String(summary.total), color: NAVY },
    { label: 'Critical', value: String(summary.bySeverity['CRITICAL'] ?? 0), color: '#DC2626' },
    { label: 'Resolved', value: String(summary.resolvedCount), color: '#16A34A' },
    { label: 'Resolution Rate', value: summary.resolutionRate, color: '#7C3AED' },
  ]

  const summaryBoxesHtml = summaryBoxes
    .map(
      (b) => `
      <div style="background: ${b.color}; color: white; border-radius: 8px; padding: 20px 16px; text-align: center; flex: 1; margin: 0 6px;">
        <div style="font-size: 32px; font-weight: 700;">${b.value}</div>
        <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">${b.label}</div>
      </div>`
    )
    .join('')

  const incidentRowsHtml = incidents
    .map(
      (inc) => `
      <tr>
        <td style="padding: 10px 12px; font-size: 12px; color: #374151; border-bottom: 1px solid #F3F4F6;">${fmtDateTime(inc.occurredAt)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #F3F4F6;">
          <span style="background: ${severityColor[inc.severity] ?? '#6B7280'}1A; color: ${severityColor[inc.severity] ?? '#6B7280'}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px;">${inc.severity}</span>
        </td>
        <td style="padding: 10px 12px; font-size: 12px; color: #374151; border-bottom: 1px solid #F3F4F6;">${inc.ruleName}</td>
        <td style="padding: 10px 12px; font-size: 11px; font-family: monospace; color: #6B7280; border-bottom: 1px solid #F3F4F6;">${inc.ruleCode}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #374151; border-bottom: 1px solid #F3F4F6;">${inc.framework}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #374151; border-bottom: 1px solid #F3F4F6;">${inc.channel}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #F3F4F6;">
          <span style="background: ${statusColor[inc.status] ?? '#6B7280'}1A; color: ${statusColor[inc.status] ?? '#6B7280'}; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px;">${inc.status}</span>
        </td>
      </tr>`
    )
    .join('')

  const frameworkBreakdownHtml = Object.entries(summary.byFramework)
    .map(
      ([fw, count]) => `
      <tr>
        <td style="padding: 8px 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #F3F4F6;">${fw}</td>
        <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: ${NAVY}; border-bottom: 1px solid #F3F4F6; text-align: center;">${count}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${reportTitle}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #111827; margin: 0; padding: 0; }
    .page-header { position: running(header); }
    .page-footer { position: running(footer); font-size: 10px; color: #9CA3AF; text-align: center; }
    @page { @bottom-center { content: element(footer); } }
  </style>
</head>
<body>
  <!-- Report Header -->
  <div style="background: ${NAVY}; padding: 32px; margin-bottom: 32px; border-radius: 0 0 8px 8px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="color: ${GOLD}; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">KavachAI</div>
        <div style="color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 2px;">DPDP Compliance Evidence Report</div>
      </div>
      <div style="text-align: right; color: rgba(255,255,255,0.8); font-size: 12px;">
        <div style="font-weight: 600; color: white;">${orgName}</div>
        <div style="margin-top: 4px;">Period: ${period}</div>
        <div>${fmtDate(periodStart)} – ${fmtDate(periodEnd)}</div>
      </div>
    </div>
    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.15);">
      <div style="color: white; font-size: 18px; font-weight: 600;">${reportTitle}</div>
      <div style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px;">Report ID: ${reportId} | Generated: ${fmtDateTime(generatedAt)} IST</div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div style="margin-bottom: 32px;">
    <h2 style="color: ${NAVY}; font-size: 16px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${GOLD};">Executive Summary</h2>
    <div style="display: flex; gap: 12px;">${summaryBoxesHtml}</div>
  </div>

  <!-- Breakdown by Framework -->
  <div style="margin-bottom: 32px;">
    <h2 style="color: ${NAVY}; font-size: 16px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${GOLD};">Incidents by Regulatory Framework</h2>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #F9FAFB;">
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Framework</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Incidents</th>
        </tr>
      </thead>
      <tbody>${frameworkBreakdownHtml}</tbody>
    </table>
  </div>

  <!-- Incident Log -->
  <div style="margin-bottom: 32px;">
    <h2 style="color: ${NAVY}; font-size: 16px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${GOLD};">Full Incident Log</h2>
    ${incidents.length === 0
      ? '<p style="color: #6B7280; font-style: italic;">No incidents recorded in this period.</p>'
      : `<table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; font-size: 12px;">
          <thead>
            <tr style="background: #F9FAFB;">
              <th style="padding: 10px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">Date/Time</th>
              <th style="padding: 10px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Severity</th>
              <th style="padding: 10px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Rule</th>
              <th style="padding: 10px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Code</th>
              <th style="padding: 10px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Framework</th>
              <th style="padding: 10px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Channel</th>
              <th style="padding: 10px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
            </tr>
          </thead>
          <tbody>${incidentRowsHtml}</tbody>
        </table>`
    }
  </div>

  <!-- Legal Footer / Watermark -->
  <div style="margin-top: 48px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 11px; color: #6B7280;">
    <strong style="color: ${NAVY};">Generated by KavachAI</strong> — India's DPDP Compliance Monitoring Platform<br />
    Report ID: ${reportId} | Content Hash (SHA-256): <code style="font-family: monospace; font-size: 10px;">${contentHash}</code><br />
    This report constitutes verifiable evidence of compliance monitoring activities under the Digital Personal Data Protection Act 2023.
    Retain as part of your compliance documentation for a minimum of 5 years as per DPDP Act Section 17.
  </div>
</body>
</html>`
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateReport(
  reportId: string,
  orgId: string
): Promise<{ s3Key: string; downloadUrl: string }> {
  // 1. Load report + org from DB
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { org: { select: { id: true, name: true } } },
  })

  if (!report) {
    throw new Error(`Report ${reportId} not found`)
  }

  // 2. Fetch all incidents in the reporting period
  const incidents = await db.incident.findMany({
    where: {
      orgId,
      occurredAt: {
        gte: report.periodStart,
        lte: report.periodEnd,
      },
    },
    orderBy: { occurredAt: 'desc' },
    select: {
      id: true,
      severity: true,
      ruleName: true,
      ruleCode: true,
      framework: true,
      channel: true,
      status: true,
      occurredAt: true,
      contextSummary: true,
    },
  })

  // 3. Calculate summary stats
  const bySeverity: Record<string, number> = {}
  const byFramework: Record<string, number> = {}
  let resolvedCount = 0

  for (const inc of incidents) {
    bySeverity[inc.severity] = (bySeverity[inc.severity] ?? 0) + 1
    byFramework[inc.framework] = (byFramework[inc.framework] ?? 0) + 1
    if (inc.status === 'RESOLVED') resolvedCount++
  }

  const summary: ReportSummary = {
    total: incidents.length,
    bySeverity,
    byFramework,
    resolvedCount,
    openCount: incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length,
    resolutionRate:
      incidents.length > 0
        ? `${Math.round((resolvedCount / incidents.length) * 100)}%`
        : 'N/A',
  }

  const now = new Date()

  // 4. Build content hash (for tamper evidence)
  const contentForHash = JSON.stringify({
    reportId,
    orgId,
    incidents: incidents.map((i) => i.id),
    total: summary.total,
    generatedAt: now.toISOString(),
  })
  const contentHash = crypto.createHash('sha256').update(contentForHash).digest('hex')

  // 5. Generate HTML
  const html = buildReportHtml(
    reportId,
    report.org.name,
    report.title,
    report.period,
    report.periodStart,
    report.periodEnd,
    summary,
    incidents as IncidentRow[],
    contentHash,
    now
  )

  // 6. Launch Puppeteer and generate PDF
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    ...(executablePath ? { executablePath } : {}),
  })

  let pdfBuffer: Buffer
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 9px; color: #9CA3AF; width: 100%; text-align: center; padding: 0 15mm;">
          KavachAI Evidence Report | ${report.title} | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
      headerTemplate: '<div></div>',
    })
    pdfBuffer = Buffer.from(pdf)
  } finally {
    await browser.close()
  }

  // 7. Upload to S3
  const s3Key = `reports/${orgId}/${reportId}/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}/report-${reportId}.pdf`
  await uploadPdf(s3Key, pdfBuffer)

  // 8. Generate presigned URL (7-day access)
  const downloadUrl = await getPresignedDownloadUrl(s3Key)

  return { s3Key, downloadUrl }
}
