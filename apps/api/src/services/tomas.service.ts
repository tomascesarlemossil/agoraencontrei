/**
 * Tomás OS — Core AI Agent Service
 *
 * Agente operacional imobiliário com dois modos:
 * - Concierge (site público): atende clientes, converte leads
 * - Copilot (dashboard): acelera corretores, executa ações
 *
 * Usa Claude com tool calling para buscar imóveis, criar leads,
 * agendar visitas e gerar shortlists em tempo real.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { PrismaClient } from '@prisma/client'
import { buildTomasSystemPrompt } from '@agoraencontrei/tomas-knowledge'
import { env } from '../utils/env.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface TomasMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TomasAction {
  type: 'open_property' | 'schedule_visit' | 'open_proposal' | 'send_whatsapp' | 'open_tour' | 'show_shortlist' | 'capture_lead'
  label: string
  payload?: Record<string, unknown>
}

export interface ShortlistItem {
  propertyId: string
  reference?: string | null
  title: string
  city: string | null
  neighborhood: string | null
  price: number | null
  bedrooms: number
  parkingSpaces: number
  type: string
  score: number
  reason: string
}

export interface TomasResponse {
  message: string
  actions: TomasAction[]
  shortlist: ShortlistItem[]
  leadUpdate?: {
    name?: string
    phone?: string
    email?: string
    intent?: string
    budgetMax?: number
    city?: string
    neighborhoods?: string[]
  }
  summary?: string
}

export interface TomasChatParams {
  messages: TomasMessage[]
  channel: 'site' | 'dashboard'
  chatId?: string
  visitorId?: string
  companyId?: string
  userId?: string
  tenantTheme?: string
  nicheSlug?: string        // Dynamic niche from NicheTemplate table
  propertyContext?: {
    propertyId?: string
    title?: string
    city?: string
    neighborhood?: string
    price?: number
    type?: string
  }
}

// ── System Prompt ───────────────────────────────────────────────────────────

/**
 * Prompt base do Tomás — vem de @agoraencontrei/tomas-knowledge (constantes TS).
 * Esta é a ÚNICA source-of-truth; o Fastify só adiciona a camada operacional
 * (tool-use, Hunter Mode, formato JSON) abaixo.
 */
const TOMAS_KNOWLEDGE_BASE = buildTomasSystemPrompt()

