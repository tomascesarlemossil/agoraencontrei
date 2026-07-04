import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildMarketplaceSystemPrompt,
  buildPartnerSystemPrompt,
  buildTomasSystemPrompt,
} from '@agoraencontrei/tomas-knowledge'

// Os DOIS cérebros compartilham o motor, mas têm prompt/identidade/dados
// separados. Estes testes travam as garantias de isolamento no nível do prompt.

test('marketplace: identidade nacional e imparcial', () => {
  const p = buildMarketplaceSystemPrompt()
  assert.match(p, /AgoraEncontrei/)
  assert.match(p, /imparcial|IMPARCIAL/i)
  assert.match(p, /Tomás IA/)
})

test('marketplace: NUNCA se apresenta como um parceiro específico', () => {
  const p = buildMarketplaceSystemPrompt()
  assert.match(p, /NUNCA se apresente como sendo da Imobiliária Lemos/i)
})

test('marketplace: sem a bravata "50 anos / 3.000 negociações"', () => {
  const p = buildMarketplaceSystemPrompt()
  assert.doesNotMatch(p, /50 anos/)
  assert.doesNotMatch(p, /3\.000 negocia/i)
})

test('marketplace: NUNCA carrega a base PRIVADA de comparáveis de um parceiro', () => {
  const p = buildMarketplaceSystemPrompt()
  assert.doesNotMatch(p, /COMPAR[ÁA]VEIS INTERNOS DA CARTEIRA/i)
})

test('partner (Lemos): marca própria + 4 modos + base regional privada', () => {
  const p = buildPartnerSystemPrompt({ name: 'Imobiliária Lemos', isLemos: true })
  assert.match(p, /Imobiliária Lemos/)
  for (const mode of ['PÚBLICO', 'CORRETOR', 'ADMINISTRAÇÃO', 'DIREÇÃO']) {
    assert.match(p, new RegExp(mode), `modo ${mode} ausente`)
  }
  // O parceiro canônico enxerga a própria base CMA privada.
  assert.match(p, /COMPAR[ÁA]VEIS INTERNOS DA CARTEIRA/i)
})

test('partner genérico: NÃO recebe dados regionais/carteira de outra empresa', () => {
  const p = buildPartnerSystemPrompt({ name: 'Imob Central' })
  assert.match(p, /Imob Central/)
  assert.doesNotMatch(p, /COMPAR[ÁA]VEIS INTERNOS DA CARTEIRA/i)
  assert.doesNotMatch(p, /MAPA DE FRANCA/i)
})

test('partner: reforça verificar permissão antes de expor dado interno', () => {
  const p = buildPartnerSystemPrompt({ name: 'Imob Y' })
  assert.match(p, /NUNCA revele informação interna a um usuário sem a permissão/i)
})

test('dispatcher: default é o cérebro MARKETPLACE', () => {
  assert.match(buildTomasSystemPrompt(), /imparcial|IMPARCIAL/i)
})

test('dispatcher: brain=partner monta o cérebro do parceiro', () => {
  const p = buildTomasSystemPrompt({ brain: 'partner', partner: { name: 'Imob Z' } })
  assert.match(p, /Imob Z/)
  assert.match(p, /DIREÇÃO/)
})
