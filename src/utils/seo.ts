import type { Property } from '@/types'
import { getPropertyTypeLabel, getPurposeLabel } from './formatters'

// ============================================================
// TYPES
// ============================================================

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  canonical?: string
  noindex?: boolean
}

// ============================================================
// DEFAULTS
// ============================================================

export const defaultSEO: SEOConfig = {
  title: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP | Imobiliária Lemos',
  description:
    'Encontre casas, apartamentos, terrenos e chácaras em Franca SP e região. AgoraEncontrei: marketplace imobiliário criado pela Imobiliária Lemos, 1.000+ imóveis disponíveis, busca com IA e atendimento 100% digital.',
  keywords: [
    'agoraencontrei',
    'marketplace imobiliário franca',
    'imóveis franca sp',
    'casas venda franca',
    'apartamento franca sp',
    'imobiliária franca',
    'imobiliária lemos',
    'aluguel franca sp',
    'terrenos franca',
    'chácara rifaina',
    'imóveis rifaina',
    'anunciar imóvel grátis',
  ],
  ogImage: 'https://www.agoraencontrei.com.br/og-image.jpg',
  canonical: 'https://www.agoraencontrei.com.br',
}

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://www.agoraencontrei.com.br'
const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'AgoraEncontrei | Imobiliária Lemos'

// ============================================================
// BUILDERS
// ============================================================

/**
 * Builds an SEOConfig object for a specific property detail page.
 */
export function buildPropertySEO(property: Property): SEOConfig {
  const typeLabel = getPropertyTypeLabel(property.type)
  const purposeLabel = getPurposeLabel(property.purpose)

  const price = property.sale_price ?? property.rent_price
  const priceText = price
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price)
    : null

  const titleParts = [
    typeLabel,
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.neighborhood,
    property.city,
    purposeLabel,
  ].filter(Boolean)

  const title = `${titleParts.join(' - ')} | ${APP_NAME}`

  const descParts = [
    `${typeLabel} para ${purposeLabel.toLowerCase()}`,
    property.neighborhood ? `no ${property.neighborhood}` : null,
    `em ${property.city}`,
    property.total_area ? `com ${property.total_area} m²` : null,
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.bathrooms ? `${property.bathrooms} banheiros` : null,
    property.garages ? `${property.garages} vagas` : null,
    priceText ? `por ${priceText}` : null,
  ].filter(Boolean)

  const description = `${descParts.join(', ')}. ${APP_NAME}: 22 anos de experiência em imóveis em Franca SP e região.`

  const keywords = [
    `${typeLabel.toLowerCase()} ${purposeLabel.toLowerCase()} ${property.city.toLowerCase()}`,
    `${typeLabel.toLowerCase()} ${property.neighborhood.toLowerCase()}`,
    `imóveis ${property.city.toLowerCase()}`,
    `${typeLabel.toLowerCase()} ${property.city.toLowerCase()}`,
    property.bedrooms ? `${typeLabel.toLowerCase()} ${property.bedrooms} quartos ${property.city.toLowerCase()}` : null,
    'imobiliária franca',
    property.city.toLowerCase(),
  ].filter((k): k is string => Boolean(k))

  const slug = property.slug ?? property.id
  const canonical = `${APP_URL}/imovel/${slug}`
  const ogImage = property.cover_image_url ?? defaultSEO.ogImage

  return { title, description, keywords, ogImage, canonical }
}

// ============================================================

interface SearchFiltersForSEO {
  search?: string
  tipo?: string
  finalidade?: string
  cidade?: string
  quartos_min?: number
  preco_min?: number
  preco_max?: number
}

/**
 * Builds an SEOConfig object for the search results page.
 * Uses active filters to produce meaningful, crawlable meta tags.
 */
export function buildSearchSEO(filters: SearchFiltersForSEO): SEOConfig {
  const parts: string[] = []
  const keywords: string[] = ['imóveis franca sp', 'imobiliária franca']

  if (filters.tipo) {
    const label = getPropertyTypeLabel(filters.tipo)
    parts.push(label)
    keywords.push(label.toLowerCase())
  } else {
    parts.push('Imóveis')
  }

  if (filters.finalidade) {
    const label = getPurposeLabel(filters.finalidade)
    parts.push(`para ${label}`)
    keywords.push(label.toLowerCase())
  }

  if (filters.quartos_min) {
    parts.push(`${filters.quartos_min}+ quartos`)
  }

  if (filters.cidade) {
    parts.push(`em ${filters.cidade}`)
    keywords.push(`imóveis ${filters.cidade.toLowerCase()}`)
  } else {
    parts.push('em Franca SP e região')
  }

  const titleBase = parts.join(' ')
  const title = `${titleBase} | ${APP_NAME}`

  const priceRange =
    filters.preco_min || filters.preco_max
      ? ` na faixa de ${filters.preco_min ? `R$ ${filters.preco_min / 1000}k` : ''}${filters.preco_min && filters.preco_max ? ' a ' : ''}${filters.preco_max ? `R$ ${filters.preco_max / 1000}k` : ''}`
      : ''

  const description = `Encontre ${titleBase}${priceRange}. ${APP_NAME} tem mais de 500 imóveis disponíveis com atendimento 100% digital.`

  // Build canonical URL preserving active filters
  const params = new URLSearchParams()
  if (filters.tipo) params.set('tipo', filters.tipo)
  if (filters.finalidade) params.set('finalidade', filters.finalidade)
  if (filters.cidade) params.set('cidade', filters.cidade)
  if (filters.quartos_min) params.set('quartos_min', String(filters.quartos_min))
  if (filters.preco_min) params.set('preco_min', String(filters.preco_min))
  if (filters.preco_max) params.set('preco_max', String(filters.preco_max))

  const queryString = params.toString()
  const canonical = `${APP_URL}/imoveis${queryString ? `?${queryString}` : ''}`

  return {
    title,
    description,
    keywords,
    canonical,
    ogImage: defaultSEO.ogImage,
  }
}
