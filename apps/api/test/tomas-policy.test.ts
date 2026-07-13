import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateToolPolicy, roleRank, ROLE_RANK } from '../src/services/tomas-policy.js'

const partner = (over: any = {}) => ({ brain: 'partner' as const, companyId: 'c1', roleRank: ROLE_RANK.ADMIN, ...over })
const market = (over: any = {}) => ({ brain: 'marketplace' as const, roleRank: ROLE_RANK.anonymous, ...over })

test('ferramenta desconhecida = negada (fail-closed)', () => {
  const d = evaluateToolPolicy('drop_all_tables', partner())
  assert.equal(d.decision, 'deny')
})

test('intel da plataforma: só marketplace + direção (rank 3); parceiro negado', () => {
  assert.equal(evaluateToolPolicy('intel_plataforma', market({ roleRank: ROLE_RANK.SUPER_ADMIN })).decision, 'allow')
  assert.equal(evaluateToolPolicy('intel_plataforma', market({ roleRank: ROLE_RANK.ADMIN })).decision, 'deny')
  // parceiro NUNCA acessa intel global, nem como admin
  assert.equal(evaluateToolPolicy('intel_plataforma', partner({ roleRank: ROLE_RANK.SUPER_ADMIN })).decision, 'deny')
})

test('ferramenta de parceiro exige companyId', () => {
  assert.equal(evaluateToolPolicy('consultar_contatos', partner({ companyId: undefined })).decision, 'deny')
  assert.equal(evaluateToolPolicy('consultar_contatos', partner()).decision, 'allow')
})

test('corretor (rank 1) NÃO executa ação administrativa (rank 2)', () => {
  const broker = partner({ roleRank: ROLE_RANK.BROKER })
  assert.equal(evaluateToolPolicy('consultar_contratos', broker).decision, 'deny') // admin+
  assert.equal(evaluateToolPolicy('consultar_documentos', broker).decision, 'allow') // broker+
})

test('escrita exige confirmação explícita', () => {
  const ctx = partner({ roleRank: ROLE_RANK.ADMIN })
  const noConfirm = evaluateToolPolicy('criar_proposta', ctx)
  assert.equal(noConfirm.decision, 'needs_confirmation')
  const confirmed = evaluateToolPolicy('criar_proposta', { ...ctx, confirmed: true })
  assert.equal(confirmed.decision, 'allow')
})

test('transferir_lead: só marketplace, escrita, exige confirmação', () => {
  assert.equal(evaluateToolPolicy('transferir_lead', partner()).decision, 'deny') // não existe no cérebro partner
  const m = evaluateToolPolicy('transferir_lead', market())
  assert.equal(m.decision, 'needs_confirmation')
  assert.equal(evaluateToolPolicy('transferir_lead', market({ confirmed: true })).decision, 'allow')
})

test('gerar_cobranca: escrita sensível, administração+ e confirmação', () => {
  assert.equal(evaluateToolPolicy('gerar_cobranca', partner({ roleRank: ROLE_RANK.BROKER })).decision, 'deny')
  assert.equal(evaluateToolPolicy('gerar_cobranca', partner({ roleRank: ROLE_RANK.ADMIN })).decision, 'needs_confirmation')
})

test('leitura pública de imóveis liberada para anônimo nos dois cérebros', () => {
  assert.equal(evaluateToolPolicy('buscar_imoveis', market()).decision, 'allow')
  assert.equal(evaluateToolPolicy('buscar_imoveis', { brain: 'partner', companyId: 'c1', roleRank: 0 }).decision, 'allow')
})

test('conhecimento e diretório público liberados nos dois cérebros', () => {
  for (const brain of ['marketplace', 'partner'] as const) {
    assert.equal(evaluateToolPolicy('consultar_conhecimento_publico', { brain, roleRank: 0 }).decision, 'allow')
    assert.equal(evaluateToolPolicy('buscar_parceiros', { brain, roleRank: 0 }).decision, 'allow')
  }
})

test('roleRank: desconhecido/nulo → 0 (anônimo)', () => {
  assert.equal(roleRank(null), 0)
  assert.equal(roleRank('HACKER'), 0)
  assert.equal(roleRank('SUPER_ADMIN'), 3)
})