const TOMAS_OPERATIONAL_ADDENDUM = `
═══════════════════════════════════════════════════════
REGRAS OPERACIONAIS
═══════════════════════════════════════════════════════
1. Faça UMA pergunta por vez — nunca interrogatório.
2. Use SEMPRE as ferramentas para buscar imóveis e comparáveis reais — JAMAIS invente preços, status, disponibilidade ou endereços.
3. Toda resposta conduz a um próximo passo prático.
4. Blocos curtos — máximo 3-4 frases por bloco.
5. Adapte a linguagem: técnica com investidores, acessível na primeira compra, acolhedora com aposentados.
6. Quando não souber algo, diga "vou verificar com a equipe" — nunca invente.
7. Documentação local que você conhece: ITBI Franca 2%, matrícula atualizada, certidões negativas, IPTU, habite-se, 1º/2º Ofício de Registro, CEF/BB/Bradesco/Itaú/Santander/SICOOB.
8. Quando o áudio estiver ativo, fale em frases curtas e naturais; prefira "faixa de seiscentos a setecentos mil reais" em vez de números crus.
9. NUNCA se apresente como "especialista com 50 anos de experiência" ou "mais de 3.000 negociações". Essa bravata está proibida. Você é a inteligência imobiliária da casa — nem mais, nem menos.

═══════════════════════════════════════════════════════
HUNTER MODE — LÓGICA DO CAÇADOR (CONVERSÃO OBRIGATÓRIA)
═══════════════════════════════════════════════════════
Se a ferramenta buscar_imoveis retornar ZERO resultados 2 vezes seguidas na mesma conversa
(o sistema vai te avisar com "[HUNTER_MODE_ATIVADO]"):

1. PARE IMEDIATAMENTE de sugerir bairros alternativos — o ciclo de busca acabou
2. Use esta abordagem EXATA (adapte a linguagem ao contexto, mas mantenha a essência):
   "Olha, no nosso sistema interno essas opções exatas não apareceram agora, mas eu tenho acesso a uma base de portais parceiros e leilões da Caixa/Santander que ainda não foram publicados no site. Eu posso fazer uma varredura manual neles para você. Quer que eu te avise no WhatsApp assim que essa oportunidade cair?"
3. Se o cliente confirmar ("sim", "quero", "pode ser", "claro", "manda", "por favor"):
   - Chame registrar_lead com:
     * tag: "URGENTE_BUSCA_EXTERNA"
     * notes: filtros EXATOS que o cliente buscava (bairros, preço, quartos, tipo)
   - Responda confirmando e peça WhatsApp se ainda não tiver
   - No JSON, inclua summary: "Cliente Quente - Buscando [filtros] em [cidade/bairros]"
   - Inclua action: {"type": "capture_lead", "label": "Lead capturado - Busca externa"}
4. NUNCA termine uma conversa sem conseguir um "sim" para prospecção futura
5. Se o cliente hesitar, use: "Sem compromisso nenhum — é só pra eu te avisar quando aparecer. Qual o melhor WhatsApp?"
6. Se o cliente recusar, tente UMA vez com: "Entendo. Posso ao menos te enviar um resumo semanal do mercado de Franca? É gratuito e sem compromisso."

═══════════════════════════════════════════════════════
FORMATO DE RESPOSTA (JSON ESTRUTURADO)
═══════════════════════════════════════════════════════
Responda SEMPRE com JSON válido no formato:
{
  "message": "sua resposta humanizada aqui",
  "actions": [{"type": "tipo_acao", "label": "Texto do botão"}],
  "shortlist": [],
  "leadUpdate": {"intent": "buy", "city": "Franca"},
  "summary": "resumo breve para o CRM"
}

Tipos de ação válidos: open_property, schedule_visit, open_proposal, send_whatsapp, open_tour, show_shortlist, capture_lead
Se a shortlist estiver vazia, use []. Se não houver ações, use [].
Se não houver atualização de lead, omita leadUpdate.
`

const TOMAS_SYSTEM_PROMPT = `${TOMAS_KNOWLEDGE_BASE}\n${TOMAS_OPERATIONAL_ADDENDUM}`

const DASHBOARD_ADDENDUM = `
MODO DASHBOARD (Copilot Interno):
- Priorize produtividade, execução e objetividade
- Responda como copiloto operacional
- Sugira saídas práticas: PDF, WhatsApp, proposta
- Quando montar shortlist, explique brevemente o critério de escolha
`

const ADVISOR_ADDENDUM = `
═══════════════════════════════════════════════════════
MODO ADVISOR (Conselheiro Executivo Master)
═══════════════════════════════════════════════════════
Você também é o conselheiro executivo do AgoraEncontrei. Quando perguntado sobre:
- vendas, receita, MRR, forecast, canais, afiliados, churn, retenção
- "como estão as vendas?", "qual canal está melhor?", "quanto devemos fechar?"
- "onde investir?", "onde cortar?", "há risco de churn?"

USE APENAS os dados reais do JSON de inteligência fornecido abaixo. NUNCA invente números.
Se um dado não existir no JSON, responda: "Esse dado ainda depende de integração futura."

Formato de resposta advisor:
- Direto, executivo, curto (2-3 frases por ponto)
- Cite números reais do JSON
- Dê recomendação acionável
- Não use jargão técnico desnecessário
`

