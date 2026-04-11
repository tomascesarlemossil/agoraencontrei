'use client'

import { useEffect, useState } from 'react'
import {
  Crown,
  Zap,
  Lock,
  Check,
  ArrowUpRight,
  Sparkles,
  ShoppingCart,
  Globe,
  BarChart3,
  FileText,
  Mail,
  Bot,
  Megaphone,
  Shield,
  Palette,
  Users,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  lite: 1,
  pro: 2,
  enterprise: 3,
}

// Icon mapping for modules/services
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  bar_chart: BarChart3,
  file_text: FileText,
  mail: Mail,
  bot: Bot,
  megaphone: Megaphone,
  shield: Shield,
  palette: Palette,
  users: Users,
  zap: Zap,
  sparkles: Sparkles,
  crown: Crown,
  shopping_cart: ShoppingCart,
}

function getIcon(iconName?: string) {
  if (!iconName) return Zap
  return ICON_MAP[iconName] ?? Zap
}

interface CatalogPlan {
  slug: string
  name: string
  price: number
  billingCycle?: string
  features?: string[]
  description?: string
  highlighted?: boolean
}

interface CatalogModule {
  slug: string
  name: string
  description?: string
  price: number
  billingType?: string
  icon?: string
  requiredPlan?: string
  category?: string
}

interface CatalogService {
  slug: string
  name: string
  description?: string
  price: number
  icon?: string
  category?: string
}

