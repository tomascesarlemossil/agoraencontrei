/**
 * AI Agent Service — Anthropic Claude
 * Agents: PDF extractor, Audio transcriber, Copywriter, Lead Scorer
 */
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../utils/env.js'

const getClient = () => {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}

// ── PDF Extractor ────────────────────────────────────────────────────────────

export interface PropertyExtract {
  title?: string
  type?: string
  totalArea?: number
  builtArea?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  price?: number
  description?: string
  features?: string[]
  rawText?: string
}

export async function extractFromPdf(base64Pdf: string): Promise<PropertyExtract> {
  const client = getClient()

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Pdf },
          },
          {
            type: 'text',
            text: `Extraia as informações do imóvel deste documento e retorne um JSON com os campos:
title, type (HOUSE/APARTMENT/LAND/COMMERCIAL), totalArea, builtArea, bedrooms, bathrooms, parkingSpaces,
street, neighborhood, city, state, price (número), description, features (array de strings).
Retorne APENAS o JSON válido, sem markdown.`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { rawText: text }
  }
}

// ── Audio Transcriber ────────────────────────────────────────────────────────

export interface AudioTranscript {
  text: string
  intent?: string    // "schedule_visit", "price_inquiry", "document_request", "other"
  entities?: {
    propertyId?: string
    date?: string
    phone?: string
  }
  suggestedAction?: string
}

