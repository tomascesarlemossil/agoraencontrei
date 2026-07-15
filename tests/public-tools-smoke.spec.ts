import { expect, request as pwRequest, test } from '@playwright/test'

const BASE_URL = 'https://www.agoraencontrei.com.br'

const tools = [
  ['/ferramentas', 'Ferramentas para resolver toda a jornada do imovel.'],
  ['/central-do-comprador', 'Compre melhor, com dados, comparacao e apoio do Tomas.'],
  ['/central-do-proprietario', 'Venda ou alugue com preco, apresentacao e documentos no lugar.'],
  ['/servicos/tour-inteligente', 'Tour'],
  ['/servicos/documentacao-imobiliaria', 'document'],
  ['/financiamentos', 'Financiamento'],
  ['/empresas-parceiras', 'parceir'],
  ['/bairros', 'bairr'],
  ['/leiloes', 'Leil'],
  ['/alertas', 'alert'],
] as const

const journeyDestinations = [
  '/imoveis',
  '/comparar',
  '/financiamentos',
  '/servicos/documentacao-imobiliaria',
  '/contato',
  '/alertas',
  '/avaliacao',
  '/servicos/fotos-imoveis',
  '/anunciar-gratis',
  '/corretores',
  '/meu-painel',
] as const

test.describe('Ferramentas públicas — disponibilidade e conteúdo', () => {
  test.setTimeout(60_000)

  for (const [route, expectedText] of tools) {
    test(`${route} responde e renderiza conteúdo principal`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `${route} não pode responder 4xx/5xx`).toBeLessThan(400)
      await expect(page.getByText(expectedText, { exact: false }).first()).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('body')).not.toContainText('Algo deu errado')
    })
  }

  test('todos os destinos expostos pela central de ferramentas respondem', async () => {
    const ctx = await pwRequest.newContext()
    for (const [route] of tools.slice(1)) {
      const response = await ctx.get(`${BASE_URL}${route}`, { timeout: 30_000 })
      expect(response.status(), route).toBeLessThan(400)
    }
    await ctx.dispose()
  })

  test('todos os passos das jornadas de comprador e proprietário respondem', async () => {
    const ctx = await pwRequest.newContext()
    for (const route of journeyDestinations) {
      const response = await ctx.get(`${BASE_URL}${route}`, { timeout: 30_000 })
      expect(response.status(), route).toBeLessThan(400)
    }
    await ctx.dispose()
  })
})
