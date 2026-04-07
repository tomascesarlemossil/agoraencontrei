import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, RequireAuth, RequireGuest } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

// ── Eager imports: public pages (fast initial load) ──────────
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

// ── Lazy imports: heavier public pages ───────────────────────
const Search = lazy(() => import('@/pages/Search'))
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'))
const News = lazy(() => import('@/pages/News'))
const Platform = lazy(() => import('@/pages/Platform'))

// ── Dashboard layout shell ───────────────────────────────────
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))

// ── Dashboard pages (all lazy) ───────────────────────────────
const Overview      = lazy(() => import('@/pages/dashboard/Overview'))
const Properties    = lazy(() => import('@/pages/dashboard/Properties'))
const Clients       = lazy(() => import('@/pages/dashboard/Clients'))
const Negotiations  = lazy(() => import('@/pages/dashboard/Negotiations'))
const Leads         = lazy(() => import('@/pages/dashboard/Leads'))
const Appointments  = lazy(() => import('@/pages/dashboard/Appointments'))
const Contracts     = lazy(() => import('@/pages/dashboard/Contracts'))
const Financing     = lazy(() => import('@/pages/dashboard/Financing'))
const Commissions   = lazy(() => import('@/pages/dashboard/Commissions'))
const MassMessages  = lazy(() => import('@/pages/dashboard/MassMessages'))
const Renewals      = lazy(() => import('@/pages/dashboard/Renewals'))
const SocialMedia   = lazy(() => import('@/pages/dashboard/SocialMedia'))
const Valuations    = lazy(() => import('@/pages/dashboard/Valuations'))
const Marketing     = lazy(() => import('@/pages/dashboard/Marketing'))
const CMS           = lazy(() => import('@/pages/dashboard/CMS'))
const Reports       = lazy(() => import('@/pages/dashboard/Reports'))
const Users         = lazy(() => import('@/pages/dashboard/Users'))
const Settings      = lazy(() => import('@/pages/dashboard/Settings'))

// ── React Query client ───────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// ── Loading fallback ─────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
        <p className="text-gold-400 font-sans text-sm tracking-widest uppercase">
          Carregando...
        </p>
      </div>
    </div>
  )
}

// ── App ──────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>

              {/* ── Public routes ──────────────────────────── */}
              <Route path="/" element={<Home />} />
              <Route path="/imoveis" element={<Search />} />
              {/* Accept both :slug (new) and :id (legacy) via the same component */}
              <Route path="/imovel/:slug" element={<PropertyDetail />} />
              <Route path="/noticias" element={<News />} />
              <Route path="/plataforma" element={<Platform />} />

              {/* ── Auth route: redirect to dashboard if already logged in ── */}
              <Route
                path="/login"
                element={
                  <RequireGuest redirectTo="/dashboard">
                    <Login />
                  </RequireGuest>
                }
              />

              {/* ── Protected dashboard routes ─────────────── */}
              {/*
               * Dashboard is the shared layout shell (sidebar + top-bar).
               * All nested routes render inside its <Outlet />.
               * The parent <RequireAuth> guards the entire /dashboard subtree.
               */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth redirectTo="/login">
                    <Dashboard />
                  </RequireAuth>
                }
              >
                {/* /dashboard → visão geral */}
                <Route index element={<Overview />} />

                {/* Imóveis */}
                <Route path="imoveis" element={<Properties />} />

                {/* Clientes */}
                <Route path="clientes" element={<Clients />} />

                {/* Negociações / Kanban */}
                <Route path="negociacoes" element={<Negotiations />} />

                {/* Leads */}
                <Route path="leads" element={<Leads />} />

                {/* Agenda / Visitas */}
                <Route path="agenda" element={<Appointments />} />
                {/* Legacy alias kept so old bookmark links still work */}
                <Route path="visitas" element={<Appointments />} />

                {/* Mensagens em massa / WhatsApp */}
                <Route path="mensagens" element={<MassMessages />} />

                {/* Renovações de contratos */}
                <Route path="renovacoes" element={<Renewals />} />

                {/* Redes sociais */}
                <Route path="redes-sociais" element={<SocialMedia />} />
                <Route path="marketing" element={<Marketing />} />

                {/* Financiamentos */}
                <Route path="financiamentos" element={<Financing />} />

                {/* Contratos */}
                <Route path="contratos" element={<Contracts />} />

                {/* Comissões */}
                <Route path="comissoes" element={<Commissions />} />

                {/* Relatórios */}
                <Route path="relatorios" element={<Reports />} />

                {/* CMS / Conteúdo do site */}
                <Route path="cms" element={<CMS />} />

                {/* Avaliações de imóveis com IA */}
                <Route path="avaliacoes" element={<Valuations />} />

                {/* Usuários e permissões */}
                <Route path="usuarios" element={<Users />} />

                {/* Configurações */}
                <Route path="configuracoes" element={<Settings />} />
              </Route>

              {/* ── 404 ────────────────────────────────────── */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </Suspense>

          {/* Toast notifications — outside <Routes> so they persist across navigation */}
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
