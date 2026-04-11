/**
 * AI Marketing Service — Geração automática de conteúdo para imóveis
 * Usa Claude (Anthropic) para gerar descrições SEO, legendas de redes sociais
 * e análise de imagens via visão computacional.
 *
 * Fluxo: Upload de fotos → IA analisa → Gera textos → Salva no banco
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '../utils/env.js'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PropertyMarketingInput {
  title: string
  type: string                // HOUSE, APARTMENT, LAND, etc.
  purpose: string             // SALE, RENT, BOTH
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
  description?: string
  images?: string[]           // URLs das fotos (para visão computacional)
}

export interface MarketingContent {
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
  instagramCaption: string
  facebookCaption: string
  tiktokCaption: string
  whatsappMessage: string
  propertyHighlights: string[]
  slug: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_PT: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara',
  RANCH: 'Sítio', WAREHOUSE: 'Galpão', OFFICE: 'Sala Comercial',
  STORE: 'Loja', STUDIO: 'Studio', PENTHOUSE: 'Cobertura',
  CONDO: 'Condomínio', KITNET: 'Kitnet',
}

const PURPOSE_PT: Record<string, string> = {
  SALE: 'à venda', RENT: 'para alugar', BOTH: 'à venda e para alugar', SEASON: 'por temporada',
}

function formatPrice(value: number | undefined): string {
  if (!value) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
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

// ── Core Service ────────────────────────────────────────────────────────────

/**
 * Gera todo o conteúdo de marketing para um imóvel usando IA.
 * Inclui: SEO (título, descrição, keywords), legendas para redes sociais,
 * mensagem WhatsApp e highlights.
 */
export async function generateMarketingContent(
  property: PropertyMarketingInput,
): Promise<MarketingContent> {
  const typePt = TYPE_PT[property.type] ?? property.type
  const purposePt = PURPOSE_PT[property.purpose] ?? property.purpose
  const location = [property.neighborhood, property.city, property.state || 'SP'].filter(Boolean).join(', ')
  const price = property.purpose === 'RENT' ? formatPrice(property.priceRent) : formatPrice(property.price)
  const area = property.builtArea || property.totalArea

  const specs = [
    property.bedrooms ? `${property.bedrooms} quarto(s)` : '',
    property.bathrooms ? `${property.bathrooms} banheiro(s)` : '',
    property.parkingSpaces ? `${property.parkingSpaces} vaga(s)` : '',
    area ? `${area}m²` : '',
  ].filter(Boolean).join(', ')

  const featuresStr = property.features?.length
    ? `Diferenciais: ${property.features.join(', ')}`
    : ''

  // If no AI key, return template-based content
  if (!env.ANTHROPIC_API_KEY) {
    return generateTemplateContent(property, typePt, purposePt, location, price, specs)
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const prompt = `Você é um especialista em marketing imobiliário digital em ${property.city || 'Franca'}/SP.
Analise os dados do imóvel abaixo e gere conteúdo de marketing otimizado.

DADOS DO IMÓVEL:
- Tipo: ${typePt} ${purposePt}
- Localização: ${location}
- Preço: ${price}
- Especificações: ${specs}
- Descrição atual: ${property.description || 'Não informada'}
${featuresStr}

GERE EM JSON (sem markdown, apenas JSON puro):
{
  "seoTitle": "Título SEO (máx 60 chars, inclua cidade e tipo do imóvel)",
  "seoDescription": "Meta description SEO (máx 160 chars, persuasiva, inclua localização)",
  "seoKeywords": ["array", "de", "5-10", "keywords", "relevantes"],
  "instagramCaption": "Legenda Instagram (max 200 chars, emojis, persuasiva, sem hashtags)",
  "facebookCaption": "Post Facebook (max 300 chars, mais formal que Instagram)",
  "tiktokCaption": "Legenda TikTok (max 150 chars, tom jovem e dinâmico)",
  "whatsappMessage": "Mensagem WhatsApp para enviar a clientes interessados (max 500 chars, inclua preço e localização)",
  "propertyHighlights": ["3-5 destaques curtos do imóvel para cards"]
}

REGRAS:
- Foque nos benefícios de morar/investir na região de ${property.city || 'Franca'}
- Use termos como "Oportunidade", "Exclusivo", "Localização privilegiada" quando cabível
- SEO: inclua "${property.city || 'Franca'}" e bairro se disponível
- Instagram: tom entusiasmado com emojis
- WhatsApp: tom profissional mas acolhedor
- NÃO inclua hashtags nas legendas (serão adicionadas separadamente)
- Retorne SOMENTE o JSON, sem formatação markdown`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    const aiContent = JSON.parse(jsonStr) as Omit<MarketingContent, 'slug'>

    return {
      ...aiContent,
      slug: slugify(`${typePt}-${purposePt}-${property.neighborhood || ''}-${property.city || 'franca'}`),
    }
  } catch (error) {
    console.error('[ai-marketing] AI generation failed, using template:', error)
    return generateTemplateContent(property, typePt, purposePt, location, price, specs)
  }
}

