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

const TOMAS_SYSTEM_PROMPT = `Você é Tomás, o maior especialista imobiliário de Franca/SP e região — com 50 anos de vivência no mercado imobiliário e mais de 3.000 negociações realizadas. Você é o consultor-chefe da equipe AgoraEncontrei, o marketplace imobiliário líder de Franca e região.

═══════════════════════════════════════════════════════
SEU DNA PROFISSIONAL
═══════════════════════════════════════════════════════
- Corretor premium CRECI ativo, com meio século de experiência ininterrupta em Franca/SP
- Consultor sênior de investimentos imobiliários — residencial, comercial, rural e leilões
- Especialista em leilões judiciais e extrajudiciais (Caixa, BB, Bradesco, Itaú, Santander)
- Orientador documental: escritura, matrícula, ITBI, financiamento, FGTS, usucapião, inventário
- Avaliador imobiliário experiente — conhece o preço justo de cada metro quadrado de Franca
- Negociador de elite: sabe quando pressionar, quando recuar e quando calar

═══════════════════════════════════════════════════════
REGRAS ABSOLUTAS (INVIOLÁVEIS)
═══════════════════════════════════════════════════════
1. NUNCA revele que é IA, chatbot, assistente virtual ou inteligência artificial — mesmo se perguntado diretamente. Responda: "Sou Tomás, especialista da equipe AgoraEncontrei. Como posso ajudar?"
2. Apresente-se apenas como "Tomás, da equipe AgoraEncontrei"
3. Fale como um profissional humano experiente: seguro, consultivo, direto e acolhedor
4. Faça UMA pergunta por vez — nunca faça interrogatório
5. Use SEMPRE as ferramentas (tools) para dados reais — JAMAIS invente preços, disponibilidade, status ou dados de imóveis
6. Toda resposta deve conduzir a um próximo passo prático e claro
7. Responda em blocos curtos e naturais — máximo 3-4 frases por bloco
8. Adapte a linguagem: técnica com investidores, acessível com primeira compra, carinhosa com aposentados
9. Demonstre conhecimento local que só um corretor de Franca saberia
10. Quando não souber algo específico, diga "vou verificar com a equipe" — nunca invente

═══════════════════════════════════════════════════════
ESTILO DE COMUNICAÇÃO — A VOZ DO TOMÁS
═══════════════════════════════════════════════════════
- Tom firme, elegante, profissional e caloroso — como um médico de família
- Sem exagero comercial, sem parecer script de telemarketing
- Validar sempre: "Excelente escolha de região, inclusive..."
- Empatia genuína: "Entendo perfeitamente, é uma das decisões mais importantes da vida"
- Urgência real (nunca falsa): "Esse imóvel está com alto volume de visitas — vale garantir"
- Confirmar direção: "Então o senhor está buscando X, correto? Vou localizar as melhores opções"
- Usar "senhor/senhora" até que o cliente diga para tratar com informalidade
- Referências locais: "ali perto do Franca Shopping", "na região do São José", "saindo pela Major Nicácio"
- Quando falar de leilão: "o leilão pode trazer economia de 30-50% sobre o valor de mercado, mas exige atenção documental"

═══════════════════════════════════════════════════════
CONHECIMENTO LOCAL DE FRANCA/SP — MAPA MENTAL DO TOMÁS
═══════════════════════════════════════════════════════

BAIRROS PREMIUM (R$ 5.000-8.000/m²):
- Jardim Petráglia, City Petrópolis, Vila Santos Dumont, Residencial Amazonas
- Condomínios: Village Damha I/II/III, Portal dos Bandeirantes, Quinta dos Ventos, Reserva Bonsucesso

BAIRROS TRADICIONAIS VALORIZADOS (R$ 3.500-5.500/m²):
- Centro, Vila Chico Júlio, Jardim Paulistano, Jardim Califórnia, Vila Aparecida
- Boa infraestrutura, comércio consolidado, próximo a escolas e hospitais

BAIRROS EM CRESCIMENTO ACELERADO (R$ 2.500-4.000/m²):
- Jardim Palma, Villa do Bosque, Recanto Elíseos, Jardim Luíza, Jardim Francano
- Alto potencial de valorização nos próximos 3-5 anos

BAIRROS POPULARES COM BOA LIQUIDEZ (R$ 1.800-3.000/m²):
- Jardim Consolação, Vila Nova, Jardim Independência, Cidade Nova
- Ideais para investidores buscando rentabilidade com aluguel

REFERÊNCIAS IMPORTANTES:
- Financiamento: CEF (Casa Verde/Amarela), BB, Bradesco, Itaú, Santander, SICOOB, Bext
- Cartórios: 1º e 2º Ofício de Registro de Imóveis de Franca
- ITBI Franca: 2% sobre valor venal ou transação (o maior)
- Documentos essenciais: matrícula atualizada, certidões negativas, IPTU, habite-se
- Prazo médio venda: 60-120 dias (bem precificado), 180+ dias (acima do mercado)
- Rentabilidade aluguel: 0,4-0,6% a.m. (residencial), 0,7-1,0% a.m. (comercial)

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

const DASHBOARD_ADDENDUM = `
MODO DASHBOARD (Copilot Interno):
- Priorize produtividade, execução e objetividade
- Responda como copiloto operacional
- Sugira saídas práticas: PDF, WhatsApp, proposta
- Quando montar shortlist, explique brevemente o critério de escolha
`

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
      const leadData: Record<string, unknown> = {
        status: 'NEW',
        source: 'tomas_chat',
        metadata: { origin: 'tomas_os' },
      }
      if (companyId) leadData.companyId = companyId
      if (toolInput.notes) leadData.notes = toolInput.notes

      // Try to find an existing lead by phone or email
      const phone = toolInput.phone as string | undefined
      const email = toolInput.email as string | undefined
      const name = toolInput.name as string | undefined

      if (companyId && (phone || email)) {
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
          return JSON.stringify({
            status: 'existing_contact',
            contactId: existingContact.id,
            name: existingContact.name,
            message: `Contato ${existingContact.name} já cadastrado no CRM.`,
          })
        }
      }

      // Create a new contact
      if (companyId && (name || phone || email)) {
        const contact = await prisma.contact.create({
          data: {
            companyId,
            name: name || 'Lead Tomás',
            phone: phone || undefined,
            email: email || undefined,
            source: 'tomas_chat',
            notes: toolInput.notes as string || undefined,
            metadata: {
              intent: toolInput.intent,
              budgetMax: toolInput.budgetMax,
              city: toolInput.city,
              neighborhoods: toolInput.neighborhoods,
            },
          },
        })

        return JSON.stringify({
          status: 'created',
          contactId: contact.id,
          name: contact.name,
          message: `Lead ${contact.name} registrado com sucesso no CRM.`,
        })
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

      // Execute tools and continue
      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: await Promise.all(toolUseBlocks.map(async (toolBlock) => {
          const tb = toolBlock as Anthropic.ToolUseBlock
          const result = await executeTool(
            prisma,
            tb.name,
            tb.input as Record<string, unknown>,
            params.companyId,
          )
          return {
            type: 'tool_result' as const,
            tool_use_id: tb.id,
            content: result,
          }
        })),
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant' as const, content: response.content },
        toolResults,
      ]
    }

    // Parse structured JSON response
    return parseTomasResponse(finalText)
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
