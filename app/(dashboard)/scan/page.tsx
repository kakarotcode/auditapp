'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ScanLine, Loader2, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'

interface ScanResult {
  violation: boolean
  saved?: boolean
  hasPersonalData?: boolean
  incidentId?: string
  severity?: string
  framework?: string
  ruleCode?: string
  entities?: string[]
  summary?: string
  reasoning?: string
  remediationSteps?: string[]
  message?: string
}

const SAMPLE = "Hi team, please onboard the new client. Aadhaar 4321 8765 9012 and PAN ABCDE1234F for Ramesh Kumar — forwarding to our external consultant now."

export default function ScanPage() {
  const [content, setContent] = useState('')
  const [channel, setChannel] = useState('WHATSAPP')
  const [external, setExternal] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [gmailLoading, setGmailLoading] = useState(false)
  const [gmailResult, setGmailResult] = useState<{ scanned: number; violations: number; incidentsCreated: number; results: Array<{ subject: string; violation: boolean; severity: string | null; incidentId: string | null }> } | null>(null)

  async function scanGmail() {
    setGmailLoading(true); setGmailResult(null)
    try {
      const res = await fetch('/api/gmail/scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Gmail scan failed'); return }
      setGmailResult(data)
      toast.success(`Scanned ${data.scanned} emails — ${data.incidentsCreated} incident(s) created`)
    } catch {
      toast.error('Could not scan Gmail')
    } finally {
      setGmailLoading(false)
    }
  }

  async function runScan() {
    if (!content.trim()) { toast.error('Please enter a message to scan'); return }
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, channel, isExternalRecipient: external }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Scan failed')
        return
      }
      setResult(data)
      if (data.violation && data.saved) toast.error(`${data.severity} violation detected — incident created`)
      else if (data.violation) toast.warning('Violation detected')
      else toast.success('No violation')
    } catch {
      toast.error('Could not reach the scanner')
    } finally {
      setLoading(false)
    }
  }

  const sevColor = (s?: string) =>
    s === 'CRITICAL' ? 'bg-red-100 text-red-700'
    : s === 'HIGH' ? 'bg-orange-100 text-orange-700'
    : s === 'MEDIUM' ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-700'

  return (
    <div className="space-y-6">
      <PageHeader title="Scan a Message" description="Run KavachAI's AI on any message to detect DPDP violations in real time" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-[#1E6FD9]" /> Message to scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Paste a WhatsApp/email message here…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm focus:border-[#1E6FD9] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E6FD9]"
          />
          <button type="button" onClick={() => setContent(SAMPLE)} className="text-xs text-[#1E6FD9] hover:underline">
            ↳ Use a sample message
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-full sm:w-48">
              <Label className="text-xs text-gray-500">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="GMAIL">Gmail</SelectItem>
                  <SelectItem value="OUTLOOK">Outlook</SelectItem>
                  <SelectItem value="GOOGLE_DRIVE">Google Drive</SelectItem>
                  <SelectItem value="ONEDRIVE">OneDrive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ext" checked={external} onCheckedChange={setExternal} />
              <Label htmlFor="ext" className="text-sm text-gray-600">Sent to an external recipient</Label>
            </div>
            <div className="sm:ml-auto">
              <Button onClick={runScan} disabled={loading} className="w-full sm:w-auto">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning…</> : <><ScanLine className="h-4 w-4 mr-2" /> Scan with AI</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gmail inbox scan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Or scan your Gmail inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            Pulls your most recent emails and runs the AI on each. Requires signing in
            with Google (granting Gmail read access).
          </p>
          <Button variant="outline" onClick={scanGmail} disabled={gmailLoading}>
            {gmailLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning inbox…</> : 'Scan my Gmail inbox'}
          </Button>
          {gmailResult && (
            <div className="rounded-lg border border-gray-100 p-3 text-sm">
              <p className="font-medium text-gray-800 mb-2">
                Scanned {gmailResult.scanned} emails · {gmailResult.violations} violation(s) · {gmailResult.incidentsCreated} incident(s) created
              </p>
              <ul className="space-y-1">
                {gmailResult.results.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    {r.violation
                      ? <Badge className={sevColor(r.severity ?? undefined)}>{r.severity}</Badge>
                      : <Badge className="bg-green-100 text-green-700">clean</Badge>}
                    {r.incidentId
                      ? <Link href={`/incidents/${r.incidentId}`} className="text-[#1E6FD9] hover:underline truncate">{r.subject}</Link>
                      : <span className="text-gray-600 truncate">{r.subject}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className={result.violation ? 'border-red-200' : 'border-green-200'}>
          <CardContent className="p-6 space-y-4">
            {result.violation ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Compliance violation detected</p>
                    <p className="text-xs text-gray-500">{result.ruleCode} · {result.framework}</p>
                  </div>
                  <Badge className={`ml-auto ${sevColor(result.severity)}`}>{result.severity}</Badge>
                </div>

                {result.entities && result.entities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Data detected (types only)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.entities.map((e) => (
                        <Badge key={e} variant="secondary" className="bg-red-50 text-red-700">{e.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.summary && (
                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{result.summary}</div>
                )}

                {result.reasoning && (
                  <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
                    <span className="font-semibold">Why it's risky: </span>{result.reasoning}
                  </div>
                )}

                {result.remediationSteps && result.remediationSteps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Recommended steps</p>
                    <ul className="space-y-1.5">
                      {result.remediationSteps.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-[#1E6FD9] font-semibold">{i + 1}.</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.saved && result.incidentId ? (
                  <Link href={`/incidents/${result.incidentId}`}>
                    <Button variant="outline" className="w-full sm:w-auto">View the created incident →</Button>
                  </Link>
                ) : (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> {result.message}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">No violation</p>
                  <p className="text-sm text-gray-500">{result.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
