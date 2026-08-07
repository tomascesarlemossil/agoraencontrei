import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeDocumentText } from '../src/services/auction-document-analysis.service.js'

test('analyzeDocumentText: texto vazio → hasText false, sem flags', () => {
  const a = analyzeDocumentText('')
  assert.equal(a.hasText, false)
  assert.equal(a.flags.length, 0)
})

test('analyzeDocumentText: extrai matrícula/cartório/processo e sinaliza penhora e ocupação', () => {
  const text = `
    IMÓVEL objeto da matrícula nº 12.345 do 2º Oficial de Registro de Imóveis da Comarca de Franca.
    Consta PENHORA nos autos do processo 0001234-56.2023.8.26.0196.
    O imóvel encontra-se OCUPADO; a desocupação correrá por conta do arrematante.
    Há débitos de condomínio em atraso. Aceita financiamento e FGTS.`
  const a = analyzeDocumentText(text)
  assert.equal(a.registryNumber, '12345')
  assert.ok(a.registryOffice && /registro de im/i.test(a.registryOffice))
  assert.equal(a.processNumber, '0001234-56.2023.8.26.0196')
  const types = a.flags.map((f) => f.type)
  assert.ok(types.includes('penhora'))
  assert.ok(types.includes('ocupado'))
  assert.ok(types.includes('debitos'))
  assert.ok(types.includes('financiamento'))
  // ALTA vem antes de INFO na ordenação
  assert.equal(a.flags[0].severity, 'ALTA')
  // Gera perguntas de diligência
  assert.ok(a.questions.some((q) => /ocupante/i.test(q)))
})

test('analyzeDocumentText: cada flag traz um trecho do documento', () => {
  const a = analyzeDocumentText('Consta hipoteca em favor do banco credor.')
  const hip = a.flags.find((f) => f.type === 'hipoteca')
  assert.ok(hip && hip.excerpt.length > 0)
})