/**
 * Analisa imagens de um imóvel via visão computacional e extrai informações.
 * Usado para preencher automaticamente a ficha técnica durante o cadastro.
 */
export async function analyzePropertyImages(
  imageUrls: string[],
  city = 'Franca',
): Promise<{
  detectedRooms: string[]
  detectedFeatures: string[]
  suggestedDescription: string
  estimatedBedrooms: number
  estimatedBathrooms: number
  propertyCondition: string
  finishingLevel: string
}> {
  if (!env.ANTHROPIC_API_KEY || imageUrls.length === 0) {
    return {
      detectedRooms: [],
      detectedFeatures: [],
      suggestedDescription: '',
      estimatedBedrooms: 0,
      estimatedBathrooms: 0,
      propertyCondition: 'unknown',
      finishingLevel: 'unknown',
    }
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  // Use up to 5 images for analysis
  const imagesToAnalyze = imageUrls.slice(0, 5)

  const imageContent: Anthropic.ImageBlockParam[] = imagesToAnalyze.map(url => ({
    type: 'image',
    source: { type: 'url', url },
  }))

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        ...imageContent,
        {
          type: 'text',
          text: `Analise estas fotos de um imóvel em ${city}/SP.
Retorne SOMENTE JSON (sem markdown):
{
  "detectedRooms": ["lista de cômodos identificados nas fotos"],
  "detectedFeatures": ["diferenciais visíveis: piso porcelanato, armários planejados, piscina, etc"],
  "suggestedDescription": "Descrição de 2-3 frases do imóvel baseada nas fotos",
  "estimatedBedrooms": número estimado de quartos (0 se incerto),
  "estimatedBathrooms": número estimado de banheiros (0 se incerto),
  "propertyCondition": "novo|reformado|bom_estado|necessita_reforma",
  "finishingLevel": "simples|padrao|alto|luxo"
}`,
        },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    return JSON.parse(jsonStr)
  } catch {
    return {
      detectedRooms: [],
      detectedFeatures: [],
      suggestedDescription: '',
      estimatedBedrooms: 0,
      estimatedBathrooms: 0,
      propertyCondition: 'unknown',
      finishingLevel: 'unknown',
    }
  }
}

// ── Template Fallback ───────────────────────────────────────────────────────

function generateTemplateContent(
  property: PropertyMarketingInput,
  typePt: string,
  purposePt: string,
  location: string,
  price: string,
  specs: string,
): MarketingContent {
  const neighborhood = property.neighborhood || ''
  const city = property.city || 'Franca'

  return {
    seoTitle: `${typePt} ${purposePt} em ${neighborhood ? neighborhood + ', ' : ''}${city}/SP`,
    seoDescription: `${typePt} ${purposePt} em ${location}. ${specs}. ${price}. Confira fotos e detalhes no Agora Encontrei.`,
    seoKeywords: [
      `${typePt.toLowerCase()} ${purposePt}`,
      `imóvel ${city.toLowerCase()}`,
      neighborhood ? `imóvel ${neighborhood.toLowerCase()}` : '',
      'agora encontrei',
      `comprar ${typePt.toLowerCase()}`,
      `${typePt.toLowerCase()} ${city.toLowerCase()}`,
    ].filter(Boolean),
    instagramCaption: `🏡 ${typePt} incrível ${purposePt} em ${location}! ${specs ? `✅ ${specs}` : ''} 💰 ${price}`,
    facebookCaption: `${typePt} ${purposePt} em ${location}. ${specs}. Valor: ${price}. Entre em contato para mais informações.`,
    tiktokCaption: `${typePt} ${purposePt} em ${city}! ${price} 🔥`,
    whatsappMessage: `Olá! Temos uma ótima oportunidade para você:\n\n🏡 *${typePt} ${purposePt}*\n📍 ${location}\n${specs ? `✅ ${specs}\n` : ''}💰 ${price}\n\nGostaria de agendar uma visita?`,
    propertyHighlights: [
      location,
      specs,
      price,
      ...(property.features?.slice(0, 2) || []),
    ].filter(Boolean),
    slug: slugify(`${typePt}-${purposePt}-${neighborhood}-${city}`),
  }
}
