import { test } from 'node:test'
import assert from 'node:assert/strict'
import { medianPricePerM2 } from '../src/routes/public/bairro-stats.util.js'

test('mediana: valor central de preço/m²', () => {
  // áreas 100 → preços/m²: 1000, 2000, 3000 → mediana 2000
  const { precoMedioM2, amostra } = medianPricePerM2([
    { price: 100000, builtArea: 100 },
    { price: 200000, builtArea: 100 },
    { price: 300000, builtArea: 100 },
  ])
  assert.equal(precoMedioM2, 2000)
  assert.equal(amostra, 3)
})

test('mediana: prioriza builtArea > totalArea > landArea', () => {
  const { precoMedioM2 } = medianPricePerM2([{ price: 100000, builtArea: 50, totalArea: 200, landArea: 500 }])
  assert.equal(precoMedioM2, 2000) // usa builtArea=50 → 2000, não 500/200
})

test('mediana: cai para totalArea quando builtArea ausente/zero', () => {
  const { precoMedioM2 } = medianPricePerM2([{ price: 100000, builtArea: 0, totalArea: 200 }])
  assert.equal(precoMedioM2, 500)
})

test('mediana: cai para landArea quando as demais ausentes', () => {
  const { precoMedioM2 } = medianPricePerM2([{ price: 100000, landArea: 400 }])
  assert.equal(precoMedioM2, 250)
})

test('mediana: ignora linhas sem preço ou sem área', () => {
  const { precoMedioM2, amostra } = medianPricePerM2([
    { price: 0, builtArea: 100 },
    { price: 100000, builtArea: 0, totalArea: 0, landArea: 0 },
    { price: 100000, builtArea: 100 }, // única válida → 1000
  ])
  assert.equal(amostra, 1)
  assert.equal(precoMedioM2, 1000)
})

test('mediana: lista vazia → null', () => {
  assert.deepEqual(medianPricePerM2([]), { precoMedioM2: null, amostra: 0 })
})

test('mediana: aceita Decimal (objeto com toString)', () => {
  // Prisma retorna Decimal; Number(decimal) usa toString.
  const decimal = { toString: () => '150000' }
  const { precoMedioM2 } = medianPricePerM2([{ price: decimal, builtArea: 100 }])
  assert.equal(precoMedioM2, 1500)
})
