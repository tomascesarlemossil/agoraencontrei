import { test } from 'node:test'
import assert from 'node:assert/strict'
import { executeTool } from '../src/services/tomas.service.js'
import { ROLE_RANK } from '../src/services/tomas-policy.js'

// Prisma falso: registra auditLog e resolve consentimento conforme o teste.
function fakePrisma(opts: { consent?: any } = {}): any {
  const audits: any[] = []
  const captured: any = {}
  return {
    _audits: audits,
    _captured: captured,
    auditLog: { create: async (a: any) => { audits.push(a.data); return a.data } },
    leadTransferConsent: { findFirst: async () => opts.consent ?? null },
    property: {
      findMany: async (args: any) => { captured.where = args?.where; return [] },
      findFirst: async () => null,
    },
  }
}
const parse = (s: string) => JSON.parse(s)

test('ferramenta desconhecida → not_allowed (nem toca no banco)', async () => {
  const r = parse(await executeTool(fakePrisma(), 'rm_rf', {}, 'c1', 'dashboard', { brain: 'partner', roleRank: ROLE_RANK.ADMIN }))
  assert.equal(r.error, 'not_allowed')
})

test('parceiro: ferramenta interna sem companyId → not_allowed', async () => {
  const r = parse(await executeTool(fakePrisma(), 'consultar_contatos', {}, undefined, 'site', { brain: 'partner', roleRank: ROLE_RANK.ADMIN }))
  assert.equal(r.error, 'not_allowed')
})

test('parceiro: corretor NÃO acessa contratos (admin+) → not_allowed', async () => {
  const r = parse(await executeTool(fakePrisma(), 'consultar_contratos', {}, 'c1', 'dashboard', { brain: 'partner', roleRank: ROLE_RANK.BROKER }))
  assert.equal(r.error, 'not_allowed')
})

test('intel da plataforma NUNCA no cérebro do parceiro → not_allowed', async () => {
  const r = parse(await executeTool(fakePrisma(), 'intel_plataforma', {}, 'c1', 'dashboard', { brain: 'partner', roleRank: ROLE_RANK.SUPER_ADMIN }))
  assert.equal(r.error, 'not_allowed')
})

test('escrita sensível sem confirmação → needs_confirmation (não executa)', async () => {
  const p = fakePrisma()
  const r = parse(await executeTool(p, 'criar_proposta', { valor: 1 }, 'c1', 'dashboard', { brain: 'partner', roleRank: ROLE_RANK.ADMIN }))
  assert.equal(r.needs_confirmation, true)
  assert.equal(r.action, 'criar_proposta')
  assert.equal(p._audits.length, 0) // não auditou porque não executou
})

test('transferir_lead SEM consentimento → consent_required (bloqueado)', async () => {
  const r = parse(await executeTool(fakePrisma({ consent: null }), 'transferir_lead', { toCompanyId: 'p1' }, undefined, 'site', {
    brain: 'marketplace', roleRank: ROLE_RANK.anonymous, confirmed: true, visitorId: 'v1',
  }))
  assert.equal(r.error, 'consent_required')
})

test('transferir_lead COM consentimento → ok + auditado', async () => {
  const p = fakePrisma({ consent: { id: 'k1', granted: true } })
  const r = parse(await executeTool(p, 'transferir_lead', { toCompanyId: 'p1' }, undefined, 'site', {
    brain: 'marketplace', roleRank: ROLE_RANK.anonymous, confirmed: true, visitorId: 'v1',
  }))
  assert.equal(r.ok, true)
  assert.equal(r.toCompanyId, 'p1')
  // escrita autorizada foi auditada
  assert.ok(p._audits.some((a: any) => a.action === 'tomas.tool.transferir_lead'))
})

test('leitura pública de imóveis continua liberada (sem regressão)', async () => {
  const r = parse(await executeTool(fakePrisma(), 'buscar_imoveis', { city: 'Franca' }, undefined, 'site', { brain: 'marketplace', roleRank: 0 }))
  assert.equal(r.found, 0) // mock retorna [], mas passou pela política sem erro
})

test('anti-injeção: companyId injetado no tool input é IGNORADO (usa o do servidor)', async () => {
  const p = fakePrisma()
  // Usuário/modelo tenta forçar outra empresa via toolInput.companyId.
  await executeTool(p, 'buscar_imoveis', { companyId: 'EMPRESA_DE_OUTRO_TENANT', city: 'X' }, 'company_do_jwt', 'dashboard', { brain: 'partner', roleRank: 1 })
  // O escopo real usa o companyId do servidor (JWT), nunca o do input.
  assert.equal(p._captured.where.companyId, 'company_do_jwt')
})

test('anti-injeção: marketplace público força authorizedPublish e não vaza rascunhos', async () => {
  const p = fakePrisma()
  await executeTool(p, 'buscar_imoveis', { city: 'X' }, undefined, 'site', { brain: 'marketplace', roleRank: 0 })
  assert.equal(p._captured.where.authorizedPublish, true)
  assert.equal(p._captured.where.companyId, undefined) // nacional: sem filtro de empresa, mas só publicados
})
