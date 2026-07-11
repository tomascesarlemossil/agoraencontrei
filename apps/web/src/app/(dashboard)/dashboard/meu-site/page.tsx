'use client'

/**
 * Meu Site (Parceiro) — self-service branding do site do tenant/parceiro
 * (subdomínio próprio, ex.: parceiro.agoraencontrei.com.br). Distinto da
 * página "Editar meu site" em Configurações, que edita o site PRINCIPAL
 * agoraencontrei.com.br.
 *
 * Antes não existia nenhuma tela para o dono do tenant editar a própria
 * marca — só uma tabela interna (SUPER_ADMIN) sem campos de branding. Esta
 * página consome GET/PATCH /api/v1/tenants/mine|:id, que já existiam (ou
 * foram adicionados) no backend com a autorização por ownerId pronta.
 */
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { MediaUploadInput } from '@/components/dashboard/MediaUploadInput'
import { usersApi, type User } from '@/lib/api'
import { ALL_THEMES, resolveTheme, type ThemeKey } from '@/lib/site-factory/theme-registry'
import { Store, ExternalLink, Loader2, CheckCircle2, Circle, Globe, Palette as PaletteIcon, Plus, Trash2, Users, Building2, Eye, UserCheck, MessageSquare, Plug, ShieldCheck } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const SITE_ROOT = process.env.NEXT_PUBLIC_SITE_ROOT ?? 'agoraencontrei.com.br'

interface Tenant {
  id: string
  name: string
  subdomain: string
  customDomain: string | null
  layoutType: string
  primaryColor: string
  logoUrl: string | null
  planStatus: string
  isActive: boolean
  readiness?: {
    complete: boolean
    completed: number
    total: number
    items: Array<{ id: string; label: string; complete: boolean }>
  }
  settings: {
    logoWordmarkUrl?: string | null
    logoVisible?: boolean
    logoShowText?: boolean
    logoPosition?: 'left' | 'center'
    [key: string]: any
  } | null
}

interface OperationsSummary {
  properties: { total: number; active: number; featured: number; views: number }
  leads: { total: number; last30d: number; won: number; conversionRate: number }
  conversations: { total: number; open: number; unread: number }
  team: { active: number }
  integrations: { activePortals: number; activeModules: number; pendingModules: number; chatMode: string }
  subscription: { plan: string; status: string; price: string | number | null }
  domain: { type: string; subdomain: string; customDomain: string | null; configured: boolean }
  audit: { total: number; recent: Array<{ id: string; action: string; resource: string; createdAt: string }> }
}

function DarkInput({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <div>
      {label && <label className="text-xs font-semibold text-white/70 mb-1.5 block">{label}</label>}
      <input
        {...props}
        className={cn(
          'bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-yellow-400/50 w-full transition-colors',
          props.className,
        )}
      />
      {hint && <p className="text-[11px] text-white/40 mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {hint && <p className="text-xs text-white/40 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
          checked ? 'bg-yellow-400' : 'bg-white/20',
        )}
      >
        <span className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
          checked ? 'translate-x-6' : 'translate-x-1',
        )} />
      </button>
    </div>
  )
}

