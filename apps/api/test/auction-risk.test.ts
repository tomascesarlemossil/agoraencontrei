import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeRiskMatrix } from '../src/services/auction-risk.service.js'

const base = {
  occupation: null as string | null, hasDebts: null as boolean | null, debtDetails: null as string | null,
  restrictions: null as string | null, processNumber: null as string | null, registryNumber: null as string | null,
  editalUrl: null as string | null, documentsUrls: [] as string[], visitDate: null as Date | string | null,
  modality: null as string | null,
}

test('computeRiskMatrix: cobre as 6 dimensões', () => {
  const rm = computeRiskMatrix(base)
  assert.equal(rm.dimensions.length, 6)
  assert.ok(['ALTO', 'MEDIO', 'BAIXO'].includes(rm.overall))
})

test('computeRiskMatrix: imóvel ocupado com débitos e sem visita → risco alto', () => {
  const rm = computeRiskMatrix({ ...base, occupation: 'OCUPADO', hasDebts: true, restrictions: 'Penhora ativa' })
  assert.equal(rm.overall, 'ALTO')
  assert.equal(rm.dimensions.find((d) => d.key === 'ocupacao')?.level, 'ALTO')
  assert.equal(rm.dimensions.find((d) => d.key === 'debitos')?.level, 'ALTO')
  assert.equal(rm.dimensions.find((d) => d.key === 'onus')?.level, 'ALTO')
})

test('computeRiskMatrix: desocupado, sem débito, com matrícula e visita → risco baixo/médio', () => {
  const rm = computeRiskMatrix({
    ...base, occupation: 'DESOCUPADO', hasDebts: false, registryNumber: '123',
    visitDate: new Date('2026-08-01'),
  })
  assert.equal(rm.dimensions.find((d) => d.key === 'ocupacao')?.level, 'BAIXO')
  assert.equal(rm.dimensions.find((d) => d.key === 'matricula')?.level, 'BAIXO')
  assert.notEqual(rm.overall, 'ALTO')
})
