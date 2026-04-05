'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  Home,
  Banknote,
  Globe,
  MessageCircle,
  Zap,
  Bell,
  FileText,
  BriefcaseBusiness,
  Sparkles,
  Megaphone,
  AlertTriangle,
  Menu,
  X,
  ChevronDown,
  Receipt,
  RefreshCw,
  Scissors,
  BarChart3,
  Landmark,
  Wand2,
  BookOpen,
  Archive,
  History,
  PlusCircle,
  ReceiptText,
  Scale,
  DollarSign,
  FolderOpen,
} from 'lucide-react'
import { useNotifications } from '@/stores/notifications.store'
import { UserAvatar } from '@/components/ui/UserAvatar'

const topNavItems = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Painel',               highlight: false },
  { href: '/dashboard/documentos', icon: Wand2,           label: 'Agente IA Documentos', highlight: true  },
]

const midNavItems = [
  { href: '/dashboard/properties',          icon: Building2,        label: 'Imóveis',       highlight: false },
  { href: '/dashboard/ai-visual',           icon: Sparkles,         label: 'IA Visual',     highlight: false },
  { href: '/dashboard/leads',               icon: UserCheck,        label: 'Leads',         highlight: false },
  { href: '/dashboard/contacts',            icon: Users,            label: 'Contatos',      highlight: false },
  { href: '/dashboard/deals',               icon: TrendingUp,       label: 'Negócios',      highlight: false },
  { href: '/dashboard/inbox',               icon: MessageCircle,    label: 'Lemos.chat',    highlight: false },
  { href: '/dashboard/financiamentos',      icon: Landmark,         label: 'Financiamentos',highlight: false },
  { href: '/dashboard/portals',             icon: Globe,            label: 'Portais',       highlight: false },
  { href: '/dashboard/automations',         icon: Zap,              label: 'Automações',    highlight: false },
  { href: '/dashboard/marketing/campanhas', icon: Megaphone,        label: 'Campanhas',     highlight: false },
  { href: '/dashboard/fiscal',              icon: FileText,         label: 'Notas Fiscais', highlight: false },
  { href: '/dashboard/crm/renovacoes',      icon: AlertTriangle,    label: 'Renovações',    highlight: false },
  { href: '/dashboard/blog',                icon: BookOpen,         label: 'Blog',          highlight: false },
]

const corretorNavItem = { href: '/dashboard/corretor', icon: BriefcaseBusiness, label: 'Meu Painel', highlight: false }

const lemosbankSubItems = [
  { href: '/dashboard/lemosbank',              icon: Banknote,   label: 'Visão Geral' },
  { href: '/dashboard/contratos',              icon: FileText,   label: 'Contratos' },
  { href: '/dashboard/contratos/novo',         icon: PlusCircle, label: 'Novo Contrato' },
  { href: '/dashboard/clientes',               icon: Users,      label: 'Clientes' },
  { href: '/dashboard/lemosbank/boletos',      icon: ReceiptText, label: 'Boletos' },
  { href: '/dashboard/lemosbank/cobrancas',    icon: Receipt,    label: 'Cobranças' },
  { href: '/dashboard/lemosbank/repasses',     icon: RefreshCw,  label: 'Repasses' },
  { href: '/dashboard/lemosbank/rescisoes',    icon: Scissors,   label: 'Rescisões' },
  { href: '/dashboard/lemosbank/automacao',    icon: Zap,        label: 'Automação' },
  { href: '/dashboard/lemosbank/relatorios',   icon: BarChart3,  label: 'Relatórios' },
  { href: '/dashboard/lemosbank/historico',             icon: Archive,      label: 'Histórico' },
  { href: '/dashboard/lemosbank/historico-financeiro',   icon: DollarSign,   label: 'Hist. Financeiro' },
  { href: '/dashboard/lemosbank/arquivo-morto',          icon: Archive,      label: 'Arquivo Morto' },
  { href: '/dashboard/lemosbank/arquivo-documentos',      icon: FolderOpen,   label: 'Arquivo de Docs' },
]

const juridicoSubItems = [
  { href: '/dashboard/juridico',      icon: Scale,      label: 'Processos' },
  { href: '/dashboard/juridico/novo', icon: PlusCircle, label: 'Novo Processo' },
]

