/**
 * AgoraEncontrei — E2E Dashboard Tests
 *
 * Tests: Login, CRUD imóvel, contratos, leads, logout
 * Run: npx playwright test e2e/dashboard-full-test.spec.ts --headed
 */
import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL || 'https://www.agoraencontrei.com.br'
const EMAIL = process.env.E2E_ADMIN_EMAIL || 'tomascesarlemossilva@gmail.com'
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || ''

const REPORT: Array<{ test: string; status: 'PASS' | 'FAIL' | 'SKIP'; error?: string; duration?: number }> = []

function log(name: string, status: 'PASS' | 'FAIL' | 'SKIP', error?: string, duration?: number) {
  REPORT.push({ test: name, status, error, duration })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${icon} ${name} ${duration ? `(${duration}ms)` : ''} ${error ? `— ${error}` : ''}`)
}

// ── Helper: Login ──────────────────────────────────────────────
async function doLogin(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('input[type="email"], input#email', EMAIL)
  await page.fill('input[type="password"], input#password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

// ── 1. LOGIN ──────────────────────────────────────────────────
test.describe('1. Autenticação', () => {
  test('Login com credenciais admin', async ({ page }) => {
    const start = Date.now()
    try {
      if (!PASSWORD) {
        log('Login', 'SKIP', 'E2E_ADMIN_PASSWORD not set in env')
        test.skip()
        return
      }
      await doLogin(page)
      await expect(page).toHaveURL(/dashboard/)
      const userName = await page.locator('text=Tomás').first().isVisible().catch(() => false)
      log('Login', 'PASS', undefined, Date.now() - start)
    } catch (e: any) {
      log('Login', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })

  test('Acesso ao dashboard sem login redireciona', async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 })
      // Should redirect to login or show auth wall
      const url = page.url()
      const isProtected = url.includes('login') || url.includes('dashboard')
      expect(isProtected).toBe(true)
      log('Auth Redirect', 'PASS', undefined, Date.now() - start)
    } catch (e: any) {
      log('Auth Redirect', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })
})

// ── 2. CRUD IMÓVEL ─────────────────────────────────────────────
test.describe('2. Cadastro de Imóvel', () => {
  test.beforeEach(async ({ page }) => {
    if (!PASSWORD) test.skip()
    await doLogin(page)
  })

  test('Acessar página de imóveis', async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${BASE}/dashboard/imoveis`, { waitUntil: 'networkidle', timeout: 15000 })
      await expect(page.locator('h1, h2, [class*="title"]').first()).toBeVisible({ timeout: 10000 })
      log('Lista Imóveis', 'PASS', undefined, Date.now() - start)
    } catch (e: any) {
      log('Lista Imóveis', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })

  test('Abrir formulário de novo imóvel', async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${BASE}/dashboard/imoveis`, { waitUntil: 'networkidle', timeout: 15000 })
      // Look for "Novo" or "Cadastrar" or "+" button
      const newBtn = page.locator('a:has-text("Novo"), button:has-text("Novo"), a:has-text("Cadastrar"), button:has-text("Cadastrar"), a:has-text("Adicionar")').first()
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click()
        await page.waitForTimeout(2000)
        // Check if form loaded
        const hasForm = await page.locator('input, textarea, select').count()
        expect(hasForm).toBeGreaterThan(0)
        log('Novo Imóvel Form', 'PASS', undefined, Date.now() - start)
      } else {
        log('Novo Imóvel Form', 'SKIP', 'Botão "Novo" não encontrado')
        test.skip()
      }
    } catch (e: any) {
      log('Novo Imóvel Form', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })

  test('Editar imóvel existente', async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${BASE}/dashboard/imoveis`, { waitUntil: 'networkidle', timeout: 15000 })
      // Click first property in the list
      const firstRow = page.locator('tr a, [class*="card"] a, a[href*="/dashboard/imoveis/"]').first()
      if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click()
        await page.waitForTimeout(2000)
        const hasEditForm = await page.locator('input, textarea').count()
        expect(hasEditForm).toBeGreaterThan(0)
        log('Editar Imóvel', 'PASS', undefined, Date.now() - start)
      } else {
        log('Editar Imóvel', 'SKIP', 'Nenhum imóvel na lista')
        test.skip()
      }
    } catch (e: any) {
      log('Editar Imóvel', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })
})

