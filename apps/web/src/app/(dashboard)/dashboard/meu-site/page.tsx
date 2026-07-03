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
import { ALL_THEMES, resolveTheme, type ThemeKey } from '@/lib/site-factory/theme-registry'
import { Store, ExternalLink, Loader2, CheckCircle2, Globe, Palette as PaletteIcon } from 'lucide-react'

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
  settings: {
    logoWordmarkUrl?: string | null
    logoVisible?: boolean
    logoShowText?: boolean
    logoPosition?: 'left' | 'center'
    [key: string]: any
  } | null
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
  })
  const [saved, setSaved] = useState(false)

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
        body: JSON.stringify(form),
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