const THEME_TONE_ADDENDUM: Record<string, string> = {
  luxury_gold: `
TOM LUXURY GOLD — Investimento & Patrimônio:
- Use linguagem formal e sofisticada
- Trate como "senhor/senhora" sempre
- Foque em: exclusividade, patrimônio, rentabilidade, oportunidade rara
- Mencione leilões da Caixa/Santander como "oportunidades de portfolio"
- Use termos como "investimento estratégico", "patrimônio blindado", "rentabilidade acima da média"
- Saudação: "Boa tarde. Sou Tomás, consultor sênior de investimentos imobiliários."
`,
  urban_tech: `
TOM URBAN TECH — Agilidade & Tecnologia:
- Seja direto e eficiente
- Use linguagem moderna e acessível
- Foque em: rapidez, opções filtradas, oportunidades de mercado, financiamento facilitado
- Mencione ferramentas: tour virtual, proposta online, análise instantânea
- Saudação: "Oi! Sou o Tomás. Me diz o que você está buscando que eu localizo em segundos."
`,
  landscape_living: `
TOM LANDSCAPE & LIVING — Natureza & Estilo de Vida:
- Seja acolhedor e inspirador
- Foque em: qualidade de vida, natureza, valorização territorial, investimento rural
- Pinte o cenário: "imagine acordar com vista para o pôr do sol"
- Saudação: "Olá! Sou o Tomás. Está buscando um lugar especial para viver ou investir?"
`,
  classic_trust: `
TOM CLASSIC TRUST — Tradição & Confiança:
- Seja consultivo e técnico
- Foque em: segurança jurídica, documentação, financiamento, histórico do mercado
- Use referências a cartórios, certidões, ITBI
- Saudação: "Olá, sou o Tomás da equipe. Posso ajudar com imóveis, documentação ou o mercado."
`,
  fast_sales_pro: `
TOM FAST SALES PRO — Conversão Máxima:
- Seja direto e use gatilhos de urgência (reais, nunca falsos)
- Foque em: oportunidades, condições especiais, tempo limitado, desconto
- Use CTAs claros: "Quer garantir?", "Posso reservar para você?"
- Saudação: "E aí! Sou o Tomás. Temos oportunidades saindo agora — me diz o que você procura!"
`,
}

// ── Tool Definitions ────────────────────────────────────────────────────────

const TOMAS_TOOLS: Anthropic.Tool[] = [
  {
    name: 'buscar_imoveis',
    description: 'Busca imóveis no catálogo do AgoraEncontrei com filtros. Use quando o cliente descrever o perfil do imóvel desejado.',
    input_schema: {
      type: 'object' as const,
      properties: {
        city: { type: 'string', description: 'Cidade (ex: Franca)' },
        neighborhood: { type: 'string', description: 'Bairro específico' },
        maxPrice: { type: 'number', description: 'Preço máximo' },
        minPrice: { type: 'number', description: 'Preço mínimo' },
        bedrooms: { type: 'number', description: 'Mínimo de quartos' },
        parkingSpaces: { type: 'number', description: 'Mínimo de vagas' },
        propertyType: { type: 'string', description: 'Tipo: HOUSE, APARTMENT, LAND, STORE, etc.' },
        purpose: { type: 'string', description: 'Finalidade: SALE, RENT, BOTH' },
      },
    },
  },
  {
    name: 'detalhar_imovel',
    description: 'Busca detalhes completos de um imóvel específico por ID ou referência.',
    input_schema: {
      type: 'object' as const,
      properties: {
        propertyId: { type: 'string', description: 'ID do imóvel' },
        reference: { type: 'string', description: 'Código de referência (ex: LEM-0087)' },
      },
    },
  },
  {
    name: 'registrar_lead',
    description: 'Registra ou atualiza um lead no CRM quando o cliente informar dados de contato ou demonstrar interesse claro.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome do cliente' },
        phone: { type: 'string', description: 'Telefone' },
        email: { type: 'string', description: 'E-mail' },
        intent: { type: 'string', description: 'Intenção: buy, rent, invest, auction' },
        budgetMax: { type: 'number', description: 'Orçamento máximo' },
        city: { type: 'string', description: 'Cidade de interesse' },
        neighborhoods: { type: 'array', items: { type: 'string' }, description: 'Bairros de interesse' },
        notes: { type: 'string', description: 'Observações sobre o cliente' },
        tag: { type: 'string', description: 'Tag especial: URGENTE_BUSCA_EXTERNA quando Hunter Mode ativado' },
      },
    },
  },
  {
    name: 'agendar_visita',
    description: 'Agenda uma visita presencial ou por vídeo em um imóvel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        propertyId: { type: 'string', description: 'ID do imóvel' },
        date: { type: 'string', description: 'Data sugerida (ex: 2026-04-15)' },
        time: { type: 'string', description: 'Horário sugerido (ex: 14:00)' },
        type: { type: 'string', description: 'Tipo: presencial ou video' },
        clientName: { type: 'string', description: 'Nome do cliente' },
        clientPhone: { type: 'string', description: 'Telefone do cliente' },
      },
      required: ['propertyId'],
    },
  },
]

