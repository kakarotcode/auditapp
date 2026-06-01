// Used by Puppeteer (lib/pdf/generate-report.ts) to render HTML for PDF generation.
// This is a pure React component that renders a static HTML page.

interface Incident {
  id: string; ruleCode: string; ruleName: string; severity: string
  status: string; channel: string; occurredAt: string; entityTypes: string[]
  contextSummary: string; riskExplanation: string | null; resolutionNote: string | null
}

interface ReportData {
  org: { name: string; gstin: string | null; state: string | null }
  report: { title: string; reportType: string; periodStart: string; periodEnd: string; generatedAt: string }
  summary: { total: number; critical: number; high: number; medium: number; low: number; resolved: number; open: number }
  incidents: Incident[]
  complianceScore: number
  watermark: string
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#ca8a04', LOW: '#6b7280',
}

export function AuditReportTemplate({ data }: { data: ReportData }) {
  const { org, report, summary, incidents, complianceScore, watermark } = data

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1f2937; background: white; }
          .page { padding: 40px 48px; max-width: 794px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0F2B5B; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #0F2B5B; letter-spacing: -0.5px; }
          .logo span { color: #1E6FD9; }
          .meta { text-align: right; color: #6b7280; font-size: 10px; line-height: 1.6; }
          h1 { font-size: 18px; font-weight: 700; color: #0F2B5B; margin-bottom: 4px; }
          h2 { font-size: 13px; font-weight: 700; color: #1f2937; margin: 24px 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
          .score-box { display: inline-flex; align-items: center; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; margin-bottom: 16px; }
          .score-num { font-size: 40px; font-weight: 800; color: ${complianceScore >= 80 ? '#16a34a' : complianceScore >= 60 ? '#ca8a04' : '#dc2626'}; line-height: 1; }
          .score-label { font-size: 11px; color: #6b7280; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
          .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; text-align: center; }
          .stat-num { font-size: 22px; font-weight: 700; }
          .stat-lbl { font-size: 9px; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th { background: #f1f5f9; text-align: left; padding: 7px 10px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; }
          td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 10px; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          .sev { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 600; color: white; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #9ca3af; font-size: 9px; }
          .watermark { color: #d1d5db; font-size: 9px; font-family: monospace; word-break: break-all; }
          .disclaimer { background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; padding: 10px 14px; margin-top: 20px; font-size: 9px; color: #78350f; }
        `}</style>
      </head>
      <body>
        <div className="page">
          {/* Header */}
          <div className="header">
            <div>
              <div className="logo">Kavach<span>AI</span></div>
              <div style={{ color: '#6b7280', fontSize: '10px', marginTop: 4 }}>Compliance Intelligence Platform</div>
            </div>
            <div className="meta">
              <div><strong>{org.name}</strong></div>
              {org.gstin && <div>GSTIN: {org.gstin}</div>}
              {org.state && <div>{org.state}</div>}
              <div style={{ marginTop: 6 }}><strong>{report.title}</strong></div>
              <div>Period: {new Date(report.periodStart).toLocaleDateString('en-IN')} – {new Date(report.periodEnd).toLocaleDateString('en-IN')}</div>
              <div>Generated: {new Date(report.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
            </div>
          </div>

          {/* Compliance Score */}
          <h2>Compliance Overview</h2>
          <div className="score-box">
            <div>
              <div className="score-num">{complianceScore}</div>
              <div className="score-label">Compliance Score</div>
            </div>
            <div style={{ fontSize: '11px', color: '#374151', lineHeight: 1.6 }}>
              <div>Total incidents: <strong>{summary.total}</strong></div>
              <div>Open: <strong>{summary.open}</strong> · Resolved: <strong>{summary.resolved}</strong></div>
            </div>
          </div>

          <div className="grid-4">
            {[
              { label: 'Critical', num: summary.critical, color: '#dc2626' },
              { label: 'High', num: summary.high, color: '#ea580c' },
              { label: 'Medium', num: summary.medium, color: '#ca8a04' },
              { label: 'Low', num: summary.low, color: '#6b7280' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Incident table */}
          <h2>Incident Log ({incidents.length} incidents)</h2>
          <table>
            <thead>
              <tr>
                <th>Rule Code</th>
                <th>Rule Name</th>
                <th>Severity</th>
                <th>Channel</th>
                <th>Date</th>
                <th>Status</th>
                <th>Entities</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '9px' }}>{inc.ruleCode}</td>
                  <td>{inc.ruleName}</td>
                  <td>
                    <span className="sev" style={{ background: SEV_COLOR[inc.severity] ?? '#6b7280' }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td>{inc.channel.replace('_', ' ')}</td>
                  <td>{new Date(inc.occurredAt).toLocaleDateString('en-IN')}</td>
                  <td>{inc.status}</td>
                  <td style={{ fontSize: '9px', color: '#6b7280' }}>{inc.entityTypes.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Disclaimer */}
          <div className="disclaimer">
            <strong>DPDP Act Compliance Note:</strong> This report is generated by KavachAI&apos;s automated compliance monitoring system.
            No personal data values are stored or included in this report — only entity type classifications.
            This report may be submitted to the Data Protection Board of India (DPB) as evidence of proactive compliance monitoring.
            Report integrity hash (SHA-256): <span style={{ fontFamily: 'monospace' }}>{watermark}</span>
          </div>

          {/* Footer */}
          <div className="footer">
            <div>KavachAI · Confidential Compliance Report · {org.name}</div>
            <div className="watermark">SHA256: {watermark.slice(0, 32)}…</div>
          </div>
        </div>
      </body>
    </html>
  )
}
