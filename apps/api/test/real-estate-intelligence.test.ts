import test from 'node:test'
import assert from 'node:assert/strict'
import { estimateMarketValue, identifyNeighborhood } from '../src/services/real-estate-intelligence.service.js'
import { evaluateToolPolicy } from '../src/services/tomas-policy.js'
import { capturePropertySnapshot, scoreDuplicate } from '../src/services/property-intelligence-ingestion.service.js'

test('ferramentas imobiliárias são leitura pública e preservam fail-closed', () => {
  for (const name of ['identificar_bairro', 'buscar_comparaveis', 'estimar_valor_imovel', 'consultar_indice_bairro', 'consultar_historico_preco']) {
    const decision = evaluateToolPolicy(name, { brain: 'marketplace', roleRank: 0 })
    assert.equal(decision.decision, 'allow')
    if (decision.decision === 'allow') assert.equal(decision.policy.access, 'read')
  }
})

test('estimativa retorna faixa e deixa explícito que usa preço anunciado', async () => {
  const prices = [400_000, 450_000, 500_000, 550_000]
  const prisma = {
    property: {
      findMany: async () => prices.map((price, index) => ({
        id: String(index), reference: null, title: `Imóvel ${index}`, city: 'Franca', neighborhood: 'Centro',
        type: 'HOUSE', purpose: 'SALE', price, priceRent: null, builtArea: 100, landArea: 150,
        totalArea: 100, bedrooms: 3, updatedAt: new Date(), publishedAt: new Date(),
      })),
    },
  } as any
  const result = await estimateMarketValue(prisma, { city: 'Franca', neighborhood: 'Centro', builtArea: 100 }, { publicOnly: true })
  assert.equal(result.validComparables, 4)
  assert.equal(result.dataClass, 'statistical_estimate_from_asking_prices')
  assert.ok(result.estimate && result.estimate.low <= result.estimate.central && result.estimate.central <= result.estimate.high)
  assert.match(result.warning, /preços anunciados/i)
})

test('bairro é tratado como inferência, não como fato oficial', async () => {
  const prisma = { property: { findMany: async () => [{ neighborhood: 'Jardim Paulistano' }, { neighborhood: 'Jardim Paulistano' }, { neighborhood: 'Jardim Paulistano' }] } } as any
  const result = await identifyNeighborhood(prisma, { city: 'Franca', street: 'Rua Exemplo' }, { publicOnly: true })
  assert.equal(result.neighborhood, 'Jardim Paulistano')
  assert.equal(result.classification, 'inference_from_listings')
  assert.match(result.warning, /fonte territorial oficial/i)
})

test('deduplicação pontua candidato sem confirmar automaticamente evidência insuficiente', () => {
  const base = { id: 'a', street: 'Rua das Flores', number: '10', city: 'Franca', neighborhood: 'Centro', latitude: null, longitude: null, builtArea: 100, landArea: 150, bedrooms: 3, parkingSpaces: 2, condoName: null }
  const candidate = { ...base, id: 'b', street: 'R. das Flores', builtArea: 103 }
  const result = scoreDuplicate(base, candidate)
  assert.equal(result.probableDuplicate, false)
  assert.equal(result.score, 65)
  assert.ok(result.reasons.some(reason => reason.rule === 'same_normalized_address'))
})

test('captura recusa fonte sem autorização de armazenamento', async () => {
  const prisma = { intelligenceDataSource: { findUnique: async () => ({ isActive: true, legalStatus: 'PENDING', storageAllowed: false }) } } as any
  const result = await capturePropertySnapshot(prisma, { propertyId: 'p1', sourceSlug: 'portal-x' })
  assert.deepEqual(result, { captured: false, reason: 'source_not_authorized_for_storage' })
})
