const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeText, addressKey, auditProperties } = require('./audit-public-properties')
const base = {
  companyId: 'lemos', importSource: 'univen', description: 'Descricao completa',
  coverImage: 'https://img.test/a.jpg', images: ['https://img.test/a.jpg'],
  street: 'Rua Sao Jose', number: '10', complement: 'Apto 2', neighborhood: 'Centro',
  city: 'Franca', state: 'SP',
}
test('normalizes accents and punctuation for stable matching', () => {
  assert.equal(normalizeText('  LOCACAO - Sao Jose '), 'locacao sao jose')
  assert.equal(addressKey(base), 'rua sao jose|10|apto 2|centro|franca|sp')
})
test('accepts a complete unique property', () => {
  const result = auditProperties([{ ...base, id: '1', reference: 'AP-1', externalId: '100', title: 'Apartamento' }])
  assert.equal(result.blockingCount, 0)
})
test('blocks duplicate source ids and shared images', () => {
  const properties = [
    { ...base, id: '1', reference: 'AP-1', externalId: '100', title: 'Apartamento' },
    { ...base, id: '2', companyId: 'old', reference: 'AP-1', externalId: '100', title: 'Copia' },
  ]
  const result = auditProperties(properties)
  assert.equal(result.findings.duplicateExternalIds.length, 1)
  assert.equal(result.findings.duplicateIdentity.length, 1)
  assert.equal(result.findings.sharedImages.length, 1)
  assert.equal(result.blockingCount, 3)
})
test('blocks incomplete public listings', () => {
  const result = auditProperties([{ ...base, id: '1', reference: 'AP-2', externalId: '101',
    title: 'Apartamento', description: '', coverImage: null, images: [] }])
  assert.equal(result.blockingCount, 3)
})
