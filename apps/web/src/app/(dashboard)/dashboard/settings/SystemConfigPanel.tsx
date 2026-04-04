'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  Palette, Globe, Search, LayoutDashboard, Shield, Bell, Zap, Scale,
  Home, DollarSign, Users, Settings2, Eye, EyeOff, CheckCircle2, Save,
  Loader2, ChevronDown, ChevronRight, Monitor, Smartphone, Sun, Moon,
  Star, Lock, Unlock, Plus, Trash2, RefreshCw, Code, Image as ImageIcon,
  FileText, MessageSquare, MapPin, Phone, Mail, Instagram, Youtube,
  Facebook, Twitter, Linkedin, Hash, ToggleLeft, ToggleRight,
  ClipboardList, History, Paintbrush, UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Primitives ────────────────────────────────────────────────────────────────
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
      {hint && <p className="text-xs text-white/30 mt-1">{hint}</p>}
    </div>
  )
}

function DarkTextarea({ label, hint, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <div>
      {label && <label className="text-xs font-semibold text-white/70 mb-1.5 block">{label}</label>}
      <textarea
        {...props}
        className={cn(
          'bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-yellow-400/50 w-full transition-colors resize-none',
          props.className,
        )}
      />
      {hint && <p className="text-xs text-white/30 mt-1">{hint}</p>}
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
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
          checked ? 'bg-yellow-400' : 'bg-white/20'
        )}
      >
        <span className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
          checked ? 'translate-x-6' : 'translate-x-1'
        )} />
      </button>
    </div>
  )
}

