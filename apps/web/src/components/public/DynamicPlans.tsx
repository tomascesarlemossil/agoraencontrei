'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle, Crown, Star, Zap, ArrowRight, Shield, Sparkles,
  Bot, MessageCircle, BarChart3, Globe, Code, EyeOff, Users,
  FileText, Lock, Loader2, X,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface PlanDef {
  id: string
  slug: string
  name: string
  description: string | null
  priceMonthly: string | number
  priceYearly: string | number | null
  maxProperties: number
  maxLeadViews: number
  maxUsers: number
  themes: string[]
  modules: string[]
  features: string[]
  highlighted: boolean
}

interface ModuleDef {
  id: string
  slug: string
  name: string
  description: string | null
  priceMonthly: string | number | null
  priceOneTime: string | number | null
  billingType: string
  category: string
  icon: string | null
}

interface NicheDef {
  id: string
  slug: string
  name: string
  icon: string | null
  description: string | null
  itemLabel: string
}

const PLAN_ICONS: Record<string, typeof Crown> = {
  lite: Zap,
  pro: Star,
  enterprise: Crown,
}

const PLAN_STYLES: Record<string, { border: string; badge: string; cta: string; bg: string }> = {
  lite: {
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-400',
    cta: 'bg-blue-600 hover:bg-blue-500 text-white',
    bg: 'from-blue-950/20 to-transparent',
  },
  pro: {
    border: 'border-amber-500/50',
    badge: 'bg-amber-500/10 text-amber-400',
    cta: 'bg-amber-600 hover:bg-amber-500 text-gray-950',
    bg: 'from-amber-950/20 to-transparent',
  },
  enterprise: {
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/10 text-purple-400',
    cta: 'bg-purple-600 hover:bg-purple-500 text-white',
    bg: 'from-purple-950/20 to-transparent',
  },
}

const MODULE_ICONS: Record<string, typeof Bot> = {
  bot: Bot,
  'message-circle': MessageCircle,
  'bar-chart-3': BarChart3,
  globe: Globe,
  code: Code,
  'eye-off': EyeOff,
  'users-round': Users,
  'file-text': FileText,
  phone: Sparkles,
  users: Users,
}

