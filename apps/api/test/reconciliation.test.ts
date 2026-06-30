import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseCsvStatement,
  parseCnab400Return,
  matchEntries,
  type MatchCandidate,
} from '../src/services/reconciliation.service.js'

test('CSV: parseia data, valor (vírgula), nossoNumero e direção', () => {
  // Extratos BR usam ';' como delimitador (vírgula é o separador decimal).
  const csv = [
    'data;valor;descricao;nossonumero;tipo',
    '2026-06-10;1.500,50;Aluguel jun;000123456;C',
    '15/06/2026;-200,00;Tarifa;;D',
  ].join('\n')
  const e = parseCsvStatement(csv, ';')
  assert.equal(e.length, 2)
  assert.equal(e[0].entryDate, '2026-06-10')
  assert.equal(e[0].amount, 1500.5)
  assert.equal(e[0].direction, 'CREDIT')
  assert.equal(e[0].nossoNumero, '000123456')
  assert.equal(e[1].entryDate, '2026-06-15')
  assert.equal(e[1].direction, 'DEBIT')
})

test('matching: por nossoNumero exato', () => {
  const entries = parseCsvStatement([
    'data;valor;nossonumero',
    '2026-06-10;1500,00;000999',
  ].join('\n'), ';')
  const candidates: MatchCandidate[] = [
    { rentalId: 'R1', nossoNumero: '000999', amount: 1500, dueDate: '2026-06-10' },
    { rentalId: 'R2', nossoNumero: '000111', amount: 1500, dueDate: '2026-06-10' },
  ]
  const m = matchEntries(entries, candidates)
  assert.equal(m[0].matchStatus, 'MATCHED')
  assert.equal(m[0].matchedRentalId, 'R1')
})

test('matching: por valor + data quando único, dentro da tolerância', () => {
  const entries = [{ entryDate: '2026-06-12', amount: 2000, direction: 'CREDIT' as const }]
  const candidates: MatchCandidate[] = [
    { rentalId: 'R1', amount: 2000, dueDate: '2026-06-10' }, // 2 dias de diferença
  ]
  const m = matchEntries(entries, candidates)
  assert.equal(m[0].matchStatus, 'MATCHED')
  assert.equal(m[0].matchedRentalId, 'R1')
})

test('matching: ambíguo (dois candidatos mesmo valor) → não concilia', () => {
  const entries = [{ entryDate: '2026-06-10', amount: 2000, direction: 'CREDIT' as const }]
  const candidates: MatchCandidate[] = [
    { rentalId: 'R1', amount: 2000, dueDate: '2026-06-10' },
    { rentalId: 'R2', amount: 2000, dueDate: '2026-06-11' },
  ]
  const m = matchEntries(entries, candidates)
  assert.equal(m[0].matchStatus, 'UNMATCHED')
})

test('matching: fora da tolerância de data → não concilia', () => {
  const entries = [{ entryDate: '2026-06-30', amount: 2000, direction: 'CREDIT' as const }]
  const candidates: MatchCandidate[] = [{ rentalId: 'R1', amount: 2000, dueDate: '2026-06-10' }]
  const m = matchEntries(entries, candidates)
  assert.equal(m[0].matchStatus, 'UNMATCHED')
})

test('matching: não reusa o mesmo candidato em duas entradas', () => {
  const entries = [
    { entryDate: '2026-06-10', amount: 1000, direction: 'CREDIT' as const, nossoNumero: '777' },
    { entryDate: '2026-06-10', amount: 1000, direction: 'CREDIT' as const, nossoNumero: '777' },
  ]
  const candidates: MatchCandidate[] = [{ rentalId: 'R1', nossoNumero: '777', amount: 1000 }]
  const m = matchEntries(entries, candidates)
  assert.equal(m[0].matchStatus, 'MATCHED')
  assert.equal(m[1].matchStatus, 'UNMATCHED') // candidato já usado
})

test('CNAB400: extrai nossoNumero, valor, ocorrência e data de detalhe', () => {
  // Constrói uma linha de 400 chars com os campos nas posições esperadas.
  const arr = new Array(400).fill(' ')
  arr[0] = '1' // registro de detalhe
  const put = (start: number, str: string) => { for (let i = 0; i < str.length; i++) arr[start + i] = str[i] }
  put(62, '0000000001234567'.padEnd(20, ' ')) // nossoNumero (slice 62..82)
  put(108, '06')        // ocorrência (liquidação)
  put(110, '100626')    // data DDMMYY → 2026-06-10
  put(152, '0000000150000') // valor 13 dígitos → 1500.00
  const line = arr.join('')
  const e = parseCnab400Return(line)
  assert.equal(e.length, 1)
  // nossoNumero preserva os dígitos como vêm no arquivo (zeros à esquerda incluídos).
  assert.equal(e[0].nossoNumero, '0000000001234567')
  assert.equal(e[0].occurrenceCode, '06')
  assert.equal(e[0].entryDate, '2026-06-10')
  assert.equal(e[0].amount, 1500)
})
