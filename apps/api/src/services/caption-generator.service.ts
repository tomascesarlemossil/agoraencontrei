import Anthropic from '@anthropic-ai/sdk'
import { env } from '../utils/env.js'

interface PropertyData {
  title: string
  type: string
  purpose: string
  city: string
  neighborhood?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpaces?: number | null
  totalArea?: number | null
  builtArea?: number | null
  price?: any
  priceRent?: any
  features?: string[] | null
  description?: string | null
  reference?: string | null
  slug?: string | null
}

const TYPE_PT: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara/Fazenda',
  WAREHOUSE: 'Galpão', OFFICE: 'Escritório', STORE: 'Loja/Comercial',
  PENTHOUSE: 'Cobertura', KITNET: 'Kitnet/Studio',
}

const PURPOSE_PT: Record<string, string> = {
  SALE: 'à venda', RENT: 'para alugar', BOTH: 'à venda e para alugar', SEASON: 'por temporada',
}

const HASHTAGS_BASE = [
  '#imóveisfranca', '#imobiliarialemos', '#franca', '#francasp',
  '#imóveis', '#corretorímoveis', '#imóvel', '#comprarimovel',
  '#alugarimóvel', '#imóveissp', '#imóveisinterior',
]

const HASHTAGS_BY_TYPE: Record<string, string[]> = {
  HOUSE: ['#casa', '#casapropia', '#casaàvenda', '#minhacasa'],
  APARTMENT: ['#apartamento', '#apto', '#apartamentoàvenda', '#morar'],
  LAND: ['#terreno', '#lote', '#investimento', '#construir'],
  FARM: ['#chácara', '#fazenda', '#sítio', '#interior'],
  WAREHOUSE: ['#galpão', '#comercial', '#logística', '#indústria'],
  OFFICE: ['#escritório', '#comercial', '#sala', '#empresas'],
  STORE: ['#loja', '#pontocómercial', '#comercial', '#negócio'],
  PENTHOUSE: ['#cobertura', '#penthouse', '#luxo', '#altíssimo'],
}

const HASHTAGS_BY_PURPOSE: Record<string, string[]> = {
  SALE: ['#venda', '#comprarcasa', '#realizarsonho', '#investimento', '#FGTS'],
  RENT: ['#aluguel', '#alugar', '#moradia', '#locação'],
  BOTH: ['#venda', '#aluguel', '#imóvel'],
  SEASON: ['#temporada', '#férias', '#verão'],
}

function fmt(v: any): string {
  if (!v) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}

export async function generatePropertyCaption(property: PropertyData): Promise<{ caption: string; hashtags: string }> {
  const typePt = TYPE_PT[property.type] ?? property.type
  const purposePt = PURPOSE_PT[property.purpose] ?? property.purpose
  const location = [property.neighborhood, property.city].filter(Boolean).join(', ')
  const priceStr = property.purpose === 'RENT' && property.priceRent
    ? `${fmt(property.priceRent)}/mês`
    : property.price ? fmt(property.price) : 'Consulte'
  const areaStr = property.builtArea ? `${property.builtArea}m²` : property.totalArea ? `${property.totalArea}m²` : ''
  const specs = [
    property.bedrooms ? `${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}` : '',
    property.bathrooms ? `${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}` : '',
    property.parkingSpaces ? `${property.parkingSpaces} vaga${property.parkingSpaces > 1 ? 's' : ''}` : '',
    areaStr,
  ].filter(Boolean).join(' · ')

  const webUrl = `https://www.agoraencontrei.com.br/imoveis/${property.slug ?? ''}`

  // Build hashtags
  const typeHashtags = HASHTAGS_BY_TYPE[property.type] ?? []
  const purposeHashtags = HASHTAGS_BY_PURPOSE[property.purpose] ?? []
  const neighborhoodTag = property.neighborhood
    ? `#${property.neighborhood.replace(/\s+/g, '').toLowerCase()}`
    : ''
  const allHashtags = [...new Set([
    ...HASHTAGS_BASE,
    ...typeHashtags,
    ...purposeHashtags,
    ...(neighborhoodTag ? [neighborhoodTag] : []),
    '#creci279051',
  ])].join(' ')

  // Use AI for caption if Anthropic key is set, otherwise use template
  if (env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Crie uma legenda para Instagram de um imóvel imobiliário. Seja entusiasmado, use emojis, destaque os melhores atributos. Máximo 200 caracteres antes das hashtags. NÃO inclua hashtags no texto principal.

Imóvel: ${typePt} ${purposePt}
Localização: ${location}
Preço: ${priceStr}
Especificações: ${specs}
${property.description ? `Descrição: ${property.description.slice(0, 300)}` : ''}
Link: ${webUrl}

Retorne SOMENTE a legenda, sem hashtags, sem aspas.`,
        }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      const captionWithLink = `${text}\n\n🔗 ${webUrl}`
      return { caption: captionWithLink, hashtags: allHashtags }
    } catch {
      // fallback to template below
    }
  }

  // Template fallback
  const emoji = { HOUSE: '🏡', APARTMENT: '🏢', LAND: '📐', FARM: '🌿', WAREHOUSE: '🏭', OFFICE: '💼', STORE: '🏪', PENTHOUSE: '✨', KITNET: '🏠' }[property.type] ?? '🏠'
  const caption = `${emoji} ${typePt} ${purposePt}!\n\n📍 ${location}${specs ? `\n✅ ${specs}` : ''}\n💰 ${priceStr}\n\n🔗 ${webUrl}\n\n📞 (16) 98101-0004 | Imobiliária Lemos — CRECI 279051`
  return { caption, hashtags: allHashtags }
}
