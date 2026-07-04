import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveBrainLabel } from '../src/services/tomas.service.js'

// Prisma falso: só precisa de company.findUnique para o resolveBrainLabel.
function fakePrisma(company: { name?: string; settings?: unknown } | null): any {
  return { company: { findUnique: async () => company } }
}

test('sem companyId → cérebro marketplace (nem consulta o banco)', async () => {
  const label = await resolveBrainLabel(fakePrisma(null), undefined)
  assert.equal(label, 'marketplace')
})

test('empresa parceira (Lemos) → cérebro partner', async () => {
  const p = fakePrisma({ name: 'Imobiliária Lemos', settings: {} })
  assert.equal(await resolveBrainLabel(p, 'company_lemos'), 'partner')
})

test('parceiro genérico → cérebro partner', async () => {
  const p = fakePrisma({ name: 'Imob Central', settings: {} })
  assert.equal(await resolveBrainLabel(p, 'company_x'), 'partner')
})

test('empresa PLATAFORMA (canonical) → cérebro marketplace', async () => {
  const p = fakePrisma({ name: 'AgoraEncontrei', settings: { canonical: 'agoraencontrei-platform' } })
  assert.equal(await resolveBrainLabel(p, 'company_platform'), 'marketplace')
})

test('lookup falha → não quebra, cai em partner (companyId presente)', async () => {
  const p: any = { company: { findUnique: async () => { throw new Error('db down') } } }
  assert.equal(await resolveBrainLabel(p, 'company_x'), 'partner')
})
