import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateRescission } from '../src/services/rescission.service.js'

test('rescisão: aluguel proporcional na metade do mês (15/30)', () => {
  const r = calculateRescission({
    monthlyRent: 3000,
    exitDate: new Date(2026, 5, 15), // 15/jun (30 dias)
    contractStart: new Date(2025, 6, 1),
    contractEnd: new Date(2026, 6, 1),
  })
  assert.equal(r.items.find((i) => i.key === 'proRataRent')?.value, 1500)
  assert.equal(r.breakdown.occupiedDays, 15)
  assert.equal(r.breakdown.daysInExitMonth, 30)
})

test('rescisão: multa proporcional ao período restante', () => {
  // base 9000 (3x3000), 1 mês restante de 12 => 750
  const r = calculateRescission({
    monthlyRent: 3000,
    exitDate: new Date(2026, 5, 15),
    contractStart: new Date(2025, 6, 1),
    contractEnd: new Date(2026, 6, 1),
  })
  assert.equal(r.items.find((i) => i.key === 'penalty')?.value, 750)
  assert.equal(r.netResult, 2250) // 1500 + 750
  assert.equal(r.settlement, 'TENANT')
})

test('rescisão: IPTU proporcional + débito - caução (fev 28 dias)', () => {
  const r = calculateRescission({
    monthlyRent: 2000,
    monthlyIptu: 200,
    exitDate: new Date(2026, 1, 10), // 10/fev (28 dias)
    contractStart: new Date(2026, 0, 5),
    contractEnd: new Date(2027, 0, 5),
    outstandingValue: 500,
    depositHeld: 2000,
  })
  assert.equal(r.items.find((i) => i.key === 'proRataRent')?.value, 714.29)
  assert.equal(r.items.find((i) => i.key === 'proRataIptu')?.value, 71.43)
  assert.equal(r.totalCredits, 2000)
  assert.equal(r.netResult, 4785.72)
})

test('rescisão: sem período restante (saída após término) => multa 0', () => {
  const r = calculateRescission({
    monthlyRent: 2500,
    exitDate: new Date(2026, 5, 30),
    contractStart: new Date(2024, 0, 1),
    contractEnd: new Date(2026, 0, 1),
  })
  assert.equal(r.items.find((i) => i.key === 'penalty'), undefined)
  assert.equal(r.breakdown.remainingMonths, 0)
})

test('rescisão: multa integral quando penaltyProportional=false', () => {
  const r = calculateRescission({
    monthlyRent: 1000,
    exitDate: new Date(2026, 2, 10),
    contractStart: new Date(2026, 0, 1),
    contractEnd: new Date(2026, 11, 1),
    penaltyBaseValue: 3000,
    penaltyProportional: false,
  })
  assert.equal(r.items.find((i) => i.key === 'penalty')?.value, 3000)
})
