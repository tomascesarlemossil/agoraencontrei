import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findActivePortalContract } from '../src/services/portal-auth.service.js'

/**
 * Mock mínimo do Prisma cujo `contract.findFirst` aplica a semântica do `where`
 * de forma genérica (igualdade para chaves escalares; `OR` = qualquer condição).
 * Se o código deixar de escopar por `companyId`, um contrato de outra empresa
 * "vazaria" aqui e os testes de isolamento falham — exatamente o que queremos.
 */
function mockPrisma(contracts: any[]) {
  const matchesWhere = (row: any, where: any): boolean => {
    for (const [k, v] of Object.entries(where)) {
      if (k === 'OR') {
        const ok = (v as any[]).some((cond) =>
          Object.entries(cond).every(([kk, vv]) => row[kk] === vv),
        )
        if (!ok) return false
      } else if (row[k] !== v) {
        return false
      }
    }
    return true
  }
  return {
    contract: {
      findFirst: async ({ where }: any) => contracts.find((c) => matchesWhere(c, where)) ?? null,
    },
  } as any
}

const clientA = { id: 'cli-1', companyId: 'empresa-A' }

test('portal: cliente da empresa A NÃO recebe contrato da empresa B', async () => {
  const prisma = mockPrisma([
    // Contrato da empresa B cujo tenantId coincide com o id do cliente A.
    { id: 'k-B', companyId: 'empresa-B', isActive: true, tenantId: 'cli-1', landlordId: null },
    // Contrato correto, da empresa A.
    { id: 'k-A', companyId: 'empresa-A', isActive: true, tenantId: 'cli-1', landlordId: null },
  ])
  const contract = await findActivePortalContract(prisma, clientA)
  assert.ok(contract, 'deveria retornar um contrato')
  assert.equal(contract!.id, 'k-A')
})

test('portal: contrato com tenantId/landlordId correspondente mas companyId diferente é ignorado', async () => {
  const prisma = mockPrisma([
    { id: 'k-B', companyId: 'empresa-B', isActive: true, tenantId: 'cli-1', landlordId: 'cli-1' },
  ])
  const contract = await findActivePortalContract(prisma, clientA)
  assert.equal(contract, null)
})

test('portal: o contrato retornado sempre pertence à mesma company do cliente/tenant', async () => {
  const prisma = mockPrisma([
    { id: 'k-A', companyId: 'empresa-A', isActive: true, tenantId: null, landlordId: 'cli-1' },
    { id: 'k-B', companyId: 'empresa-B', isActive: true, tenantId: null, landlordId: 'cli-1' },
  ])
  const contract = await findActivePortalContract(prisma, clientA)
  assert.ok(contract)
  // A empresa do contrato precisa bater com a do cliente (validado pelo where).
  const chosen = [
    { id: 'k-A', companyId: 'empresa-A' },
    { id: 'k-B', companyId: 'empresa-B' },
  ].find((c) => c.id === contract!.id)!
  assert.equal(chosen.companyId, clientA.companyId)
})

test('portal: cliente sem contrato ATIVO continua autenticando, mas contract = null', async () => {
  const prisma = mockPrisma([
    // Existe contrato da empresa certa, mas inativo → não conta.
    { id: 'k-A', companyId: 'empresa-A', isActive: false, tenantId: 'cli-1', landlordId: null },
  ])
  const contract = await findActivePortalContract(prisma, clientA)
  assert.equal(contract, null)
})

test('portal: encontra por landlordId quando o cliente é o proprietário', async () => {
  const prisma = mockPrisma([
    { id: 'k-A', companyId: 'empresa-A', isActive: true, tenantId: 'outro', landlordId: 'cli-1' },
  ])
  const contract = await findActivePortalContract(prisma, clientA)
  assert.ok(contract)
  assert.equal(contract!.id, 'k-A')
})
