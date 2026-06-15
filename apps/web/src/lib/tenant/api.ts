/**
 * Cliente público para sites de tenant (clones de parceiros).
 * Busca imóveis reais do tenant a partir da API pública.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export interface TenantProperty {
  id: string
  slug: string
  reference?: string | null
  title: string
  description?: string | null
  type: string
  purpose: string
  price?: string | number | null
  priceRent?: string | number | null
  valueUnderConsultation?: boolean
  condoFee?: string | number | null
  iptu?: string | number | null
  city: string
  state: string
  neighborhood?: string | null
  condoName?: string | null
  totalArea?: number | null
  builtArea?: number | null
  bedrooms?: number | null
  suites?: number | null
  bathrooms?: number | null
  parkingSpaces?: number | null
  floor?: number | null
  coverImage?: string | null
  images: string[]
  features: string[]
  isFeatured?: boolean
  views?: number
}

export const TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  LAND: 'Terreno',
  FARM: 'Fazenda',
  RANCH: 'Chácara',
  WAREHOUSE: 'Galpão',
  OFFICE: 'Sala comercial',
  STORE: 'Loja',
  STUDIO: 'Studio',
  PENTHOUSE: 'Cobertura',
  CONDO: 'Condomínio',
  KITNET: 'Kitnet',
}

export interface TenantData {
  id: string
  name: string
  subdomain: string
  customDomain: string | null
  layoutType: string
  primaryColor: string
  logoUrl: string | null
  plan: string
  planStatus: string
  isActive: boolean
  settings: Record<string, any>
  companyId: string
}

export async function getTenant(slug: string): Promise<TenantData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/tenant/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data as TenantData) ?? null
  } catch {
    return null
  }
}

export async function getTenantProperties(
  slug: string,
  params?: Record<string, string>,
): Promise<TenantProperty[]> {
  try {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(
      `${API_URL}/api/v1/public/tenant/${slug}/properties${qs ? `?${qs}` : ''}`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as TenantProperty[]) ?? []
  } catch {
    return []
  }
}

export async function getTenantProperty(
  slug: string,
  propSlug: string,
): Promise<TenantProperty | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/tenant/${slug}/properties/${encodeURIComponent(propSlug)}`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    return (json.data as TenantProperty) ?? null
  } catch {
    return null
  }
}

export function formatBRL(value: number | string | null | undefined): string {
  if (value == null || value === '') return 'Sob consulta'
  const n = typeof value === 'string' ? Number(value) : value
  if (!isFinite(n) || n <= 0) return 'Sob consulta'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function propertyPrice(p: TenantProperty): string {
  if (p.valueUnderConsultation) return 'Sob consulta'
  if (p.purpose === 'RENT') {
    const v = formatBRL(p.priceRent)
    return v === 'Sob consulta' ? v : `${v}/mês`
  }
  return formatBRL(p.price ?? p.priceRent)
}

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type
}
