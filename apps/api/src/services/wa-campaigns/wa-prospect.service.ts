/**
 * Agente de pesquisa de empresas/contatos comerciais PÚBLICOS.
 *
 * Regras de segurança do MVP:
 *  - NÃO faz scraping de navegador nem automação de WhatsApp Web.
 *  - NÃO coleta dados pessoais sensíveis — apenas dados comerciais públicos.
 *  - TODO resultado entra como PENDING_REVIEW e exige revisão humana + fonte
 *    (sourceRef) antes de poder virar destinatário de campanha.
 *
 * No MVP o "agente" é SIMULADO: devolve candidatos de exemplo, claramente
 * marcados como necessitando verificação, sem inventar números reais. A
 * integração real (ex.: Google Places API, diretórios públicos de CNPJ) é
 * plugada depois substituindo `runResearch`.
 */

import type { PrismaClient } from '@prisma/client'
import { normalizePhoneBR } from './phone.util.js'
import { addRecipients } from './wa-campaigns.service.js'

export interface ResearchInput {
  companyId: string
  campaignId?: string
  query: string
  city?: string
  category?: string
  limit?: number
}

interface RawProspect {
  name: string
  phone?: string
  category?: string
  city?: string
  sourceRef: string
  sourceUrl?: string
}

/**
 * Executa a "pesquisa". Ponto de extensão para integrar uma fonte real.
 * No MVP retorna candidatos de exemplo determinísticos — sem telefones reais,
 * forçando o revisor humano a preencher/validar o contato antes do envio.
 */
async function runResearch(input: ResearchInput): Promise<RawProspect[]> {
  const limit = Math.min(input.limit ?? 5, 25)
  const city = input.city ?? 'sua cidade'
  const category = input.category ?? input.query

  const results: RawProspect[] = []
  for (let i = 1; i <= limit; i++) {
    results.push({
      name: `${category} — Exemplo ${i}`,
      phone: undefined, // MVP não inventa telefones; revisor humano preenche.
      category,
      city,
      sourceRef: `SIMULADO: substituir por fonte pública verificável (ex.: perfil comercial de "${category}" em ${city}). Requer verificação humana.`,
      sourceUrl: undefined,
    })
  }
  return results
}

export async function researchProspects(prisma: PrismaClient, input: ResearchInput) {
  const raw = await runResearch(input)
  const created = []
  for (const p of raw) {
    const norm = p.phone ? normalizePhoneBR(p.phone) : null
    const row = await (prisma as any).waProspectResult.create({
      data: {
        companyId: input.companyId,
        campaignId: input.campaignId,
        name: p.name,
        phone: p.phone,
        phoneE164: norm?.e164 ?? null,
        category: p.category,
        city: p.city,
        sourceRef: p.sourceRef,
        sourceUrl: p.sourceUrl,
        status: 'PENDING_REVIEW',
      },
    })
    created.push(row)
  }
  return created
}

export async function listProspects(
  prisma: PrismaClient,
  companyId: string,
  filters?: { campaignId?: string; status?: string },
) {
  return (prisma as any).waProspectResult.findMany({
    where: {
      companyId,
      ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

/**
 * Revisão humana: aprova (opcionalmente corrigindo telefone/fonte) ou rejeita.
 * Aprovação sem telefone válido é bloqueada — sem contato não há envio.
 */
export async function reviewProspect(
  prisma: PrismaClient,
  companyId: string,
  prospectId: string,
  input: { action: 'approve' | 'reject'; phone?: string; sourceRef?: string; notes?: string; reviewedById: string },
) {
  const prospect = await (prisma as any).waProspectResult.findFirst({ where: { id: prospectId, companyId } })
  if (!prospect) throw new Error('PROSPECT_NOT_FOUND')

  if (input.action === 'reject') {
    return (prisma as any).waProspectResult.update({
      where: { id: prospectId },
      data: { status: 'REJECTED', reviewedById: input.reviewedById, reviewedAt: new Date(), notes: input.notes },
    })
  }

  // Aprovação exige telefone válido (do resultado ou corrigido pelo revisor).
  const phone = input.phone ?? prospect.phone
  const norm = phone ? normalizePhoneBR(phone) : null
  if (!norm?.valid || !norm.e164) throw new Error('APPROVE_REQUIRES_VALID_PHONE')

  return (prisma as any).waProspectResult.update({
    where: { id: prospectId },
    data: {
      status: 'APPROVED',
      phone,
      phoneE164: norm.e164,
      sourceRef: input.sourceRef ?? prospect.sourceRef,
      notes: input.notes,
      reviewedById: input.reviewedById,
      reviewedAt: new Date(),
    },
  })
}

/**
 * Importa prospects APROVADOS para a campanha como destinatários, registrando
 * origem `prospect_agent`, base LGPD `legitimate_interest` e a fonte pública.
 */
export async function importApprovedProspects(
  prisma: PrismaClient,
  args: { companyId: string; campaignId: string },
) {
  const approved = await (prisma as any).waProspectResult.findMany({
    where: { companyId: args.companyId, status: 'APPROVED', phoneE164: { not: null } },
  })

  if (approved.length === 0) {
    return { imported: 0, report: null }
  }

  const report = await addRecipients(prisma, {
    campaignId: args.campaignId,
    companyId: args.companyId,
    entries: approved.map((p: any) => ({
      raw: p.phoneE164,
      name: p.name,
      source: 'prospect_agent',
      consentBasis: 'legitimate_interest',
      sourceRef: p.sourceRef,
    })),
  })

  await (prisma as any).waProspectResult.updateMany({
    where: { id: { in: approved.map((p: any) => p.id) } },
    data: { status: 'IMPORTED', campaignId: args.campaignId },
  })

  return { imported: report.added, report }
}
