/**
 * Mock de Prisma em memória para os testes do módulo de campanhas WhatsApp.
 * Cobre apenas os modelos/métodos exercitados pelos serviços testados.
 * (Não é um arquivo *.test.ts → não é executado como suíte.)
 */

let seq = 0
const nextId = (p: string) => `${p}_${++seq}`

/** Casa um registro contra um `where` com suporte a operadores comuns. */
function matchWhere(row: any, where: any): boolean {
  if (!where) return true
  for (const [key, cond] of Object.entries<any>(where)) {
    // Chave composta unique (companyId_phoneE164 / campaignId_phoneE164)
    if (key.includes('_') && cond && typeof cond === 'object' && !('in' in cond) && !('not' in cond)) {
      for (const [k, v] of Object.entries(cond)) {
        if (row[k] !== v) return false
      }
      continue
    }
    if (cond && typeof cond === 'object') {
      if ('in' in cond) { if (!cond.in.includes(row[key])) return false; continue }
      if ('not' in cond) { if (row[key] === cond.not) return false; continue }
    } else if (row[key] !== cond) {
      return false
    }
  }
  return true
}

/** Aplica um `data` de update, resolvendo { increment: n }. */
function applyData(row: any, data: any) {
  for (const [k, v] of Object.entries<any>(data)) {
    if (v && typeof v === 'object' && 'increment' in v) row[k] = (row[k] ?? 0) + v.increment
    else row[k] = v
  }
}

function makeModel(store: any[], defaults: (d: any) => any) {
  return {
    async create({ data }: any) {
      const row = { id: nextId('r'), createdAt: new Date(), updatedAt: new Date(), ...defaults(data), ...data }
      store.push(row)
      return { ...row }
    },
    async createMany({ data }: any) {
      const rows = Array.isArray(data) ? data : [data]
      for (const d of rows) store.push({ id: nextId('r'), createdAt: new Date(), updatedAt: new Date(), ...defaults(d), ...d })
      return { count: rows.length }
    },
    async findUnique({ where }: any) {
      return store.find((r) => matchWhere(r, where)) ?? null
    },
    async findFirst({ where }: any) {
      return store.find((r) => matchWhere(r, where)) ?? null
    },
    async findMany({ where }: any) {
      return store.filter((r) => matchWhere(r, where)).map((r) => ({ ...r }))
    },
    async count({ where }: any) {
      return store.filter((r) => matchWhere(r, where)).length
    },
    async update({ where, data }: any) {
      const row = store.find((r) => matchWhere(r, where))
      if (row) applyData(row, data)
      return row
    },
    async updateMany({ where, data }: any) {
      const rows = store.filter((r) => matchWhere(r, where))
      rows.forEach((r) => applyData(r, data))
      return { count: rows.length }
    },
    async upsert({ where, create, update }: any) {
      const row = store.find((r) => matchWhere(r, where))
      if (row) { applyData(row, update); return row }
      const created = { id: nextId('r'), createdAt: new Date(), ...create }
      store.push(created)
      return created
    },
    async deleteMany({ where }: any) {
      let count = 0
      for (let i = store.length - 1; i >= 0; i--) {
        if (matchWhere(store[i], where)) { store.splice(i, 1); count++ }
      }
      return { count }
    },
  }
}

export function makeMockPrisma() {
  const db = {
    waCampaign: [] as any[],
    waCampaignRecipient: [] as any[],
    waOptOut: [] as any[],
    waProspectResult: [] as any[],
    lead: [] as any[],
  }

  const prisma: any = {
    __db: db,
    waCampaign: makeModel(db.waCampaign, () => ({
      status: 'DRAFT', riskScore: 0, riskLevel: 'low', riskFactors: [], requiresApproval: false,
      totalRecipients: 0, totalSent: 0, totalDelivered: 0, totalReplied: 0, totalFailed: 0, totalOptOut: 0,
      templateName: null, templateLang: 'pt_BR', variables: {},
    })),
    waCampaignRecipient: makeModel(db.waCampaignRecipient, () => ({ status: 'PENDING', valid: false, variables: {} })),
    waOptOut: makeModel(db.waOptOut, () => ({ reason: 'keyword' })),
    waProspectResult: makeModel(db.waProspectResult, () => ({ status: 'PENDING_REVIEW' })),
    lead: makeModel(db.lead, () => ({ status: 'NEW' })),
  }
  return prisma
}
