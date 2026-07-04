import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  minimalLeadData,
  buildConsentText,
  recordLeadTransferConsent,
  hasValidConsent,
  revokeLeadTransferConsent,
  CONSENT_TEXT_VERSION,
} from '../src/services/lead-transfer-consent.service.js'

// Store em memória imitando a tabela lead_transfer_consents.
function memPrisma() {
  const rows: any[] = []
  let seq = 0
  return {
    _rows: rows,
    auditLog: { create: async () => ({}) },
    leadTransferConsent: {
      create: async ({ data }: any) => { const r = { id: `k${++seq}`, ...data }; rows.push(r); return r },
      findFirst: async ({ where }: any) => {
        const ors = where.OR || []
        return rows.filter(r =>
          r.toCompanyId === where.toCompanyId && r.granted === true && r.revokedAt == null &&
          ors.some((o: any) => (o.visitorId && r.visitorId === o.visitorId) || (o.chatId && r.chatId === o.chatId)),
        ).slice(-1)[0] || null
      },
      updateMany: async ({ where, data }: any) => {
        const ors = where.OR || []
        let count = 0
        for (const r of rows) {
          if (r.toCompanyId === where.toCompanyId && r.granted === true && r.revokedAt == null &&
              ors.some((o: any) => (o.visitorId && r.visitorId === o.visitorId) || (o.chatId && r.chatId === o.chatId))) {
            Object.assign(r, data); count++
          }
        }
        return { count }
      },
    },
  } as any
}

test('minimalLeadData: mantém só o mínimo e descarta o resto (LGPD)', () => {
  const out = minimalLeadData({
    name: 'João', phone: '16999', email: 'a@b.com', city: 'Franca',
    cpf: '12345678900', rg: 'x', fullChatHistory: 'tudo', senha: 'secreta',
  } as any)
  assert.deepEqual(Object.keys(out).sort(), ['city', 'email', 'name', 'phone'])
  assert.equal((out as any).cpf, undefined)
  assert.equal((out as any).fullChatHistory, undefined)
})

test('buildConsentText: informa parceiro, dados, finalidade e canal', () => {
  const t = buildConsentText({
    partnerName: 'Imobiliária Lemos',
    data: { name: 'João', phone: '16999' },
    purpose: 'apresentar imóveis',
    channel: 'WhatsApp',
  })
  assert.match(t, /Imobiliária Lemos/)
  assert.match(t, /nome, telefone/)
  assert.match(t, /apresentar imóveis/)
  assert.match(t, /WhatsApp/)
  assert.match(t, /revogar/)
})

test('fluxo: registrar → consentimento válido → revogar → inválido', async () => {
  const p = memPrisma()
  const rec = await recordLeadTransferConsent(p, {
    visitorId: 'v1', toCompanyId: 'lemos', toCompanyName: 'Imobiliária Lemos',
    purpose: 'contato', channel: 'whatsapp', data: { name: 'João', phone: '16999', cpf: 'x' } as any,
  })
  // versão e minimização gravadas
  assert.equal(rec.consentVersion, CONSENT_TEXT_VERSION)
  assert.deepEqual(Object.keys(rec.dataShared).sort(), ['name', 'phone'])

  assert.equal(await hasValidConsent(p, { toCompanyId: 'lemos', visitorId: 'v1' }), true)
  // outro parceiro não herda o consentimento
  assert.equal(await hasValidConsent(p, { toCompanyId: 'outra', visitorId: 'v1' }), false)
  // outro visitante não herda
  assert.equal(await hasValidConsent(p, { toCompanyId: 'lemos', visitorId: 'v2' }), false)

  const n = await revokeLeadTransferConsent(p, { toCompanyId: 'lemos', visitorId: 'v1' })
  assert.equal(n, 1)
  assert.equal(await hasValidConsent(p, { toCompanyId: 'lemos', visitorId: 'v1' }), false)
})

test('hasValidConsent: sem visitorId/chatId → false (nunca "vale por padrão")', async () => {
  assert.equal(await hasValidConsent(memPrisma(), { toCompanyId: 'lemos' }), false)
})
