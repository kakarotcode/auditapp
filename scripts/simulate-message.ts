/**
 * End-to-end pipeline test for KavachAI.
 *
 * Injects a synthetic message (containing fake PII) into the REAL processing
 * queue, exactly as an incoming WhatsApp/Gmail webhook would. The running
 * worker then drives the full pipeline:
 *   detectPii → classifyContext → scoreRisk → remediation → create Incident
 *   → AlertSender → Socket.io emit
 *
 * Usage:
 *   1. In terminal A:  npm run worker        (must be running)
 *   2. In terminal B:  npx tsx scripts/simulate-message.ts
 *      (optional)      npx tsx scripts/simulate-message.ts "your custom message text"
 *
 * Requires a REAL ANTHROPIC_API_KEY in .env — the AI steps call Claude.
 * Without it the worker job will fail at the AI step (you'll see the error in
 * the worker log), which is itself a useful signal that the key is missing.
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Zero-dependency .env loader (avoids needing the `dotenv` package). Populates
// process.env from the project .env so REDIS_URL / ANTHROPIC_API_KEY are
// available when we dynamically import the queue below.
function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const k = m[1]
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      if (process.env[k] === undefined) process.env[k] = v
    }
  } catch {
    // No .env file — rely on existing process env / defaults.
  }
}

const db = new PrismaClient()

const DEFAULT_MESSAGE =
  "Hi, please process the new client onboarding. Aadhaar is 4321 8765 9012 " +
  "and PAN ABCDE1234F for Ramesh Kumar. Forwarding to our external consultant now."

async function main() {
  loadEnv()

  // Imported after loadEnv() so the queue's Redis connection picks up REDIS_URL.
  const { messageProcessorQueue, redisConnection } = await import('../lib/queue')

  const customText = process.argv.slice(2).join(' ').trim()
  const content = customText || DEFAULT_MESSAGE

  console.log('\n🧪 KavachAI — End-to-End Pipeline Test\n')

  // ---- Pre-flight ---------------------------------------------------------
  const key = process.env.ANTHROPIC_API_KEY ?? ''
  const keyLooksReal = key.startsWith('sk-ant-')
  if (!keyLooksReal) {
    console.warn(
      '⚠️  ANTHROPIC_API_KEY does not look like a real key (expected to start ' +
      'with "sk-ant-"). The AI steps will fail and no incident will be created.\n' +
      '   Add a real key to .env to see the full pipeline succeed.\n'
    )
  }

  // ---- Find org + an active source ---------------------------------------
  const org = await db.organisation.findFirst({ select: { id: true, name: true, vertical: true } })
  if (!org) {
    console.error('✗ No organisation found. Run `npm run db:seed` first.')
    process.exit(1)
  }

  const source = await db.dataSource.findFirst({
    where: { orgId: org.id, status: 'ACTIVE' },
    select: { id: true, type: true, displayName: true },
  })
  if (!source) {
    console.error('✗ No active data source found for the org. Run `npm run db:seed` first.')
    process.exit(1)
  }

  console.log(`Org:    ${org.name} (${org.vertical})`)
  console.log(`Source: ${source.type} — ${source.displayName}`)
  console.log(`Message: "${content}"\n`)

  const incidentsBefore = await db.incident.count({ where: { orgId: org.id } })

  // ---- Enqueue the job (same shape a webhook would enqueue) --------------
  const job = await messageProcessorQueue.add('process-test-message', {
    orgId: org.id,
    sourceId: source.id,
    sourceType: source.type,
    messageId: `test-${Date.now()}`,
    fromIdentifier: '+919876500000',
    toIdentifier: '+919812300000',
    content,
    timestamp: new Date().toISOString(),
    isExternalRecipient: true,
  })

  console.log(`✓ Enqueued job ${job.id} to messageProcessorQueue.`)
  console.log('  Watch the worker terminal for processing logs...\n')

  // ---- Poll for the resulting incident -----------------------------------
  const timeoutMs = 60_000
  const started = Date.now()
  let created = false

  process.stdout.write('Waiting for an incident to be created (up to 60s) ')
  while (Date.now() - started < timeoutMs) {
    const count = await db.incident.count({ where: { orgId: org.id } })
    if (count > incidentsBefore) {
      created = true
      break
    }
    await new Promise((r) => setTimeout(r, 2000))
    process.stdout.write('.')
  }
  console.log('')

  if (created) {
    const latest = await db.incident.findFirst({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        ruleCode: true, ruleName: true, severity: true, status: true,
        entityTypes: true, contextSummary: true, framework: true,
      },
    })
    console.log('\n✅ SUCCESS — incident created by the pipeline:\n')
    console.log(`   Rule:     ${latest?.ruleCode} — ${latest?.ruleName}`)
    console.log(`   Severity: ${latest?.severity}   Framework: ${latest?.framework}`)
    console.log(`   Entities: ${latest?.entityTypes.join(', ')}`)
    console.log(`   Summary:  ${latest?.contextSummary}`)
    console.log('\n   Open the dashboard — it should reflect the new incident.\n')
  } else {
    console.log(
      '\n❌ No incident appeared within 60s. Likely causes:\n' +
      '   • The worker is not running  → start it with `npm run worker`\n' +
      '   • ANTHROPIC_API_KEY is missing/placeholder → AI step failed (check worker log)\n' +
      '   • The message was classified as non-violating (try a clearer PII example)\n'
    )
  }

  await messageProcessorQueue.close()
  await redisConnection.quit()
  await db.$disconnect()
  process.exit(created ? 0 : 1)
}

main().catch(async (err) => {
  console.error('Fatal error:', err)
  await db.$disconnect().catch(() => {})
  process.exit(1)
})