export async function transcribeAudio(base64Audio: string, mimeType = 'audio/ogg'): Promise<AudioTranscript> {
  const client = getClient()

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Transcreva este áudio e identifique a intenção. Retorne JSON com os campos:
text (transcrição), intent (schedule_visit/price_inquiry/document_request/other),
entities (propertyId, date, phone se mencionados), suggestedAction (ação sugerida no CRM).
O áudio está em base64: ${base64Audio.substring(0, 100)}...
Retorne APENAS JSON válido.`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { text: text, intent: 'other' }
  }
}

// ── Copywriter ────────────────────────────────────────────────────────────────

export interface CopywriteInput {
  title: string
  type: string
  purpose: string
  totalArea?: number
  builtArea?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  city?: string
  neighborhood?: string
  price?: number
  priceRent?: number
  features?: string[]
  portal: 'olx' | 'zap' | 'vivareal' | 'facebook' | 'instagram' | 'generic'
}

export interface CopywriteOutput {
  title: string
  description: string
  hashtags?: string[]
}

const PORTAL_INSTRUCTIONS: Record<string, string> = {
  olx: 'Texto direto e objetivo para OLX. Máximo 2000 caracteres. Sem emojis excessivos.',
  zap: 'Texto profissional para ZAP Imóveis. Destaque diferenciais. Máximo 3000 caracteres.',
  vivareal: 'Texto detalhado para Viva Real. Inclua todos os cômodos e características.',
  facebook: 'Texto engajante para Facebook Marketplace. Use emojis moderadamente. Máximo 1500 chars.',
  instagram: 'Texto curto e impactante para Instagram (caption). Inclua hashtags relevantes. Máximo 500 chars.',
  generic: 'Texto completo e profissional para divulgação geral.',
}

export async function copywriteProperty(input: CopywriteInput): Promise<CopywriteOutput> {
  const client = getClient()

  const specs = [
    input.bedrooms && `${input.bedrooms} quarto(s)`,
    input.bathrooms && `${input.bathrooms} banheiro(s)`,
    input.parkingSpaces && `${input.parkingSpaces} vaga(s)`,
    input.totalArea && `${input.totalArea}m² total`,
    input.builtArea && `${input.builtArea}m² construídos`,
  ].filter(Boolean).join(', ')

  const price = input.purpose === 'RENT'
    ? input.priceRent && `R$ ${input.priceRent.toLocaleString('pt-BR')}/mês`
    : input.price && `R$ ${input.price.toLocaleString('pt-BR')}`

  const instruction = PORTAL_INSTRUCTIONS[input.portal] ?? PORTAL_INSTRUCTIONS.generic

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Crie um anúncio imobiliário para o seguinte imóvel:
Título: ${input.title}
Tipo: ${input.type} (${input.purpose})
Localização: ${input.neighborhood ?? ''}, ${input.city ?? ''}
Características: ${specs}
Preço: ${price ?? 'A consultar'}
Diferenciais: ${input.features?.join(', ') ?? 'não informado'}

Instrução do portal: ${instruction}

Retorne JSON com: title (título otimizado), description (texto do anúncio), hashtags (array, apenas se for instagram/facebook).
Retorne APENAS JSON válido.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { title: input.title, description: text }
  }
}

// ── Lead Scorer ────────────────────────────────────────────────────────────────

export interface LeadScoreInput {
  lead: {
    source?: string
    interest?: string
    budget?: number
    status?: string
    score?: number
    createdAt: string
    lastContactAt?: string
  }
  activitiesCount: number
  dealsCount: number
  hasPhone: boolean
  hasEmail: boolean
  hasContact: boolean
}

export async function scoreLead(input: LeadScoreInput): Promise<{ score: number; reasoning: string }> {
  const client = getClient()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Pontue este lead imobiliário de 0 a 100:
- Fonte: ${input.lead.source ?? 'desconhecida'}
- Interesse: ${input.lead.interest ?? 'não informado'}
- Orçamento: ${input.lead.budget ? `R$ ${input.lead.budget}` : 'não informado'}
- Status: ${input.lead.status}
- Tem telefone: ${input.hasPhone}
- Tem e-mail: ${input.hasEmail}
- Já é contato: ${input.hasContact}
- Atividades registradas: ${input.activitiesCount}
- Negócios abertos: ${input.dealsCount}
- Criado em: ${input.lead.createdAt}
- Último contato: ${input.lead.lastContactAt ?? 'nunca'}

Critérios: leads com orçamento definido (+20), telefone (+15), e-mail (+10), atividades recentes (+10 cada até 20), fonte whatsapp/portal (+10), negócio aberto (+15).
Retorne JSON: {"score": número, "reasoning": "explicação curta"}.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { score: input.lead.score ?? 0, reasoning: 'Erro ao calcular score' }
  }
}

// ── Property Search Interpreter ────────────────────────────────────────────────

export interface SearchFilters {
  type?: string
  purpose?: string
  bedrooms?: number
  minPrice?: number
  maxPrice?: number
  city?: string
  neighborhood?: string
  search?: string
}

export async function interpretSearchQuery(query: string): Promise<SearchFilters> {
  const client = getClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Você é um parser de busca imobiliária brasileiro. Interprete a busca abaixo, corrija erros de escrita e extraia todos os filtros possíveis.

Busca: "${query}"

REGRAS OBRIGATÓRIAS:

1. TIPO DO IMÓVEL — detecte mesmo abreviado ou errado:
   casa/casinha/cs → HOUSE
   apartamento/apto/ap/apartamen → APARTMENT
   terreno/lote/terra → LAND
   fazenda/sítio/sitio/chácara/chacara → FARM
   galpão/galpao/barracão → WAREHOUSE
   escritório/sala comercial → OFFICE
   loja/ponto comercial → STORE
   cobertura/penthouse → PENTHOUSE
   kitnet/kitinete/studio/quitinete → KITNET

2. FINALIDADE — detecte mesmo informal:
   venda/vender/comprar/compro/a venda/vendo → SALE
   aluguel/alugar/aluga/alugando/locação/locar → RENT
   temporada/veraneio → SEASON

3. QUARTOS — qualquer número seguido de: quartos/qts/q/dorms/dormitórios/suítes

4. PREÇO — converta SEMPRE para número inteiro (sem R$, sem pontos):
   "500 mil" → 500000
   "1 milhão" / "1 mi" → 1000000
   "250k" → 250000
   "800 mil reais" → 800000
   "até X" / "no maximo X" / "max X" → maxPrice
   "a partir de X" / "minimo X" / "de X" → minPrice
   faixa "de X a Y" / "entre X e Y" → minPrice + maxPrice

5. CIDADE — identifique qualquer cidade brasileira mencionada, mesmo com erros de grafia. Corrija o nome para a grafia correta:
   "guarulhos" → "Guarulhos"
   "s paulo" / "sp" / "são paulo" → "São Paulo"
   "rj" / "rio" → "Rio de Janeiro"
   "campinas" → "Campinas"
   Corrija o nome da cidade para a grafia correta em português.

6. BAIRRO — se mencionado, extraia no campo neighborhood

7. CARACTERÍSTICAS EXTRAS — coloque em search (piscina, varanda, churrasqueira, condomínio, etc.)

EXEMPLOS:
"guarulhos ate 500 mil" → {"city":"Guarulhos","maxPrice":500000,"search":""}
"apto 3 qts aluguel sp 2000 reais" → {"type":"APARTMENT","purpose":"RENT","bedrooms":3,"city":"São Paulo","maxPrice":2000,"search":""}
"casa franca 2 quartos" → {"type":"HOUSE","bedrooms":2,"city":"Franca","search":""}
"kitnet alugar" → {"type":"KITNET","purpose":"RENT","search":""}
"imovel com piscina guarulhos" → {"city":"Guarulhos","search":"piscina"}
"fazenda riberao preto ate 2 mi" → {"type":"FARM","city":"Ribeirão Preto","maxPrice":2000000,"search":""}

IMPORTANTE: Seja agressivo na extração. Prefira extrair um campo com confiança média a não extrair nada. Se não há campo search útil, retorne "".

Retorne SOMENTE JSON válido, sem markdown, sem explicação.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { search: query }
  }
}

// ── Análise qualitativa de mercado para endpoint de avaliação ────────────────

export async function analyzarMercado(params: {
  cidade: string
  tipo: string
  finalidade?: string
  area: number
  quartos?: number
  mediaM2: number
  valorEstimado: number
  totalComparaveis: number
}): Promise<string> {
  const client = getClient()

  const { cidade, tipo, finalidade, area, quartos, mediaM2, valorEstimado, totalComparaveis } = params

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Você é um corretor imobiliário especialista. Analise brevemente o mercado para este imóvel em 2-3 frases diretas em português:

Imóvel: ${tipo} em ${cidade}${quartos ? `, ${quartos} quartos` : ''}, ${area}m²
Finalidade: ${finalidade === 'RENT' ? 'Aluguel' : 'Venda'}
Preço médio/m² na região: R$ ${mediaM2.toLocaleString('pt-BR')}/m²
Valor estimado: R$ ${valorEstimado.toLocaleString('pt-BR')}
Comparáveis encontrados: ${totalComparaveis}

Responda com análise objetiva do mercado, tendência de preços e dica para o proprietário. Máximo 3 frases.`,
      },
    ],
  })

  return (response.content[0] as any).text ?? ''
}

