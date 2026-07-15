import test from 'node:test'
import assert from 'node:assert/strict'
import { estimateMarketValue, identifyNeighborhood } from '../src/services/real-estate-intelligence.service.js'
import { evaluateToolPolicy } from '../src/services/tomas-policy.js'
import { capturePropertySnapshot, scoreDuplicate } from '../src/services/property-intelligence-ingestion.service.js'
import { normalizeTerritorialName, resolveTerritorialAddress } from '../src/services/territorial-intelligence.service.js'
import { importTerritorialRows, validateTerritorialImportRow } from '../src/services/territorial-ingestion.service.js'
import { ibgeFrancaStreetCount } from '../src/services/ibge-territorial-seed.service.js'

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

test('normalização territorial remove tipo e acentos sem destruir o nome', () => {
  assert.equal(normalizeTerritorialName('Avenida São Vicente'), 'sao vicente')
  assert.equal(normalizeTerritorialName('R. das Flores'), 'das flores')
})

test('cadastro territorial canônico tem precedência sobre inferência de anúncios', async () => {
  let listingQueries = 0
  const prisma = {
    territorialCity: { findFirst: async () => ({ id: 'franca', name: 'Franca', stateCode: 'SP', ibgeCode: '3516200', confidence: 95 }) },
    territorialStreet: { findFirst: async () => ({
      id: 'rua-1', name: 'Rua Exemplo', streetType: 'Rua', postalCode: '14400000', confidence: 90,
      neighborhood: { id: 'bairro-1', name: 'Centro', kind: 'OFFICIAL', confidence: 95 },
    }) },
    property: { findMany: async () => { listingQueries++; return [{ neighborhood: 'Bairro divergente' }] } },
  } as any

  const resolution = await resolveTerritorialAddress(prisma, { city: 'Franca', state: 'SP', street: 'Rua Exemplo' })
  assert.equal(resolution.classification, 'canonical_street_mapping')
  assert.equal(resolution.neighborhood?.name, 'Centro')

  const result = await identifyNeighborhood(prisma, { city: 'Franca', street: 'Rua Exemplo' }, { publicOnly: true })
  assert.equal(result.neighborhood, 'Centro')
  assert.equal(result.classification, 'canonical_street_mapping')
  assert.equal(listingQueries, 0)
})

test('resolução territorial usa CEP como preferência e recua para rua oficial sem CEP', async () => {
  let streetQueries = 0
  const prisma = {
    territorialCity: { findFirst: async () => ({ id: 'franca', name: 'Franca', stateCode: 'SP', confidence: 95 }) },
    territorialStreet: { findFirst: async ({ where }: any) => {
      streetQueries++
      if (where.postalCode) return null
      return { id: 'rua-ibge', name: 'Rua Exemplo', streetType: 'Rua', postalCode: null, confidence: 85, neighborhood: null }
    } },
  } as any
  const result = await resolveTerritorialAddress(prisma, { city: 'Franca', state: 'SP', street: 'Rua Exemplo', postalCode: '14400-000' })
  assert.equal(result.street?.id, 'rua-ibge')
  assert.equal(streetQueries, 2)
})

test('importação territorial valida UF e confiança e aceita rua sem bairro confirmado', () => {
  assert.deepEqual(validateTerritorialImportRow({ city: 'Franca', state: 'SP', neighborhood: 'Centro' }), { valid: true, errors: [] })
  assert.deepEqual(validateTerritorialImportRow({ city: 'Franca', state: 'SP', street: 'Rua oficial sem bairro confirmado' }), { valid: true, errors: [] })
  const invalid = validateTerritorialImportRow({ city: 'Franca', state: 'S', street: 'Rua sem bairro', confidence: 120 })
  assert.equal(invalid.valid, false)
  assert.deepEqual(invalid.errors, ['state_must_have_two_letters', 'confidence_out_of_range'])
})

test('importação territorial recusa fonte sem autorização de armazenamento', async () => {
  const prisma = { intelligenceDataSource: { findUnique: async () => ({ isActive: true, legalStatus: 'PENDING', storageAllowed: false }) } } as any
  const result = await importTerritorialRows(prisma, { sourceSlug: 'fonte-nao-aprovada', rows: [{ city: 'Franca', state: 'SP' }] })
  assert.deepEqual(result, { imported: false, reason: 'source_not_authorized_for_storage', processed: 0 })
})

test('recorte IBGE de Franca contém a carga consolidada esperada', () => {
  assert.equal(ibgeFrancaStreetCount, 2977)
})

test('vinculação territorial trata cidade como precisão independente da rua', async () => {
  let cityUpdate: any = null
  const prisma = {
    territorialCity: { findMany: async () => [{ id: 'franca', name: 'Franca', stateCode: 'SP' }] },
    property: {
      updateMany: async (args: any) => { cityUpdate = args; return { count: 3 } },
      findMany: async () => [],
    },
  } as any
  const { linkPropertiesToTerritory } = await import('../src/services/territorial-ingestion.service.js')
  const result = await linkPropertiesToTerritory(prisma)
  assert.equal(result.cityLinked, 3)
  assert.equal(cityUpdate.data.territorialCityId, 'franca')
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