interface CatalogData {
  plans: CatalogPlan[]
  modules: CatalogModule[]
  services: CatalogService[]
  niches?: unknown[]
  settings?: unknown
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function billingLabel(type?: string) {
  switch (type) {
    case 'monthly':
      return '/mês'
    case 'yearly':
      return '/ano'
    case 'one_time':
      return 'único'
    default:
      return '/mês'
  }
}

export default function CrescerPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userCompany = useAuthStore((s) => s.user?.company)
  const userCompanyId = useAuthStore((s) => s.user?.companyId)
  const [catalog, setCatalog] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeModuleSlugs, setActiveModuleSlugs] = useState<string[]>([])

  // Derive tenant plan from auth store (real data, not mock)
  const tenantPlan = (userCompany?.plan ?? 'lite').toLowerCase()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`
        }

        // Fetch catalog and tenant billing in parallel
        const [catalogRes, billingRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/public/catalog`, { headers }),
          userCompanyId && accessToken
            ? fetch(`${API_URL}/api/v1/billing/saas/tenant/billing?tenantId=${userCompanyId}`, { headers }).catch(() => null)
            : Promise.resolve(null),
        ])

        if (!catalogRes.ok) {
          throw new Error(`Erro ao carregar catálogo (${catalogRes.status})`)
        }
        const catalogData = await catalogRes.json()
        setCatalog(catalogData)

        // Extract active module slugs from billing data
        if (billingRes?.ok) {
          const billingData = await billingRes.json()
          if (billingData?.success && billingData?.data?.activeModules) {
            setActiveModuleSlugs(
              billingData.data.activeModules.map((a: { module: { slug: string } }) => a.module.slug)
            )
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [accessToken, userCompanyId])

  const currentPlanLevel = PLAN_HIERARCHY[tenantPlan] ?? 0
  const isEnterprise = tenantPlan === 'enterprise'

  const currentPlan = catalog?.plans?.find((p) => p.slug === tenantPlan)
  const upgradePlans =
    catalog?.plans?.filter(
      (p) => (PLAN_HIERARCHY[p.slug] ?? 0) > currentPlanLevel,
    ) ?? []

  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)

  async function handleContratarModule(mod: CatalogModule) {
    // Get tenantId from auth store or settings
    const tenantId = useAuthStore.getState().user?.companyId
    if (!tenantId) {
      alert('Erro: Você precisa estar logado e vinculado a um tenant.')
      return
    }

    setPurchaseLoading(mod.slug)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const res = await fetch(`${API_URL}/api/v1/billing/saas/module`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenantId,
          moduleSlug: mod.slug,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Redirect to Asaas payment page
        window.location.href = data.data.paymentUrl
      } else {
        alert(data.message || data.error || 'Erro ao gerar cobrança.')
      }
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setPurchaseLoading(null)
    }
  }

  async function handleContratarService(svc: CatalogService) {
    const tenantId = useAuthStore.getState().user?.companyId
    if (!tenantId) {
      alert('Erro: Você precisa estar logado e vinculado a um tenant.')
      return
    }

    setPurchaseLoading(svc.slug)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const res = await fetch(`${API_URL}/api/v1/billing/saas/module`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenantId,
          moduleSlug: svc.slug,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        window.location.href = data.data.paymentUrl
      } else {
        alert(data.message || data.error || 'Erro ao gerar cobrança.')
      }
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setPurchaseLoading(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-[#d4a853]" />
          <p className="text-gray-400 text-sm sm:text-lg">Carregando catálogo...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-red-800 rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">
            Erro ao carregar
          </h2>
          <p className="text-sm text-gray-400 mb-4 sm:mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 sm:px-6 sm:py-2.5 bg-[#d4a853] text-gray-950 text-sm font-semibold rounded-lg hover:bg-[#c49a48] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-[#d4a853] flex-shrink-0" />
            <h1 className="text-xl sm:text-3xl font-bold text-white">
              Crescer meu Negócio
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-lg">
            Gerencie seu plano, módulos e serviços premium.
          </p>
        </div>

        {/* ───────── Section 1: Current Plan Card ───────── */}
        <section>
          <h2 className="text-base sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-[#d4a853]" />
            Seu Plano Atual
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-bl from-[#d4a853]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-[#d4a853]/20 text-[#d4a853] border border-[#d4a853]/30">
                    <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {currentPlan?.name ?? tenantPlan.toUpperCase()}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {currentPlan
                    ? formatCurrency(currentPlan.price)
                    : 'Plano Atual'}
                  {currentPlan && (
                    <span className="text-sm sm:text-base font-normal text-gray-400">
                      {' '}
                      {billingLabel(currentPlan.billingCycle)}
                    </span>
                  )}
                </p>
                {currentPlan?.features && currentPlan.features.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {currentPlan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-gray-300 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                )}
                {activeModuleSlugs.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Módulos ativos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeModuleSlugs.map((mod) => (
                        <span
                          key={mod}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/40"
                        >
                          <Check className="h-3 w-3" />
                          {mod.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isEnterprise && (
                <div className="shrink-0">
                  <a
                    href="#upgrades"
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#d4a853] text-gray-950 text-sm sm:text-base font-semibold rounded-lg hover:bg-[#c49a48] transition-colors shadow-lg shadow-[#d4a853]/20"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Fazer Upgrade
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ───────── Section 2: Available Plan Upgrades ───────── */}
        {!isEnterprise && upgradePlans.length > 0 && (
          <section id="upgrades">
            <h2 className="text-base sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#d4a853]" />
              Upgrades Disponíveis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upgradePlans.map((plan) => {
                const isHighlighted = plan.highlighted || plan.slug === 'pro'
                return (
                  <div
                    key={plan.slug}
                    className={`relative bg-gray-900 rounded-xl p-4 sm:p-6 flex flex-col transition-all hover:scale-[1.01] sm:hover:scale-[1.02] ${
                      isHighlighted
                        ? 'border-2 border-[#d4a853] shadow-lg shadow-[#d4a853]/10 order-first sm:order-none'
                        : 'border border-gray-800'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-[#d4a853] text-gray-950">
                          <Sparkles className="h-3 w-3" />
                          RECOMENDADO
                        </span>
                      </div>
                    )}
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                      {plan.name}
                    </h3>
                    {plan.description && (
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {plan.description}
                      </p>
                    )}
                    <div className="mt-3 sm:mt-4 mb-3 sm:mb-4">
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-gray-400 text-xs sm:text-sm">
                        {' '}
                        {billingLabel(plan.billingCycle)}
                      </span>
                      {currentPlan && plan.price > currentPlan.price && (
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                          +{formatCurrency(plan.price - currentPlan.price)}{' '}
                          comparado ao plano atual
                        </p>
                      )}
                    </div>
                    {plan.features && plan.features.length > 0 && (
                      <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-1">
                        {plan.features.map((feat, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm"
                          >
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#d4a853] shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    )}
                    <a
                      href={`/parceiros/cadastro?plan=${plan.slug}`}
                      className={`mt-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors text-center ${
                        isHighlighted
                          ? 'bg-[#d4a853] text-gray-950 hover:bg-[#c49a48] shadow-lg shadow-[#d4a853]/20'
                          : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      Assinar
                      <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ───────── Section 3: Módulos Extras ───────── */}
        {catalog?.modules && catalog.modules.length > 0 && (
          <section>
            <h2 className="text-base sm:text-xl font-semibold text-white mb-1.5 sm:mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#d4a853]" />
              Módulos Extras
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
              Expanda as funcionalidades com módulos especializados.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {catalog.modules.map((mod) => {
                const isActive = activeModuleSlugs.includes(mod.slug)
                const requiredLevel =
                  PLAN_HIERARCHY[mod.requiredPlan ?? 'free'] ?? 0
                const isLocked = requiredLevel > currentPlanLevel
                const IconComp = getIcon(mod.icon)

                return (
                  <div
                    key={mod.slug}
                    className={`relative bg-gray-900 border rounded-xl p-4 sm:p-6 flex flex-col transition-all ${
                      isActive
                        ? 'border-green-700/50'
                        : isLocked
                          ? 'border-gray-800 opacity-60'
                          : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {/* Status Badge */}
                    {isActive && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-900/40 text-green-400 border border-green-800/40">
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          Ativo
                        </span>
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-800 text-gray-500 border border-gray-700">
                          <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {mod.requiredPlan?.toUpperCase() ?? 'Upgrade'}
                        </span>
                      </div>
                    )}

                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-3 sm:mb-4 ${
                        isActive
                          ? 'bg-green-900/30 text-green-400'
                          : isLocked
                            ? 'bg-gray-800 text-gray-600'
                            : 'bg-[#d4a853]/10 text-[#d4a853]'
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <IconComp className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-semibold mb-1 ${isLocked ? 'text-gray-500' : 'text-white'}`}
                    >
                      {mod.name}
                    </h3>
                    {mod.description && (
                      <p
                        className={`text-xs sm:text-sm mb-3 sm:mb-4 flex-1 line-clamp-2 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}
                      >
                        {mod.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-1 mb-2.5 sm:mb-3">
                        <span
                          className={`text-lg sm:text-xl font-bold ${isLocked ? 'text-gray-600' : 'text-white'}`}
                        >
                          {formatCurrency(mod.price)}
                        </span>
                        <span
                          className={`text-xs sm:text-sm ${isLocked ? 'text-gray-700' : 'text-gray-500'}`}
                        >
                          {billingLabel(mod.billingType)}
                        </span>
                      </div>

                      {isActive ? (
                        <button
                          disabled
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm bg-green-900/20 text-green-400 border border-green-800/30 cursor-default"
                        >
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Ativo
                        </button>
                      ) : isLocked ? (
                        <button
                          disabled
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                        >
                          <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Plano Insuficiente
                        </button>
                      ) : (
                        <button
                          onClick={() => handleContratarModule(mod)}
                          disabled={purchaseLoading === mod.slug}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm bg-[#d4a853] text-gray-950 hover:bg-[#c49a48] transition-colors shadow-md shadow-[#d4a853]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {purchaseLoading === mod.slug ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Contratar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ───────── Section 4: Serviços Premium ───────── */}
        {catalog?.services && catalog.services.length > 0 && (
          <section>
            <h2 className="text-base sm:text-xl font-semibold text-white mb-1.5 sm:mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-[#d4a853]" />
              Serviços Premium
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
              Serviços especializados para acelerar o crescimento.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {catalog.services.map((svc) => {
                const IconComp = getIcon(svc.icon)

                return (
                  <div
                    key={svc.slug}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 flex flex-col hover:border-[#d4a853]/30 transition-all"
                  >
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#d4a853]/10 text-[#d4a853] mb-3 sm:mb-4">
                      <IconComp className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-white mb-1">
                      {svc.name}
                    </h3>
                    {svc.description && (
                      <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 flex-1 line-clamp-2">
                        {svc.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-1 mb-2.5 sm:mb-3">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {formatCurrency(svc.price)}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">único</span>
                      </div>

                      <button
                        onClick={() => handleContratarService(svc)}
                        disabled={purchaseLoading === svc.slug}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm bg-gray-800 text-[#d4a853] border border-[#d4a853]/30 hover:bg-[#d4a853]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {purchaseLoading === svc.slug ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Solicitar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state if catalog has nothing */}
        {catalog &&
          (!catalog.plans || catalog.plans.length === 0) &&
          (!catalog.modules || catalog.modules.length === 0) &&
          (!catalog.services || catalog.services.length === 0) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 sm:p-12 text-center">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 text-gray-700 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">
                Catálogo vazio
              </h3>
              <p className="text-sm text-gray-400">
                Nenhum plano, módulo ou serviço disponível no momento.
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
