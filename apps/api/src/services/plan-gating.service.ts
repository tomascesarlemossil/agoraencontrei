/**
 * Plan Gating — enforces subscription-plan limits.
 *
 * Os limites (maxProperties, maxUsers) vivem em PlanDefinition mas, até
 * agora, nunca eram checados: um tenant Lite podia criar imóveis e
 * usuários sem limite. Este serviço fecha essa brecha.
 *
 * Regras:
 *   - Empresa SEM Tenant (a própria plataforma / Imobiliária Lemos) não
 *     tem limite — retorna sem erro.
 *   - Plano não cadastrado em PlanDefinition → não bloqueia (fail-open).
 *   - Limite -1 → ilimitado.
 */

import type { PrismaClient } from '@prisma/client'

export type PlanQuota = 'properties' | 'users'

export class PlanLimitError extends Error {
  readonly statusCode = 403
  readonly code = 'PLAN_LIMIT_REACHED'
  constructor(
    readonly quota: PlanQuota,
    readonly limit: number,
    readonly planName: string,
  ) {
    const label = quota === 'properties' ? 'imóveis' : 'usuários'
    super(
      `Limite do plano ${planName} atingido: máximo de ${limit} ${label}. ` +
      `Faça upgrade do plano para adicionar mais.`,
    )
    this.name = 'PlanLimitError'
  }
}

/**
 * Lança PlanLimitError se a empresa já atingiu o limite do plano para o
 * recurso pedido. Deve ser chamado ANTES de criar o recurso.
 */
export async function assertWithinPlanQuota(
  prisma: PrismaClient,
  companyId: string,
  quota: PlanQuota,
): Promise<void> {
  const tenant = await prisma.tenant
    .findFirst({ where: { companyId }, select: { plan: true } })
    .catch(() => null)
  if (!tenant) return // plataforma / empresa sem plano SaaS

  const plan = await prisma.planDefinition
    .findUnique({
      where: { slug: (tenant.plan || '').toLowerCase() },
      select: { maxProperties: true, maxUsers: true, name: true },
    })
    .catch(() => null)
  if (!plan) return // plano não cadastrado — não bloqueia

  const limit = quota === 'properties' ? plan.maxProperties : plan.maxUsers
  if (limit == null || limit < 0) return // ilimitado

  const current = quota === 'properties'
    ? await prisma.property.count({ where: { companyId } })
    : await prisma.user.count({ where: { companyId, status: { not: 'INACTIVE' } } })

  if (current >= limit) {
    throw new PlanLimitError(quota, limit, plan.name)
  }
}
