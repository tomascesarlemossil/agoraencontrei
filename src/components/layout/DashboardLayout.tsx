import React, { useState, createContext, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  UserPlus,
  Calendar,
  MessageSquare,
  RefreshCw,
  Share2,
  Landmark,
  FileText,
  DollarSign,
  BarChart3,
  Globe,
  Star,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type UserRole = 'admin' | 'corretor' | 'gerente'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Imóveis', href: '/dashboard/imoveis', icon: Building2, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Negociações', href: '/dashboard/negociacoes', icon: Handshake, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Leads', href: '/dashboard/leads', icon: UserPlus, badge: 5, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Mensagens em Massa', href: '/dashboard/mensagens', icon: MessageSquare, roles: ['admin', 'gerente'] },
  { label: 'Renovações', href: '/dashboard/renovacoes', icon: RefreshCw, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Redes Sociais', href: '/dashboard/redes-sociais', icon: Share2, roles: ['admin', 'gerente'] },
  { label: 'Financiamentos', href: '/dashboard/financiamentos', icon: Landmark, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Contratos', href: '/dashboard/contratos', icon: FileText, roles: ['admin', 'gerente'] },
  { label: 'Comissões', href: '/dashboard/comissoes', icon: DollarSign, roles: ['admin', 'corretor', 'gerente'] },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3, roles: ['admin', 'gerente'] },
  { label: 'CMS', href: '/dashboard/cms', icon: Globe, roles: ['admin'] },
  { label: 'Avaliações', href: '/dashboard/avaliacoes', icon: Star, roles: ['admin', 'gerente'] },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings, roles: ['admin'] },
]

const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false })

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: UserRole
  userName?: string
  userEmail?: string
  userAvatar?: string
  notificationCount?: number
  onLogout?: () => void
}

export function DashboardLayout({
  children,
  userRole = 'corretor',
  userName = 'Corretor Lemos',
  userEmail = 'corretor@imobiliarialemos.com.br',
  userAvatar,
  notificationCount = 3,
  onLogout,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole))

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(href)
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleLogout = () => {
    onLogout?.()
    navigate('/login')
  }

  const SidebarContent = () => (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-navy-800 shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed && (
            <Link to="/" className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold text-gold-400 tracking-widest">LEMOS</span>
              <span className="text-[8px] font-sans font-semibold tracking-[0.3em] text-foreground/40 uppercase">
                IMOBILIÁRIA
              </span>
            </Link>
          )}
          {collapsed && (
            <Link to="/" className="font-display text-lg font-bold text-gold-400">L</Link>
          )}
          <button
            className="hidden lg:flex p-1.5 rounded-md text-foreground/40 hover:text-foreground hover:bg-navy-800 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                  collapsed ? 'justify-center' : '',
                  active
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                    : 'text-foreground/60 hover:text-foreground hover:bg-navy-800'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-colors',
                  active ? 'text-gold-400' : 'text-foreground/40 group-hover:text-foreground/80'
                )} style={{ width: '1.125rem', height: '1.125rem' }} />
                {!collapsed && (
                  <>
                    <span className="flex-1 font-sans">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="text-xs bg-gold-500 text-navy-950 rounded-full px-1.5 py-0.5 font-bold min-w-[1.25rem] text-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-gold-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info at Bottom */}
        {!collapsed && (
          <div className="border-t border-navy-800 p-3 shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-navy-800/50">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate font-sans">{userName}</p>
                <p className="text-xs text-foreground/40 truncate font-sans capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarContext.Provider>
  )

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-navy-950 border-r border-navy-800',
          'transition-all duration-300 ease-in-out shrink-0',
          collapsed ? 'w-[64px]' : 'w-[240px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 w-64 bg-navy-950 border-r border-navy-800',
          'transform transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-navy-950/80 backdrop-blur-sm border-b border-navy-800 flex items-center px-4 gap-4 shrink-0">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-navy-800 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar imóvel, cliente, lead..."
              leftIcon={<Search className="h-4 w-4" />}
              className="h-9 bg-navy-900 border-navy-700 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button className="p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-navy-800 transition-colors relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-gold-500 text-navy-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-navy-800 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-foreground font-sans leading-tight">{userName}</p>
                    <p className="text-xs text-foreground/40 font-sans capitalize leading-tight">{userRole}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-foreground/40 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium text-sm text-foreground">{userName}</p>
                    <p className="text-xs text-foreground/40 font-normal mt-0.5">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/perfil" className="gap-2">
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/configuracoes" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
