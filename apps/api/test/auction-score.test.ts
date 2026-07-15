import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeAgoraScore } from '../src/services/auction-score.service.js'

const baseInput = {
  occupation: null as string | null,
  financingAvailable: false,
  fgtsAllowed: false,
  hasEdital: false,
  hasMatricula: false,
  hasRegistryNumber: false,
}

test('computeAgoraScore: nota fica entre 0 e 100 e critérios somam a nota', () => {
  const s = computeAgoraScore(baseInput, null, null)
  assert.ok(s.score >= 0 && s.score <= 100)
  const sum = s.criteria.reduce((a, c) => a + c.points, 0)
  assert.equal(s.score, Math.round(sum))
  assert.equal(s.criteria.length, 8)
})

test('computeAgoraScore: oportunidade forte pontua alto', () => {
  const strong = computeAgoraScore(
    { occupation: 'DESOCUPADO', financingAvailable: true, fgtsAllowed: true, hasEdital: true, hasMatricula: true, hasRegistryNumber: true },
    { netMarginPercent: 35, minimumBid: 200000, marketValue: { conservative: 300000 } as any, costs: { totalCosts: 30000 } as any } as any,
    { marketEstimate: { confidence: 80, sampleSize: 20 } as any, comparables: [], inflatedAppraisal: { realDiscountPercent: 35, appraisalAboveMarketPercent: -5 } as any } as any,
  )
  assert.ok(strong.score >= 75, `esperava >=75, veio ${strong.score}`)
  assert.ok(['EXCEPCIONAL', 'FORTE'].includes(strong.grade))
})

test('computeAgoraScore: imóvel fraco/ocupado e sem dados pontua baixo', () => {
  const weak = computeAgoraScore(
    { ...baseInput, occupation: 'OCUPADO' },
    { netMarginPercent: -5, minimumBid: 200000, marketValue: null, costs: { totalCosts: 60000 } as any } as any,
    null,
  )
  assert.ok(weak.score < 60, `esperava <60, veio ${weak.score}`)
})

test('computeAgoraScore: grade segue as faixas', () => {
  assert.equal(computeAgoraScore(baseInput, null, null).gradeLabel.length > 0, true)
})
