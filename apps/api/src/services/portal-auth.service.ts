import type { PrismaClient } from '@prisma/client'

export interface PortalClientRef {
  id: string
  companyId: string
}

export interface PortalContract {
  id: string
  status: string
  rentValue: unknown
  propertyAddress: string | null
  startDate: Date | null
}

/**
 * Busca o contrato ATIVO do cliente do portal, SEMPRE escopado à empresa do
 * cliente. O `companyId` vem exclusivamente do cliente/tenant resolvido no
 * login (subdomínio) — NUNCA de dados do body. Assim um cliente da empresa A
 * jamais recebe um contrato da empresa B, mesmo que exista um contrato de outra
 * empresa cujo `tenantId`/`landlordId` coincida com o id do cliente.
 */
export async function findActivePortalContract(
  prisma: Pick<PrismaClient, 'contract'>,
  client: PortalClientRef,
): Promise<PortalContract | null> {
  return (prisma as any).contract.findFirst({
    where: {
      companyId: client.companyId,
      isActive: true,
      OR: [{ tenantId: client.id }, { landlordId: client.id }],
    },
    select: { id: true, status: true, rentValue: true, propertyAddress: true, startDate: true },
  })
}
