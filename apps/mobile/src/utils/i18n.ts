/**
 * Internacionalização simples (PT/EN/ES) sem dependências externas.
 * O idioma atual vem do AppContext; use o hook `useT()` ou `t(lang, key)`.
 */
export const LANGUAGES = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
] as const

export type LangCode = (typeof LANGUAGES)[number]['code']

type Dict = Record<string, string>

const PT: Dict = {
  home: 'Início', search: 'Busca', auctions: 'Leilões', partners: 'Parceiros', profile: 'Perfil',
  settings: 'Configurações', darkMode: 'Modo Escuro', language: 'Idioma', notifications: 'Notificações',
  favorites: 'Meus Favoritos', valuation: 'Avaliação Imediata de Imóvel', logout: 'Sair',
  login: 'Entrar', register: 'Cadastrar', loginRegister: 'Entrar / Cadastrar',
  visitor: 'Visitante', loginHint: 'Entre para ver favoritos e propostas',
  featured: 'Imóveis em destaque', noProperties: 'Nenhum imóvel disponível agora. Puxe para atualizar.',
  searchPlaceholder: 'Cidade, bairro ou tipo de imóvel', searchHint: 'Busque imóveis em tempo real.',
  notFound: 'Nenhum imóvel encontrado.', subscribeOnSite: 'Assinar no site',
  beAPartner: 'Seja um Parceiro', auctionsSubtitle: 'Oportunidades com score e ROI — ao vivo.',
  noAuctions: 'Nenhum leilão disponível agora. Puxe para atualizar.', tagline: 'Marketplace Imobiliário',
}
const EN: Dict = {
  home: 'Home', search: 'Search', auctions: 'Auctions', partners: 'Partners', profile: 'Profile',
  settings: 'Settings', darkMode: 'Dark Mode', language: 'Language', notifications: 'Notifications',
  favorites: 'My Favorites', valuation: 'Instant Property Appraisal', logout: 'Log out',
  login: 'Sign in', register: 'Sign up', loginRegister: 'Sign in / Sign up',
  visitor: 'Visitor', loginHint: 'Sign in to see favorites and proposals',
  featured: 'Featured properties', noProperties: 'No properties available right now. Pull to refresh.',
  searchPlaceholder: 'City, neighborhood or property type', searchHint: 'Search properties in real time.',
  notFound: 'No properties found.', subscribeOnSite: 'Subscribe on the website',
  beAPartner: 'Become a Partner', auctionsSubtitle: 'Opportunities with score and ROI — live.',
  noAuctions: 'No auctions available right now. Pull to refresh.', tagline: 'Real Estate Marketplace',
}
const ES: Dict = {
  home: 'Inicio', search: 'Buscar', auctions: 'Subastas', partners: 'Socios', profile: 'Perfil',
  settings: 'Ajustes', darkMode: 'Modo Oscuro', language: 'Idioma', notifications: 'Notificaciones',
  favorites: 'Mis Favoritos', valuation: 'Tasación Inmediata', logout: 'Salir',
  login: 'Entrar', register: 'Registrarse', loginRegister: 'Entrar / Registrarse',
  visitor: 'Visitante', loginHint: 'Entra para ver favoritos y propuestas',
  featured: 'Inmuebles destacados', noProperties: 'No hay inmuebles disponibles ahora. Desliza para actualizar.',
  searchPlaceholder: 'Ciudad, barrio o tipo de inmueble', searchHint: 'Busca inmuebles en tiempo real.',
  notFound: 'Ningún inmueble encontrado.', subscribeOnSite: 'Suscríbete en el sitio',
  beAPartner: 'Sé un Socio', auctionsSubtitle: 'Oportunidades con score y ROI — en vivo.',
  noAuctions: 'No hay subastas disponibles ahora. Desliza para actualizar.', tagline: 'Marketplace Inmobiliario',
}

const TABLES: Record<string, Dict> = { 'pt-BR': PT, 'en-US': EN, 'es-ES': ES }

export type TKey = keyof typeof PT

export function t(lang: string, key: TKey): string {
  return (TABLES[lang] || PT)[key] || PT[key] || String(key)
}
