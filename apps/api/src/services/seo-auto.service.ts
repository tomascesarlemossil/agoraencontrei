/**
 * SEO Auto-Generator Service — Geração automática de conteúdo SEO
 * Gera títulos, descrições, keywords e slugs otimizados para o Google
 * usando IA e templates como fallback.
 *
 * Foco: SEO Local (Franca/SP) para dominar buscas regionais.
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '../utils/env.js'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SEOInput {
  title: string
  type: string             // HOUSE, APARTMENT, etc.
  purpose: string          // SALE, RENT
  city: string
  state?: string
  neighborhood?: string
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  totalArea?: number
  builtArea?: number
  price?: number
  priceRent?: number
  features?: string[]
  condoName?: string
}

export interface SEOOutput {
  metaTitle: string          // Max 60 chars
  metaDescription: string    // Max 160 chars
  keywords: string[]         // 5-10 keywords
  slug: string
  h1: string
  ogTitle: string
  ogDescription: string
  structuredData: Record<string, any>  // JSON-LD schema.org
}

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_PT: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara',
  RANCH: 'Sítio', WAREHOUSE: 'Galpão', OFFICE: 'Sala Comercial',
  STORE: 'Loja', STUDIO: 'Studio', PENTHOUSE: 'Cobertura',
  CONDO: 'Condomínio', KITNET: 'Kitnet',
}

const PURPOSE_PT: Record<string, string> = {
  SALE: 'à Venda', RENT: 'para Alugar', BOTH: 'à Venda e para Alugar', SEASON: 'por Temporada',
}

const PURPOSE_ACTION: Record<string, string> = {
  SALE: 'Comprar', RENT: 'Alugar', BOTH: 'Comprar ou Alugar', SEASON: 'Alugar por Temporada',
}

function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

function formatPrice(value: number | undefined): string {
  if (!value) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Gera conteúdo SEO completo para uma página de imóvel.
 * Inclui título, descrição, keywords, slug, Open Graph e JSON-LD.
 */
export async function generatePropertySEO(input: SEOInput): Promise<SEOOutput> {
  const typePt = TYPE_PT[input.type] ?? input.type
  const purposePt = PURPOSE_PT[input.purpose] ?? input.purpose
  const purposeAction = PURPOSE_ACTION[input.purpose] ?? 'Comprar'
  const city = input.city || 'Franca'
  const state = input.state || 'SP'
  const neighborhood = input.neighborhood || ''
  const price = input.purpose === 'RENT' ? input.priceRent : input.price

  // Build specs string
  const specs: string[] = []
  if (input.bedrooms) specs.push(`${input.bedrooms} quarto${input.bedrooms > 1 ? 's' : ''}`)
  if (input.bathrooms) specs.push(`${input.bathrooms} banheiro${input.bathrooms > 1 ? 's' : ''}`)
  if (input.parkingSpaces) specs.push(`${input.parkingSpaces} vaga${input.parkingSpaces > 1 ? 's' : ''}`)
  const area = input.builtArea || input.totalArea
  if (area) specs.push(`${area}m²`)

  // Try AI generation first
  if (env.ANTHROPIC_API_KEY) {
    try {
      return await generateWithAI(input, typePt, purposePt, city, state, neighborhood, specs, price)
    } catch (error) {
      console.error('[seo-auto] AI generation failed, using template:', error)
    }
  }

  // Template fallback
  return generateFromTemplate(input, typePt, purposePt, purposeAction, city, state, neighborhood, specs, price)
}

/**
 * Gera SEO para uma página de bairro (SEO programático para escala).
 */
