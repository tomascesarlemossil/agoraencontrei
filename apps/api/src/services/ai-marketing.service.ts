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

/**
 * Lightweight output of `suggestTitleAndDescription` — used by the
 * "Sugerir com IA" button no cadastro de imóveis. Só os campos que o
 * formulário precisa para preencher direto; sem SEO/slug/etc.
 */
export interface TitleSuggestion {
  title: string           // pronto para usar no campo "Título do imóvel"
  description: string     // pronto para o campo "Descrição Pública"
  hashtags: string[]      // hashtags separadas para redes sociais
  source: 'ai' | 'template'
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

// ── Title / description / hashtags suggestion ────────────────────────────────
//
// Usado pelo botão "Sugerir com IA" no cadastro de imóveis: recebe o que
// o corretor já preencheu (tipo, localização, quartos, preço, features,
// notas) e devolve um título, descrição e hashtags prontos para colar
// no formulário. O cadastro não precisa esperar uma foto ou um título já
// existente — por isso essa API é separada da `generateMarketingContent`
// (que pressupõe um imóvel já existente).

/**
 * Devolve um título vendável + descrição humanizada + hashtags.
 * Usa Claude quando ANTHROPIC_API_KEY está setada. Caso contrário,
 * gera um template simples para o corretor editar.
 */
export async function suggestTitleAndDescription(
  input: Omit<PropertyMarketingInput, 'title'> & { title?: string },
): Promise<TitleSuggestion> {
  const typePt = TYPE_PT[input.type?.toUpperCase() ?? 'HOUSE'] ?? 'Imóvel'
  const purposePt = PURPOSE_PT[input.purpose?.toUpperCase() ?? 'SALE'] ?? 'à venda'
  const location = [input.neighborhood, input.city, input.state].filter(Boolean).join(', ')
  const priceStr = formatPrice(input.price || input.priceRent)

  // Template fallback — usado quando não tem AI key ou quando Claude falha.
  const templateFallback = (): TitleSuggestion => {
    const rooms = input.bedrooms ? `${input.bedrooms} quartos` : ''
    const area = input.builtArea ? `${input.builtArea}m²` : (input.totalArea ? `${input.totalArea}m²` : '')
    const bits = [rooms, area].filter(Boolean).join(' · ')
    const title = `${typePt} ${purposePt}${location ? ' em ' + location : ''}${bits ? ' — ' + bits : ''}`
    const description = [
      `${typePt} ${purposePt}${location ? ' localizado em ' + location : ''}.`,
      bits && `Conta com ${bits}.`,
      input.features?.length ? `Destaques: ${input.features.slice(0, 4).join(', ')}.` : '',
      input.description ? input.description : '',
      priceStr !== 'Consulte' ? `Valor: ${priceStr}.` : '',
      'Entre em contato para agendar uma visita.',
    ].filter(Boolean).join(' ')
    const hashtags = [
      `#${typePt.toLowerCase().replace(/\s+/g, '')}`,
      `#${purposePt.replace(/\s+/g, '')}`,
      input.city ? `#${slugify(input.city).replace(/-/g, '')}` : '',
      '#imobiliarialemos',
      '#agoraencontrei',
      '#imoveis',
    ].filter(Boolean).slice(0, 10)
    return { title: title.slice(0, 80), description, hashtags, source: 'template' }
  }

  if (!env.ANTHROPIC_API_KEY) return templateFallback()

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const prompt = `Você é um redator especialista em imóveis. Com base nos dados abaixo, gere título e descrição prontos para publicação no site do AgoraEncontrei e no Instagram/Facebook/WhatsApp da Imobiliária Lemos.

DADOS DO IMÓVEL:
- Tipo: ${typePt}
- Finalidade: ${purposePt}
- Cidade: ${input.city || 'Franca'}/${input.state || 'SP'}
${input.neighborhood ? `- Bairro: ${input.neighborhood}` : ''}
${input.bedrooms != null ? `- Quartos: ${input.bedrooms}` : ''}
${input.bathrooms != null ? `- Banheiros: ${input.bathrooms}` : ''}
${input.parkingSpaces != null ? `- Vagas: ${input.parkingSpaces}` : ''}
${input.builtArea != null ? `- Área construída: ${input.builtArea}m²` : ''}
${input.totalArea != null ? `- Área total: ${input.totalArea}m²` : ''}
${input.features?.length ? `- Features: ${input.features.join(', ')}` : ''}
${input.price ? `- Preço venda: ${formatPrice(input.price)}` : ''}
${input.priceRent ? `- Preço aluguel: ${formatPrice(input.priceRent)}` : ''}
${input.description ? `- Descrição que o corretor escreveu: ${input.description}` : ''}

REGRAS:
1. TÍTULO (máx 80 caracteres): vendável, específico, inclui tipo + finalidade + bairro/cidade + um diferencial. Sem adjetivos vazios ("maravilhoso", "incrível"). Ex: "Casa 3 quartos com piscina no Jardim América — Franca/SP".
2. DESCRIÇÃO (180-400 caracteres): tom humano, fluido, pronto para publicar no site. Destaque o que realmente diferencia. Sem emojis. Sem hashtags.
3. HASHTAGS (6-12): lowercase, sem espaços. Use: tipo+finalidade, bairro, cidade, features principais, 1-2 institucionais (#imobiliarialemos, #agoraencontrei). Sem caracteres especiais.

Responda APENAS com JSON válido:
{
  "title": "...",
  "description": "...",
  "hashtags": ["#casaavenda", "#jardimamerica", ...]
}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(jsonStr) as { title?: string; description?: string; hashtags?: string[] }

    // Sanidade mínima — se a AI devolver lixo, cai no template.
    if (!parsed.title || parsed.title.length < 10) return templateFallback()

    return {
      title: String(parsed.title).slice(0, 120),
      description: String(parsed.description ?? '').slice(0, 800),
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.filter(h => typeof h === 'string').slice(0, 12)
        : [],
      source: 'ai',
    }
  } catch (error) {
    console.error('[ai-marketing] suggestTitleAndDescription failed, using template:', error)
    return templateFallback()
  }
}