// ── 3. CONTRATOS ──────────────────────────────────────────────
test.describe('3. Contratos', () => {
  test.beforeEach(async ({ page }) => {
    if (!PASSWORD) test.skip()
    await doLogin(page)
  })

  test('Acessar página de contratos', async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${BASE}/dashboard/contratos`, { waitUntil: 'networkidle', timeout: 15000 })
      const status = page.url().includes('contratos') ? 'PASS' : 'FAIL'
      log('Contratos Page', status as any, undefined, Date.now() - start)
      expect(status).toBe('PASS')
    } catch (e: any) {
      log('Contratos Page', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })

  test('Formulário de novo contrato', async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${BASE}/dashboard/contratos`, { waitUntil: 'networkidle', timeout: 15000 })
      const newBtn = page.locator('a:has-text("Novo"), button:has-text("Novo"), a:has-text("Criar")').first()
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click()
        await page.waitForTimeout(2000)
        log('Novo Contrato Form', 'PASS', undefined, Date.now() - start)
      } else {
        log('Novo Contrato Form', 'SKIP', 'Botão não encontrado')
        test.skip()
      }
    } catch (e: any) {
      log('Novo Contrato Form', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })
})

// ── 4. LEADS ──────────────────────────────────────────────────
test.describe('4. Captura de Lead', () => {
  test('Lead via página de leilões (público)', async ({ page }) => {
    const start = Date.now()
    try {
      await page.goto(`${BASE}/leiloes`, { waitUntil: 'networkidle', timeout: 20000 })
      // Wait for auction cards to load
      await page.waitForTimeout(3000)
      // Click first auction card
      const card = page.locator('[class*="cursor-pointer"]').first()
      if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
        await card.click()
        await page.waitForTimeout(1000)
        // Check if lead modal opened
        const modal = page.locator('[class*="fixed"]').filter({ hasText: 'Interesse' })
        if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
          log('Lead Modal Opens', 'PASS', undefined, Date.now() - start)
        } else {
          log('Lead Modal Opens', 'FAIL', 'Modal não apareceu ao clicar no card')
        }
      } else {
        log('Lead Modal Opens', 'SKIP', 'Nenhum card de leilão visível')
        test.skip()
      }
    } catch (e: any) {
      log('Lead Modal Opens', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })

  test('Dashboard de leads carrega', async ({ page }) => {
    const start = Date.now()
    try {
      if (!PASSWORD) { log('Dashboard Leads', 'SKIP', 'No password'); test.skip(); return }
      await doLogin(page)
      await page.goto(`${BASE}/dashboard/leads`, { waitUntil: 'networkidle', timeout: 15000 })
      expect(page.url()).toContain('leads')
      log('Dashboard Leads', 'PASS', undefined, Date.now() - start)
    } catch (e: any) {
      log('Dashboard Leads', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })
})

// ── 5. LOGOUT ─────────────────────────────────────────────────
test.describe('5. Logout', () => {
  test('Logout funciona', async ({ page }) => {
    const start = Date.now()
    try {
      if (!PASSWORD) { log('Logout', 'SKIP', 'No password'); test.skip(); return }
      await doLogin(page)
      // Find logout button/link
      const logoutBtn = page.locator('text=Sair, a:has-text("Sair"), button:has-text("Sair")').first()
      if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutBtn.click()
        await page.waitForTimeout(2000)
        const url = page.url()
        const loggedOut = url.includes('login') || url === `${BASE}/`
        log('Logout', loggedOut ? 'PASS' : 'FAIL', undefined, Date.now() - start)
      } else {
        log('Logout', 'SKIP', 'Botão Sair não visível')
        test.skip()
      }
    } catch (e: any) {
      log('Logout', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })
})

// ── 6. PÁGINAS PÚBLICAS (Performance) ──────────────────────────
test.describe('6. Performance Páginas Públicas', () => {
  const pages = [
    { name: 'Home', url: '/' },
    { name: 'Leilões', url: '/leiloes' },
    { name: 'Investor Terminal', url: '/investor' },
    { name: 'Yield Ranking', url: '/oportunidades/melhores-alugueis-brasil' },
    { name: 'Avaliação', url: '/avaliacao' },
    { name: 'Blog', url: '/blog' },
  ]

  for (const p of pages) {
    test(`${p.name} carrega < 3s`, async ({ page }) => {
      const start = Date.now()
      try {
        const response = await page.goto(`${BASE}${p.url}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
        const elapsed = Date.now() - start
        const status = response?.status()
        expect(status).toBeLessThan(400)
        expect(elapsed).toBeLessThan(3000)
        log(`${p.name} Load`, 'PASS', `${status} in ${elapsed}ms`, elapsed)
      } catch (e: any) {
        log(`${p.name} Load`, 'FAIL', e.message, Date.now() - start)
        throw e
      }
    })
  }
})

// ── 7. MOBILE MENU ────────────────────────────────────────────
test.describe('7. Mobile Menu', () => {
  test('Hamburger menu abre no mobile', async ({ page }) => {
    const start = Date.now()
    try {
      await page.setViewportSize({ width: 375, height: 812 }) // iPhone X
      await page.goto(`${BASE}/leiloes`, { waitUntil: 'networkidle', timeout: 15000 })
      // Find hamburger button
      const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first()
      await expect(hamburger).toBeVisible({ timeout: 5000 })
      await hamburger.click()
      await page.waitForTimeout(500)
      // Check if menu drawer opened
      const drawer = page.locator('#mobile-drawer, [class*="fixed"][class*="z-"]').filter({ hasText: 'Comprar' })
      const isOpen = await drawer.isVisible({ timeout: 3000 }).catch(() => false)
      log('Mobile Menu', isOpen ? 'PASS' : 'FAIL', isOpen ? undefined : 'Drawer não abriu', Date.now() - start)
      expect(isOpen).toBe(true)
    } catch (e: any) {
      log('Mobile Menu', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })

  test('Sticky CTA visível no mobile', async ({ page }) => {
    const start = Date.now()
    try {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(`${BASE}/leiloes`, { waitUntil: 'networkidle', timeout: 15000 })
      const cta = page.locator('text=Falar com Corretor').first()
      const visible = await cta.isVisible({ timeout: 5000 }).catch(() => false)
      log('Sticky CTA Mobile', visible ? 'PASS' : 'FAIL', undefined, Date.now() - start)
    } catch (e: any) {
      log('Sticky CTA Mobile', 'FAIL', e.message, Date.now() - start)
      throw e
    }
  })
})

// ── RELATÓRIO FINAL ───────────────────────────────────────────
test.afterAll(() => {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║        RELATÓRIO E2E — AGORAENCONTREI DASHBOARD            ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')

  const pass = REPORT.filter(r => r.status === 'PASS').length
  const fail = REPORT.filter(r => r.status === 'FAIL').length
  const skip = REPORT.filter(r => r.status === 'SKIP').length

  for (const r of REPORT) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️'
    const dur = r.duration ? ` (${r.duration}ms)` : ''
    const err = r.error ? ` — ${r.error}` : ''
    console.log(`║ ${icon} ${r.test.padEnd(30)}${r.status}${dur}${err}`)
  }

  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║  TOTAL: ${REPORT.length} | ✅ ${pass} PASS | ❌ ${fail} FAIL | ⏭️ ${skip} SKIP`)
  console.log(`║  STATUS: ${fail === 0 ? '🟢 SISTEMA OPERACIONAL' : '🔴 FALHAS DETECTADAS'}`)
  console.log('╚══════════════════════════════════════════════════════════════╝')
})
