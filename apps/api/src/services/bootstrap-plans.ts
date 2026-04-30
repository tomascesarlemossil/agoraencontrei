/**
 * Bootstrap idempotente de PlanDefinition + NicheTemplate.
 *
 * Roda no boot do servidor: se a tabela está vazia (ou faltando os planos
 * default), insere os básicos para que o checkout funcione "out of the
 * box". Não sobrescreve nada que já existe — admin pode mexer livre via
 * /api/v1/master/plans depois.
 *
 * Sintoma que isto resolve: o checkout retornava
 *   `Erro ao criar assinatura. Tente novamente.`
 * porque `prisma.planDefinition.findUnique({ where: { slug: 'pro' } })`
 * devolvia null e a rota nem chegava no Asaas.
 */

import type { PrismaClient } from '@prisma/client'

interface PlanSeed {
  slug: string
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  maxProperties: number
  maxLeadViews: number
  maxUsers: number
  maxAIRequests: number
  themes: string[]
  modules: string[]
  features: string[]
  highlighted: boolean
  sortOrder: number
}

const DEFAULT_PLANS: PlanSeed[] = [
  {
    slug: 'lite',
    name: 'Lite',
    description: 'Site profissional + CRM básico para começar a vender online.',
    priceMonthly: 97,
    priceYearly: 970, // ~2 meses grátis
    maxProperties: 30,
    maxLeadViews: 100,
    maxUsers: 1,
    maxAIRequests: 50,
    themes: ['urban_tech', 'classic_trust'],
    modules: ['site_basico', 'crm_basico'],
    features: [
      'Site multi-tenant (subdomínio.agoraencontrei.com.br)',
      'Até 30 imóveis publicados',
      'CRM básico (leads + contatos)',
      'Tomás IA — 50 conversas/mês',
      'Suporte por e-mail',
    ],
    highlighted: false,
    sortOrder: 10,
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Para corretores e imobiliárias que querem escalar com IA e automação.',
    priceMonthly: 297,
    priceYearly: 2970, // ~2 meses grátis
    maxProperties: 200,
    maxLeadViews: 1000,
    maxUsers: 5,
    maxAIRequests: 1000,
    themes: ['urban_tech', 'classic_trust', 'luxury_gold', 'fast_sales_pro'],
    modules: ['site_basico', 'crm_avancado', 'ia_tomas', 'whatsapp', 'leiloes'],
    features: [
      'Tudo do Lite',
      'Até 200 imóveis publicados',
      'CRM avançado (deals, pipeline, automações)',
      'Tomás IA — 1000 conversas/mês + voz',
      'Integração WhatsApp Cloud API',
      'Painel de leilões (Caixa, Santander, Zuk)',
      'Até 5 corretores',
      'Suporte prioritário',
    ],
    highlighted: true,
    sortOrder: 20,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Domínio próprio, ilimitado e atendimento dedicado.',
    priceMonthly: 597,
    priceYearly: 5970,
    maxProperties: -1,
    maxLeadViews: -1,
    maxUsers: -1,
    maxAIRequests: -1,
    themes: ['urban_tech', 'classic_trust', 'luxury_gold', 'fast_sales_pro', 'landscape_living'],
    modules: ['site_basico', 'crm_avancado', 'ia_tomas', 'whatsapp', 'leiloes', 'dominio_proprio', 'split_pagamentos'],
    features: [
      'Tudo do Pro',
      'Imóveis e leads ilimitados',
      'Domínio próprio (.com.br)',
      'Split de pagamentos (Asaas)',
      'Tomás IA ilimitado',
      'Usuários e corretores ilimitados',
      'Onboarding e suporte dedicado',
    ],
    highlighted: false,
    sortOrder: 30,
  },
]

interface NicheSeed {
  slug: string
  name: string
  icon: string
  description: string
  tomasPersona: string
  tomasGreeting: string
  tomasTone: 'consultivo' | 'agil' | 'acolhedor' | 'formal' | 'direto'
  itemLabel: string
  itemLabelPlural: string
  defaultTheme: string
  availableThemes: string[]
  sortOrder: number
}

