import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateInstallmentPlan } from '../src/services/agreement.service.js'

function sum(plan: { amount: number }[]) {
  return Math.round(plan.reduce((s, p) => s + p.amount, 0) * 100) / 100
}

test('acordo: parcelas somam exatamente o valor acordado (resto na última)', () => {
  const plan = generateInstallmentPlan({
    agreedValue: 1000,
    installments: 3,
    firstDueDate: new Date(2026, 0, 31),
  })
  assert.equal(plan.length, 3)
  assert.equal(sum(plan), 1000)
  assert.equal(plan[0].amount, 333.33)
  assert.equal(plan[2].amount, 333.34) // última absorve o centavo
})

test('acordo: clamp de fim de mês nos vencimentos (jan31 -> fev28 -> mar31)', () => {
  const plan = generateInstallmentPlan({
    agreedValue: 900,
    installments: 3,
    firstDueDate: new Date(2026, 0, 31),
  })
  assert.equal(plan[0].dueDate, '2026-01-31')
  assert.equal(plan[1].dueDate, '2026-02-28')
  assert.equal(plan[2].dueDate, '2026-03-31')
})

test('acordo: parcela única', () => {
  const plan = generateInstallmentPlan({
    agreedValue: 5000,
    installments: 1,
    firstDueDate: new Date(2026, 5, 10),
  })
  assert.equal(plan.length, 1)
  assert.equal(plan[0].amount, 5000)
  assert.equal(plan[0].dueDate, '2026-06-10')
})

test('acordo: valor quebrado fecha em centavos', () => {
  const plan = generateInstallmentPlan({
    agreedValue: 999.99,
    installments: 4,
    firstDueDate: new Date(2026, 11, 15),
  })
  assert.equal(sum(plan), 999.99)
})

test('acordo: intervalo bimestral', () => {
  const plan = generateInstallmentPlan({
    agreedValue: 600,
    installments: 3,
    firstDueDate: new Date(2026, 0, 10),
    intervalMonths: 2,
  })
  assert.equal(plan[0].dueDate, '2026-01-10')
  assert.equal(plan[1].dueDate, '2026-03-10')
  assert.equal(plan[2].dueDate, '2026-05-10')
})