// Mini mockup do cabeçalho do site do parceiro — reflete ao vivo as escolhas
// de logo/marca escrita/posição/tema feitas no formulário abaixo.
function HeaderPreview({
  themeKey, accentColor, siteName, logoUrl, wordmarkUrl, logoVisible, logoShowText, logoPosition,
}: {
  themeKey: ThemeKey
  accentColor: string
  siteName: string
  logoUrl: string
  wordmarkUrl: string
  logoVisible: boolean
  logoShowText: boolean
  logoPosition: 'left' | 'center'
}) {
  const theme = ALL_THEMES.find(t => t.key === themeKey) ?? ALL_THEMES[0]
  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-gray-700 rounded-md px-3 py-0.5 text-[10px] text-gray-400 truncate">
          seusite.{SITE_ROOT}
        </div>
      </div>
      <div className={`${theme.bg} ${theme.text} relative overflow-hidden`}>
        <div className={`${theme.headerBg} px-4 py-3 flex items-center justify-between relative`}>
          {logoVisible ? (
            <div className={cn('flex items-center gap-2', logoPosition === 'center' && 'sm:absolute sm:left-1/2 sm:-translate-x-1/2')}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ backgroundColor: accentColor }} />
              )}
              {logoShowText && (
                wordmarkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wordmarkUrl} alt="" className="h-5 w-auto object-contain" />
                ) : (
                  <span className={`text-xs font-bold ${theme.text}`}>{siteName || 'Meu Site'}</span>
                )
              )}
            </div>
          ) : <div />}
          <div className="hidden sm:flex gap-3 ml-auto">
            <span className={`text-[10px] ${theme.textMuted}`}>Imóveis</span>
            <span className={`text-[10px] ${theme.textMuted}`}>Sobre</span>
            <span className={`text-[10px] ${theme.textMuted}`}>Contato</span>
          </div>
        </div>
        <div className={`${theme.hero} px-4 py-6 text-center`}>
          <p className={`text-sm ${theme.fontHeading} font-bold`}>Encontre o imóvel ideal</p>
          <div className={`${theme.buttonPrimary} inline-block mt-3 px-3 py-1 rounded-md text-[10px]`}>Buscar</div>
        </div>
      </div>
    </div>
  )
}

