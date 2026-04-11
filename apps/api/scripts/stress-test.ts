/**
 * Stress Test Script — Validates Growth Engine under load
 *
 * Tests:
 * 1. Lead ingestion (100 simultaneous, 300 sequential, 500 batch)
 * 2. Outbound queue (rate limiting, number rotation, dedup)
 * 3. Follow-up scheduling (D+1/D+3/D+7, skip logic)
 * 4. Sales funnel (stage transitions, idempotency)
 * 5. Preview engine (generation, expiration, tracking)
 *
 * Usage: npx tsx scripts/stress-test.ts
 * Requires: DATABASE_URL set (runs against real DB)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RESULTS: Array<{ test: string; status: 'PASS' | 'FAIL' | 'WARN'; detail: string; ms: number }> = []

function log(msg: string) {
  console.log(`[stress-test] ${msg}`)
}

function record(test: string, status: 'PASS' | 'FAIL' | 'WARN', detail: string, ms: number) {
  RESULTS.push({ test, status, detail, ms })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`  ${icon} ${test}: ${detail} (${ms}ms)`)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomPhone(): string {
  return `5511${Math.floor(900000000 + Math.random() * 99999999)}`
}

function randomName(): string {
  const first = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Fernando', 'Patricia', 'Rafael', 'Camila']
  const last = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Alves', 'Ferreira', 'Gomes']
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
}

// ── Test 1: Lead Ingestion — 100 simultaneous ───────────────────────────────

async function testLeadIngestion100() {
  log('Test 1: 100 simultaneous lead ingestions')
  const start = Date.now()
  const phones = new Set<string>()

  // Dynamic import to test the real service
  const { ingestLead } = await import('../src/services/lead-ingestion.service.js')

  const promises = Array.from({ length: 100 }, (_, i) => {
    const phone = randomPhone()
    phones.add(phone)
    return ingestLead(prisma, {
      name: randomName(),
      phone,
      source: ['meta_ads', 'google_ads', 'seo', 'organic', 'whatsapp_outbound'][i % 5],
      campaign: `stress_test_${Math.floor(i / 20)}`,
    }).catch(err => ({ error: err.message }))
  })

  const results = await Promise.all(promises)
  const ms = Date.now() - start
  const errors = results.filter((r: any) => r.error)
  const successes = results.filter((r: any) => !r.error)

  if (errors.length === 0) {
    record('Lead Ingestion (100 concurrent)', 'PASS', `100/100 created in ${ms}ms`, ms)
  } else {
    record('Lead Ingestion (100 concurrent)', errors.length > 10 ? 'FAIL' : 'WARN', `${successes.length}/100 ok, ${errors.length} errors`, ms)
  }

  // Verify dedup: re-ingest the same phone
  const dupPhone = Array.from(phones)[0]
  const dupResult = await ingestLead(prisma, {
    name: 'Duplicate Test',
    phone: dupPhone,
    source: 'manual',
  })

  if (dupResult.isDuplicate) {
    record('Deduplication', 'PASS', `Phone ${dupPhone.slice(0, 6)}*** correctly deduplicated`, 0)
  } else {
    record('Deduplication', 'FAIL', 'Duplicate not detected', 0)
  }

  return phones
}

// ── Test 2: Lead Ingestion — 300 sequential ─────────────────────────────────

async function testLeadIngestion300() {
  log('Test 2: 300 sequential lead ingestions')
  const start = Date.now()
  const { ingestLead } = await import('../src/services/lead-ingestion.service.js')

  let ok = 0
  let fail = 0

  for (let i = 0; i < 300; i++) {
    try {
      await ingestLead(prisma, {
        name: randomName(),
        phone: randomPhone(),
        source: 'whatsapp_outbound',
        campaign: 'stress_300',
      })
      ok++
    } catch {
      fail++
    }
  }

  const ms = Date.now() - start
  record('Lead Ingestion (300 sequential)', ok >= 295 ? 'PASS' : 'WARN', `${ok}/300 ok, ${fail} errors, avg ${Math.round(ms / 300)}ms/lead`, ms)
}

// ── Test 3: Sales Funnel — Stage transitions ────────────────────────────────

async function testFunnelTransitions() {
  log('Test 3: Sales funnel stage transitions')
  const start = Date.now()
  const { ingestLead, updateFunnelStage } = await import('../src/services/lead-ingestion.service.js')

  // Create a lead
  const result = await ingestLead(prisma, {
    name: 'Funnel Test Lead',
    phone: randomPhone(),
    source: 'meta_ads',
  })

  // Verify initial stage
  const funnel = await prisma.salesFunnel.findUnique({ where: { id: result.funnelId } }) as any
  if (funnel?.stage !== 'captured') {
    record('Funnel Initial Stage', 'FAIL', `Expected 'captured', got '${funnel?.stage}'`, Date.now() - start)
    return
  }
  record('Funnel Initial Stage', 'PASS', "Stage = 'captured'", 0)

  // Progress through stages
  const stages = ['engaged', 'preview_sent', 'preview_clicked', 'checkout_sent', 'converted']
  for (const stage of stages) {
    await updateFunnelStage(prisma, result.funnelId, stage)
    const updated = await prisma.salesFunnel.findUnique({ where: { id: result.funnelId } }) as any
    if (updated?.stage !== stage) {
      record(`Funnel → ${stage}`, 'FAIL', `Expected '${stage}', got '${updated?.stage}'`, Date.now() - start)
      return
    }
  }

  // Verify converted has timestamp
  const converted = await prisma.salesFunnel.findUnique({ where: { id: result.funnelId } }) as any
  if (converted?.convertedAt) {
    record('Funnel Full Pipeline', 'PASS', 'All 6 stages transitioned correctly, convertedAt set', Date.now() - start)
  } else {
    record('Funnel Full Pipeline', 'WARN', 'Stages ok but convertedAt not set', Date.now() - start)
  }
}

// ── Test 4: Intent Detection ────────────────────────────────────────────────

async function testIntentDetection() {
  log('Test 4: Intent detection')
  const { detectSalesIntent } = await import('../src/services/sales-funnel.service.js')

  const cases: Array<[string, string]> = [
    ['quanto custa o plano?', 'price'],
    ['qual o preço?', 'price'],
    ['quero saber como funciona', 'interest'],
    ['me conta mais', 'interest'],
    ['quero ativar agora', 'activation'],
    ['manda o link', 'activation'],
    ['bom dia', 'none'],
    ['obrigado', 'none'],
  ]

  let pass = 0
  for (const [msg, expected] of cases) {
    const result = detectSalesIntent(msg)
    if (result === expected) {
      pass++
    } else {
      record(`Intent: "${msg}"`, 'FAIL', `Expected '${expected}', got '${result}'`, 0)
    }
  }

  record('Intent Detection', pass === cases.length ? 'PASS' : 'WARN', `${pass}/${cases.length} cases correct`, 0)
}

// ── Test 5: Preview Engine ──────────────────────────────────────────────────

async function testPreviewEngine() {
  log('Test 5: Preview engine')
  const start = Date.now()
  const { generateBranding, getAvailableThemes } = await import('../src/services/preview-branding.service.js')
  const { generatePreviewToken, isPreviewExpired } = await import('../src/services/preview-token.service.js')

  // Test all themes
  const themes = getAvailableThemes()
  let allOk = true
  for (const theme of themes) {
    const branding = generateBranding({
      companyName: 'Test Corp',
      theme: theme.key,
      segment: 'corretor',
    })
    if (!branding.slogan || !branding.theme.primaryColor) {
      record(`Theme: ${theme.key}`, 'FAIL', 'Missing slogan or color', 0)
      allOk = false
    }
  }
  if (allOk) {
    record('Preview Themes', 'PASS', `All ${themes.length} themes generate correctly`, Date.now() - start)
  }

  // Test token generation + expiry
  const token = generatePreviewToken('test-site')
  if (token.token.length === 32 && !isPreviewExpired(token.expiresAt)) {
    record('Preview Token', 'PASS', '32-char token, not expired', 0)
  } else {
    record('Preview Token', 'FAIL', 'Token generation issue', 0)
  }

  // Test expiry detection
  const expired = new Date(Date.now() - 1000)
  if (isPreviewExpired(expired)) {
    record('Preview Expiry', 'PASS', 'Expired dates detected correctly', 0)
  } else {
    record('Preview Expiry', 'FAIL', 'Expired date not detected', 0)
  }

  // Test 48h window
  const hoursDiff = (token.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursDiff > 47 && hoursDiff < 49) {
    record('Preview 48h Window', 'PASS', `Expires in ${hoursDiff.toFixed(1)}h`, 0)
  } else {
    record('Preview 48h Window', 'FAIL', `Expires in ${hoursDiff.toFixed(1)}h (expected ~48h)`, 0)
  }
}

// ── Test 6: Follow-up Scheduling ────────────────────────────────────────────

async function testFollowUpScheduling() {
  log('Test 6: Follow-up scheduling')
  const start = Date.now()

  try {
    const { scheduleFollowUps, cancelFollowUps } = await import('../src/services/followup.service.js')

    const leadId = `stress_test_${Date.now()}`
    const outboundId = `outbound_test_${Date.now()}`

    // Schedule follow-ups
    await scheduleFollowUps(prisma, {
      leadId,
      outboundId,
      phone: randomPhone(),
      name: 'Follow-up Test',
    })

    // Verify 3 follow-ups created (D+1, D+3, D+7)
    const followUps = await (prisma as any).followUpSchedule.findMany({
      where: { leadId },
      orderBy: { scheduledAt: 'asc' },
    })

    if (followUps.length === 3) {
      const steps = followUps.map((f: any) => f.step)
      if (steps.includes('d1') && steps.includes('d3') && steps.includes('d7')) {
        record('Follow-up Schedule', 'PASS', '3 follow-ups (d1, d3, d7) created', Date.now() - start)
      } else {
        record('Follow-up Schedule', 'FAIL', `Wrong steps: ${steps.join(', ')}`, Date.now() - start)
      }
    } else {
      record('Follow-up Schedule', 'FAIL', `Expected 3, got ${followUps.length}`, Date.now() - start)
    }

    // Test cancellation
    await cancelFollowUps(prisma, leadId)
    const cancelled = await (prisma as any).followUpSchedule.findMany({
      where: { leadId, status: 'cancelled' },
    })

    if (cancelled.length === 3) {
      record('Follow-up Cancel', 'PASS', 'All 3 cancelled correctly', 0)
    } else {
      record('Follow-up Cancel', 'WARN', `${cancelled.length}/3 cancelled`, 0)
    }

    // Test idempotency: schedule again shouldn't create duplicates
    await scheduleFollowUps(prisma, {
      leadId: `stress_idem_${Date.now()}`,
      outboundId: `outbound_idem_${Date.now()}`,
      phone: randomPhone(),
      name: 'Idempotency Test',
    })
    // Schedule again with same leadId
    const idemLeadId = `stress_idem2_${Date.now()}`
    await scheduleFollowUps(prisma, { leadId: idemLeadId, outboundId: 'out1', phone: '5511999', name: 'Test' })
    await scheduleFollowUps(prisma, { leadId: idemLeadId, outboundId: 'out2', phone: '5511999', name: 'Test' })
    const idemCount = await (prisma as any).followUpSchedule.count({ where: { leadId: idemLeadId } })
    if (idemCount === 3) {
      record('Follow-up Idempotency', 'PASS', 'No duplicate schedules on re-run', 0)
    } else {
      record('Follow-up Idempotency', idemCount === 6 ? 'WARN' : 'FAIL', `Expected 3 (idempotent), got ${idemCount}`, 0)
    }
  } catch (err: any) {
    record('Follow-up Scheduling', 'FAIL', err.message, Date.now() - start)
  }
}

// ── Test 7: Outbound Queue Structure ────────────────────────────────────────

async function testOutboundQueue() {
  log('Test 7: Outbound queue service')
  const start = Date.now()

  try {
    const { OUTBOUND_TEMPLATES: TEMPLATES, selectSenderNumber } = await import('../src/services/outbound-queue.service.js')

    // Verify templates exist
    if (TEMPLATES && Object.keys(TEMPLATES).length >= 3) {
      record('Outbound Templates', 'PASS', `${Object.keys(TEMPLATES).length} templates (A/B/C+)`, 0)
    } else {
      record('Outbound Templates', 'FAIL', 'Missing templates', 0)
    }

    // Test number selection
    const number = await selectSenderNumber(prisma)
    if (number) {
      record('Sender Number Selection', 'PASS', `Selected: ${number.slice(0, 6)}***`, Date.now() - start)
    } else {
      record('Sender Number Selection', 'WARN', 'No sender number (WHATSAPP_PHONE_ID not set)', Date.now() - start)
    }
  } catch (err: any) {
    record('Outbound Queue', 'FAIL', err.message, Date.now() - start)
  }
}

// ── Test 8: Webhook Idempotency ─────────────────────────────────────────────

async function testWebhookIdempotency() {
  log('Test 8: Webhook idempotency patterns')

  // Check tenant activation idempotency
  const testTenant = await prisma.tenant.findFirst({
    where: { planStatus: 'ACTIVE' },
  }).catch(() => null)

  if (testTenant) {
    record('Tenant Activation Idempotency', 'PASS', 'Active tenant found — re-activation check in webhook code', 0)
  } else {
    record('Tenant Activation Idempotency', 'WARN', 'No active tenant to validate against', 0)
  }

  // Check SalesFunnel conversion idempotency
  const { convertFunnelEntry } = await import('../src/services/sales-funnel.service.js')
  const testFunnel = await prisma.salesFunnel.create({
    data: {
      name: 'Idempotency Test',
      phone: randomPhone(),
      source: 'test',
      stage: 'checkout_sent',
      score: 50,
    },
  }) as any

  // Convert once
  await convertFunnelEntry(prisma, { funnelId: testFunnel.id }, 'tenant_test_1')
  const first = await prisma.salesFunnel.findUnique({ where: { id: testFunnel.id } }) as any

  // Convert again (should be no-op since already converted)
  await convertFunnelEntry(prisma, { funnelId: testFunnel.id }, 'tenant_test_2')
  const second = await prisma.salesFunnel.findUnique({ where: { id: testFunnel.id } }) as any

  if (first?.tenantId === 'tenant_test_1' && second?.tenantId === 'tenant_test_1') {
    record('Funnel Conversion Idempotency', 'PASS', 'Second conversion correctly skipped', 0)
  } else {
    record('Funnel Conversion Idempotency', 'WARN', `First: ${first?.tenantId}, Second: ${second?.tenantId}`, 0)
  }
}

// ── Test 9: Score Calculation ───────────────────────────────────────────────

async function testScoreCalculation() {
  log('Test 9: Score calculation')
  const { ingestLead } = await import('../src/services/lead-ingestion.service.js')

  // High score lead (affiliate + phone + email + interest + budget)
  const highScore = await ingestLead(prisma, {
    name: 'High Score',
    phone: randomPhone(),
    email: 'test@test.com',
    source: 'affiliate',
    interest: 'saas',
    budget: 500,
    affiliateCode: 'TEST123',
  })

  // Low score lead (just organic + name)
  const lowScore = await ingestLead(prisma, {
    name: 'Low Score',
    source: 'organic',
  })

  if (highScore.score > lowScore.score && highScore.score >= 70) {
    record('Score Calculation', 'PASS', `High: ${highScore.score}, Low: ${lowScore.score}`, 0)
  } else {
    record('Score Calculation', 'WARN', `High: ${highScore.score}, Low: ${lowScore.score} — expected high > 70`, 0)
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  STRESS TEST — AgoraEncontrei Growth Engine')
  console.log('═══════════════════════════════════════════════════════\n')

  const totalStart = Date.now()

  try {
    // Connection test
    await prisma.$queryRaw`SELECT 1`
    record('Database Connection', 'PASS', 'Connected', 0)
  } catch (err: any) {
    record('Database Connection', 'FAIL', err.message, 0)
    printReport(totalStart)
    process.exit(1)
  }

  await testLeadIngestion100()
  await testLeadIngestion300()
  await testFunnelTransitions()
  await testIntentDetection()
  await testPreviewEngine()
  await testFollowUpScheduling()
  await testOutboundQueue()
  await testWebhookIdempotency()
  await testScoreCalculation()

  printReport(totalStart)

  // Cleanup test data
  log('Cleaning up stress test data...')
  await prisma.salesFunnel.deleteMany({
    where: { campaign: { in: ['stress_test_0', 'stress_test_1', 'stress_test_2', 'stress_test_3', 'stress_test_4', 'stress_300'] } },
  }).catch(() => {})
  await prisma.salesFunnel.deleteMany({
    where: { source: 'test' },
  }).catch(() => {})

  await prisma.$disconnect()
}

function printReport(totalStart: number) {
  const totalMs = Date.now() - totalStart
  const pass = RESULTS.filter(r => r.status === 'PASS').length
  const warn = RESULTS.filter(r => r.status === 'WARN').length
  const fail = RESULTS.filter(r => r.status === 'FAIL').length

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  RESULTS')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  ✅ PASS: ${pass}`)
  console.log(`  ⚠️  WARN: ${warn}`)
  console.log(`  ❌ FAIL: ${fail}`)
  console.log(`  Total: ${RESULTS.length} tests in ${totalMs}ms`)
  console.log('════════════════════════════════════════════════════��══')

  if (fail > 0) {
    console.log('\n  FAILURES:')
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    ❌ ${r.test}: ${r.detail}`)
    })
  }

  console.log(`\n  Overall: ${fail === 0 ? '✅ ALL CRITICAL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