const DEFAULT_NICHES: NicheSeed[] = [
  {
    slug: 'imobiliaria',
    name: 'Imobiliária',
    icon: 'building-2',
    description: 'Corretores e imobiliárias com foco em venda e locação.',
    tomasPersona: 'Você é Tomás, consultor imobiliário. Conheça profundamente o mercado de imóveis residenciais e comerciais.',
    tomasGreeting: 'Oi! Sou o Tomás. Me diz o que você está buscando que eu localizo em segundos.',
    tomasTone: 'consultivo',
    itemLabel: 'Imóvel',
    itemLabelPlural: 'Imóveis',
    defaultTheme: 'urban_tech',
    availableThemes: ['urban_tech', 'classic_trust', 'luxury_gold', 'fast_sales_pro'],
    sortOrder: 10,
  },
  {
    slug: 'investidor-leiloes',
    name: 'Investidor de Leilões',
    icon: 'gavel',
    description: 'Foco em arremate de imóveis em leilão judicial e bancário.',
    tomasPersona: 'Você é Tomás, especialista em leilões judiciais e bancários. Domina ITBI, matrícula, desocupação e ROI.',
    tomasGreeting: 'Boa tarde. Sou Tomás, consultor de oportunidades em leilão.',
    tomasTone: 'formal',
    itemLabel: 'Oportunidade',
    itemLabelPlural: 'Oportunidades',
    defaultTheme: 'luxury_gold',
    availableThemes: ['luxury_gold', 'classic_trust', 'urban_tech'],
    sortOrder: 20,
  },
  {
    slug: 'rural',
    name: 'Rural / Fazenda',
    icon: 'tractor',
    description: 'Sítios, chácaras e fazendas para morar ou investir.',
    tomasPersona: 'Você é Tomás, consultor de imóveis rurais. Conhece áreas, georreferenciamento, CAR, ITR.',
    tomasGreeting: 'Olá! Sou o Tomás. Está buscando um lugar especial para viver ou investir?',
    tomasTone: 'acolhedor',
    itemLabel: 'Propriedade',
    itemLabelPlural: 'Propriedades',
    defaultTheme: 'landscape_living',
    availableThemes: ['landscape_living', 'classic_trust'],
    sortOrder: 30,
  },
]

export async function bootstrapDefaultPlans(prisma: PrismaClient): Promise<void> {
  // Plans
  let createdPlans = 0
  for (const plan of DEFAULT_PLANS) {
    const existing = await (prisma as any).planDefinition.findUnique({
      where: { slug: plan.slug },
    }).catch(() => null)
    if (existing) continue

    await (prisma as any).planDefinition.create({
      data: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxProperties: plan.maxProperties,
        maxLeadViews: plan.maxLeadViews,
        maxUsers: plan.maxUsers,
        maxAIRequests: plan.maxAIRequests,
        themes: plan.themes,
        modules: plan.modules,
        features: plan.features,
        highlighted: plan.highlighted,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
    }).catch(() => null)
    createdPlans++
  }

  // Niches
  let createdNiches = 0
  for (const niche of DEFAULT_NICHES) {
    const existing = await (prisma as any).nicheTemplate.findUnique({
      where: { slug: niche.slug },
    }).catch(() => null)
    if (existing) continue

    await (prisma as any).nicheTemplate.create({
      data: {
        slug: niche.slug,
        name: niche.name,
        icon: niche.icon,
        description: niche.description,
        tomasPersona: niche.tomasPersona,
        tomasGreeting: niche.tomasGreeting,
        tomasTone: niche.tomasTone,
        itemLabel: niche.itemLabel,
        itemLabelPlural: niche.itemLabelPlural,
        defaultTheme: niche.defaultTheme,
        availableThemes: niche.availableThemes,
        sortOrder: niche.sortOrder,
        isActive: true,
      },
    }).catch(() => null)
    createdNiches++
  }

  if (createdPlans > 0 || createdNiches > 0) {
    console.log(`[bootstrap] PlanDefinition: ${createdPlans} criados; NicheTemplate: ${createdNiches} criados`)
  }
}
