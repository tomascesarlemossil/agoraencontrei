import { test, expect, request as pwRequest } from '@playwright/test'

/**
 * Smoke de páginas públicas + rotas que já quebraram em produção. Roda contra
 * E2E_BASE_URL (default produção). Valida que nenhuma responde 5xx — em
 * especial /comparar (que retornava 500 por ler o param errado) e os sitemaps
 * (que já ficaram 404/timeout).
 */
const BASE_URL = process.env.E2E_BASE_URL || 'https://agoraencontrei.com.br'

// Rotas públicas críticas — devem responder 2xx (ou 3xx), nunca 5xx.
const PUBLIC_ROUTES = [
  '/',
  '/leiloes',
  '/imoveis-a-venda',
  '/imoveis-para-alugar',
  '/comparar',
  '/comparar/franca-vs-ribeirao-preto', // combinação city-vs-city (regressão do 500)
  '/especialistas',
  '/meu-painel',                          // painel do especialista (magic-link)
  '/login',
  '/parceiros/cadastro',
]

// Sitemaps que precisam responder 200 e conter XML.
const SITEMAP_ROUTES = [
  '/sitemap-index.xml',
  '/sitemaps/cidades',
  '/sitemaps/blog',
]

test.describe('Público — smoke de disponibilidade', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route} não retorna 5xx`, async () => {
      const ctx = await pwRequest.newContext()
      const res = await ctx.get(`${BASE_URL}${route}`, { maxRedirects: 5, timeout: 30_000 })
      const status = res.status()
      console.log(`${route} → ${status}`)
      expect(status, `${route} deveria responder < 500`).toBeLessThan(500)
      await ctx.dispose()
    })
  }

  for (const route of SITEMAP_ROUTES) {
    test(`sitemap ${route} responde 200 XML`, async () => {
      const ctx = await pwRequest.newContext()
      const res = await ctx.get(`${BASE_URL}${route}`, { timeout: 30_000 })
      console.log(`${route} → ${res.status()}`)
      expect(res.status()).toBe(200)
      const body = await res.text()
      expect(body).toContain('<')
      await ctx.dispose()
    })
  }
})

test.describe('Comparar cidades — conteúdo', () => {
  test('/comparar/franca-vs-ribeirao-preto renderiza os dois nomes', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/comparar/franca-vs-ribeirao-preto`, { waitUntil: 'domcontentloaded' })
    // A correção do 500: a página deve montar (não 5xx) e mostrar o comparativo.
    expect(res?.status() ?? 200).toBeLessThan(500)
    await expect(page.locator('h1')).toContainText('vs')
    await expect(page.locator('text=Comparação Detalhada')).toBeVisible()
  })
})

test.describe('Login white-label — etapa 1', () => {
  test('/login mostra campo de identificador e marca AgoraEncontrei', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#identifier, input[name="email"], input[type="email"]').first()).toBeVisible()
    // Selo de propaganda AgoraEncontrei sempre presente.
    await expect(page.locator('text=AgoraEncontrei').first()).toBeVisible()
  })
})
