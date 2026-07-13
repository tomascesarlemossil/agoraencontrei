import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PLATFORM_PLANS,
  buildMarketplaceSystemPrompt,
  buildPartnerSystemPrompt,
  searchPublicKnowledge,
} from '@agoraencontrei/tomas-knowledge'
import { executeTool } from '../src/services/tomas.service.js'

test('conhecimento: Neo é tratado como possível referência à NIU, sem misturar homônimos', () => {
  const results = searchPublicKnowledge('Neo Arquitetura')
  assert.equal(results[0]?.id, 'niu-profile')
  assert.match(results[0]?.details.join(' ') ?? '', /não é o nome confirmado.*quis dizer NIU/i)
})

test('conhecimento: Douglas retorna papel, contexto e fontes verificáveis', () => {
  const results = searchPublicKnowledge('quem é Douglas')
  assert.equal(results[0]?.id, 'douglas-costa-niu')
  assert.match(results[0]?.summary ?? '', /gestor de obras/i)
  assert.ok((results[0]?.sources?.length ?? 0) >= 2)
})

test('conhecimento: ferramentas retornam rota pública acionável', () => {
  const results = searchPublicKnowledge('simulação de financiamento')
  assert.equal(results[0]?.path, '/financiamentos')
})

test('prompts dos dois cérebros instruem consulta pública sem romper isolamento', () => {
  const marketplace = buildMarketplaceSystemPrompt()
  const partner = buildPartnerSystemPrompt({ name: 'Empresa Teste' })
  assert.match(marketplace, /consultar_conhecimento_publico/)
  assert.match(partner, /buscar_parceiros/)
  assert.match(marketplace, /NUNCA acesse, mencione ou exponha informações internas/i)
})

test('prompt operacional exige justificativa nas indicações e não inventa tour 360', async () => {
  const source = await import('../src/services/tomas.service.js')
  assert.ok(source.executeTool)
  const file = await import('node:fs/promises').then(fs => fs.readFile(new URL('../src/services/tomas.service.ts', import.meta.url), 'utf8'))
  assert.match(file, /explique em 1-2 frases por que o perfil combina/i)
  assert.match(file, /não significa automaticamente tour 360°/i)
})

test('fallback editorial dos planos acompanha os limites públicos atuais', () => {
  const lite = PLATFORM_PLANS.find(plan => plan.slug === 'lite')
  const pro = PLATFORM_PLANS.find(plan => plan.slug === 'pro')
  assert.deepEqual(lite?.limits, { properties: 5, leadViews: 10, users: 1, aiRequests: 0 })
  assert.deepEqual(pro?.limits, { properties: 30, leadViews: 50, users: 5, aiRequests: 100 })
})

test('ferramenta: planos ativos vêm do banco e planos internos são omitidos', async () => {
  const prisma = {
    planDefinition: {
      findMany: async () => [
        { slug: 'fundador', name: 'Fundador', priceMonthly: 0, priceYearly: 0, metadata: { internal: true } },
        { slug: 'pro', name: 'Pro Atual', priceMonthly: 321, priceYearly: 3210, metadata: {}, features: [], modules: [] },
      ],
    },
  } as any

  const result = JSON.parse(await executeTool(
    prisma,
    'consultar_conhecimento_publico',
    { query: 'quanto custa o plano pro?' },
    undefined,
    'site',
    { brain: 'marketplace', roleRank: 0 },
  ))

  assert.equal(result.activePlans.length, 1)
  assert.equal(result.activePlans[0].name, 'Pro Atual')
  assert.equal(result.activePlans[0].priceMonthly, 321)
})

test('ferramenta: busca por Neo retorna somente o parceiro NIU verificado', async () => {
  const prisma = { specialist: { findMany: async () => [] } } as any
  const result = JSON.parse(await executeTool(
    prisma,
    'buscar_parceiros',
    { query: 'Neo Arquitetura' },
    undefined,
    'site',
    { brain: 'marketplace', roleRank: 0 },
  ))

  assert.equal(result.found, 1)
  assert.equal(result.partners[0].name, 'NIU Arquitetura')
  assert.match(result.nameClarification, /se chama NIU Arquitetura/i)
})

test('ferramenta: pergunta natural sobre Douglas encontra a NIU', async () => {
  const prisma = { specialist: { findMany: async () => [] } } as any
  const result = JSON.parse(await executeTool(
    prisma,
    'buscar_parceiros',
    { query: 'quem é Douglas?' },
    undefined,
    'site',
    { brain: 'marketplace', roleRank: 0 },
  ))

  assert.equal(result.found, 1)
  assert.equal(result.partners[0].people[1].role, 'gestor de obras')
})
