import { test } from 'node:test'
import assert from 'node:assert/strict'
import { captureAnalysisSnapshot } from '../src/services/auction-analysis-snapshot.service.js'

const now = new Date('2026-07-15T12:00:00Z')

test('captureAnalysisSnapshot: não sobrescreve snapshot já registrado (imutável)', async () => {
  let updateCalled = false
  const prisma = {
    auction: {
      findUnique: async () => ({ analysisSnapshotAt: new Date('2026-01-01') }),
      update: async () => { updateCalled = true; return {} },
    },
  } as any
  const r = await captureAnalysisSnapshot(prisma, 'a1', now)
  assert.equal(r.captured, false)
  assert.equal(updateCalled, false)
})

test('captureAnalysisSnapshot: leilão inexistente → captured false', async () => {
  const prisma = { auction: { findUnique: async () => null } } as any
  const r = await captureAnalysisSnapshot(prisma, 'missing', now)
  assert.equal(r.captured, false)
})

test('captureAnalysisSnapshot: grava quando ainda não há snapshot', async () => {
  let saved: any = null
  let call = 0
  const prisma = {
    auction: {
      findUnique: async () => {
        call++
        // 1ª chamada: check de existência; 2ª: dados completos do leilão
        if (call === 1) return { analysisSnapshotAt: null }
        return {
          id: 'a1', city: 'Franca', state: 'SP', neighborhood: 'Centro', propertyType: 'HOUSE',
          latitude: null, longitude: null, totalArea: 100, builtArea: null, landArea: null,
          appraisalValue: 300000, minimumBid: 180000, marketPriceEstimate: null,
          occupation: 'DESOCUPADO', discountPercent: 40, financingAvailable: true, fgtsAllowed: false,
          editalUrl: 'x/edital.pdf', documentsUrls: [], registryNumber: '123',
        }
      },
      findMany: async () => [],
      update: async (args: any) => { saved = args.data; return {} },
    },
  } as any
  const r = await captureAnalysisSnapshot(prisma, 'a1', now)
  assert.equal(r.captured, true)
  assert.ok(saved.analysisSnapshot)
  assert.equal(saved.analysisSnapshot.capturedAt, now.toISOString())
  assert.ok(saved.analysisSnapshot.agoraScore)
})