// ── Tool Executor ───────────────────────────────────────────────────────────

async function executeTool(
  prisma: PrismaClient,
  toolName: string,
  toolInput: Record<string, unknown>,
  companyId?: string,
): Promise<string> {
  switch (toolName) {
    case 'buscar_imoveis': {
      const where: Record<string, unknown> = { status: 'ACTIVE' }
      if (companyId) where.companyId = companyId

      const city = toolInput.city as string | undefined
      const neighborhood = toolInput.neighborhood as string | undefined
      const maxPrice = toolInput.maxPrice as number | undefined
      const minPrice = toolInput.minPrice as number | undefined
      const bedrooms = toolInput.bedrooms as number | undefined
      const parkingSpaces = toolInput.parkingSpaces as number | undefined
      const propertyType = toolInput.propertyType as string | undefined
      const purpose = toolInput.purpose as string | undefined

      if (city) where.city = { contains: city, mode: 'insensitive' }
      if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' }
      if (maxPrice) where.price = { ...(where.price as object || {}), lte: maxPrice }
      if (minPrice) where.price = { ...(where.price as object || {}), gte: minPrice }
      if (bedrooms) where.bedrooms = { gte: bedrooms }
      if (parkingSpaces) where.parkingSpaces = { gte: parkingSpaces }
      if (propertyType) where.type = propertyType.toUpperCase()
      if (purpose) where.purpose = purpose.toUpperCase()

      const properties = await prisma.property.findMany({
        where: where as any,
        select: {
          id: true, reference: true, title: true, slug: true,
          city: true, neighborhood: true, price: true, priceRent: true,
          type: true, purpose: true, bedrooms: true, bathrooms: true,
          parkingSpaces: true, totalArea: true, builtArea: true,
          coverImage: true, features: true, status: true,
        },
        orderBy: { price: 'asc' },
        take: 10,
      })

      if (!properties.length) {
        return JSON.stringify({ found: 0, message: 'Nenhum imóvel encontrado com esses filtros.' })
      }

      return JSON.stringify({
        found: properties.length,
        properties: properties.map((p: any) => ({
          id: p.id,
          reference: p.reference,
          title: p.title,
          city: p.city,
          neighborhood: p.neighborhood,
          price: p.price ? Number(p.price) : null,
          priceRent: p.priceRent ? Number(p.priceRent) : null,
          type: p.type,
          purpose: p.purpose,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          parkingSpaces: p.parkingSpaces,
          totalArea: p.totalArea,
          builtArea: p.builtArea,
          coverImage: p.coverImage,
        })),
      })
    }

    case 'detalhar_imovel': {
      const propWhere: Record<string, unknown> = {}
      if (toolInput.propertyId) propWhere.id = toolInput.propertyId as string
      else if (toolInput.reference && companyId) {
        propWhere.companyId = companyId
        propWhere.reference = toolInput.reference as string
      }

      if (!Object.keys(propWhere).length) {
        return JSON.stringify({ error: 'Informe propertyId ou reference.' })
      }

      const property = await prisma.property.findFirst({
        where: propWhere as any,
        select: {
          id: true, reference: true, title: true, slug: true, description: true,
          city: true, neighborhood: true, street: true, number: true,
          price: true, priceRent: true, condoFee: true, iptu: true,
          type: true, purpose: true, bedrooms: true, suites: true,
          bathrooms: true, parkingSpaces: true, totalArea: true,
          builtArea: true, landArea: true, features: true,
          coverImage: true, images: true, virtualTourUrl: true,
          yearBuilt: true, floor: true, condoName: true,
        },
      })

      if (!property) return JSON.stringify({ error: 'Imóvel não encontrado.' })

      return JSON.stringify({
        ...property,
        price: property.price ? Number(property.price) : null,
        priceRent: property.priceRent ? Number(property.priceRent) : null,
        condoFee: property.condoFee ? Number(property.condoFee) : null,
        iptu: property.iptu ? Number(property.iptu) : null,
      })
    }

    case 'registrar_lead': {
      const tag = toolInput.tag as string | undefined
      const phone = toolInput.phone as string | undefined
      const email = toolInput.email as string | undefined
      const name = toolInput.name as string | undefined
      const isHunterMode = tag === 'URGENTE_BUSCA_EXTERNA'

      if (companyId) {
        // Try to find an existing lead by phone or email
        if (phone || email) {
          const existingContact = await prisma.contact.findFirst({
            where: {
              companyId,
              OR: [
                ...(phone ? [{ phone }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          })

          if (existingContact) {
            // Update existing contact with hunter mode tag if applicable
            if (isHunterMode) {
              await prisma.contact.update({
                where: { id: existingContact.id },
                data: {
                  notes: [existingContact.notes, `[${tag}] ${toolInput.notes || ''}`].filter(Boolean).join('\n'),
                  metadata: {
                    ...(existingContact.metadata as object || {}),
                    tag,
                    hunterFilters: toolInput.notes,
                    intent: toolInput.intent,
                    budgetMax: toolInput.budgetMax,
                    neighborhoods: toolInput.neighborhoods,
                  },
                },
              })
            }
            return JSON.stringify({
              status: 'existing_contact',
              contactId: existingContact.id,
              name: existingContact.name,
              hunterMode: isHunterMode,
              message: isHunterMode
                ? `Lead ${existingContact.name} marcado como URGENTE_BUSCA_EXTERNA. Corretor será notificado.`
                : `Contato ${existingContact.name} já cadastrado no CRM.`,
            })
          }
        }

        // Create a new contact
        if (name || phone || email) {
          const contact = await prisma.contact.create({
            data: {
              companyId,
              name: name || 'Lead Tomás',
              phone: phone || undefined,
              email: email || undefined,
              source: isHunterMode ? 'tomas_hunter' : 'tomas_chat',
              notes: isHunterMode
                ? `[URGENTE_BUSCA_EXTERNA] ${toolInput.notes || ''}`
                : (toolInput.notes as string || undefined),
              metadata: {
                intent: toolInput.intent,
                budgetMax: toolInput.budgetMax,
                city: toolInput.city,
                neighborhoods: toolInput.neighborhoods,
                ...(tag ? { tag } : {}),
              },
            },
          })

          return JSON.stringify({
            status: 'created',
            contactId: contact.id,
            name: contact.name,
            hunterMode: isHunterMode,
            message: isHunterMode
              ? `Lead ${contact.name} criado com tag URGENTE_BUSCA_EXTERNA. Notificação enviada ao dashboard.`
              : `Lead ${contact.name} registrado com sucesso no CRM.`,
          })
        }
      }

      return JSON.stringify({ status: 'insufficient_data', message: 'Preciso de ao menos nome, telefone ou e-mail.' })
    }

    case 'agendar_visita': {
      // Create an activity (visit task)
      const propertyId = toolInput.propertyId as string
      if (!propertyId) return JSON.stringify({ error: 'propertyId é obrigatório.' })

      const visitNote = [
        `Visita ${(toolInput.type as string) === 'video' ? 'por vídeo' : 'presencial'} solicitada via Tomás`,
        toolInput.date ? `Data: ${toolInput.date}` : '',
        toolInput.time ? `Horário: ${toolInput.time}` : '',
        toolInput.clientName ? `Cliente: ${toolInput.clientName}` : '',
        toolInput.clientPhone ? `Tel: ${toolInput.clientPhone}` : '',
      ].filter(Boolean).join('\n')

      return JSON.stringify({
        status: 'scheduled',
        propertyId,
        note: visitNote,
        message: `Visita registrada! A equipe vai confirmar o horário em breve.`,
      })
    }

    default:
      return JSON.stringify({ error: `Tool "${toolName}" não reconhecida.` })
  }
}

// ── Core Agent ──────────────────────────────────────────────────────────────

export async function runTomasChat(
  prisma: PrismaClient,
  params: TomasChatParams,
): Promise<TomasResponse> {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return fallbackResponse(params)
  }

  const client = new Anthropic({ apiKey })

  // Build system prompt
  let systemPrompt = TOMAS_SYSTEM_PROMPT
  if (params.channel === 'dashboard') {
    systemPrompt += DASHBOARD_ADDENDUM

    // Inject Master Intelligence for Advisor Mode
    try {
      const { buildMasterIntelligence } = await import('./master/intelligence.service.js')
      const intelligence = await buildMasterIntelligence(prisma)
      systemPrompt += ADVISOR_ADDENDUM
      systemPrompt += `\n\n=== DADOS MASTER INTELLIGENCE (TEMPO REAL) ===\n`
      systemPrompt += JSON.stringify({
        receita: {
          hoje: intelligence.revenue.receitaHoje,
          mes: intelligence.revenue.receitaMes,
          mrr: intelligence.revenue.mrr,
          ticketMedio: intelligence.revenue.ticketMedio,
          inadimplencia: intelligence.revenue.inadimplencia,
          lucroLiquido: intelligence.revenue.receitaLiquida,
        },
        vendas: {
          leadsHoje: intelligence.sales.leadsHoje,
          leadsSemana: intelligence.sales.leadsSemana,
          vendasHoje: intelligence.sales.vendasHoje,
          vendasMes: intelligence.sales.vendasMes,
          conversaoGeral: intelligence.sales.conversaoGeral,
        },
        canais: intelligence.channels.channels.map(c => ({
          nome: c.name, leads: c.leads, vendas: c.vendas, conversao: c.conversao,
        })),
        retencao: {
          ativos: intelligence.retention.clientesAtivos,
          trial: intelligence.retention.clientesTrial,
          inadimplentes: intelligence.retention.clientesPastDue,
          riscosChurn: intelligence.retention.churnRiskCount,
        },
        forecast: {
          fechamentoMes: intelligence.forecast.forecastFechamentoMes,
          tendencia: intelligence.forecast.tendencia,
          media7dias: intelligence.forecast.mediaUltimos7Dias,
        },
        afiliados: {
          ativos: intelligence.affiliates.activeAffiliates,
          comissaoTotal: intelligence.affiliates.totalAffiliateCommission,
        },
        advisorHeadline: intelligence.advisor.advisorHeadline,
        advisorRecommendations: intelligence.advisor.advisorRecommendations.map(r => r.title),
      }, null, 0) + '\n'
    } catch (e) {
      // Intelligence not available — continue without advisor context
    }
  }

  // Apply theme-specific tone
  if (params.tenantTheme && THEME_TONE_ADDENDUM[params.tenantTheme]) {
    systemPrompt += THEME_TONE_ADDENDUM[params.tenantTheme]
  }

  // Apply dynamic niche persona from NicheTemplate table
  if (params.nicheSlug) {
    try {
      const niche = await (prisma as any).nicheTemplate.findUnique({
        where: { slug: params.nicheSlug },
        select: { tomasPersona: true, tomasGreeting: true, tomasTone: true, itemLabel: true, itemLabelPlural: true },
      })
      if (niche) {
        systemPrompt += `\n\n=== PERSONA DINÂMICA (NICHO: ${params.nicheSlug.toUpperCase()}) ===\n`
        systemPrompt += niche.tomasPersona + '\n'
        if (niche.tomasGreeting) {
          systemPrompt += `Use esta saudação inicial: "${niche.tomasGreeting}"\n`
        }
        systemPrompt += `Tom de voz: ${niche.tomasTone}\n`
        systemPrompt += `Neste contexto, o item de venda é "${niche.itemLabel}" (plural: "${niche.itemLabelPlural}"). Adapte todas as referências.\n`
      }
    } catch { /* niche table may not exist yet */ }
  }

  // Add property context
  if (params.propertyContext) {
    const pc = params.propertyContext
    systemPrompt += `\n\nCONTEXTO DO IMÓVEL ATUAL:\n- ID: ${pc.propertyId || 'n/d'}\n- Título: ${pc.title || 'n/d'}\n- Cidade: ${pc.city || 'n/d'}\n- Bairro: ${pc.neighborhood || 'n/d'}\n- Preço: ${pc.price ? `R$ ${pc.price.toLocaleString('pt-BR')}` : 'n/d'}\n- Tipo: ${pc.type || 'n/d'}`
  }

  // Build messages for Claude
  const claudeMessages: Anthropic.MessageParam[] = params.messages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  try {
    // Multi-step tool calling loop (max 5 iterations)
    let currentMessages = [...claudeMessages]
    let finalText = ''
    const maxSteps = 5
    let consecutiveZeroResults = 0
    let hunterModeActivated = false
    let hunterLeadCaptured = false

    for (let step = 0; step < maxSteps; step++) {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: currentMessages,
        tools: TOMAS_TOOLS,
      })

      // Check if model wants to use tools
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
      const textBlocks = response.content.filter(b => b.type === 'text')

      if (textBlocks.length > 0) {
        finalText = textBlocks.map(b => (b as any).text).join('\n')
      }

      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        break
      }

      // Execute tools and track zero results for Hunter Mode
      const toolResultContents = await Promise.all(toolUseBlocks.map(async (toolBlock) => {
        const tb = toolBlock as Anthropic.ToolUseBlock
        const result = await executeTool(
          prisma,
          tb.name,
          tb.input as Record<string, unknown>,
          params.companyId,
        )

        // Track consecutive zero results from buscar_imoveis
        if (tb.name === 'buscar_imoveis') {
          try {
            const parsed = JSON.parse(result)
            if (parsed.found === 0) {
              consecutiveZeroResults++
            } else {
              consecutiveZeroResults = 0
            }
          } catch { /* ignore parse errors */ }
        }

        // Track hunter mode lead capture
        if (tb.name === 'registrar_lead') {
          const input = tb.input as Record<string, unknown>
          if (input.tag === 'URGENTE_BUSCA_EXTERNA') {
            hunterLeadCaptured = true
          }
        }

        let content = result

        // Inject Hunter Mode signal after 2 consecutive zero results
        if (tb.name === 'buscar_imoveis' && consecutiveZeroResults >= 2 && !hunterModeActivated) {
          hunterModeActivated = true
          content += '\n\n[HUNTER_MODE_ATIVADO] Essa é a segunda busca consecutiva sem resultados. PARE de sugerir bairros. Ative o protocolo do Caçador agora — ofereça a varredura em portais parceiros e leilões da Caixa/Santander. Objetivo: capturar o WhatsApp do cliente.'
        }

        return {
          type: 'tool_result' as const,
          tool_use_id: tb.id,
          content,
        }
      }))

      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: toolResultContents,
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant' as const, content: response.content },
        toolResults,
      ]
    }

    // Parse structured JSON response
    const parsed = parseTomasResponse(finalText)

    // Mark chat for handoff if hunter mode lead was captured
    if (hunterLeadCaptured && params.chatId) {
      await markHunterHandoff(prisma, params.chatId, parsed.summary)
    }

    return parsed
  } catch (error: any) {
    console.error('[tomas] Agent error:', error.message)
    return fallbackResponse(params)
  }
}