// ── Document Generator ────────────────────────────────────────────────────────

export interface DocumentGenerateInput {
  templateId: string
  templateContent: string  // the template HTML/text structure
  formData: Record<string, string>
  userInstructions: string
  previousHtml?: string  // existing document HTML for correction/refinement requests
  images?: Array<{ base64: string; mediaType: string; description: string }>
}

export interface DocumentGenerateResult {
  html: string
  title: string
  suggestedFilename: string
}

export async function generateDocument(input: DocumentGenerateInput): Promise<DocumentGenerateResult> {
  const client = getClient()

  const systemPrompt = `Você é um assistente jurídico especializado em documentos imobiliários da Imobiliária Lemos.
Sua tarefa é gerar documentos profissionais em HTML completo, pronto para impressão em A4.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS HTML válido, sem markdown, sem explicações
2. Use o template fornecido como base estrutural
3. Preencha todos os campos com os dados fornecidos
4. Onde não houver dados, use _____________________ (linha em branco para preenchimento manual)
5. Mantenha linguagem jurídica formal
6. O HTML deve ter CSS inline para impressão A4 profissional
7. Use o cabeçalho padrão da Imobiliária Lemos

CABEÇALHO PADRÃO:
- Nome: IMOBILIÁRIA LEMOS
- Endereço: Rua Simão Caleiro, 2383 · Vila França · Franca/SP · CEP 14401-155
- Telefone: (16) 3723-0045
- CRECI: 61053-F
- Responsável: Noêmia Pires Lemos da Silva

ESTILO CSS A4:
- Fonte: Arial, tamanho 11-12pt
- Margens: 2cm todos os lados
- Linha de assinatura: borda inferior simples, 8cm de largura
- Cabeçalho azul marinho (#1B2B5B)
- Títulos em negrito, centralizados

Retorne o HTML completo começando com <!DOCTYPE html>`

  const userContent: any[] = []

  // Add images if provided
  if (input.images?.length) {
    for (const img of input.images) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
      })
      userContent.push({ type: 'text', text: `Imagem acima: ${img.description}` })
    }
  }

  if (input.previousHtml) {
    // Correction mode: include a snippet of the existing document for context
    const htmlSnippet = input.previousHtml.length > 3000
      ? input.previousHtml.slice(0, 3000) + '\n... [documento continua] ...'
      : input.previousHtml

    userContent.push({
      type: 'text',
      text: `DOCUMENTO ATUAL (que deve ser CORRIGIDO conforme instrução do usuário):
${htmlSnippet}

INSTRUÇÃO DE CORREÇÃO DO USUÁRIO:
${input.userInstructions}

DADOS ATUALIZADOS:
${Object.entries(input.formData).map(([k, v]) => `${k}: ${v}`).join('\n')}

Aplique as correções solicitadas e retorne o documento HTML completo atualizado.`,
    })
  } else {
    userContent.push({
      type: 'text',
      text: `TEMPLATE BASE:
${input.templateContent}

DADOS FORNECIDOS:
${Object.entries(input.formData).map(([k, v]) => `${k}: ${v}`).join('\n')}

INSTRUÇÕES ADICIONAIS:
${input.userInstructions}

Gere o documento HTML completo seguindo o template e preenchendo com os dados acima.`,
    })
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const html = response.content[0].type === 'text' ? response.content[0].text : '<p>Erro ao gerar documento</p>'

  // Extract title from first heading
  const titleMatch = html.match(/<h[12][^>]*>([^<]+)<\/h[12]>/i)
  const title = titleMatch ? titleMatch[1].trim() : input.templateId.replace(/-/g, ' ').toUpperCase()

  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  const suggestedFilename = `${title.toLowerCase().replace(/\s+/g, '_')}_${date}.html`

  return { html, title, suggestedFilename }
}

