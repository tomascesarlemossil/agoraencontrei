import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Visão Geral', end: true },
  { to: '/dashboard/imoveis', label: 'Imóveis' },
  { to: '/dashboard/clientes', label: 'Clientes' },
  { to: '/dashboard/negociacoes', label: 'Negociações' },
  { to: '/dashboard/leads', label: 'Leads' },
  { to: '/dashboard/visitas', label: 'Visitas' },
  { to: '/dashboard/contratos', label: 'Contratos' },
  { to: '/dashboard/financiamentos', label: 'Financiamentos' },
  { to: '/dashboard/comissoes', label: 'Comissões' },
  { to: '/dashboard/marketing', label: 'Marketing' },
  { to: '/dashboard/cms', label: 'CMS' },
  { to: '/dashboard/relatorios', label: 'Relatórios' },
  { to: '/dashboard/usuarios', label: 'Usuários' },
  { to: '/dashboard/configuracoes', label: 'Configurações' },
]

export default function Dashboard() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-navy-900">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-800 border-r border-gold-500/10 flex flex-col">
        <div className="p-6 border-b border-gold-500/10">
          <h2 className="font-display text-xl gold-text">Imobiliária Lemos</h2>
          <p className="text-cream-200/40 text-xs font-sans mt-1">Painel Administrativo</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-sans transition-colors ${
                      isActive
                        ? 'bg-gold-500/15 text-gold-400 font-medium'
                        : 'text-cream-200/60 hover:text-cream-200 hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gold-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 text-xs font-bold">
              {profile?.full_name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cream-200 text-xs font-medium truncate">{profile?.full_name ?? 'Usuário'}</p>
              <p className="text-cream-200/40 text-xs truncate">{profile?.role ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-outline-gold w-full text-xs py-2"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