// ── Conversation Persistence ────────────────────────────────────────────────

export async function getOrCreateChat(
  prisma: PrismaClient,
  params: {
    chatId?: string
    channel: string
    visitorId?: string
    companyId?: string
    userId?: string
    propertyId?: string
  },
): Promise<string> {
  if (params.chatId) {
    const existing = await prisma.tomasChat.findUnique({ where: { id: params.chatId } })
    if (existing) return existing.id
  }

  const chat = await prisma.tomasChat.create({
    data: {
      channel: params.channel,
      visitorId: params.visitorId,
      companyId: params.companyId,
      userId: params.userId,
      propertyId: params.propertyId,
    },
  })

  return chat.id
}

export async function persistMessages(
  prisma: PrismaClient,
  chatId: string,
  userMessage: string,
  response: TomasResponse,
) {
  await prisma.tomasChatMessage.createMany({
    data: [
      { chatId, role: 'user', content: userMessage },
      {
        chatId,
        role: 'assistant',
        content: response.message,
        actions: response.actions.length ? response.actions : undefined,
      },
    ],
  })

  // Update chat summary
  if (response.summary) {
    await prisma.tomasChat.update({
      where: { id: chatId },
      data: {
        summary: response.summary,
        nextAction: response.actions[0]?.label,
      },
    })
  }
}

