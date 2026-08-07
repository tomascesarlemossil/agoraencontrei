import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeDivergences } from '../src/services/auction-divergence.service.js'

const base = {
  title: null as string | null, description: null as string | null, propertyType: 'HOUSE' as string | null,
  totalArea: null as number | null, builtArea: null as number | null, landArea: null as number | null,
  bedrooms: 0, appraisalValue: null as number | null, minimumBid: null as number | null,
  discountPercent: null as number | null, timeline: null as any,
}

test('computeDivergences: imóvel consistente → nenhuma divergência', () => {
  const r = computeDivergences({ ...base, appraisalValue: 300000, minimumBid: 210000, discountPercent: 30, totalArea: 100, builtArea: 90 })
  assert.equal(r.count, 0)
})

test('computeDivergences: desconto declarado diverge do calculado', () => {
  // calculado = 1 - 210000/300000 = 30%, declarado 45% → divergência
  const r = computeDivergences({ ...base, appraisalValue: 300000, minimumBid: 210000, discountPercent: 45 })
  assert.ok(r.divergences.some((d) => d.key === 'discount'))
})

test('computeDivergences: área construída maior que total', () => {
  const r = computeDivergences({ ...base, totalArea: 80, builtArea: 120 })
  assert.ok(r.divergences.some((d) => d.key === 'area_built_gt_total'))
})

test('computeDivergences: quartos no título divergem do cadastro', () => {
  const r = computeDivergences({ ...base, title: 'Apartamento 3 quartos no Centro', bedrooms: 2 })
  assert.ok(r.divergences.some((d) => d.key === 'bedrooms'))
})

test('computeDivergences: variação de avaliação entre ocorrências', () => {
  const r = computeDivergences({ ...base, timeline: [{ appraisalValue: 200000, totalArea: null }, { appraisalValue: 300000, totalArea: null }] })
  assert.ok(r.divergences.some((d) => d.key === 'appraisal_variance'))
})