export function generateNeighborhoodSEO(
  neighborhood: string,
  city: string,
  state: string,
  propertyCount: number,
  types: string[],
): SEOOutput {
  const slug = slugify(`imoveis-${neighborhood}-${city}`)
  const typesStr = types.length > 0
    ? types.map(t => TYPE_PT[t] || t).join(', ')
    : 'Casas, Apartamentos e Terrenos'

  return {
    metaTitle: `Imóveis em ${neighborhood}, ${city}/${state} | Agora Encontrei`,
    metaDescription: `${propertyCount}+ imóveis em ${neighborhood}, ${city}. ${typesStr}. Fotos, preços e tour virtual. Encontre seu imóvel ideal!`,
    keywords: [
      `imóveis ${neighborhood.toLowerCase()}`,
      `${neighborhood.toLowerCase()} ${city.toLowerCase()}`,
      `casa ${neighborhood.toLowerCase()}`,
      `apartamento ${neighborhood.toLowerCase()}`,
      `comprar imóvel ${neighborhood.toLowerCase()}`,
      `alugar ${neighborhood.toLowerCase()}`,
      `imóveis ${city.toLowerCase()}`,
    ],
    slug,
    h1: `Imóveis à Venda e para Alugar em ${neighborhood}`,
    ogTitle: `${propertyCount}+ Imóveis em ${neighborhood}, ${city} | Agora Encontrei`,
    ogDescription: `Encontre ${typesStr.toLowerCase()} em ${neighborhood}. Compare preços e agende visitas.`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Imóveis em ${neighborhood}, ${city}/${state}`,
      description: `Listagem de imóveis disponíveis em ${neighborhood}`,
      numberOfItems: propertyCount,
      itemListElement: [],
    },
  }
}

// ── AI Generation ───────────────────────────────────────────────────────────

async function generateWithAI(
  input: SEOInput,
  typePt: string,
  purposePt: string,
  city: string,
  state: string,
  neighborhood: string,
  specs: string[],
  price: number | undefined,
): Promise<SEOOutput> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const prompt = `Gere conteúdo SEO para uma página de imóvel. Retorne SOMENTE JSON.

IMÓVEL:
- Tipo: ${typePt} ${purposePt}
- Localização: ${neighborhood ? `${neighborhood}, ` : ''}${city}/${state}
- Especificações: ${specs.join(', ') || 'Não informado'}
- Preço: ${price ? formatPrice(price) : 'Consulte'}
${input.condoName ? `- Condomínio: ${input.condoName}` : ''}
${input.features?.length ? `- Diferenciais: ${input.features.join(', ')}` : ''}

RETORNE JSON:
{
  "metaTitle": "Máx 60 chars. Inclua tipo, localização e preço se couber",
  "metaDescription": "Máx 160 chars. Persuasiva, inclua benefícios e CTA",
  "keywords": ["5-10 keywords relevantes para Google"],
  "h1": "Título principal da página (pode ser mais longo que metaTitle)",
  "ogTitle": "Título para compartilhamento em redes sociais",
  "ogDescription": "Descrição para Open Graph (max 200 chars)"
}

REGRAS SEO:
- Inclua "${city}" em title e description
- ${neighborhood ? `Inclua "${neighborhood}" nas keywords` : ''}
- Use termos de busca reais: "comprar casa", "alugar apartamento", etc.
- Foco em intenção de busca do comprador/locatário`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
  const aiResult = JSON.parse(jsonStr)

  const slug = slugify(`${typePt}-${purposePt}-${neighborhood || ''}-${city}`)

  return {
    ...aiResult,
    slug,
    structuredData: buildPropertyJsonLd(input, typePt, purposePt, city, state, neighborhood, specs, price),
  }
}

// ── Template Fallback ───────────────────────────────────────────────────────

function generateFromTemplate(
  input: SEOInput,
  typePt: string,
  purposePt: string,
  purposeAction: string,
  city: string,
  state: string,
  neighborhood: string,
  specs: string[],
  price: number | undefined,
): SEOOutput {
  const locationStr = neighborhood ? `${neighborhood}, ${city}/${state}` : `${city}/${state}`
  const specsStr = specs.join(', ')
  const priceStr = price ? ` - ${formatPrice(price)}` : ''
  const slug = slugify(`${typePt}-${purposePt}-${neighborhood || ''}-${city}`)

  return {
    metaTitle: truncate(`${typePt} ${purposePt} em ${locationStr}${priceStr}`, 60),
    metaDescription: truncate(
      `${typePt} ${purposePt} em ${locationStr}. ${specsStr}. Fotos, preços e tour virtual. Encontre no Agora Encontrei!`,
      160,
    ),
    keywords: [
      `${typePt.toLowerCase()} ${purposePt.toLowerCase()} ${city.toLowerCase()}`,
      neighborhood ? `${typePt.toLowerCase()} ${neighborhood.toLowerCase()}` : '',
      `${purposeAction.toLowerCase()} ${typePt.toLowerCase()} ${city.toLowerCase()}`,
      `imóveis ${city.toLowerCase()}`,
      neighborhood ? `imóveis ${neighborhood.toLowerCase()}` : '',
      `${typePt.toLowerCase()} ${specsStr}`,
      'agora encontrei',
      `imobiliária ${city.toLowerCase()}`,
    ].filter(Boolean),
    slug,
    h1: `${typePt} ${purposePt} em ${locationStr}`,
    ogTitle: `${typePt} ${purposePt}${priceStr} | ${locationStr}`,
    ogDescription: `${typePt} com ${specsStr} em ${locationStr}. Veja fotos e agende sua visita!`,
    structuredData: buildPropertyJsonLd(input, typePt, purposePt, city, state, neighborhood, specs, price),
  }
}

// ── JSON-LD Structured Data ─────────────────────────────────────────────────

function buildPropertyJsonLd(
  input: SEOInput,
  typePt: string,
  purposePt: string,
  city: string,
  state: string,
  neighborhood: string,
  specs: string[],
  price: number | undefined,
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${typePt} ${purposePt} em ${neighborhood || city}`,
    description: `${typePt} com ${specs.join(', ')} em ${neighborhood ? `${neighborhood}, ` : ''}${city}/${state}`,
    url: `https://www.agoraencontrei.com.br/imoveis/${slugify(`${typePt}-${purposePt}-${neighborhood || ''}-${city}`)}`,
    ...(price && {
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
      },
    }),
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state,
      addressCountry: 'BR',
      ...(neighborhood && { streetAddress: neighborhood }),
    },
    ...(input.totalArea && { floorSize: { '@type': 'QuantitativeValue', value: input.totalArea, unitCode: 'MTK' } }),
    ...(input.bedrooms && { numberOfBedrooms: input.bedrooms }),
    ...(input.bathrooms && { numberOfBathroomsTotal: input.bathrooms }),
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