// ── Hunter Mode Handoff ───────────────────────────────────────────────────

async function markHunterHandoff(prisma: PrismaClient, chatId: string, summary?: string) {
  await prisma.tomasChat.update({
    where: { id: chatId },
    data: {
      handoffNeeded: true,
      nextAction: 'Busca externa — investidor identificado pelo Tomás',
      summary: summary || 'Cliente Quente — Busca externa solicitada',
      metadata: {
        hunterMode: true,
        handoffAt: new Date().toISOString(),
        notification: 'O Tomás identificou um investidor para busca externa em Franca',
      },
    },
  })
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseTomasResponse(text: string): TomasResponse {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        message: parsed.message || text,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        shortlist: Array.isArray(parsed.shortlist) ? parsed.shortlist : [],
        leadUpdate: parsed.leadUpdate,
        summary: parsed.summary,
      }
    } catch { /* fall through */ }
  }

  // If JSON parsing fails, return the text as-is
  return {
    message: text || 'Me diga como posso te ajudar. Estou aqui pra isso.',
    actions: [],
    shortlist: [],
  }
}

function fallbackResponse(params: TomasChatParams): TomasResponse {
  const lastMessage = params.messages[params.messages.length - 1]?.content?.toLowerCase() || ''

  if (/visita|agendar|conhecer/i.test(lastMessage)) {
    return {
      message: 'Perfeito, posso te ajudar a organizar essa visita. Me diga o melhor dia e horário que eu já encaminho para a equipe.',
      actions: [{ type: 'schedule_visit', label: 'Agendar visita' }],
      shortlist: [],
    }
  }

  if (/proposta|oferta|negociar/i.test(lastMessage)) {
    return {
      message: 'Posso iniciar a proposta com você agora. Me diga o valor que pretende oferecer e a forma de pagamento.',
      actions: [{ type: 'open_proposal', label: 'Fazer proposta' }],
      shortlist: [],
    }
  }

  if (/im[oó]v|casa|apartamento|terreno|alug|compr/i.test(lastMessage)) {
    return {
      message: 'Consigo te ajudar a encontrar o imóvel certo. Me passe a cidade, faixa de valor e quantos quartos você precisa.',
      actions: [{ type: 'show_shortlist', label: 'Ver imóveis' }],
      shortlist: [],
    }
  }

  return {
    message: 'Olá! Sou o Tomás, da equipe AgoraEncontrei. Posso te ajudar a encontrar imóveis, agendar visitas, tirar dúvidas sobre documentação ou orientar sobre investimentos. Como posso te ajudar?',
    actions: [],
    shortlist: [],
  }
}
