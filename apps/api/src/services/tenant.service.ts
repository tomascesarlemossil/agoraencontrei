/**
 * Tenant Service — Gestão de clones SaaS
 *
 * Gerencia criação, provisionamento e suspensão de tenants.
 * Cada tenant é um site isolado com dados próprios.
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../utils/env.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface CreateTenantInput {
  name: string
  subdomain: string
  customDomain?: string
  domainType?: 'subdomain' | 'new' | 'own'
  layoutType?: 'luxury' | 'clean' | 'social' | 'marketplace'
  plan?: 'LITE' | 'PRO' | 'ENTERPRISE'
  primaryColor?: string
  logoUrl?: string
  ownerId?: string
  asaasApiKey?: string
}

export interface TenantSummary {
  id: string
  name: string
  subdomain: string
  customDomain: string | null
  layoutType: string
  plan: string
  planStatus: string
  isActive: boolean
  createdAt: Date
}

// ── Constants ───────────────────────────────────────────────────────────────

// Plan prices are read from PlanDefinition at runtime — no hardcoded values
async function getPlanPrice(prisma: any, planSlug: string): Promise<number> {
  const planDef = await prisma.planDefinition?.findFirst?.({
    where: { slug: planSlug.toLowerCase(), isActive: true },
    select: { priceMonthly: true },
  }).catch(() => null)
  return planDef ? Number(planDef.priceMonthly) : 0
}

const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'mail', 'smtp', 'ftp', 'ns1', 'ns2',
  'dashboard', 'portal', 'blog', 'help', 'support', 'docs', 'status',
  'staging', 'dev', 'test', 'demo', 'lemos', 'agora', 'agoraencontrei',
]

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Valida se o subdomínio está disponível.
 */
export async function isSubdomainAvailable(
  prisma: PrismaClient,
  subdomain: string,
): Promise<{ available: boolean; reason?: string }> {
  const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

  if (normalized.length < 3) {
    return { available: false, reason: 'Subdomínio deve ter pelo menos 3 caracteres' }
  }
  if (normalized.length > 50) {
    return { available: false, reason: 'Subdomínio muito longo (máx 50 chars)' }
  }
  if (RESERVED_SUBDOMAINS.includes(normalized)) {
    return { available: false, reason: 'Subdomínio reservado' }
  }

  const existing = await (prisma as any).tenant?.findUnique?.({
    where: { subdomain: normalized },
  }).catch(() => null)

  if (existing) {
    return { available: false, reason: 'Subdomínio já está em uso' }
  }

  return { available: true }
}

/**
 * Cria um novo tenant (clone) com ambiente isolado.
 * O site nasce 100% vazio, sem dados da Imobiliária Lemos.
 */
export async function createTenant(
  prisma: PrismaClient,
  input: CreateTenantInput,
): Promise<any> {
  const subdomain = input.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
  const plan = input.plan || 'LITE'

  // 1. Criar Company isolada para o tenant
  const company = await prisma.company.create({
    data: {
      name: input.name,
      plan: plan.toLowerCase(),
      settings: {
        isTenant: true,
        layoutType: input.layoutType || 'urban_tech',
        primaryColor: input.primaryColor || '#d4a853',
      },
      isActive: true,
    },
  })

  // 2. Criar registro do Tenant
  const tenant = await (prisma as any).tenant.create({
    data: {
      name: input.name,
      subdomain,
      customDomain: input.customDomain || null,
      domainType: input.domainType || 'subdomain',
      layoutType: input.layoutType || 'clean',
      primaryColor: input.primaryColor || '#3b82f6',
      logoUrl: input.logoUrl || null,
      plan,
      planStatus: 'TRIAL',
      planPrice: await getPlanPrice(prisma, plan),
      splitPercent: 2.00,
      repasseDelayDays: 7,
      companyId: company.id,
      ownerId: input.ownerId || null,
      asaasApiKey: input.asaasApiKey || null,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      settings: {},
    },
  })

  return { tenant, company }
}

/**
 * Ativa um tenant após confirmação de pagamento.
 */
export async function activateTenant(
  prisma: PrismaClient,
  tenantId: string,
  asaasSubscriptionId?: string,
): Promise<any> {
  return (prisma as any).tenant.update({
    where: { id: tenantId },
    data: {
      planStatus: 'ACTIVE',
      activatedAt: new Date(),
      suspendedAt: null,
      asaasSubscriptionId: asaasSubscriptionId || undefined,
    },
  })
}

/**
 * Suspende um tenant por inadimplência.
 */
export async function suspendTenant(
  prisma: PrismaClient,
  tenantId: string,
): Promise<any> {
  return (prisma as any).tenant.update({
    where: { id: tenantId },
    data: {
      planStatus: 'SUSPENDED',
      isActive: false,
      suspendedAt: new Date(),
    },
  })
}

/**
 * Busca tenant pelo subdomínio ou domínio customizado.
 */
export async function findTenantByHost(
  prisma: PrismaClient,
  host: string,
): Promise<any | null> {
  // Try subdomain first
  let tenant = await (prisma as any).tenant.findUnique({
    where: { subdomain: host },
  }).catch(() => null)

  if (tenant) return tenant

  // Try custom domain
  tenant = await (prisma as any).tenant.findUnique({
    where: { customDomain: host },
  }).catch(() => null)

  return tenant
}

/**
 * Lista todos os tenants para o painel master.
 */
export async function listTenants(
  prisma: PrismaClient,
  filters?: { planStatus?: string; isActive?: boolean },
): Promise<any[]> {
  return (prisma as any).tenant.findMany({
    where: {
      ...(filters?.planStatus && { planStatus: filters.planStatus }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Calcula métricas MRR para o painel master.
 */
export async function calculateMRR(
  prisma: PrismaClient,
): Promise<{
  totalTenants: number
  activeTenants: number
  mrr: number
  arr: number
  churnRate: number
}> {
  const allTenants = await (prisma as any).tenant.findMany({
    select: { planStatus: true, planPrice: true, suspendedAt: true, createdAt: true },
  })

  const active = allTenants.filter((t: any) => t.planStatus === 'ACTIVE')
  const suspended = allTenants.filter((t: any) => t.planStatus === 'SUSPENDED')
  const mrr = active.reduce((sum: number, t: any) => sum + Number(t.planPrice || 0), 0)

  return {
    totalTenants: allTenants.length,
    activeTenants: active.length,
    mrr,
    arr: mrr * 12,
    churnRate: allTenants.length > 0
      ? Math.round((suspended.length / allTenants.length) * 100)
      : 0,
  }
}

/**
 * Registra domínio customizado na Vercel API.
 */
export async function addDomainToVercel(
  domain: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  const vercelToken = (env as any).VERCEL_TOKEN
  const projectId = (env as any).VERCEL_PROJECT_ID

  if (!vercelToken || !projectId) {
    return { success: false, error: 'VERCEL_TOKEN or VERCEL_PROJECT_ID not configured' }
  }

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      },
    )

    // Vercel API response — apenas `error.message` é consumido quando !ok.
    const data = await res.json() as { error?: { message?: string } } & Record<string, unknown>

    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Vercel API error' }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