const bottomItems = [
  { href: '/dashboard/historico-alteracoes', icon: History,  label: 'Hist. Alterações' },
  { href: '/dashboard/notifications',        icon: Bell,     label: 'Notificações' },
  { href: '/dashboard/settings',             icon: Settings, label: 'Configurações' },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const unreadCount = useNotifications(s => s.unreadCount)
  const isBroker = user?.role === 'BROKER'
  const lemosbankActive = pathname.startsWith('/dashboard/lemosbank') ||
    pathname.startsWith('/dashboard/contratos') ||
    pathname.startsWith('/dashboard/clientes')
  const juridicoActive = pathname.startsWith('/dashboard/juridico')
  const [lemosbankOpen, setLemosbankOpen] = useState(lemosbankActive)
  const [juridicoOpen, setJuridicoOpen] = useState(juridicoActive)

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
        <Image
          src="/logo-lemos.png"
          alt="Imobiliária Lemos"
          width={40}
          height={40}
          className="rounded-full flex-shrink-0 object-cover"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm leading-none text-white" style={{ fontFamily: 'Georgia, serif' }}>IMOBILIÁRIA</p>
          <p className="text-xs font-bold leading-none mt-0.5 truncate" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>LEMOS</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* ── Top items: Painel + Agente IA Documentos ──────── */}
        {topNavItems.map(({ href, icon: Icon, label, highlight }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? highlight
                    ? 'text-white border border-yellow-400/40'
                    : 'bg-blue-600/30 text-white'
                  : highlight
                    ? 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-400/5 border border-yellow-400/20'
                    : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
              style={active && highlight ? { background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(232,198,106,0.1))' } : undefined}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', highlight && !active && 'text-yellow-400/70')} />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0" />}
            </Link>
          )
        })}

        {/* ── Lemosbank Section ─────────────────────────────── */}
        {!isBroker && <div>
          <button
            onClick={() => setLemosbankOpen(o => !o)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5',
              (lemosbankActive || lemosbankOpen) ? 'text-white' : 'text-white/60',
            )}
          >
            <Banknote className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Lemosbank</span>
            <ChevronDown className={cn('ml-auto h-3 w-3 flex-shrink-0 transition-transform', (lemosbankOpen || lemosbankActive) && 'rotate-180')} />
          </button>
          {(lemosbankOpen || lemosbankActive) && (
            <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5">
              {lemosbankSubItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/dashboard/lemosbank' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      active
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>}

        {/* ── Jurídico Section ─────────────────────────────────── */}
        {!isBroker && <div>
          <button
            onClick={() => setJuridicoOpen(o => !o)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5',
              (juridicoActive || juridicoOpen) ? 'text-indigo-300' : 'text-white/60',
            )}
          >
            <Scale className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Jurídico</span>
            <ChevronDown className={cn('ml-auto h-3 w-3 flex-shrink-0 transition-transform', (juridicoOpen || juridicoActive) && 'rotate-180')} />
          </button>
          {(juridicoOpen || juridicoActive) && (
            <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5">
              {juridicoSubItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/dashboard/juridico' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      active
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>}

        {/* ── Mid items: Imóveis → Blog ──────────────────────── */}
        {midNavItems.map(({ href, icon: Icon, label, highlight }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? highlight
                    ? 'text-white border border-yellow-400/40'
                    : 'bg-blue-600/30 text-white'
                  : highlight
                    ? 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-400/5 border border-yellow-400/20'
                    : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
              style={active && highlight ? { background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(232,198,106,0.1))' } : undefined}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', highlight && !active && 'text-yellow-400/70')} />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0" />}
            </Link>
          )
        })}

        {/* ── Meu Painel (corretor) — last ──────────────────── */}
        {(() => {
          const { href, icon: Icon, label } = corretorNavItem
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-blue-600/30 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0" />}
            </Link>
          )
        })()}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
        {bottomItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            {label === 'Notificações' ? (
              <span className="relative">
                <Icon className="h-4 w-4" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-gray-900">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 rounded-full bg-red-500 animate-ping opacity-75" />
                  </>
                )}
              </span>
            ) : (
              <Icon className="h-4 w-4" />
            )}
            <span>{label}</span>
            {label === 'Notificações' && unreadCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
        <button
          onClick={() => { onClose?.(); logout() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
        <UserAvatar
          name={user?.name}
          avatarUrl={(user as any)?.avatarUrl}
          size="sm"
          showRing
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">{user?.name ?? 'Usuário'}</p>
          <p className="text-[10px] text-white/40 truncate">{(user as any)?.role ?? user?.email ?? ''}</p>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Fecha drawer ao trocar de rota
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 h-screen bg-sidebar text-sidebar-foreground border-r border-white/10 flex-shrink-0">
        <NavContent />
      </aside>

      {/* ── Mobile: top bar ─────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-white/10">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white p-1"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-bold text-white">AgoraEncontrei</span>
        </div>
      </div>

      {/* ── Mobile: spacer para não sobrepor conteúdo ────────────────── */}
      <div className="md:hidden h-14 flex-shrink-0" />

      {/* ── Mobile: drawer overlay ──────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative z-10 flex flex-col w-72 max-w-[85vw] h-full bg-gray-900 border-r border-white/10 overflow-hidden">
            <NavContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
