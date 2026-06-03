/**
 * Detection accuracy evaluator for KavachAI.
 *
 * Runs a labelled set of realistic messages through the REAL AI pipeline
 * (detectPii → classifyContext) and reports how often it agrees with the
 * expected label — i.e. your false-positive and false-negative rates. This is
 * the single most important number before charging customers for a compliance
 * product: does it catch real violations without crying wolf?
 *
 * Run with a real ANTHROPIC_API_KEY in .env:
 *   npx tsx scripts/eval-detection.ts
 *
 * Add your own real-world examples to CASES to test on data that looks like
 * your customers' actual messages.
 */
import '../workers/load-env'

interface Case {
  text: string
  external: boolean
  expectedViolation: boolean
  note: string
}

// expectedViolation = should this be flagged? Mix of clear violations, clean
// messages, and tricky edge cases (legitimate internal use that should NOT flag).
const CASES: Case[] = [
  // ---- Clear violations (should flag = true) ----
  { text: 'Onboarding new client: Aadhaar 4321 8765 9012 and PAN ABCDE1234F for Ramesh Kumar, forwarding to our external consultant.', external: true, expectedViolation: true, note: 'Aadhaar+PAN to external' },
  { text: 'Forwarding the patient diagnosis report (diabetes, hypertension) for Mrs. Sharma to the insurance agent on WhatsApp.', external: true, expectedViolation: true, note: 'Health data to external' },
  { text: 'Sharing client HDFC bank account 50100234567890 and statement with an outside CA for review.', external: true, expectedViolation: true, note: 'Financial data to external' },
  { text: 'Team, here is the full customer list with phone numbers and emails — sending to my personal Gmail to work from home.', external: true, expectedViolation: true, note: 'Bulk PII to personal email' },
  { text: 'Mr. Sharma salary slip and PAN attached, sending to the external recruiter for the offer.', external: true, expectedViolation: true, note: 'PAN+salary to recruiter' },
  { text: 'Client passport number M1234567 and date of birth 12/05/1988 shared with the visa agent.', external: true, expectedViolation: true, note: 'Passport+DOB to agent' },

  // ---- Clean / no personal data (should flag = false) ----
  { text: 'Let us meet at 5pm tomorrow to review the quarterly audit checklist.', external: true, expectedViolation: false, note: 'No PII' },
  { text: 'Reminder: the GST filing deadline is the 20th. Please prepare the working papers.', external: false, expectedViolation: false, note: 'No PII' },
  { text: 'Happy Diwali to all our valued clients and team! Office closed Friday.', external: true, expectedViolation: false, note: 'No PII' },
  { text: 'The office WiFi password is changed to Office@2026. Please update your devices.', external: false, expectedViolation: false, note: 'Secret but not personal data' },

  // ---- Edge cases (legitimate internal use — should NOT flag = false) ----
  { text: 'Assigning the Ramesh Kumar audit file to Priya from our team for this quarter.', external: false, expectedViolation: false, note: 'Internal, name only, legit work' },
  { text: 'Internal note: client meeting notes saved to our shared drive for the engagement team.', external: false, expectedViolation: false, note: 'Internal legitimate processing' },
]

async function main() {
  const { detectPii } = await import('../lib/ai/pii-detector')
  const { classifyContext } = await import('../lib/ai/context-classifier')

  if (!process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')) {
    console.error('✗ Real ANTHROPIC_API_KEY required in .env (starts with sk-ant-).')
    process.exit(1)
  }

  console.log(`\n🧪 KavachAI — Detection Accuracy Eval (${CASES.length} cases)\n`)

  let tp = 0, fp = 0, tn = 0, fn = 0
  for (const c of CASES) {
    const pii = await detectPii(c.text)
    let predicted = false
    if (pii.hasPersonalData) {
      const cls = await classifyContext({
        piiResult: pii,
        senderRole: 'STAFF',
        recipientType: c.external ? 'EXTERNAL' : 'INTERNAL',
        hasConsentRecord: false,
      })
      predicted = cls.isViolation
    }
    const correct = predicted === c.expectedViolation
    if (c.expectedViolation && predicted) tp++
    else if (!c.expectedViolation && predicted) fp++
    else if (!c.expectedViolation && !predicted) tn++
    else fn++
    const mark = correct ? '✓' : '✗ MISS'
    console.log(`${mark}  expected=${c.expectedViolation ? 'FLAG' : 'ok  '}  got=${predicted ? 'FLAG' : 'ok  '}  — ${c.note}`)
  }

  const total = CASES.length
  const precision = tp + fp ? tp / (tp + fp) : 1
  const recall = tp + fn ? tp / (tp + fn) : 1
  const accuracy = (tp + tn) / total

  console.log('\n──────── Scorecard ────────')
  console.log(`True positives  (caught real violations):  ${tp}`)
  console.log(`False negatives (MISSED violations ⚠️):     ${fn}`)
  console.log(`False positives (false alarms):             ${fp}`)
  console.log(`True negatives  (correctly ignored):        ${tn}`)
  console.log(`\nAccuracy:  ${(accuracy * 100).toFixed(0)}%`)
  console.log(`Recall:    ${(recall * 100).toFixed(0)}%   (of real violations, how many caught — HIGH is critical)`)
  console.log(`Precision: ${(precision * 100).toFixed(0)}%   (of alerts, how many were real — low = annoying false alarms)`)
  console.log('\nFor a compliance product, watch FALSE NEGATIVES most — a missed violation is the dangerous one.\n')
  process.exit(0)
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1) })
