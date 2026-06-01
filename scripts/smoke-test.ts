// scripts/smoke-test.ts
// Run with: npx tsx scripts/smoke-test.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runSmokeTests() {
  console.log('\n🔍 KavachAI Smoke Tests\n')
  const results: { name: string; passed: boolean; detail: string }[] = []

  const test = async (name: string, fn: () => Promise<string>) => {
    try {
      const detail = await fn()
      results.push({ name, passed: true, detail })
      console.log(`✓ ${name}: ${detail}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ name, passed: false, detail: msg })
      console.log(`✗ ${name}: ${msg}`)
    }
  }

  // DB tests
  await test('Database connection', async () => {
    await prisma.$queryRaw`SELECT 1`
    return 'connected'
  })

  await test('Organisation exists', async () => {
    const org = await prisma.organisation.findFirst()
    if (!org) throw new Error('No organisation found — run npm run db:seed')
    return `"${org.name}" (score: ${org.complianceScore})`
  })

  await test('Admin user exists', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mehtaca.com' },
    })
    if (!user) throw new Error('Seed user not found — run npm run db:seed')
    return `${user.name} (${user.role})`
  })

  await test('Incidents seeded', async () => {
    const count = await prisma.incident.count()
    if (count < 5) throw new Error(`Only ${count} incidents — need at least 5`)
    return `${count} incidents found`
  })

  await test('Data sources seeded', async () => {
    const active = await prisma.dataSource.count({ where: { status: 'ACTIVE' } })
    if (active < 1) throw new Error('No active data sources')
    return `${active} active source(s)`
  })

  await test('Reports seeded', async () => {
    const reports = await prisma.report.count({ where: { status: 'READY' } })
    if (reports < 1) throw new Error('No ready reports')
    return `${reports} report(s) ready`
  })

  await test('Compliance score in valid range', async () => {
    const org = await prisma.organisation.findFirst()
    if (!org) throw new Error('No org')
    if (org.complianceScore < 0 || org.complianceScore > 100) {
      throw new Error(`Score ${org.complianceScore} is out of range 0-100`)
    }
    return `Score: ${org.complianceScore}/100`
  })

  await test('ScoreHistory records exist', async () => {
    const count = await prisma.scoreHistory.count()
    if (count < 1) throw new Error(`Only ${count} history records`)
    return `${count} history entries`
  })

  await test('Rulebook engine loads', async () => {
    const { getRulebookForOrg } = await import('../lib/compliance/rulebook-engine')
    const org = await prisma.organisation.findFirst()
    if (!org) throw new Error('No org')
    const rules = await getRulebookForOrg(org.id)
    if (!rules || rules.length < 5) throw new Error(`Only ${rules?.length} rules loaded`)
    return `${rules.length} rules loaded`
  })

  await test('Health score calculator works', async () => {
    const { calculateHealthScore } = await import('../lib/compliance/health-score')
    const org = await prisma.organisation.findFirst()
    if (!org) throw new Error('No org')
    const score = await calculateHealthScore(org.id)
    if (score < 0 || score > 100) throw new Error(`Score ${score} out of range`)
    return `Calculated score: ${score}`
  })

  await test('Staff members seeded', async () => {
    const count = await prisma.staffMember.count()
    if (count < 1) throw new Error('No staff members found')
    return `${count} staff member(s)`
  })

  await test('Invoices seeded', async () => {
    const count = await prisma.invoice.count()
    if (count < 1) throw new Error('No invoices found')
    return `${count} invoice(s)`
  })

  await test('Incident timeline events exist', async () => {
    const count = await prisma.incidentTimelineEvent.count()
    if (count < 1) throw new Error('No timeline events')
    return `${count} timeline event(s)`
  })

  await test('Audit events exist', async () => {
    const count = await prisma.auditEvent.count()
    if (count < 1) throw new Error('No audit events')
    return `${count} audit event(s)`
  })

  // Summary
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${results.length} total`)

  if (failed > 0) {
    console.log('\n❌ Failed tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.name}: ${r.detail}`)
    })
    process.exit(1)
  } else {
    console.log('\n✅ All smoke tests passed — app is ready!')
    console.log('\n🚀 Access the app:')
    console.log('   URL:      http://localhost:3000')
    console.log('   Login:    admin@mehtaca.com')
    console.log('   Password: Demo@1234')
  }

  await prisma.$disconnect()
}

runSmokeTests().catch(async (err) => {
  console.error('Smoke test runner failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})
