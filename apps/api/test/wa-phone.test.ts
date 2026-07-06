import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePhoneBR,
  parsePhoneList,
  normalizeAndDedupe,
} from '../src/services/wa-campaigns/phone.util.js'

test('normaliza celular com DDD e máscara para E.164', () => {
  assert.equal(normalizePhoneBR('(11) 91234-5678').e164, '+5511912345678')
  assert.equal(normalizePhoneBR('11912345678').e164, '+5511912345678')
  assert.equal(normalizePhoneBR('+55 11 91234-5678').e164, '+5511912345678')
  assert.equal(normalizePhoneBR('5511912345678').e164, '+5511912345678')
  assert.equal(normalizePhoneBR('011 91234-5678').e164, '+5511912345678')
})

test('insere o nono dígito em celular antigo de 8 dígitos', () => {
  const n = normalizePhoneBR('11 8123-4567') // 8 dígitos → recebe o nono
  assert.equal(n.valid, true)
  assert.equal(n.e164, '+5511981234567')
})

test('rejeita telefone fixo (não entregável no WhatsApp)', () => {
  const n = normalizePhoneBR('11 3234-5678')
  assert.equal(n.valid, false)
  assert.equal(n.reason, 'landline_not_whatsapp')
})

test('rejeita DDD inválido', () => {
  const n = normalizePhoneBR('10 91234-5678')
  assert.equal(n.valid, false)
  assert.equal(n.reason, 'invalid_ddd')
})

test('rejeita muito curto e vazio', () => {
  assert.equal(normalizePhoneBR('12345').reason, 'too_short')
  assert.equal(normalizePhoneBR('').reason, 'empty')
})

test('parsePhoneList separa por linha, vírgula e ponto e vírgula', () => {
  const list = parsePhoneList('11912345678\n11987654321, 21912345678; 11955554444')
  assert.equal(list.length, 4)
})

test('normalizeAndDedupe remove duplicados e separa inválidos', () => {
  const report = normalizeAndDedupe([
    '11912345678',
    '(11) 91234-5678', // duplicado do primeiro
    '11 3234-5678',    // fixo → inválido
    '21987654321',
    'lixo',            // inválido
  ])
  assert.equal(report.valid.length, 2)
  assert.equal(report.duplicates.length, 1)
  assert.equal(report.invalid.length, 2)
})
