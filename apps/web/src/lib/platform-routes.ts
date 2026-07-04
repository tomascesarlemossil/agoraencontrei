/**
 * Platform-only routes — fonte única de verdade.
 *
 * Estas rotas do dashboard administram a PLATAFORMA AgoraEncontrei (parceiros,
 * planos, afiliados, tenants, eventos, saúde de integrações, filas de repasse,
 * inteligência de mercado, financeiro SaaS, fábrica de site). Só podem ser
 * vistas/acessadas pelo super-admin da plataforma (`SUPER_ADMIN`).
 *
 * Um PARCEIRO contratado (incluindo a Imobiliária Lemos, que é ADMIN da própria
 * empresa) NUNCA deve enxergar estas ferramentas — ele gere apenas o próprio
 * site, sistema e dados de clientes. Ele continua editando o próprio site pelos
 * itens "Meu Site (Parceiro)" (`/dashboard/meu-site`) e "Editar meu site"
 * (`/dashboard/settings`), que não fazem parte desta lista.
 *
 * A sidebar (esconde) e o guard de rota (redireciona) consomem estas funções;
 * a defesa real continua no backend (403 por SUPER_ADMIN em cada rota).
 */

/** Prefixos de rota exclusivos da plataforma. */
export const PLATFORM_ONLY_HREFS = [
  '/dashboard/admin/master',      // Admin Master (catálogo planos/nichos/módulos/serviços)
  '/dashboard/admin/tenants',     // Parceiros & Tenants
  '/dashboard/admin/events',      // Eventos do Sistema
  '/dashboard/admin/webhooks',    // Saúde das Integrações
  '/dashboard/admin/repasses',    // Fila de Repasses
  '/dashboard/afiliados',         // Programa de Afiliados
  '/dashboard/saas-financeiro',   // Financeiro SaaS
  '/dashboard/master',            // Master Intel (BI / inteligência de mercado)
  '/dashboard/market',            // Radar de Mercado
  '/dashboard/parceiros',         // Painel de Parceiros da plataforma
  '/dashboard/site-factory',      // Fábrica de Site (criação de clones/tenants)
] as const

/**
 * Retorna true se `pathname` pertence a uma rota exclusiva da plataforma.
 * Faz match por prefixo (normalizado) para cobrir sub-rotas e parâmetros
 * dinâmicos (ex.: /dashboard/admin/tenants/abc123, /dashboard/admin/repasses?x=1).
 */
export function isPlatformOnly(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  // Normaliza: remove query string/hash e barra final.
  const normalized = pathname.split(/[?#]/)[0].replace(/\/+$/, '')
  return PLATFORM_ONLY_HREFS.some(
    (base) => normalized === base || normalized.startsWith(base + '/'),
  )
}

/** Só o super-admin da plataforma vê/acessa as rotas platform-only. */
export function isPlatformAdmin(user: { role?: string | null } | null | undefined): boolean {
  return user?.role === 'SUPER_ADMIN'
}