function formatPrice(val: string | number): string {
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function DynamicPlans() {
  const [plans, setPlans] = useState<PlanDef[]>([])
  const [modules, setModules] = useState<ModuleDef[]>([])
  const [niches, setNiches] = useState<NicheDef[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDef | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  // Erro inline do checkout — substitui o alert() opaco por um aviso visível
  // dentro do modal, com o motivo real devolvido pela API (CPF inválido,
  // subdomínio em uso, Asaas auth, etc.).
  const [checkoutError, setCheckoutError] = useState<{ message: string; hint?: string } | null>(null)
  const [checkoutForm, setCheckoutForm] = useState({
    name: '', email: '', cpfCnpj: '', phone: '',
    tenantName: '', subdomain: '', layoutType: 'urban_tech', primaryColor: '#d4a853',
  })

  useEffect(() => {
    fetch(`${API_URL}/api/v1/public/catalog`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setPlans(d.data.plans || [])
          setModules(d.data.modules || [])
          setNiches(d.data.niches || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-400 mt-4">Carregando planos...</p>
      </div>
    )
  }

  if (plans.length === 0) return null

  return (
    <div className="space-y-16">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
            billingCycle === 'monthly' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition relative ${
            billingCycle === 'yearly' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Anual
          <span className="absolute -top-2 -right-3 sm:-right-4 text-[10px] bg-emerald-500 text-white px-1 sm:px-1.5 py-0.5 rounded-full font-bold">
            -17%
          </span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto px-2 sm:px-0">
        {plans.map(plan => {
          const style = PLAN_STYLES[plan.slug] || PLAN_STYLES.lite
          const Icon = PLAN_ICONS[plan.slug] || Zap
          const price = billingCycle === 'yearly' && plan.priceYearly
            ? Math.round(Number(plan.priceYearly) / 12)
            : Number(plan.priceMonthly)

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl sm:rounded-2xl border ${style.border} bg-gradient-to-b ${style.bg} backdrop-blur-sm p-4 sm:p-6 transition-all hover:scale-[1.01] sm:hover:scale-[1.02] ${
                plan.highlighted ? 'ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10 order-first sm:order-none' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-gray-950 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${style.badge} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-[11px] sm:text-xs text-gray-400 truncate">{plan.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-white">R$ {formatPrice(price)}</span>
                  <span className="text-xs sm:text-sm text-gray-400">/mês</span>
                </div>
                {billingCycle === 'yearly' && plan.priceYearly && (
                  <p className="text-[11px] sm:text-xs text-emerald-400 mt-1">
                    R$ {formatPrice(plan.priceYearly)}/ano — economia de R$ {formatPrice(Number(plan.priceMonthly) * 12 - Number(plan.priceYearly))}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
                {plan.maxProperties > 0 && (
                  <li className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Até {plan.maxProperties} imóveis</span>
                  </li>
                )}
                {plan.maxProperties === -1 && (
                  <li className="flex items-start gap-2 text-xs sm:text-sm">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Imóveis ilimitados</span>
                  </li>
                )}
              </ul>

              <button
                onClick={() => setCheckoutPlan(plan)}
                className={`block w-full text-center py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${style.cta}`}
              >
                Assinar Agora <ArrowRight className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Modules add-ons */}
      {modules.length > 0 && (
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-2">Módulos Extras</h3>
          <p className="text-gray-400 text-center mb-8">Expanda seu plano com funcionalidades adicionais</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
            {modules.map(mod => {
              const IconComp = MODULE_ICONS[mod.icon || ''] || Sparkles
              return (
                <div key={mod.id} className="border border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-gray-900/50 hover:border-gray-700 transition">
                  <div className="flex items-center gap-2.5 mb-1.5 sm:mb-2">
                    <IconComp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                    <h4 className="font-semibold text-white text-xs sm:text-sm">{mod.name}</h4>
                  </div>
                  {mod.description && (
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-2 sm:mb-3 line-clamp-2">{mod.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-amber-400">
                      {mod.priceMonthly ? `R$ ${formatPrice(mod.priceMonthly)}/mês` :
                       mod.priceOneTime ? `R$ ${formatPrice(mod.priceOneTime)} (único)` :
                       'Incluso'}
                    </span>
                    {mod.billingType !== 'included' && (
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {mod.category}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Niches */}
      {niches.length > 1 && (
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-2">Atendemos Diversos Nichos</h3>
          <p className="text-gray-400 text-center mb-8">Nossa plataforma se adapta ao seu negócio</p>
          <div className="flex flex-wrap justify-center gap-3">
            {niches.map(niche => (
              <div key={niche.id} className="border border-gray-800 rounded-full px-4 py-2 bg-gray-900/50 flex items-center gap-2">
                <span className="text-sm text-gray-300">{niche.name}</span>
                <span className="text-xs text-gray-500">({niche.itemLabel})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security badge */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-gray-500 text-xs sm:text-sm px-4">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Pagamento seguro via Asaas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Protocolo Fort Knox</span>
        </div>
      </div>

      {/* ═══ Checkout Modal ═══ */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
          <div className="relative bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => { setCheckoutPlan(null); setCheckoutLoading(false); setCheckoutError(null) }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 pr-8">
              Assinar Plano {checkoutPlan.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
              R$ {formatPrice(
                billingCycle === 'yearly' && checkoutPlan.priceYearly
                  ? Math.round(Number(checkoutPlan.priceYearly) / 12)
                  : Number(checkoutPlan.priceMonthly)
              )}/mês
              {billingCycle === 'yearly' && checkoutPlan.priceYearly && (
                <span className="text-emerald-400 ml-1">(cobrança anual)</span>
              )}
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setCheckoutLoading(true)
                setCheckoutError(null)
                try {
                  const res = await fetch(`${API_URL}/api/v1/billing/saas/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      planSlug: checkoutPlan.slug,
                      billingCycle: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
                      customer: {
                        name: checkoutForm.name,
                        email: checkoutForm.email,
                        cpfCnpj: checkoutForm.cpfCnpj.replace(/\D/g, ''),
                        phone: checkoutForm.phone.replace(/\D/g, ''),
                      },
                      tenantName: checkoutForm.tenantName,
                      subdomain: checkoutForm.subdomain
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ''),
                      layoutType: checkoutForm.layoutType,
                      primaryColor: checkoutForm.primaryColor,
                    }),
                  })

                  const data = await res.json()

                  if (res.ok && data.success) {
                    // Redirect to Asaas payment page
                    window.location.href = data.data.paymentUrl
                  } else {
                    setCheckoutError({
                      message: data.message || data.error || 'Erro ao criar assinatura.',
                      hint: data.hint,
                    })
                    setCheckoutLoading(false)
                  }
                } catch {
                  setCheckoutError({
                    message: 'Erro de conexão. Verifique sua internet e tente novamente.',
                  })
                  setCheckoutLoading(false)
                }
              }}
              className="space-y-3 sm:space-y-4"
            >
              {/* Name + Email side by side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Nome completo *
                  </label>
                  <input
                    required
                    type="text"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 sm:py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    E-mail *
                  </label>
                  <input
                    required
                    type="email"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 sm:py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="joao@empresa.com"
                  />
                </div>
              </div>

              {/* CPF + Phone side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    CPF ou CNPJ *
                  </label>
                  <input
                    required
                    type="text"
                    value={checkoutForm.cpfCnpj}
                    onChange={(e) => setCheckoutForm(f => ({ ...f, cpfCnpj: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 sm:py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 sm:py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="(11) 99999-0000"
                  />
                </div>
              </div>

              <hr className="border-gray-700" />

              {/* Tenant Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Nome do seu site *
                </label>
                <input
                  required
                  type="text"
                  value={checkoutForm.tenantName}
                  onChange={(e) => setCheckoutForm(f => ({ ...f, tenantName: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 sm:py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Imobiliária Premium"
                />
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Subdomínio *
                </label>
                <div className="flex items-center">
                  <input
                    required
                    type="text"
                    value={checkoutForm.subdomain}
                    onChange={(e) =>
                      setCheckoutForm(f => ({
                        ...f,
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                    className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-l-lg px-3 py-2 sm:py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="minha-imobiliaria"
                  />
                  <span className="bg-gray-700 border border-gray-700 border-l-0 rounded-r-lg px-2 sm:px-3 py-2 sm:py-2.5 text-gray-400 text-[11px] sm:text-sm whitespace-nowrap flex-shrink-0">
                    .agoraencontrei.com.br
                  </span>
                </div>
              </div>

              {/* Layout + Color side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Layout do site
                  </label>
                  <select
                    value={checkoutForm.layoutType}
                    onChange={(e) => setCheckoutForm(f => ({ ...f, layoutType: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 sm:py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  >
                    <option value="urban_tech">Urban Tech</option>
                    <option value="clean">Clean</option>
                    <option value="classic">Classic</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Cor principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={checkoutForm.primaryColor}
                      onChange={(e) => setCheckoutForm(f => ({ ...f, primaryColor: e.target.value }))}
                      className="w-9 h-9 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-gray-400">{checkoutForm.primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Erro inline (substitui o alert opaco) */}
              {checkoutError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-red-300">{checkoutError.message}</div>
                      {checkoutError.hint && (
                        <div className="mt-1 text-red-300/70">{checkoutError.hint}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutError(null)}
                      className="text-red-300/60 hover:text-red-300"
                      aria-label="Fechar erro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition bg-amber-600 hover:bg-amber-500 text-gray-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Assinar — R$ {formatPrice(
                      billingCycle === 'yearly' && checkoutPlan.priceYearly
                        ? Number(checkoutPlan.priceYearly)
                        : Number(checkoutPlan.priceMonthly)
                    )}{billingCycle === 'yearly' ? '/ano' : '/mês'}
                  </>
                )}
              </button>

              <p className="text-[11px] sm:text-xs text-gray-500 text-center">
                Pagamento seguro via Asaas. Redirecionamento automático.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