// ── Document identification from natural language ─────────────────────────────

export interface DocumentIdentifyInput {
  text: string
  templateIds: string[]  // list of available template IDs to choose from
  images?: Array<{ base64: string; mediaType: string }>
}

export interface DocumentIdentifyResult {
  templateId: string
  confidence: number         // 0-100
  extractedData: Record<string, string>
  reasoning: string
}

export async function identifyDocument(input: DocumentIdentifyInput): Promise<DocumentIdentifyResult> {
  const client = getClient()

  const systemPrompt = `Você é um especialista em documentos imobiliários da Imobiliária Lemos.
Sua tarefa é:
1. Identificar qual tipo de documento o usuário quer criar com base no texto/descrição
2. Extrair todos os dados mencionados (nomes, CPFs, endereços, valores, datas, etc.)
3. Se imagens forem fornecidas, extrair dados dos documentos fotografados (RG, CPF, comprovante de residência, etc.)

TEMPLATES DISPONÍVEIS:
${input.templateIds.join('\n')}

Retorne APENAS um JSON válido com esta estrutura:
{
  "templateId": "id-do-template-identificado",
  "confidence": 85,
  "extractedData": {
    "nome_campo": "valor_extraido"
  },
  "reasoning": "Breve explicação de por que escolheu este template"
}

Para os campos extraídos, use EXATAMENTE os nomes de campos dos templates:

LOCAÇÃO (contrato-locacao-*):
- locador_nome, locador_cpf, locador_rg, locador_estado_civil, locador_endereco
- locatario_nome, locatario_cpf, locatario_rg, locatario_nascimento, locatario_profissao, locatario_estado_civil, locatario_endereco_atual
- imovel_endereco, imovel_bairro, imovel_descricao, valor_aluguel, dia_vencimento
- data_inicio, data_fim, garantia_tipo, fiador_nome, fiador_cpf, fiador_rg, fiador_estado_civil, fiador_endereco
- data_assinatura, observacoes

VENDA (compromisso-compra-venda, carta-desistencia):
- vendedor_nome, vendedor_cpf, vendedor_rg, vendedor_estado_civil, vendedor_endereco
- comprador_nome, comprador_cpf, comprador_rg, comprador_estado_civil, comprador_endereco
- imovel_endereco, imovel_matricula, imovel_descricao, valor_venda, data_assinatura

FICHA CADASTRAL PESSOA FÍSICA (ficha-cadastral-pf):
- finalidade, nome_completo, data_nascimento, naturalidade, nacionalidade, estado_civil
- conjuge_nome, conjuge_cpf, conjuge_rg
- cpf, rg, rg_orgao, rg_data, profissao, empresa_nome, empresa_cnpj, renda_mensal
- endereco_atual, tel_residencial, tel_celular, email

NOTIFICAÇÃO/AVISO (aviso-nao-renovacao, comunicado-desocupacao, notificacao-*):
- destinatario_nome, destinatario_cpf, destinatario_endereco
- imovel_endereco, assunto, mensagem, prazo, data_documento

VISTORIA/ENTREGA (termo-entrega-chaves, laudo-vistoria):
- locador_nome, locatario_nome, imovel_endereco, data_vistoria, condicoes_gerais, observacoes

ADMINISTRATIVO (protocolo-documentos, regulamento-condominio, folha-rosto):
- nome, cpf, endereco, data, descricao, observacoes`

  const userContent: any[] = []

  if (input.images?.length) {
    for (const img of input.images) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
      })
    }
    userContent.push({ type: 'text', text: 'Extraia os dados das imagens acima (documentos pessoais, comprovantes, etc.)' })
  }

  userContent.push({
    type: 'text',
    text: `Texto do usuário: "${input.text}"\n\nIdentifique o tipo de documento e extraia todos os dados mencionados. Retorne apenas o JSON.`,
  })

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'

  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0]) as DocumentIdentifyResult
  } catch {
    return {
      templateId: input.templateIds[0] ?? 'contrato-locacao-residencial',
      confidence: 30,
      extractedData: {},
      reasoning: 'Não foi possível identificar o documento com precisão.',
    }
  }
}