function Section({ title, icon: Icon, children, collapsible = true }: { title: string; icon?: any; children: React.ReactNode; collapsible?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => collapsible && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4 text-yellow-400" />}
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        {collapsible && (open ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />)}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function SaveButton({ onClick, isPending, saved }: { onClick: () => void; isPending: boolean; saved: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onClick}
        disabled={isPending}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Salvo!' : 'Salvar alterações'}
      </button>
    </div>
  )
}

// ── Seletor de Temas ──────────────────────────────────────────────────────────
const THEMES = [
  { id: 'classic-blue',    name: 'Clássico Azul',     desc: 'Azul marinho + dourado. Tradicional e confiável.',         gradient: 'linear-gradient(135deg,#1B2B5B 0%,#2d4a8a 50%,#C9A84C 100%)' },
  { id: 'luxury-dark',     name: 'Luxo Escuro',       desc: 'Preto + dourado. Sofisticado e premium.',                  gradient: 'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#D4AF37 100%)' },
  { id: 'minimal-white',   name: 'Minimalista',       desc: 'Branco + azul. Clean, moderno, foco no conteúdo.',         gradient: 'linear-gradient(135deg,#f8f8f8 0%,#e0e0e0 50%,#2563EB 100%)' },
  { id: 'nature-green',    name: 'Verde Natureza',    desc: 'Esmeralda + verde. Tranquilo e acolhedor.',                gradient: 'linear-gradient(135deg,#064E3B 0%,#065F46 50%,#6EE7B7 100%)' },
  { id: 'modern-coral',    name: 'Coral Moderno',     desc: 'Coral + laranja. Vibrante, jovem, dinâmico.',              gradient: 'linear-gradient(135deg,#E11D48 0%,#F97316 60%,#FBBF24 100%)' },
  { id: 'grafite-premium', name: 'Grafite Premium',   desc: 'Grafite + ciano. Tecnológico e profissional.',             gradient: 'linear-gradient(135deg,#1f2937 0%,#374151 50%,#06B6D4 100%)' },
]

function ThemeSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {THEMES.map(theme => (
        <button
          key={theme.id}
          onClick={() => onChange(theme.id)}
          className={cn(
            'relative p-1 rounded-2xl border-2 transition-all text-left overflow-hidden',
            value === theme.id ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border-white/10 hover:border-white/30'
          )}
        >
          {/* Preview gradient */}
          <div
            className="w-full h-20 rounded-xl mb-2"
            style={{ background: theme.gradient }}
          />
          <div className="px-1 pb-1">
            <p className="text-xs font-bold text-white">{theme.name}</p>
            <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{theme.desc}</p>
          </div>
          {value === theme.id && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-black" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Sub-abas do painel ────────────────────────────────────────────────────────
const SUB_TABS = [
  { id: 'temas',       label: 'Temas do Site',     icon: Palette },
  { id: 'seo',         label: 'SEO & Google',      icon: Search },
  { id: 'site-texts',  label: 'Textos & Seções',   icon: FileText },
  { id: 'design',      label: 'Design Dashboard',  icon: Monitor },
  { id: 'modulos',     label: 'Módulos',           icon: LayoutDashboard },
  { id: 'permissoes',  label: 'Permissões',        icon: Shield },
  { id: 'dashboard',   label: 'Dashboard Widgets', icon: LayoutDashboard },
  { id: 'financeiro',  label: 'Financeiro',        icon: DollarSign },
  { id: 'juridico',    label: 'Jurídico',          icon: Scale },
  { id: 'locacao',     label: 'Locação',           icon: Home },
  { id: 'notificacoes',label: 'Notificações',      icon: Bell },
  { id: 'campos',      label: 'Campos de Cadastro', icon: ClipboardList },
  { id: 'aparencia',   label: 'Cores & Botões',     icon: Paintbrush },
  { id: 'perm-granular',label: 'Permissões Usuário', icon: UserCog },
  { id: 'historico',   label: 'Histórico',          icon: History },
  { id: 'avancado',    label: 'Avançado',          icon: Code },
]

// ── Config History Tab ────────────────────────────────────────────────────────
function ConfigHistoryTab() {
  const { getValidToken } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['config-history'],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/audit-logs?resource=system-config&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      return res.json()
    },
  })

  const logs = data?.data ?? []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white mb-1">Histórico de Configurações</h2>
        <p className="text-xs text-white/40">Todas as alterações de configurações com data, usuário e valores anteriores.</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-white/30 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Nenhuma alteração registrada</p>
          <p className="text-xs text-white/30 mt-1">As próximas alterações de configuração aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log: any) => (
            <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                    {log.action}
                  </span>
                  {log.userName && (
                    <span className="text-xs text-white/50">por {log.userName}</span>
                  )}
                </div>
                <span className="text-xs text-white/30">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              {log.payload?.changes && Object.keys(log.payload.changes).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(log.payload.changes).slice(0, 10).map(([key, val]: [string, any]) => (
                    <div key={key} className="text-xs flex items-center gap-2">
                      <span className="text-white/50 font-mono">{key}:</span>
                      <span className="text-red-400 line-through">{JSON.stringify(val?.before ?? '—')}</span>
                      <span className="text-white/30">→</span>
                      <span className="text-green-400">{JSON.stringify(val?.after ?? '—')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SystemConfigPanel() {
  const { getValidToken, user } = useAuth()
  const qc = useQueryClient()
  const [subTab, setSubTab] = useState('temas')
  const [saved, setSaved] = useState(false)

  // ── Fetch config ────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/system-config`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao carregar configurações')
      return res.json()
    },
  })

  // ── Local state ─────────────────────────────────────────────────────────────
  const [cfg, setCfg] = useState<any>(null)

  useEffect(() => {
    if (data?.config) setCfg(data.config)
  }, [data])

  const updateCfg = (section: string, key: string, value: any) => {
    setCfg((prev: any) => ({
      ...prev,
      [section]: { ...prev?.[section], [key]: value },
    }))
  }

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (updates: any) => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/system-config`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      return res.json()
    },
    onSuccess: (data) => {
      setCfg(data.config)
      setSaved(true)
      qc.invalidateQueries({ queryKey: ['system-config'] })
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const save = (section?: string) => {
    if (!cfg) return
    const updates = section ? { [section]: cfg[section] } : cfg
    saveMutation.mutate(updates)
  }

  if (isLoading || !cfg) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role ?? '')

  return (
    <div className="flex gap-6">
      {/* Sub-nav lateral */}
      <div className="w-44 flex-shrink-0">
        <div className="space-y-1 sticky top-4">
          {SUB_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                subTab === tab.id
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 space-y-4 min-w-0">

        {/* ── TEMAS DO SITE ─────────────────────────────────────────────── */}
        {subTab === 'temas' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Temas do Site Público</h2>
              <p className="text-xs text-white/40">Selecione um tema pronto e clique em Salvar. O site atualiza instantaneamente.</p>
            </div>
            <Section title="Tema Visual Ativo" icon={Palette} collapsible={false}>
              <ThemeSelector
                value={cfg.site?.siteTheme ?? 'classic-blue'}
                onChange={v => updateCfg('site', 'siteTheme', v)}
              />
              <SaveButton onClick={() => save('site')} isPending={saveMutation.isPending} saved={saved} />
            </Section>
            <Section title="Vídeo / Imagem de Fundo do Hero" icon={ImageIcon}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">O vídeo ou imagem aparece como fundo da seção principal do site.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Tipo de fundo</label>
                    <select
                      value={cfg.site?.heroVideoType ?? 'youtube'}
                      onChange={e => updateCfg('site', 'heroVideoType', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="upload">Vídeo enviado</option>
                      <option value="image">Imagem</option>
                      <option value="none">Sem fundo (cor sólida)</option>
                    </select>
                  </div>
                  <DarkInput
                    label="URL do vídeo/imagem"
                    value={cfg.site?.heroVideoUrl ?? ''}
                    onChange={e => updateCfg('site', 'heroVideoUrl', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <DarkInput
                  label="URL de imagem de fundo alternativa"
                  value={cfg.site?.heroImageUrl ?? ''}
                  onChange={e => updateCfg('site', 'heroImageUrl', e.target.value)}
                  placeholder="https://..."
                />
                <SaveButton onClick={() => save('site')} isPending={saveMutation.isPending} saved={saved} />
              </div>
            </Section>

            <Section title="Vídeo de Apresentação do Site" icon={ImageIcon}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">
                  Exibido na página inicial antes da seção "Siga-nas nas Redes Sociais".
                  Escolha entre um <strong className="text-white/60">vídeo</strong> (com autoplay silencioso) ou um <strong className="text-white/60">banner/imagem</strong>.
                  Deixe em branco para usar o vídeo padrão de apresentação do novo site.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Tipo de conteúdo</label>
                    <select
                      value={cfg.site?.presentationMediaType ?? 'video'}
                      onChange={e => updateCfg('site', 'presentationMediaType', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full"
                    >
                      <option value="video">Vídeo (autoplay)</option>
                      <option value="banner">Banner / Imagem</option>
                      <option value="none">Ocultar seção</option>
                    </select>
                  </div>
                  <DarkInput
                    label="URL do vídeo ou banner"
                    value={cfg.site?.presentationVideoUrl ?? ''}
                    onChange={e => updateCfg('site', 'presentationVideoUrl', e.target.value)}
                    placeholder="https://... (MP4 ou imagem)"
                    hint="Cole a URL do arquivo de vídeo (.mp4) ou imagem"
                  />
                </div>
                <DarkInput
                  label="URL do banner (se tipo = Banner)"
                  value={cfg.site?.presentationBannerUrl ?? ''}
                  onChange={e => updateCfg('site', 'presentationBannerUrl', e.target.value)}
                  placeholder="https://... (JPG, PNG, WebP)"
                />
                <DarkInput
                  label="Link do banner (opcional)"
                  value={cfg.site?.presentationBannerLink ?? ''}
                  onChange={e => updateCfg('site', 'presentationBannerLink', e.target.value)}
                  placeholder="/imoveis ou https://..."
                  hint="Ao clicar no banner, redireciona para este link"
                />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput
                    label="Título (opcional)"
                    value={cfg.site?.presentationTitle ?? ''}
                    onChange={e => updateCfg('site', 'presentationTitle', e.target.value)}
                    placeholder="Conheça o nosso novo site"
                  />
                  <DarkInput
                    label="Subtítulo (opcional)"
                    value={cfg.site?.presentationSubtitle ?? ''}
                    onChange={e => updateCfg('site', 'presentationSubtitle', e.target.value)}
                    placeholder="Veja tudo que preparamos para você"
                  />
                </div>
                <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                  <p className="text-xs text-yellow-300 font-semibold mb-1">Vídeo padrão atual:</p>
                  <p className="text-xs text-white/50 break-all">https://files.manuscdn.com/user_upload_by_module/session_file/310519663481419273/MbhJNDOYKAGxseOh.mp4</p>
                  <p className="text-xs text-white/40 mt-1">Deixe o campo URL em branco para usar este vídeo. Substitua pela URL do novo vídeo quando quiser trocar.</p>
                </div>
                <SaveButton onClick={() => save('site')} isPending={saveMutation.isPending} saved={saved} />
              </div>
            </Section>
          </div>
        )}

        {/* ── SEO & GOOGLE ──────────────────────────────────────────────── */}
        {subTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">SEO & Google</h2>
              <p className="text-xs text-white/40">Configure metadados, palavras-chave e integrações de rastreamento.</p>
            </div>
            <Section title="Metadados Principais" icon={Search}>
              <div className="space-y-3">
                <DarkInput label="Título da página (title tag)" value={cfg.seo?.title ?? ''} onChange={e => updateCfg('seo', 'title', e.target.value)} placeholder="Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis" />
                <DarkInput label="Template de título (outras páginas)" value={cfg.seo?.titleTemplate ?? ''} onChange={e => updateCfg('seo', 'titleTemplate', e.target.value)} placeholder="%s | Imobiliária Lemos" hint="Use %s onde o título da página será inserido" />
                <DarkTextarea label="Meta description" value={cfg.seo?.description ?? ''} onChange={e => updateCfg('seo', 'description', e.target.value)} rows={3} placeholder="Há mais de 20 anos conectando pessoas aos melhores imóveis..." hint="Ideal: 150-160 caracteres" />
                <DarkInput label="Nome do site" value={cfg.seo?.siteName ?? ''} onChange={e => updateCfg('seo', 'siteName', e.target.value)} placeholder="Imobiliária Lemos" />
                <DarkInput label="Autor" value={cfg.seo?.author ?? ''} onChange={e => updateCfg('seo', 'author', e.target.value)} placeholder="Imobiliária Lemos" />
                <DarkInput label="URL canônica" value={cfg.seo?.canonical ?? ''} onChange={e => updateCfg('seo', 'canonical', e.target.value)} placeholder="https://www.agoraencontrei.com.br" />
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Palavras-chave (uma por linha)</label>
                  <DarkTextarea
                    value={(cfg.seo?.keywords ?? []).join('\n')}
                    onChange={e => updateCfg('seo', 'keywords', e.target.value.split('\n').filter(Boolean))}
                    rows={5}
                    placeholder={'imobiliária franca\nimóveis franca sp\nalugar casa franca\ncomprar apartamento franca'}
                    hint="Palavras que descrevem seu negócio para os buscadores"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Robots</label>
                  <select
                    value={cfg.seo?.robots ?? 'index, follow'}
                    onChange={e => updateCfg('seo', 'robots', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full"
                  >
                    <option value="index, follow">index, follow (recomendado)</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </select>
                </div>
              </div>
            </Section>
            <Section title="Open Graph (Facebook / WhatsApp)" icon={Facebook}>
              <div className="space-y-3">
                <DarkInput label="OG Title" value={cfg.seo?.ogTitle ?? ''} onChange={e => updateCfg('seo', 'ogTitle', e.target.value)} placeholder="Imobiliária Lemos — Franca/SP" />
                <DarkTextarea label="OG Description" value={cfg.seo?.ogDescription ?? ''} onChange={e => updateCfg('seo', 'ogDescription', e.target.value)} rows={2} />
                <DarkInput label="OG Image URL" value={cfg.seo?.ogImage ?? ''} onChange={e => updateCfg('seo', 'ogImage', e.target.value)} placeholder="https://..." hint="Recomendado: 1200x630px" />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="OG Image Width" type="number" value={cfg.seo?.ogImageWidth ?? 1200} onChange={e => updateCfg('seo', 'ogImageWidth', Number(e.target.value))} />
                  <DarkInput label="OG Image Height" type="number" value={cfg.seo?.ogImageHeight ?? 630} onChange={e => updateCfg('seo', 'ogImageHeight', Number(e.target.value))} />
                </div>
              </div>
            </Section>
            <Section title="Twitter / X Card" icon={Twitter}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Twitter Card Type</label>
                  <select value={cfg.seo?.twitterCard ?? 'summary_large_image'} onChange={e => updateCfg('seo', 'twitterCard', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                    <option value="summary_large_image">summary_large_image (recomendado)</option>
                    <option value="summary">summary</option>
                  </select>
                </div>
                <DarkInput label="Twitter Site (@handle)" value={cfg.seo?.twitterSite ?? ''} onChange={e => updateCfg('seo', 'twitterSite', e.target.value)} placeholder="@imobiliarialemos" />
                <DarkInput label="Twitter Creator (@handle)" value={cfg.seo?.twitterCreator ?? ''} onChange={e => updateCfg('seo', 'twitterCreator', e.target.value)} placeholder="@tomaslemosbr" />
              </div>
            </Section>
            <Section title="Rastreamento & Analytics" icon={Hash}>
              <div className="space-y-3">
                <DarkInput label="Google Analytics 4 (Measurement ID)" value={cfg.seo?.googleAnalytics ?? ''} onChange={e => updateCfg('seo', 'googleAnalytics', e.target.value)} placeholder="G-XXXXXXXXXX" />
                <DarkInput label="Google Tag Manager (GTM ID)" value={cfg.seo?.googleTagManager ?? ''} onChange={e => updateCfg('seo', 'googleTagManager', e.target.value)} placeholder="GTM-XXXXXXX" />
                <DarkInput label="Google Search Console (verificação)" value={cfg.seo?.googleSiteVerify ?? ''} onChange={e => updateCfg('seo', 'googleSiteVerify', e.target.value)} placeholder="Código de verificação HTML" />
                <DarkInput label="Facebook Pixel ID" value={cfg.seo?.facebookPixel ?? ''} onChange={e => updateCfg('seo', 'facebookPixel', e.target.value)} placeholder="1234567890" />
                <DarkInput label="Bing Webmaster Tools (verificação)" value={cfg.seo?.bingVerify ?? ''} onChange={e => updateCfg('seo', 'bingVerify', e.target.value)} placeholder="Código de verificação" />
                <DarkInput label="Hotjar ID" value={cfg.seo?.hotjarId ?? ''} onChange={e => updateCfg('seo', 'hotjarId', e.target.value)} placeholder="1234567" />
                <DarkInput label="Microsoft Clarity ID" value={cfg.seo?.clarityId ?? ''} onChange={e => updateCfg('seo', 'clarityId', e.target.value)} placeholder="xxxxxxxxxx" />
                <Toggle label="Schema.org (dados estruturados)" hint="Melhora a exibição nos resultados do Google" checked={cfg.seo?.schemaOrg ?? true} onChange={v => updateCfg('seo', 'schemaOrg', v)} />
              </div>
            </Section>
            <SaveButton onClick={() => save('seo')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── TEXTOS & SEÇÕES DO SITE ────────────────────────────────────── */}
        {subTab === 'site-texts' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Textos & Seções do Site</h2>
              <p className="text-xs text-white/40">Personalize todos os textos visíveis no site público.</p>
            </div>
            <Section title="Hero — Seção Principal" icon={Home}>
              <div className="space-y-3">
                <DarkInput label="Texto do badge (destaque)" value={cfg.site?.heroBadge ?? ''} onChange={e => updateCfg('site', 'heroBadge', e.target.value)} placeholder="Mais de 20 anos de tradição em Franca/SP" />
                <DarkInput label="Título principal" value={cfg.site?.heroTitle ?? ''} onChange={e => updateCfg('site', 'heroTitle', e.target.value)} placeholder="Encontre o imóvel" />
                <DarkInput label="Título em destaque (cor do tema)" value={cfg.site?.heroTitleHighlight ?? ''} onChange={e => updateCfg('site', 'heroTitleHighlight', e.target.value)} placeholder="dos seus sonhos" />
                <DarkInput label="Subtítulo" value={cfg.site?.heroSubtitle ?? ''} onChange={e => updateCfg('site', 'heroSubtitle', e.target.value)} placeholder="Compra, venda e locação de imóveis em Franca e região" />
                <div className="grid grid-cols-3 gap-3">
                  <DarkInput label="Estatística: Anos" value={cfg.site?.statYears ?? '22+'} onChange={e => updateCfg('site', 'statYears', e.target.value)} />
                  <DarkInput label="Label: Anos" value={cfg.site?.statYearsLabel ?? 'Anos de mercado'} onChange={e => updateCfg('site', 'statYearsLabel', e.target.value)} />
                  <DarkInput label="Estatística: Famílias" value={cfg.site?.statFamilies ?? '5.000+'} onChange={e => updateCfg('site', 'statFamilies', e.target.value)} />
                </div>
              </div>
            </Section>
            <Section title="Seção de Imóveis em Destaque" icon={Star}>
              <div className="space-y-3">
                <DarkInput label="Título da seção" value={cfg.site?.featuredTitle ?? ''} onChange={e => updateCfg('site', 'featuredTitle', e.target.value)} placeholder="Imóveis em Destaque" />
                <DarkInput label="Subtítulo" value={cfg.site?.featuredSubtitle ?? ''} onChange={e => updateCfg('site', 'featuredSubtitle', e.target.value)} placeholder="Recém cadastrados — os mais novos do portfólio" />
              </div>
            </Section>
            <Section title="Seção de Diferenciais" icon={CheckCircle2}>
              <div className="space-y-3">
                <DarkInput label="Título da seção" value={cfg.site?.trustTitle ?? ''} onChange={e => updateCfg('site', 'trustTitle', e.target.value)} placeholder="Por que escolher a Imobiliária Lemos?" />
              </div>
            </Section>
            <Section title="CTA — Chamada para Ação Final" icon={MessageSquare}>
              <div className="space-y-3">
                <DarkInput label="Título" value={cfg.site?.ctaTitle ?? ''} onChange={e => updateCfg('site', 'ctaTitle', e.target.value)} placeholder="Pronto para encontrar seu imóvel?" />
                <DarkInput label="Subtítulo" value={cfg.site?.ctaSubtitle ?? ''} onChange={e => updateCfg('site', 'ctaSubtitle', e.target.value)} placeholder="Fale com nossos especialistas..." />
                <DarkInput label="Texto do botão" value={cfg.site?.ctaButton ?? ''} onChange={e => updateCfg('site', 'ctaButton', e.target.value)} placeholder="Falar com um corretor" />
              </div>
            </Section>
            <Section title="Contato & WhatsApp" icon={Phone}>
              <div className="space-y-3">
                <DarkInput label="Número WhatsApp (com DDI e DDD, sem +)" value={cfg.site?.whatsappNumber ?? ''} onChange={e => updateCfg('site', 'whatsappNumber', e.target.value)} placeholder="5516981010004" />
                <DarkTextarea label="Mensagem padrão do WhatsApp" value={cfg.site?.whatsappMessage ?? ''} onChange={e => updateCfg('site', 'whatsappMessage', e.target.value)} rows={2} placeholder="Olá! Gostaria de saber mais sobre os imóveis." />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Telefone fixo" value={cfg.site?.phoneFixed ?? ''} onChange={e => updateCfg('site', 'phoneFixed', e.target.value)} placeholder="(16) 3723-0045" />
                  <DarkInput label="Celular" value={cfg.site?.phoneMobile ?? ''} onChange={e => updateCfg('site', 'phoneMobile', e.target.value)} placeholder="(16) 98101-0004" />
                </div>
              </div>
            </Section>
            <Section title="Redes Sociais" icon={Instagram}>
              <div className="space-y-3">
                <DarkInput label="Instagram (Imobiliária)" value={cfg.site?.instagramUrl ?? ''} onChange={e => updateCfg('site', 'instagramUrl', e.target.value)} placeholder="https://instagram.com/imobiliarialemos" />
                <DarkInput label="Instagram (Tomas Lemos)" value={cfg.site?.instagramUrlTomas ?? ''} onChange={e => updateCfg('site', 'instagramUrlTomas', e.target.value)} placeholder="https://instagram.com/tomaslemosbr" />
                <DarkInput label="Facebook" value={cfg.site?.facebookUrl ?? ''} onChange={e => updateCfg('site', 'facebookUrl', e.target.value)} placeholder="https://facebook.com/imobiliarialemos" />
                <DarkInput label="YouTube" value={cfg.site?.youtubeUrl ?? ''} onChange={e => updateCfg('site', 'youtubeUrl', e.target.value)} placeholder="https://youtube.com/@imobiliarialemos" />
                <DarkInput label="LinkedIn" value={cfg.site?.linkedinUrl ?? ''} onChange={e => updateCfg('site', 'linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/..." />
                <DarkInput label="TikTok" value={cfg.site?.tiktokUrl ?? ''} onChange={e => updateCfg('site', 'tiktokUrl', e.target.value)} placeholder="https://tiktok.com/@..." />
              </div>
            </Section>
            <Section title="Footer" icon={FileText}>
              <div className="space-y-3">
                <DarkTextarea label="Tagline do footer" value={cfg.site?.footerTagline ?? ''} onChange={e => updateCfg('site', 'footerTagline', e.target.value)} rows={2} placeholder="Há mais de 20 anos conectando pessoas..." />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Ano de fundação" value={cfg.site?.footerFoundedYear ?? '2002'} onChange={e => updateCfg('site', 'footerFoundedYear', e.target.value)} />
                  <DarkInput label="Endereço no footer" value={cfg.site?.footerAddress ?? ''} onChange={e => updateCfg('site', 'footerAddress', e.target.value)} placeholder="Franca — SP" />
                </div>
                <DarkInput label="Texto de copyright" value={cfg.site?.footerCopyright ?? ''} onChange={e => updateCfg('site', 'footerCopyright', e.target.value)} placeholder="Imobiliária Lemos. Todos os direitos reservados." />
              </div>
            </Section>
            <Section title="Seções Visíveis no Site" icon={Eye}>
              <div className="space-y-1 divide-y divide-white/5">
                {[
                  { key: 'showHeroVideo',           label: 'Vídeo/imagem no hero',         hint: 'Fundo animado da seção principal' },
                  { key: 'showSearchBar',            label: 'Barra de busca',               hint: 'Campo de busca de imóveis no hero' },
                  { key: 'showFeaturedProperties',   label: 'Imóveis em destaque',          hint: 'Seção de imóveis em destaque' },
                  { key: 'showServicesSection',      label: 'Seção de serviços',            hint: 'Compra, venda, locação, avaliação' },
                  { key: 'showBlogSection',          label: 'Seção de blog/notícias',       hint: 'Últimas publicações do blog' },
                  { key: 'showCorretoresSection',    label: 'Seção de corretores',          hint: 'Equipe de corretores' },
                  { key: 'showFinanciamentos',       label: 'Seção de financiamentos',      hint: 'Simulação de financiamento' },
                  { key: 'showWhatsappButton',       label: 'Botão flutuante WhatsApp',     hint: 'Botão verde no canto da tela' },
                  { key: 'showChatWidget',           label: 'Widget de chat',               hint: 'Chat ao vivo no site' },
                  { key: 'showTrustBadges',          label: 'Seção de diferenciais',        hint: 'Cards de confiança/credenciais' },
                  { key: 'showStatsBar',             label: 'Barra de estatísticas',        hint: 'Números de imóveis, anos, famílias' },
                  { key: 'showSmartQuiz',            label: 'Quiz inteligente',             hint: 'Quiz para recomendar imóveis' },
                  { key: 'showAvaliacao',            label: 'Avaliação de imóveis',         hint: 'Formulário de avaliação online' },
                  { key: 'showAnunciarSection',      label: 'Seção anunciar imóvel',        hint: 'CTA para proprietários' },
                  { key: 'showCookieBanner',         label: 'Banner de cookies',            hint: 'Aviso de política de privacidade' },
                ].map(item => (
                  <Toggle
                    key={item.key}
                    label={item.label}
                    hint={item.hint}
                    checked={cfg.site?.[item.key] ?? true}
                    onChange={v => updateCfg('site', item.key, v)}
                  />
                ))}
              </div>
            </Section>
            <Section title="Manutenção" icon={Settings2}>
              <div className="space-y-3">
                <Toggle label="Modo manutenção" hint="Exibe mensagem de manutenção no site público" checked={cfg.site?.maintenanceMode ?? false} onChange={v => updateCfg('site', 'maintenanceMode', v)} />
                <DarkTextarea label="Mensagem de manutenção" value={cfg.site?.maintenanceMessage ?? ''} onChange={e => updateCfg('site', 'maintenanceMessage', e.target.value)} rows={2} />
                <DarkTextarea label="Banner de cookies — texto" value={cfg.site?.cookieBannerText ?? ''} onChange={e => updateCfg('site', 'cookieBannerText', e.target.value)} rows={2} />
              </div>
            </Section>
            <SaveButton onClick={() => save('site')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── DESIGN DO DASHBOARD ───────────────────────────────────────── */}
        {subTab === 'design' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Design do Dashboard</h2>
              <p className="text-xs text-white/40">Personalize a aparência do painel administrativo.</p>
            </div>
            <Section title="Tema do Painel" icon={Monitor}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Tema</label>
                  <div className="flex gap-3">
                    {['dark', 'light', 'auto'].map(t => (
                      <button key={t} onClick={() => updateCfg('design', 'dashboardTheme', t)}
                        className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border', cfg.design?.dashboardTheme === t ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-white/10 text-white/50 hover:border-white/30')}>
                        {t === 'dark' ? '🌙 Escuro' : t === 'light' ? '☀️ Claro' : '🔄 Auto'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Estilo do sidebar</label>
                  <div className="flex gap-3">
                    {['dark', 'light', 'colored'].map(t => (
                      <button key={t} onClick={() => updateCfg('design', 'sidebarStyle', t)}
                        className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border', cfg.design?.sidebarStyle === t ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-white/10 text-white/50 hover:border-white/30')}>
                        {t === 'dark' ? 'Escuro' : t === 'light' ? 'Claro' : 'Colorido'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor primária</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={cfg.design?.primaryColor ?? '#1B2B5B'} onChange={e => updateCfg('design', 'primaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <DarkInput value={cfg.design?.primaryColor ?? '#1B2B5B'} onChange={e => updateCfg('design', 'primaryColor', e.target.value)} placeholder="#1B2B5B" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor de destaque</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={cfg.design?.accentColor ?? '#C9A84C'} onChange={e => updateCfg('design', 'accentColor', e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <DarkInput value={cfg.design?.accentColor ?? '#C9A84C'} onChange={e => updateCfg('design', 'accentColor', e.target.value)} placeholder="#C9A84C" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Fonte</label>
                  <select value={cfg.design?.fontFamily ?? 'Inter'} onChange={e => updateCfg('design', 'fontFamily', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                    <option value="Inter">Inter (padrão)</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Nunito">Nunito</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Estilo dos cards</label>
                  <select value={cfg.design?.cardStyle ?? 'elevated'} onChange={e => updateCfg('design', 'cardStyle', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                    <option value="elevated">Elevado (sombra)</option>
                    <option value="flat">Flat (sem sombra)</option>
                    <option value="bordered">Bordado</option>
                    <option value="glass">Glass morphism</option>
                  </select>
                </div>
                <Toggle label="Modo compacto" hint="Reduz o espaçamento para mais informação na tela" checked={cfg.design?.compactMode ?? false} onChange={v => updateCfg('design', 'compactMode', v)} />
                <Toggle label="Animações" hint="Transições e animações na interface" checked={cfg.design?.animationsEnabled ?? true} onChange={v => updateCfg('design', 'animationsEnabled', v)} />
                <Toggle label="Tabelas listradas" hint="Linhas alternadas nas tabelas" checked={cfg.design?.tableStriped ?? true} onChange={v => updateCfg('design', 'tableStriped', v)} />
                <Toggle label="Mostrar logo no sidebar" checked={cfg.design?.showLogoInSidebar ?? true} onChange={v => updateCfg('design', 'showLogoInSidebar', v)} />
                <Toggle label="Mostrar nome da empresa no sidebar" checked={cfg.design?.showCompanyName ?? true} onChange={v => updateCfg('design', 'showCompanyName', v)} />
              </div>
            </Section>
            <SaveButton onClick={() => save('design')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── MÓDULOS ───────────────────────────────────────────────────── */}
        {subTab === 'modulos' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Módulos do Sistema</h2>
              <p className="text-xs text-white/40">Ative ou desative módulos. Módulos desativados ficam ocultos no menu e inacessíveis.</p>
            </div>
            <Section title="Módulos Disponíveis" icon={LayoutDashboard} collapsible={false}>
              <div className="space-y-1 divide-y divide-white/5">
                {[
                  { key: 'lemosbank',      label: 'LemosBank',            hint: 'Financeiro interno (restrito)' },
                  { key: 'juridico',       label: 'Jurídico',             hint: 'Processos e documentos jurídicos (restrito)' },
                  { key: 'fiscal',         label: 'Fiscal',               hint: 'Notas fiscais e obrigações fiscais' },
                  { key: 'financiamentos', label: 'Financiamentos',       hint: 'Simulação e gestão de financiamentos' },
                  { key: 'aiVisual',       label: 'IA Visual',            hint: 'Geração e edição de imagens com IA' },
                  { key: 'blog',           label: 'Blog',                 hint: 'Publicação de artigos e notícias' },
                  { key: 'marketing',      label: 'Marketing',            hint: 'Campanhas e automações de marketing' },
                  { key: 'automations',    label: 'Automações',           hint: 'Fluxos automáticos de CRM' },
                  { key: 'portals',        label: 'Portais',              hint: 'Integração com ZAP, Viva Real, OLX' },
                  { key: 'reports',        label: 'Relatórios',           hint: 'Relatórios e análises' },
                  { key: 'corretor',       label: 'Portal do Corretor',   hint: 'Acesso externo para corretores' },
                  { key: 'documentos',     label: 'Documentos',           hint: 'Arquivo de documentos e contratos' },
                  { key: 'crm',            label: 'CRM',                  hint: 'Gestão de clientes e negócios' },
                  { key: 'inbox',          label: 'Inbox / Chat',         hint: 'Mensagens e atendimento' },
                  { key: 'renovacoes',     label: 'Renovações',           hint: 'Controle de renovações de contratos' },
                  { key: 'historico',      label: 'Histórico / Auditoria',hint: 'Log de ações do sistema' },
                ].map(item => (
                  <Toggle
                    key={item.key}
                    label={item.label}
                    hint={item.hint}
                    checked={cfg.modules?.[item.key] ?? true}
                    onChange={v => updateCfg('modules', item.key, v)}
                  />
                ))}
              </div>
            </Section>
            <Section title="Itens Visíveis no Menu Lateral" icon={LayoutDashboard}>
              <div className="space-y-1 divide-y divide-white/5">
                {[
                  { key: 'showImoveis',        label: 'Imóveis' },
                  { key: 'showAIVisual',        label: 'IA Visual' },
                  { key: 'showLeads',           label: 'Leads' },
                  { key: 'showContatos',        label: 'Contatos' },
                  { key: 'showNegocios',        label: 'Negócios' },
                  { key: 'showChat',            label: 'Chat / Inbox' },
                  { key: 'showFinanciamentos',  label: 'Financiamentos' },
                  { key: 'showPortais',         label: 'Portais' },
                  { key: 'showAutomacoes',      label: 'Automações' },
                  { key: 'showCampanhas',       label: 'Campanhas' },
                  { key: 'showFiscal',          label: 'Fiscal' },
                  { key: 'showRenovacoes',      label: 'Renovações' },
                  { key: 'showBlog',            label: 'Blog' },
                  { key: 'showCorretor',        label: 'Portal Corretor' },
                  { key: 'showDocumentos',      label: 'Documentos' },
                  { key: 'showLemosbank',       label: 'LemosBank' },
                  { key: 'showJuridico',        label: 'Jurídico' },
                  { key: 'showHistorico',       label: 'Histórico' },
                  { key: 'showRelatorios',      label: 'Relatórios' },
                ].map(item => (
                  <Toggle
                    key={item.key}
                    label={item.label}
                    checked={cfg.sidebar?.[item.key] ?? true}
                    onChange={v => updateCfg('sidebar', item.key, v)}
                  />
                ))}
              </div>
            </Section>
            <SaveButton onClick={() => save('modules')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── PERMISSÕES ────────────────────────────────────────────────── */}
        {subTab === 'permissoes' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Permissões de Acesso Interno</h2>
              <p className="text-xs text-white/40">Controle quais usuários têm acesso aos módulos internos restritos (LemosBank, Jurídico, Fiscal, Financiamentos).</p>
            </div>
            <Section title="Módulos Restritos" icon={Lock} collapsible={false}>
              <div className="space-y-3">
                <p className="text-xs text-white/50 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3">
                  ⚠️ Módulos marcados como restritos só são acessíveis pelos usuários listados abaixo. Administradores sempre têm acesso total.
                </p>
                <div className="space-y-1 divide-y divide-white/5">
                  {['lemosbank', 'juridico', 'fiscal', 'financiamentos', 'relatorios'].map(mod => (
                    <Toggle
                      key={mod}
                      label={mod.charAt(0).toUpperCase() + mod.slice(1)}
                      hint="Marque para restringir o acesso"
                      checked={(cfg.internalModuleAccess?.restrictedModules ?? []).includes(mod)}
                      onChange={v => {
                        const current = cfg.internalModuleAccess?.restrictedModules ?? []
                        const updated = v ? [...current, mod] : current.filter((m: string) => m !== mod)
                        updateCfg('internalModuleAccess', 'restrictedModules', updated)
                      }}
                    />
                  ))}
                </div>
              </div>
            </Section>
            <Section title="Usuários com Acesso Interno" icon={Users} collapsible={false}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">
                  Liste os nomes (primeiro nome) dos usuários que têm acesso aos módulos restritos. Não diferencia maiúsculas/minúsculas.
                </p>
                <div className="space-y-2">
                  {(cfg.internalModuleAccess?.allowedUsers ?? ['tomas', 'nadia', 'naira', 'geraldo', 'noemia']).map((u: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <DarkInput
                        value={u}
                        onChange={e => {
                          const arr = [...(cfg.internalModuleAccess?.allowedUsers ?? [])]
                          arr[i] = e.target.value.toLowerCase().trim()
                          updateCfg('internalModuleAccess', 'allowedUsers', arr)
                        }}
                        placeholder="nome do usuário"
                      />
                      <button
                        onClick={() => {
                          const arr = (cfg.internalModuleAccess?.allowedUsers ?? []).filter((_: string, j: number) => j !== i)
                          updateCfg('internalModuleAccess', 'allowedUsers', arr)
                        }}
                        className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const arr = [...(cfg.internalModuleAccess?.allowedUsers ?? []), '']
                    updateCfg('internalModuleAccess', 'allowedUsers', arr)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar usuário
                </button>
                <div className="bg-white/5 rounded-xl p-3 text-xs text-white/40 space-y-1">
                  <p className="font-semibold text-white/60">Usuários pré-autorizados:</p>
                  <p>Tomas · Nádia · Naira · Geraldo · Noêmia</p>
                </div>
              </div>
            </Section>
            <SaveButton onClick={() => save('internalModuleAccess')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── DASHBOARD WIDGETS ─────────────────────────────────────────── */}
        {subTab === 'dashboard' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Widgets do Dashboard</h2>
              <p className="text-xs text-white/40">Escolha quais cards e widgets aparecem na tela inicial do painel.</p>
            </div>
            <Section title="Cards de KPI" icon={LayoutDashboard} collapsible={false}>
              <div className="space-y-1 divide-y divide-white/5">
                {[
                  { key: 'showRevenueCard',      label: 'Card de Receita',             hint: 'Receita mensal de locação' },
                  { key: 'showContractsCard',     label: 'Card de Contratos',           hint: 'Total de contratos ativos' },
                  { key: 'showClientsCard',       label: 'Card de Clientes',            hint: 'Total de clientes cadastrados' },
                  { key: 'showDefaultCard',       label: 'Card de Inadimplência',       hint: 'Contratos em atraso' },
                  { key: 'showPropertiesStats',   label: 'Estatísticas de Imóveis',     hint: 'Total de imóveis por status' },
                  { key: 'showLeadsStats',        label: 'Estatísticas de Leads',       hint: 'Leads recebidos no período' },
                  { key: 'showFinancialSummary',  label: 'Resumo Financeiro',           hint: 'Balanço do mês' },
                  { key: 'showLegalAlerts',       label: 'Alertas Jurídicos',           hint: 'Audiências e prazos próximos' },
                  { key: 'showUpcomingRentals',   label: 'Vencimentos Próximos',        hint: 'Aluguéis vencendo em breve' },
                  { key: 'showLateRentals',       label: 'Aluguéis em Atraso',         hint: 'Contratos com pagamento atrasado' },
                  { key: 'showRecentActivity',    label: 'Atividade Recente',           hint: 'Últimas ações no sistema' },
                  { key: 'showQuickActions',      label: 'Ações Rápidas',              hint: 'Botões de atalho' },
                  { key: 'showAIAssistant',       label: 'Assistente IA',              hint: 'Widget do assistente inteligente' },
                  { key: 'showCalendarWidget',    label: 'Widget de Calendário',        hint: 'Próximos eventos e compromissos' },
                  { key: 'showNotifications',     label: 'Notificações',               hint: 'Painel de notificações' },
                ].map(item => (
                  <Toggle key={item.key} label={item.label} hint={item.hint} checked={cfg.dashboard?.[item.key] ?? true} onChange={v => updateCfg('dashboard', item.key, v)} />
                ))}
              </div>
            </Section>
            <Section title="Layout" icon={Monitor}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cards por linha</label>
                  <select value={cfg.dashboard?.cardsPerRow ?? 4} onChange={e => updateCfg('dashboard', 'cardsPerRow', Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                    <option value={2}>2 por linha</option>
                    <option value={3}>3 por linha</option>
                    <option value={4}>4 por linha (padrão)</option>
                    <option value={5}>5 por linha</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Período padrão dos gráficos</label>
                  <select value={cfg.dashboard?.defaultDateRange ?? '30d'} onChange={e => updateCfg('dashboard', 'defaultDateRange', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                    <option value="365d">Último ano</option>
                  </select>
                </div>
              </div>
            </Section>
            <SaveButton onClick={() => save('dashboard')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── FINANCEIRO ────────────────────────────────────────────────── */}
        {subTab === 'financeiro' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Configurações Financeiras</h2>
              <p className="text-xs text-white/40">Padrões para contratos de locação, cobranças e integrações financeiras.</p>
            </div>
            <Section title="Padrões de Locação" icon={DollarSign}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Dia de vencimento padrão (inquilino)" type="number" value={cfg.financial?.defaultDueDay ?? 5} onChange={e => updateCfg('financial', 'defaultDueDay', Number(e.target.value))} />
                  <DarkInput label="Dia de repasse padrão (proprietário)" type="number" value={cfg.financial?.landlordDefaultDueDay ?? 10} onChange={e => updateCfg('financial', 'landlordDefaultDueDay', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Multa por atraso (%)" type="number" step="0.1" value={cfg.financial?.lateFeePercent ?? 2.0} onChange={e => updateCfg('financial', 'lateFeePercent', Number(e.target.value))} />
                  <DarkInput label="Juros mensais (%)" type="number" step="0.1" value={cfg.financial?.interestPercentMonth ?? 1.0} onChange={e => updateCfg('financial', 'interestPercentMonth', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Índice de reajuste</label>
                    <select value={cfg.financial?.indexType ?? 'IGPM'} onChange={e => updateCfg('financial', 'indexType', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                      <option value="IGPM">IGP-M</option>
                      <option value="IPCA">IPCA</option>
                      <option value="INPC">INPC</option>
                      <option value="IVAR">IVAR</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                  <DarkInput label="Mês de reajuste" type="number" min={1} max={12} value={cfg.financial?.readjustmentMonth ?? 12} onChange={e => updateCfg('financial', 'readjustmentMonth', Number(e.target.value))} />
                </div>
                <DarkInput label="Taxa de serviço fiscal (%)" type="number" step="0.1" value={cfg.financial?.fiscalServicePercent ?? 8.0} onChange={e => updateCfg('financial', 'fiscalServicePercent', Number(e.target.value))} />
              </div>
            </Section>
            <Section title="Dados Bancários" icon={DollarSign}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Banco" value={cfg.financial?.bankName ?? ''} onChange={e => updateCfg('financial', 'bankName', e.target.value)} placeholder="Banco do Brasil" />
                  <DarkInput label="Agência" value={cfg.financial?.bankAgency ?? ''} onChange={e => updateCfg('financial', 'bankAgency', e.target.value)} placeholder="0001-1" />
                </div>
                <DarkInput label="Conta" value={cfg.financial?.bankAccount ?? ''} onChange={e => updateCfg('financial', 'bankAccount', e.target.value)} placeholder="12345-6" />
                <DarkInput label="Chave PIX" value={cfg.financial?.bankPix ?? ''} onChange={e => updateCfg('financial', 'bankPix', e.target.value)} placeholder="CNPJ, e-mail ou chave aleatória" />
              </div>
            </Section>
            <Section title="Asaas — Boletos e Cobranças" icon={Zap}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">Integração com Asaas para geração automática de boletos e cobranças.</p>
                <DarkInput label="API Key do Asaas" type="password" value={cfg.financial?.asaasApiKey ?? ''} onChange={e => updateCfg('financial', 'asaasApiKey', e.target.value)} placeholder="$aact_..." />
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Ambiente</label>
                  <select value={cfg.financial?.asaasMode ?? 'sandbox'} onChange={e => updateCfg('financial', 'asaasMode', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                    <option value="sandbox">Sandbox (testes)</option>
                    <option value="production">Produção</option>
                  </select>
                </div>
                <Toggle label="Gerar boletos automaticamente" hint="Gera boleto ao criar lançamento de aluguel" checked={cfg.financial?.autoGenerateBoletos ?? false} onChange={v => updateCfg('financial', 'autoGenerateBoletos', v)} />
              </div>
            </Section>
            <SaveButton onClick={() => save('financial')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── JURÍDICO ──────────────────────────────────────────────────── */}
        {subTab === 'juridico' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Configurações Jurídicas</h2>
              <p className="text-xs text-white/40">Padrões para processos jurídicos, alertas e dados do advogado.</p>
            </div>
            <Section title="Padrões de Processo" icon={Scale}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Tribunal padrão" value={cfg.legal?.defaultCourt ?? 'TJSP'} onChange={e => updateCfg('legal', 'defaultCourt', e.target.value)} placeholder="TJSP" />
                  <DarkInput label="Cidade do tribunal" value={cfg.legal?.defaultCourtCity ?? 'Franca'} onChange={e => updateCfg('legal', 'defaultCourtCity', e.target.value)} placeholder="Franca" />
                </div>
                <DarkInput label="Vara padrão" value={cfg.legal?.defaultCourtSection ?? '1ª Vara Cível'} onChange={e => updateCfg('legal', 'defaultCourtSection', e.target.value)} placeholder="1ª Vara Cível" />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Alertar X dias antes da audiência" type="number" value={cfg.legal?.alertDaysBeforeHearing ?? 7} onChange={e => updateCfg('legal', 'alertDaysBeforeHearing', Number(e.target.value))} />
                  <DarkInput label="Alertar X dias antes do prazo" type="number" value={cfg.legal?.alertDaysBeforeDeadline ?? 3} onChange={e => updateCfg('legal', 'alertDaysBeforeDeadline', Number(e.target.value))} />
                </div>
                <Toggle label="Mostrar alertas jurídicos no dashboard" checked={cfg.legal?.showLegalOnDashboard ?? true} onChange={v => updateCfg('legal', 'showLegalOnDashboard', v)} />
                <Toggle label="Vincular contrato ao processo automaticamente" checked={cfg.legal?.autoLinkContractToCase ?? true} onChange={v => updateCfg('legal', 'autoLinkContractToCase', v)} />
              </div>
            </Section>
            <Section title="Advogado Padrão" icon={Users}>
              <div className="space-y-3">
                <DarkInput label="Nome do advogado" value={cfg.legal?.defaultLawyerName ?? ''} onChange={e => updateCfg('legal', 'defaultLawyerName', e.target.value)} placeholder="Dr. João Silva" />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="OAB" value={cfg.legal?.defaultLawyerOab ?? ''} onChange={e => updateCfg('legal', 'defaultLawyerOab', e.target.value)} placeholder="SP 123456" />
                  <DarkInput label="Telefone" value={cfg.legal?.defaultLawyerPhone ?? ''} onChange={e => updateCfg('legal', 'defaultLawyerPhone', e.target.value)} placeholder="(16) 99999-9999" />
                </div>
                <DarkInput label="E-mail" value={cfg.legal?.defaultLawyerEmail ?? ''} onChange={e => updateCfg('legal', 'defaultLawyerEmail', e.target.value)} placeholder="advogado@escritorio.com.br" />
              </div>
            </Section>
            <SaveButton onClick={() => save('legal')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── LOCAÇÃO ───────────────────────────────────────────────────── */}
        {subTab === 'locacao' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Configurações de Locação</h2>
              <p className="text-xs text-white/40">Padrões para contratos de locação, prazos e notificações.</p>
            </div>
            <Section title="Padrões de Contrato" icon={Home}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Índice de reajuste</label>
                    <select value={cfg.rental?.defaultIndexType ?? 'IGPM'} onChange={e => updateCfg('rental', 'defaultIndexType', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                      <option value="IGPM">IGP-M</option>
                      <option value="IPCA">IPCA</option>
                      <option value="INPC">INPC</option>
                      <option value="IVAR">IVAR</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                  <DarkInput label="Mês de reajuste" type="number" min={1} max={12} value={cfg.rental?.defaultReadjustmentMonth ?? 12} onChange={e => updateCfg('rental', 'defaultReadjustmentMonth', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Tipo de garantia padrão</label>
                  <select value={cfg.rental?.defaultGuaranteeType ?? 'fiador'} onChange={e => updateCfg('rental', 'defaultGuaranteeType', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                    <option value="fiador">Fiador</option>
                    <option value="caucao">Caução</option>
                    <option value="seguro">Seguro fiança</option>
                    <option value="titulo">Título de capitalização</option>
                    <option value="sem_garantia">Sem garantia</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Duração padrão (meses)" type="number" value={cfg.rental?.defaultContractDuration ?? 30} onChange={e => updateCfg('rental', 'defaultContractDuration', Number(e.target.value))} />
                  <DarkInput label="Aviso prévio (dias)" type="number" value={cfg.rental?.rescissionNoticedays ?? 30} onChange={e => updateCfg('rental', 'rescissionNoticedays', Number(e.target.value))} />
                </div>
                <DarkInput label="Enviar lembrete X dias antes do vencimento" type="number" value={cfg.rental?.sendReminderDaysBefore ?? 5} onChange={e => updateCfg('rental', 'sendReminderDaysBefore', Number(e.target.value))} />
                <Toggle label="Mostrar locação no dashboard" checked={cfg.rental?.showRentalOnDashboard ?? true} onChange={v => updateCfg('rental', 'showRentalOnDashboard', v)} />
              </div>
            </Section>
            <SaveButton onClick={() => save('rental')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── NOTIFICAÇÕES ──────────────────────────────────────────────── */}
        {subTab === 'notificacoes' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Notificações</h2>
              <p className="text-xs text-white/40">Configure quando e como o sistema envia notificações.</p>
            </div>
            <Section title="E-mail de Notificação" icon={Mail}>
              <div className="space-y-3">
                <DarkInput label="E-mail para receber notificações" type="email" value={cfg.notifications?.notificationEmail ?? ''} onChange={e => updateCfg('notifications', 'notificationEmail', e.target.value)} placeholder="gerencia@imobiliarialemos.com.br" />
                <div className="space-y-1 divide-y divide-white/5">
                  {[
                    { key: 'emailOnNewLead',        label: 'Novo lead recebido' },
                    { key: 'emailOnNewContract',     label: 'Novo contrato criado' },
                    { key: 'emailOnLateRental',      label: 'Aluguel em atraso' },
                    { key: 'emailOnNewMessage',      label: 'Nova mensagem no chat' },
                    { key: 'emailOnLegalHearing',    label: 'Audiência jurídica próxima' },
                    { key: 'emailOnContractExpiry',  label: 'Contrato próximo do vencimento' },
                    { key: 'dailySummaryEmail',      label: 'Resumo diário por e-mail' },
                    { key: 'weeklyReportEmail',      label: 'Relatório semanal por e-mail' },
                    { key: 'pushNotifications',      label: 'Notificações push no navegador' },
                  ].map(item => (
                    <Toggle key={item.key} label={item.label} checked={cfg.notifications?.[item.key] ?? true} onChange={v => updateCfg('notifications', item.key, v)} />
                  ))}
                </div>
              </div>
            </Section>
            <Section title="SMTP — Servidor de E-mail" icon={Mail}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">Configure o servidor SMTP para envio de e-mails transacionais.</p>
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Host SMTP" value={cfg.notifications?.smtpHost ?? ''} onChange={e => updateCfg('notifications', 'smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
                  <DarkInput label="Porta" type="number" value={cfg.notifications?.smtpPort ?? 587} onChange={e => updateCfg('notifications', 'smtpPort', Number(e.target.value))} />
                </div>
                <DarkInput label="Usuário SMTP" value={cfg.notifications?.smtpUser ?? ''} onChange={e => updateCfg('notifications', 'smtpUser', e.target.value)} placeholder="seu@email.com" />
                <DarkInput label="Senha SMTP" type="password" value={cfg.notifications?.smtpPass ?? ''} onChange={e => updateCfg('notifications', 'smtpPass', e.target.value)} placeholder="••••••••" />
                <DarkInput label="E-mail remetente (From)" value={cfg.notifications?.smtpFrom ?? ''} onChange={e => updateCfg('notifications', 'smtpFrom', e.target.value)} placeholder="noreply@imobiliarialemos.com.br" />
                <DarkInput label="Nome remetente" value={cfg.notifications?.smtpFromName ?? 'Imobiliária Lemos'} onChange={e => updateCfg('notifications', 'smtpFromName', e.target.value)} />
              </div>
            </Section>
            <SaveButton onClick={() => save('notifications')} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── CAMPOS DE CADASTRO ─────────────────────────────────────── */}
        {subTab === 'campos' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Campos de Cadastro Configuráveis</h2>
              <p className="text-xs text-white/40">Defina quais campos são obrigatórios ou opcionais em cada formulário do sistema.</p>
            </div>
            {(['client', 'property', 'contract', 'legalCase', 'lead'] as const).map(form => {
              const labels: Record<string, string> = { client: 'Clientes', property: 'Imóveis', contract: 'Contratos', legalCase: 'Processos Jurídicos', lead: 'Leads' }
              const formCfg = cfg.forms?.[form] ?? { requiredFields: [], showFields: [] }
              const allFields = formCfg.showFields ?? []
              const required = formCfg.requiredFields ?? []
              return (
                <Section key={form} title={labels[form]} icon={ClipboardList}>
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 mb-2">Marque os campos obrigatórios. Campos desmarcados serão opcionais.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {allFields.map((field: string) => (
                        <label key={field} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={required.includes(field)}
                            onChange={e => {
                              const newRequired = e.target.checked
                                ? [...required, field]
                                : required.filter((f: string) => f !== field)
                              updateCfg('forms', form, { ...formCfg, requiredFields: newRequired })
                            }}
                            className="rounded border-white/20 bg-white/5 text-yellow-400 focus:ring-yellow-400"
                          />
                          <span className="text-xs text-white/70">{field}</span>
                          {required.includes(field) && <span className="text-[10px] text-yellow-400 font-bold">*</span>}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-white/50 mb-1">Adicionar campo ao formulário:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nome do campo..."
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white flex-1 outline-none focus:border-yellow-400/50"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const v = (e.target as HTMLInputElement).value.trim()
                              if (v && !allFields.includes(v)) {
                                updateCfg('forms', form, { ...formCfg, showFields: [...allFields, v] })
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Section>
              )
            })}
            <SaveButton onClick={() => save()} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── CORES & BOTÕES ──────────────────────────────────────────── */}
        {subTab === 'aparencia' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Cores & Botões Editáveis</h2>
              <p className="text-xs text-white/40">Personalize as cores do site público e do dashboard.</p>
            </div>
            <Section title="Cores do Site Público" icon={Paintbrush}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor Primária</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.site?.primaryColor ?? '#1B2B5B'} onChange={e => updateCfg('site', 'primaryColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.site?.primaryColor ?? '#1B2B5B'} onChange={e => updateCfg('site', 'primaryColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor de Destaque</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.site?.accentColor ?? '#C9A84C'} onChange={e => updateCfg('site', 'accentColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.site?.accentColor ?? '#C9A84C'} onChange={e => updateCfg('site', 'accentColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor de Fundo</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.site?.backgroundColor ?? '#f9f7f4'} onChange={e => updateCfg('site', 'backgroundColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.site?.backgroundColor ?? '#f9f7f4'} onChange={e => updateCfg('site', 'backgroundColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor do Texto</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.site?.textColor ?? '#1a1a1a'} onChange={e => updateCfg('site', 'textColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.site?.textColor ?? '#1a1a1a'} onChange={e => updateCfg('site', 'textColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Section>
            <Section title="Botões do Site" icon={Paintbrush}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor do Botão Principal</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.site?.buttonPrimaryColor ?? '#1B2B5B'} onChange={e => updateCfg('site', 'buttonPrimaryColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.site?.buttonPrimaryColor ?? '#1B2B5B'} onChange={e => updateCfg('site', 'buttonPrimaryColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Texto do Botão</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.site?.buttonTextColor ?? '#ffffff'} onChange={e => updateCfg('site', 'buttonTextColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.site?.buttonTextColor ?? '#ffffff'} onChange={e => updateCfg('site', 'buttonTextColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                </div>
                <DarkInput label="Raio da borda (px)" type="number" value={cfg.site?.buttonBorderRadius ?? 12} onChange={e => updateCfg('site', 'buttonBorderRadius', Number(e.target.value))} hint="Ex: 0 = quadrado, 12 = arredondado, 999 = pílula" />
                <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-2">Pré-visualização:</p>
                  <button
                    className="px-6 py-3 font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: cfg.site?.buttonPrimaryColor ?? '#1B2B5B',
                      color: cfg.site?.buttonTextColor ?? '#ffffff',
                      borderRadius: `${cfg.site?.buttonBorderRadius ?? 12}px`,
                    }}
                  >
                    Botão de Exemplo
                  </button>
                </div>
              </div>
            </Section>
            <Section title="Cores do Dashboard" icon={Monitor}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor Primária Dashboard</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.design?.primaryColor ?? '#6366f1'} onChange={e => updateCfg('design', 'primaryColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.design?.primaryColor ?? '#6366f1'} onChange={e => updateCfg('design', 'primaryColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Cor de Destaque Dashboard</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cfg.design?.accentColor ?? '#f59e0b'} onChange={e => updateCfg('design', 'accentColor', e.target.value)} className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input type="text" value={cfg.design?.accentColor ?? '#f59e0b'} onChange={e => updateCfg('design', 'accentColor', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Section>
            <SaveButton onClick={() => save()} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── PERMISSÕES POR USUÁRIO ─────────────────────────────────── */}
        {subTab === 'perm-granular' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Permissões Granulares por Usuário</h2>
              <p className="text-xs text-white/40">Configure permissões individuais por módulo para cada usuário, além dos roles padrão.</p>
            </div>
            <Section title="Módulos com Acesso Restrito" icon={Lock}>
              <div className="space-y-2">
                <p className="text-xs text-white/40 mb-2">Selecione quais módulos exigem permissão especial para acesso.</p>
                {['lemosbank', 'juridico', 'fiscal', 'financiamentos', 'relatorios', 'marketing', 'crm', 'automations', 'blog'].map(mod => (
                  <Toggle
                    key={mod}
                    label={mod.charAt(0).toUpperCase() + mod.slice(1)}
                    checked={(cfg.internalModuleAccess?.restrictedModules ?? []).includes(mod)}
                    onChange={checked => {
                      const current = cfg.internalModuleAccess?.restrictedModules ?? []
                      const updated = checked ? [...current, mod] : current.filter((m: string) => m !== mod)
                      updateCfg('internalModuleAccess', 'restrictedModules', updated)
                    }}
                  />
                ))}
              </div>
            </Section>
            <Section title="Usuários Autorizados" icon={UserCog}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">Usuários na lista abaixo podem acessar todos os módulos restritos.</p>
                <div className="flex flex-wrap gap-2">
                  {(cfg.internalModuleAccess?.allowedUsers ?? []).map((u: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                      {u}
                      <button
                        onClick={() => {
                          const updated = (cfg.internalModuleAccess?.allowedUsers ?? []).filter((_: string, j: number) => j !== i)
                          updateCfg('internalModuleAccess', 'allowedUsers', updated)
                        }}
                        className="hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do usuário..."
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white flex-1 outline-none focus:border-yellow-400/50"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = (e.target as HTMLInputElement).value.trim().toLowerCase()
                        if (v && !(cfg.internalModuleAccess?.allowedUsers ?? []).includes(v)) {
                          updateCfg('internalModuleAccess', 'allowedUsers', [...(cfg.internalModuleAccess?.allowedUsers ?? []), v])
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </Section>
            <Section title="Permissões por Módulo por Usuário" icon={Shield}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">Configure acesso específico para cada módulo e usuário individualmente.</p>
                {['lemosbank', 'juridico', 'fiscal', 'financiamentos', 'relatorios'].map(mod => {
                  const modulePerms = cfg.modulePermissions?.[mod] ?? []
                  return (
                    <div key={mod} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{mod.charAt(0).toUpperCase() + mod.slice(1)}</span>
                        <span className="text-xs text-white/40">{modulePerms.length} usuário(s)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {modulePerms.map((u: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-[11px]">
                            {u}
                            <button onClick={() => {
                              const updated = modulePerms.filter((_: string, j: number) => j !== i)
                              updateCfg('modulePermissions', mod, updated)
                            }} className="hover:text-red-400"><Trash2 className="h-2.5 w-2.5" /></button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text" placeholder={`Adicionar usuário a ${mod}...`}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white w-full outline-none focus:border-blue-400/50"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const v = (e.target as HTMLInputElement).value.trim().toLowerCase()
                            if (v && !modulePerms.includes(v)) {
                              updateCfg('modulePermissions', mod, [...modulePerms, v])
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </Section>
            <SaveButton onClick={() => save()} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

        {/* ── HISTÓRICO DE CONFIGURAÇÕES ──────────────────────────────── */}
        {subTab === 'historico' && (
          <ConfigHistoryTab />
        )}

        {/* ── AVANÇADO ──────────────────────────────────────────────────── */}
        {subTab === 'avancado' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Configurações Avançadas</h2>
              <p className="text-xs text-white/40">CSS personalizado, JavaScript, favicon e outras opções avançadas.</p>
            </div>
            <Section title="CSS Personalizado" icon={Code}>
              <div className="space-y-3">
                <p className="text-xs text-white/40">Adicione CSS personalizado que será injetado no site público. Use com cuidado.</p>
                <DarkTextarea
                  value={cfg.site?.customCss ?? ''}
                  onChange={e => updateCfg('site', 'customCss', e.target.value)}
                  rows={8}
                  placeholder={`/* Exemplo: alterar cor dos botões */\n.btn-primary {\n  background: #ff0000 !important;\n}`}
                  className="font-mono text-xs"
                />
              </div>
            </Section>
            <Section title="JavaScript Personalizado" icon={Code}>
              <div className="space-y-3">
                <p className="text-xs text-white/40 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  ⚠️ Atenção: JavaScript personalizado pode comprometer a segurança e o funcionamento do site. Use apenas se souber o que está fazendo.
                </p>
                <DarkTextarea
                  value={cfg.site?.customJs ?? ''}
                  onChange={e => updateCfg('site', 'customJs', e.target.value)}
                  rows={6}
                  placeholder="// JavaScript personalizado"
                  className="font-mono text-xs"
                />
              </div>
            </Section>
            <Section title="Favicon & Ícones" icon={ImageIcon}>
              <div className="space-y-3">
                <DarkInput label="URL do Favicon" value={cfg.site?.faviconUrl ?? ''} onChange={e => updateCfg('site', 'faviconUrl', e.target.value)} placeholder="https://..." hint="Recomendado: 32x32px ou 64x64px .ico ou .png" />
                <DarkInput label="URL da imagem OG padrão" value={cfg.site?.ogImageUrl ?? ''} onChange={e => updateCfg('site', 'ogImageUrl', e.target.value)} placeholder="https://..." hint="Imagem padrão para compartilhamento (1200x630px)" />
              </div>
            </Section>
            <Section title="Configurações de Imóveis" icon={Home}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1.5 block">Ordenação padrão</label>
                    <select value={cfg.site?.defaultSortBy ?? 'createdAt'} onChange={e => updateCfg('site', 'defaultSortBy', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full">
                      <option value="createdAt">Mais recentes</option>
                      <option value="price">Preço</option>
                      <option value="views">Mais vistos</option>
                    </select>
                  </div>
                  <DarkInput label="Imóveis por página" type="number" value={cfg.site?.propertiesPerPage ?? 12} onChange={e => updateCfg('site', 'propertiesPerPage', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <DarkInput label="Latitude do mapa" type="number" step="0.0001" value={cfg.site?.mapDefaultLat ?? -20.5386} onChange={e => updateCfg('site', 'mapDefaultLat', Number(e.target.value))} />
                  <DarkInput label="Longitude do mapa" type="number" step="0.0001" value={cfg.site?.mapDefaultLng ?? -47.4009} onChange={e => updateCfg('site', 'mapDefaultLng', Number(e.target.value))} />
                  <DarkInput label="Zoom do mapa" type="number" value={cfg.site?.mapDefaultZoom ?? 13} onChange={e => updateCfg('site', 'mapDefaultZoom', Number(e.target.value))} />
                </div>
                <Toggle label="Mostrar preço nos cards" checked={cfg.site?.showPriceOnCard ?? true} onChange={v => updateCfg('site', 'showPriceOnCard', v)} />
                <Toggle label="Mostrar área nos cards" checked={cfg.site?.showAreaOnCard ?? true} onChange={v => updateCfg('site', 'showAreaOnCard', v)} />
                <Toggle label="Mostrar quartos nos cards" checked={cfg.site?.showBedroomsOnCard ?? true} onChange={v => updateCfg('site', 'showBedroomsOnCard', v)} />
                <Toggle label="Mostrar bairro nos cards" checked={cfg.site?.showNeighborhoodOnCard ?? true} onChange={v => updateCfg('site', 'showNeighborhoodOnCard', v)} />
              </div>
            </Section>
            <SaveButton onClick={() => save()} isPending={saveMutation.isPending} saved={saved} />
          </div>
        )}

      </div>
    </div>
  )
}