export default function MeuSitePage() {
  const { getValidToken } = useAuth()
  const qc = useQueryClient()

  // Token para MediaUploadInput (que precisa de um valor síncrono, não uma
  // Promise) — mesmo padrão usado em SystemConfigPanel.tsx.
  const [apiToken, setApiToken] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    getValidToken().then(t => { if (mounted) setApiToken(t) })
    return () => { mounted = false }
  }, [getValidToken])

  const { data: tenant, isLoading, error } = useQuery<Tenant | null>({
    queryKey: ['tenant-mine'],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/tenants/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error('Erro ao carregar seu site')
      const json = await res.json()
      return json.data as Tenant
    },
  })

  const [form, setForm] = useState({
    name: '', primaryColor: '#143A1F', layoutType: 'urban_tech' as ThemeKey,
    logoUrl: '', logoWordmarkUrl: '', logoVisible: true, logoShowText: true,
    logoPosition: 'left' as 'left' | 'center',
    heroTitle: '', heroSubtitle: '', aboutText: '', address: '', city: '', phone: '', creci: '',
    email: '', hours: '', officialWebsite: '', instagramUrl: '', facebookUrl: '', youtubeUrl: '', chatMode: 'tomas' as 'tomas' | 'partner' | 'both' | 'off',
    leadRoutingMode: 'balanced' as 'balanced' | 'on_call' | 'region', onCallBrokerId: '',
    regionRoutingRules: [] as Array<{ region: string; brokerId: string }>,
  })

  const { data: team = [] } = useQuery<User[]>({
    queryKey: ['partner-routing-team'],
    queryFn: async () => usersApi.list((await getValidToken())!),
    enabled: Boolean(tenant),
  })
  const routingTeam = team.filter(member => member.status === 'ACTIVE' && ['ADMIN', 'MANAGER', 'BROKER'].includes(member.role))

  const { data: operations } = useQuery<OperationsSummary>({
    queryKey: ['partner-operations'],
    queryFn: async () => {
      const token = await getValidToken()
      const response = await fetch(`${API_URL}/api/v1/tenants/mine/operations`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Não foi possível carregar o resumo operacional')
      return (await response.json()).data as OperationsSummary
    },
    enabled: Boolean(tenant),
  })
  const [saved, setSaved] = useState(false)
  // Domínio próprio — fluxo à parte (POST /:id/domain com integração Vercel).
  const [domainInput, setDomainInput] = useState('')
  const [dnsInfo, setDnsInfo] = useState<{ aRecord?: any; cnameRecord?: any } | null>(null)
  const [domainError, setDomainError] = useState('')

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name ?? '',
        primaryColor: tenant.primaryColor || '#143A1F',
        layoutType: (resolveTheme(tenant.layoutType).key) as ThemeKey,
        logoUrl: tenant.logoUrl ?? '',
        logoWordmarkUrl: tenant.settings?.logoWordmarkUrl ?? '',
        logoVisible: tenant.settings?.logoVisible !== false,
        logoShowText: tenant.settings?.logoShowText !== false,
        logoPosition: tenant.settings?.logoPosition === 'center' ? 'center' : 'left',
        heroTitle: tenant.settings?.heroTitle ?? '',
        heroSubtitle: tenant.settings?.heroSubtitle ?? '',
        aboutText: tenant.settings?.aboutText ?? '',
        address: tenant.settings?.address ?? '',
        city: tenant.settings?.city ?? '',
        phone: tenant.settings?.phone ?? '',
        creci: tenant.settings?.creci ?? '',
        email: tenant.settings?.email ?? '',
        hours: tenant.settings?.hours ?? '',
        officialWebsite: tenant.settings?.officialWebsite ?? '',
        instagramUrl: tenant.settings?.instagramUrl ?? '',
        facebookUrl: tenant.settings?.facebookUrl ?? '',
        youtubeUrl: tenant.settings?.youtubeUrl ?? '',
        chatMode: tenant.settings?.chatMode ?? 'tomas',
        leadRoutingMode: tenant.settings?.leadRoutingMode ?? 'balanced',
        onCallBrokerId: tenant.settings?.onCallBrokerId ?? '',
        regionRoutingRules: Array.isArray(tenant.settings?.regionRoutingRules) ? tenant.settings.regionRoutingRules : [],
      })
    }
  }, [tenant])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) return
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          primaryColor: form.primaryColor,
          layoutType: form.layoutType,
          logoUrl: form.logoUrl,
          logoWordmarkUrl: form.logoWordmarkUrl,
          logoVisible: form.logoVisible,
          logoShowText: form.logoShowText,
          logoPosition: form.logoPosition,
          settings: {
            heroTitle: form.heroTitle,
            heroSubtitle: form.heroSubtitle,
            aboutText: form.aboutText,
            address: form.address,
            city: form.city,
            phone: form.phone,
            creci: form.creci,
            email: form.email,
            hours: form.hours,
            officialWebsite: form.officialWebsite,
            instagramUrl: form.instagramUrl,
            facebookUrl: form.facebookUrl,
            youtubeUrl: form.youtubeUrl,
            chatMode: form.chatMode,
            leadRoutingMode: form.leadRoutingMode,
            onCallBrokerId: form.onCallBrokerId || null,
            regionRoutingRules: form.regionRoutingRules.filter(rule => rule.region.trim() && rule.brokerId),
          },
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro ao salvar') }
      return res.json()
    },
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      qc.invalidateQueries({ queryKey: ['tenant-mine'] })
    },
    onError: (e: Error) => alert('Erro ao salvar: ' + e.message),
  })

  const domainMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) return
      const domain = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      if (domain.length < 4 || !domain.includes('.')) throw new Error('Informe um domínio válido (ex.: www.suaimobiliaria.com.br)')
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/tenants/${tenant.id}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ domain }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error ?? json?.message ?? 'Não foi possível conectar o domínio')
      return json
    },
    onSuccess: (json: any) => {
      setDomainError('')
      setDnsInfo(json?.data?.dnsInstructions ?? null)
      qc.invalidateQueries({ queryKey: ['tenant-mine'] })
    },
    onError: (e: Error) => { setDomainError(e.message); setDnsInfo(null) },
  })

  const publicationMutation = useMutation({
    mutationFn: async (published: boolean) => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/tenants/mine/publication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ published }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message ?? 'Não foi possível alterar a publicação')
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-mine'] }),
    onError: (e: Error) => alert(e.message),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-white/50">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando seu site…
      </div>
    )
  }

  // Usuário autenticado mas sem tenant — ainda não é parceiro com site
  // próprio. Estado tratado aqui (em vez de gate no sidebar) para não
  // acoplar a navegação a uma chamada de API extra.
  if (!tenant || error) {
    return (
      <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
          <Store className="w-10 h-10 text-yellow-400/70 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Você ainda não tem um site de parceiro</h1>
          <p className="text-white/50 text-sm mb-6">
            Parceiros podem ter seu próprio site (ex.: seusite.{SITE_ROOT}) com marca, cores e tema
            independentes do site principal. Assine um plano de parceiro para criar o seu.
          </p>
          <a
            href="/parceiros/planos"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: '#C9A84C', color: '#143A1F' }}
          >
            Ver planos de parceiro <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  const siteUrl = tenant.customDomain
    ? `https://${tenant.customDomain}`
    : `https://${tenant.subdomain}.${SITE_ROOT}`
  const sitePublished = tenant.settings?.sitePublished !== false

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-yellow-400/80" /> Meu Site (Parceiro)
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Marca, cores e tema do seu site próprio — independente do site principal.
          </p>
        </div>
        <a
          href={siteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/80 border border-white/15 hover:bg-white/5 transition-colors"
        >
          <Globe className="w-4 h-4" /> {siteUrl.replace(/^https?:\/\//, '')} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-5" aria-labelledby="publication-checklist-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="publication-checklist-title" className="text-sm font-bold text-white">Checklist de publicação</h2>
            <p className="mt-1 text-xs text-white/50">
              {tenant.readiness?.completed ?? 0} de {tenant.readiness?.total ?? 0} itens obrigatórios concluídos.
            </p>
          </div>
          <button
            type="button"
            disabled={publicationMutation.isPending || (!sitePublished && !tenant.readiness?.complete)}
            onClick={() => publicationMutation.mutate(!sitePublished)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: sitePublished ? '#ffffff1a' : '#C9A84C', color: sitePublished ? 'white' : '#143A1F' }}
          >
            {publicationMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sitePublished ? 'Retirar do ar' : 'Publicar site'}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tenant.readiness?.items.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-white/70">
              {item.complete
                ? <CheckCircle2 className="h-4 w-4 flex-none text-emerald-400" />
                : <Circle className="h-4 w-4 flex-none text-amber-300" />}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        {!sitePublished && !tenant.readiness?.complete && (
          <p className="mt-4 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            O site permanece em preparação até todos os itens acima serem concluídos.
          </p>
        )}
      </section>

      {operations && (
        <section className="space-y-4" aria-labelledby="operations-title">
          <div className="flex items-end justify-between gap-3">
            <div><h2 id="operations-title" className="text-base font-bold text-white">Operação do site</h2><p className="text-xs text-white/45">Resumo atualizado da empresa e do atendimento.</p></div>
            <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${operations.subscription.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-200'}`}>{operations.subscription.plan} · {operations.subscription.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              { label: 'Imóveis ativos', value: operations.properties.active, detail: `${operations.properties.total} cadastrados`, icon: Building2 },
              { label: 'Visualizações', value: operations.properties.views, detail: `${operations.properties.featured} destaques`, icon: Eye },
              { label: 'Leads', value: operations.leads.total, detail: `${operations.leads.last30d} nos últimos 30 dias`, icon: UserCheck },
              { label: 'Conversas abertas', value: operations.conversations.open, detail: `${operations.conversations.unread} não lidas`, icon: MessageSquare },
              { label: 'Equipe ativa', value: operations.team.active, detail: 'usuários habilitados', icon: Users },
              { label: 'Integrações', value: operations.integrations.activePortals + operations.integrations.activeModules, detail: `${operations.integrations.pendingModules} pendentes`, icon: Plug },
            ].map(item => (
              <div key={item.label} className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-3">
                <item.icon className="mb-3 h-4 w-4 text-yellow-400/80" />
                <p className="text-xl font-bold text-white">{item.value.toLocaleString('pt-BR')}</p>
                <p className="truncate text-xs font-semibold text-white/70">{item.label}</p>
                <p className="mt-1 text-[11px] leading-tight text-white/35">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-white"><Globe className="h-4 w-4 text-yellow-400/80" />Domínio</p>
              <p className="mt-2 truncate text-sm text-white/75">{operations.domain.customDomain || `${operations.domain.subdomain}.${SITE_ROOT}`}</p>
              <p className="mt-1 text-xs text-emerald-300">Configurado</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-white"><ShieldCheck className="h-4 w-4 text-yellow-400/80" />Conversão de leads</p>
              <p className="mt-2 text-2xl font-bold text-white">{(operations.leads.conversionRate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</p>
              <p className="mt-1 text-xs text-white/40">{operations.leads.won} negócios ganhos</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-white">Últimas alterações</p>
              <div className="mt-2 space-y-1.5">
                {operations.audit.recent.slice(0, 3).map(event => <p key={event.id} className="truncate text-xs text-white/50">{event.action} · {new Date(event.createdAt).toLocaleDateString('pt-BR')}</p>)}
                {operations.audit.recent.length === 0 && <p className="text-xs text-white/35">Nenhuma alteração registrada.</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Domínio próprio (opcional) — conecta um domínio do parceiro via Vercel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-yellow-400/80" /> Domínio próprio
        </h2>
        <p className="text-white/50 text-xs mb-3">
          Use seu próprio domínio (ex.: <span className="text-white/70">www.suaimobiliaria.com.br</span>) no lugar de
          {' '}<span className="text-white/70">{tenant.subdomain}.{SITE_ROOT}</span>. Grátis — você aponta o DNS conforme as instruções.
        </p>

        {tenant.customDomain && (
          <p className="text-xs text-green-400/90 mb-3">
            ✓ Domínio conectado: <span className="font-semibold">{tenant.customDomain}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={e => setDomainInput(e.target.value)}
            placeholder={tenant.customDomain || 'www.suaimobiliaria.com.br'}
            className="flex-1 min-w-[220px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50"
          />
          <button
            type="button"
            onClick={() => domainMutation.mutate()}
            disabled={domainMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
            style={{ backgroundColor: '#C9A84C', color: '#143A1F' }}
          >
            {domainMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Conectar domínio
          </button>
        </div>

        {domainError && <p className="text-xs text-red-400 mt-2">{domainError}</p>}

        {dnsInfo && (
          <div className="mt-4 bg-black/20 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/70 mb-2 font-semibold">Configure estes registros no seu provedor de DNS:</p>
            <div className="space-y-1.5 text-[11px] font-mono text-white/80">
              {dnsInfo.aRecord && (
                <div className="flex flex-wrap gap-x-3"><span className="text-yellow-400/80">A</span><span>{dnsInfo.aRecord.name}</span><span>→</span><span>{dnsInfo.aRecord.value}</span></div>
              )}
              {dnsInfo.cnameRecord && (
                <div className="flex flex-wrap gap-x-3"><span className="text-yellow-400/80">CNAME</span><span>{dnsInfo.cnameRecord.name}</span><span>→</span><span>{dnsInfo.cnameRecord.value}</span></div>
              )}
            </div>
            <p className="text-[11px] text-white/40 mt-2">A propagação do DNS pode levar de alguns minutos a algumas horas.</p>
          </div>
        )}
      </div>

      {tenant.planStatus === 'SUSPENDED' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
          Seu site está suspenso (pagamento pendente). As alterações abaixo ficam salvas, mas o site só volta ao ar após regularização.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Formulário ──────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wide">Identidade</h2>
            <DarkInput
              label="Nome do site"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex.: Imobiliária João Silva"
            />
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor principal</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={e => setForm(p => ({ ...p, primaryColor: e.target.value }))}
                  className="w-11 h-11 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
                <DarkInput
                  value={form.primaryColor}
                  onChange={e => setForm(p => ({ ...p, primaryColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1.5 block flex items-center gap-1.5">
                <PaletteIcon className="w-3.5 h-3.5" /> Tema visual
              </label>
              <select
                value={form.layoutType}
                onChange={e => setForm(p => ({ ...p, layoutType: e.target.value as ThemeKey }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full"
              >
                {ALL_THEMES.map(t => (
                  <option key={t.key} value={t.key}>{t.name} — {t.tagline}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wide">Logo</h2>
            <MediaUploadInput
              label="Ícone do logo"
              hint="Aparece no cabeçalho do seu site. Imagem quadrada funciona melhor."
              kind="image"
              value={form.logoUrl}
              onChange={url => setForm(p => ({ ...p, logoUrl: url }))}
              token={apiToken}
              placeholder="https://... ou envie um arquivo"
            />
            <MediaUploadInput
              label="Marca escrita (opcional)"
              hint="Uma imagem com o nome/marca do seu site, exibida ao lado do ícone. Se vazio, usa o nome do site em texto."
              kind="image"
              value={form.logoWordmarkUrl}
              onChange={url => setForm(p => ({ ...p, logoWordmarkUrl: url }))}
              token={apiToken}
              placeholder="https://... ou envie um arquivo"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wide">Conteúdo e atendimento</h2>
            <DarkInput label="Título principal" value={form.heroTitle} onChange={e => setForm(p => ({ ...p, heroTitle: e.target.value }))} placeholder="Encontre o imóvel ideal" />
            <DarkInput label="Texto de apresentação" value={form.heroSubtitle} onChange={e => setForm(p => ({ ...p, heroSubtitle: e.target.value }))} placeholder="Venda, locação e atendimento especializado" />
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1.5 block">Sobre a empresa</label>
              <textarea value={form.aboutText} onChange={e => setForm(p => ({ ...p, aboutText: e.target.value }))} rows={4} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-yellow-400/50 w-full resize-y" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DarkInput label="Endereço" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              <DarkInput label="Cidade/UF" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
              <DarkInput label="Telefone / WhatsApp" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <DarkInput label="E-mail" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              <DarkInput label="CRECI da imobiliária" value={form.creci} onChange={e => setForm(p => ({ ...p, creci: e.target.value }))} />
              <DarkInput label="Horário de atendimento" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} />
              <DarkInput label="Site oficial" value={form.officialWebsite} onChange={e => setForm(p => ({ ...p, officialWebsite: e.target.value }))} placeholder="https://www.suaimobiliaria.com.br" />
              <DarkInput label="Instagram" value={form.instagramUrl} onChange={e => setForm(p => ({ ...p, instagramUrl: e.target.value }))} placeholder="https://instagram.com/suaimobiliaria" />
              <DarkInput label="Facebook" value={form.facebookUrl} onChange={e => setForm(p => ({ ...p, facebookUrl: e.target.value }))} placeholder="https://facebook.com/suaimobiliaria" />
              <DarkInput label="YouTube" value={form.youtubeUrl} onChange={e => setForm(p => ({ ...p, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/@suaimobiliaria" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1.5 block">Chat do site</label>
              <select value={form.chatMode} onChange={e => setForm(p => ({ ...p, chatMode: e.target.value as typeof form.chatMode }))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                <option value="tomas">Tomás com identidade da imobiliária</option>
                <option value="partner">Somente atendimento da imobiliária</option>
                <option value="both">Tomás e atendimento da imobiliária</option>
                <option value="off">Sem chat flutuante</option>
              </select>
            </div>
            {(form.chatMode === 'partner' || form.chatMode === 'both') && (
              <div className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-4 w-4 text-yellow-400" />Distribuição dos atendimentos</h3>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/70">Regra principal</label>
                  <select value={form.leadRoutingMode} onChange={e => setForm(p => ({ ...p, leadRoutingMode: e.target.value as typeof form.leadRoutingMode }))} className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white">
                    <option value="balanced">Distribuir para quem tem menos leads</option>
                    <option value="on_call">Enviar para o corretor de plantão</option>
                    <option value="region">Distribuir conforme bairro ou cidade</option>
                  </select>
                </div>
                {(form.leadRoutingMode === 'on_call' || form.leadRoutingMode === 'region') && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/70">Corretor de plantão ou reserva</label>
                    <select value={form.onCallBrokerId} onChange={e => setForm(p => ({ ...p, onCallBrokerId: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white">
                      <option value="">Usar distribuição equilibrada como reserva</option>
                      {routingTeam.map(member => <option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}
                    </select>
                  </div>
                )}
                {form.leadRoutingMode === 'region' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-semibold text-white/70">Regras por região</label>
                      <button type="button" onClick={() => setForm(p => ({ ...p, regionRoutingRules: [...p.regionRoutingRules, { region: '', brokerId: '' }] }))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-white" title="Adicionar região"><Plus className="h-4 w-4" /></button>
                    </div>
                    {form.regionRoutingRules.map((rule, index) => (
                      <div key={`${index}-${rule.brokerId}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input value={rule.region} onChange={e => setForm(p => ({ ...p, regionRoutingRules: p.regionRoutingRules.map((item, itemIndex) => itemIndex === index ? { ...item, region: e.target.value } : item) }))} placeholder="Bairro ou cidade" className="min-w-0 rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white" />
                        <select value={rule.brokerId} onChange={e => setForm(p => ({ ...p, regionRoutingRules: p.regionRoutingRules.map((item, itemIndex) => itemIndex === index ? { ...item, brokerId: e.target.value } : item) }))} className="min-w-0 rounded-md border border-white/10 bg-gray-900 px-2 py-2 text-xs text-white">
                          <option value="">Responsável</option>
                          {routingTeam.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setForm(p => ({ ...p, regionRoutingRules: p.regionRoutingRules.filter((_, itemIndex) => itemIndex !== index) }))} className="flex h-8 w-8 items-center justify-center rounded-md text-red-300" title="Remover região"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    {form.regionRoutingRules.length === 0 && <p className="text-xs text-white/40">Adicione bairros ou cidades e escolha o responsável. Sem correspondência, o plantão ou a distribuição equilibrada será usada.</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-1">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Exibição no cabeçalho</h2>
            <Toggle
              label="Mostrar logo"
              hint="Desative para ocultar completamente o ícone e a marca escrita"
              checked={form.logoVisible}
              onChange={v => setForm(p => ({ ...p, logoVisible: v }))}
            />
            <Toggle
              label="Mostrar marca escrita ao lado do ícone"
              hint="Desative para exibir só o ícone"
              checked={form.logoShowText}
              onChange={v => setForm(p => ({ ...p, logoShowText: v }))}
            />
            <div className="pt-2">
              <label className="text-xs font-semibold text-white/70 mb-1.5 block">Posição no cabeçalho</label>
              <select
                value={form.logoPosition}
                onChange={e => setForm(p => ({ ...p, logoPosition: e.target.value as 'left' | 'center' }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full"
              >
                <option value="left">Esquerda (padrão)</option>
                <option value="center">Centralizado</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60"
            style={{ backgroundColor: '#C9A84C', color: '#143A1F' }}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
            {saved ? 'Salvo!' : 'Salvar alterações'}
          </button>
        </div>

        {/* ── Preview ─────────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 self-start">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Pré-visualização</p>
          <HeaderPreview
            themeKey={form.layoutType}
            accentColor={form.primaryColor}
            siteName={form.name}
            logoUrl={form.logoUrl}
            wordmarkUrl={form.logoWordmarkUrl}
            logoVisible={form.logoVisible}
            logoShowText={form.logoShowText}
            logoPosition={form.logoPosition}
          />
        </div>
      </div>
    </div>
  )
}
