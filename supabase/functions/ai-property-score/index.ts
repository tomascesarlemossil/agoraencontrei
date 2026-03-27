import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyData {
  id?: string
  titulo?: string
  tipo?: string
  finalidade?: string
  status?: string
  preco?: number
  preco_condominio?: number
  preco_iptu?: number
  descricao?: string
  bairro?: string
  cidade?: string
  estado?: string
  area_total?: number
  area_construida?: number
  quartos?: number
  suites?: number
  banheiros?: number
  vagas?: number
  piscina?: boolean
  churrasqueira?: boolean
  academia?: boolean
  salao_festas?: boolean
  playground?: boolean
  portaria_24h?: boolean
  elevador?: boolean
  condominio_fechado?: boolean
  fibra_optica?: boolean
  ar_condicionado?: boolean
  aquecimento_solar?: boolean
  pet_friendly?: boolean
  mobiliado?: boolean
  destaque?: boolean
  fotos?: unknown[]
}

interface ScoreBreakdown {
  localizacao: number
  preco: number
  caracteristicas: number
  amenidades: number
  documentacao: number
  potencial_investimento: number
}

interface ScoreResult {
  score_total: number
  breakdown: ScoreBreakdown
  analise_texto: string
  pontos_fortes: string[]
  pontos_fracos: string[]
  roi_estimado_anual: number | null
  tempo_estimado_venda_meses: number | null
  recomendacao: string
  gerado_em: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { property_id, property_data } = await req.json() as {
      property_id?: string
      property_data?: PropertyData
    }

    if (!property_id && !property_data) {
      return new Response(
        JSON.stringify({ error: 'Either property_id or property_data must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let property: PropertyData

    // Fetch property from database if only ID was provided
    if (property_id) {
      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('id', property_id)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Property not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      property = data as PropertyData
    } else {
      property = property_data!
    }

    // Fetch comparable properties for context (same city, same type, available)
    const { data: comparables } = await supabaseClient
      .from('properties')
      .select('preco, area_total, quartos, bairro, tipo, finalidade, status')
      .eq('cidade', property.cidade ?? 'Franca')
      .eq('tipo', property.tipo ?? 'casa')
      .eq('finalidade', property.finalidade ?? 'venda')
      .eq('status', 'disponivel')
      .neq('id', property.id ?? '')
      .limit(20)

    // Calculate price per m² for market context
    const pricePerM2List = (comparables ?? [])
      .filter((c: any) => c.area_total && c.area_total > 0)
      .map((c: any) => c.preco / c.area_total)

    const avgPricePerM2 = pricePerM2List.length > 0
      ? pricePerM2List.reduce((a: number, b: number) => a + b, 0) / pricePerM2List.length
      : null

    const propertyPricePerM2 = property.area_total && property.area_total > 0
      ? (property.preco ?? 0) / property.area_total
      : null

    // Prepare context for AI analysis
    const propertyContext = {
      tipo: property.tipo,
      finalidade: property.finalidade,
      preco: property.preco,
      preco_condominio: property.preco_condominio,
      preco_iptu: property.preco_iptu,
      cidade: property.cidade,
      bairro: property.bairro,
      estado: property.estado,
      area_total: property.area_total,
      area_construida: property.area_construida,
      quartos: property.quartos,
      suites: property.suites,
      banheiros: property.banheiros,
      vagas: property.vagas,
      amenidades: {
        piscina: property.piscina,
        churrasqueira: property.churrasqueira,
        academia: property.academia,
        salao_festas: property.salao_festas,
        playground: property.playground,
        portaria_24h: property.portaria_24h,
        elevador: property.elevador,
        condominio_fechado: property.condominio_fechado,
        fibra_optica: property.fibra_optica,
        ar_condicionado: property.ar_condicionado,
        aquecimento_solar: property.aquecimento_solar,
        pet_friendly: property.pet_friendly,
        mobiliado: property.mobiliado,
      },
      total_fotos: Array.isArray(property.fotos) ? property.fotos.length : 0,
    }

    const marketContext = {
      total_comparaveis: comparables?.length ?? 0,
      preco_medio_m2_mercado: avgPricePerM2 ? Math.round(avgPricePerM2) : null,
      preco_m2_imovel: propertyPricePerM2 ? Math.round(propertyPricePerM2) : null,
      posicao_preco: avgPricePerM2 && propertyPricePerM2
        ? propertyPricePerM2 < avgPricePerM2 * 0.9
          ? 'abaixo_mercado'
          : propertyPricePerM2 > avgPricePerM2 * 1.1
          ? 'acima_mercado'
          : 'alinhado_mercado'
        : 'sem_referencia',
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      // Return a calculated score without AI if API key is not available
      const fallbackScore = calculateFallbackScore(property, marketContext)
      return new Response(
        JSON.stringify(fallbackScore),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Você é um especialista em mercado imobiliário brasileiro, especialmente na cidade de Franca, SP.
Analise este imóvel e forneça uma pontuação de investimento de 0 a 10 com análise detalhada.

DADOS DO IMÓVEL:
${JSON.stringify(propertyContext, null, 2)}

CONTEXTO DE MERCADO:
${JSON.stringify(marketContext, null, 2)}

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "score_total": número de 0.0 a 10.0 com 1 casa decimal,
  "breakdown": {
    "localizacao": número de 0 a 10 (qualidade do bairro, proximidade a serviços),
    "preco": número de 0 a 10 (relação preço vs mercado),
    "caracteristicas": número de 0 a 10 (quartos, área, suítes, vagas),
    "amenidades": número de 0 a 10 (piscina, churrasqueira, portaria, etc),
    "documentacao": número de 0 a 10 (baseado na completude dos dados disponíveis),
    "potencial_investimento": número de 0 a 10 (valorização esperada, liquidez)
  },
  "analise_texto": "Parágrafo de 3-4 frases analisando o imóvel como investimento",
  "pontos_fortes": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "pontos_fracos": ["ponto fraco 1", "ponto fraco 2"],
  "roi_estimado_anual": número percentual de retorno anual estimado (para locação) ou null,
  "tempo_estimado_venda_meses": número de meses estimados para vender ou null,
  "recomendacao": "COMPRAR" | "AGUARDAR" | "NEGOCIAR" | "ALUGAR"
}`

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      throw new Error(`Anthropic API error: ${aiResponse.status} - ${errorText}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.content?.[0]?.text ?? ''

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON')
    }

    const scoreResult: ScoreResult = JSON.parse(jsonMatch[0])
    scoreResult.gerado_em = new Date().toISOString()

    // Save score back to property record if we have an ID
    if (property_id) {
      const { error: updateError } = await supabaseClient
        .from('properties')
        .update({
          investment_score: scoreResult.score_total,
          investment_analysis: {
            breakdown: scoreResult.breakdown,
            pontos_fortes: scoreResult.pontos_fortes,
            pontos_fracos: scoreResult.pontos_fracos,
            roi_estimado_anual: scoreResult.roi_estimado_anual,
            tempo_estimado_venda_meses: scoreResult.tempo_estimado_venda_meses,
            recomendacao: scoreResult.recomendacao,
            analise_texto: scoreResult.analise_texto,
            mercado: marketContext,
            gerado_em: scoreResult.gerado_em,
          }
        })
        .eq('id', property_id)

      if (updateError) {
        console.error('Failed to save score to database:', updateError.message)
      }
    }

    return new Response(
      JSON.stringify({
        ...scoreResult,
        market_context: marketContext,
        property_id: property_id ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('ai-property-score error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateFallbackScore(property: PropertyData, marketContext: any): ScoreResult {
  // Rule-based fallback scoring when AI is unavailable
  let localizacao = 5.0
  let preco = 5.0
  let caracteristicas = 5.0
  let amenidades = 5.0
  let documentacao = 5.0
  let potencial = 5.0

  // Location scoring by neighborhood
  const nobreNeighborhoods = ['jardim paulistano', 'jardim america', 'jardim consolação', 'jardim consolacao', 'centro']
  const bairroLower = (property.bairro ?? '').toLowerCase()
  if (nobreNeighborhoods.some(n => bairroLower.includes(n))) {
    localizacao = 8.0
  } else if (bairroLower.includes('jardim') || bairroLower.includes('vila')) {
    localizacao = 6.5
  }

  // Price scoring vs market
  if (marketContext.posicao_preco === 'abaixo_mercado') preco = 8.5
  else if (marketContext.posicao_preco === 'alinhado_mercado') preco = 7.0
  else if (marketContext.posicao_preco === 'acima_mercado') preco = 4.5

  // Characteristics scoring
  const quartos = property.quartos ?? 0
  const suites = property.suites ?? 0
  const vagas = property.vagas ?? 0
  const area = property.area_total ?? 0
  if (quartos >= 3) caracteristicas += 1
  if (suites >= 1) caracteristicas += 0.5
  if (vagas >= 2) caracteristicas += 0.5
  if (area >= 200) caracteristicas += 1
  caracteristicas = Math.min(10, caracteristicas)

  // Amenities scoring
  const amenitiesCount = [
    property.piscina, property.churrasqueira, property.academia,
    property.salao_festas, property.portaria_24h, property.elevador,
    property.condominio_fechado, property.ar_condicionado, property.aquecimento_solar
  ].filter(Boolean).length
  amenidades = Math.min(10, 4 + amenitiesCount * 0.7)

  // Documentation scoring based on data completeness
  const fields = [
    property.descricao, property.cep ?? property.rua,
    property.area_total, property.quartos,
    Array.isArray(property.fotos) && property.fotos.length > 0
  ]
  const completeness = fields.filter(Boolean).length / fields.length
  documentacao = 4 + completeness * 6

  // Investment potential
  if (property.finalidade === 'locacao') {
    potencial = 7.0 // Rental properties have steady returns
  } else if (nobreNeighborhoods.some(n => bairroLower.includes(n))) {
    potencial = 8.0
  }

  const scoreTotal = (localizacao + preco + caracteristicas + amenidades + documentacao + potencial) / 6
  const roundedScore = Math.round(scoreTotal * 10) / 10

  return {
    score_total: roundedScore,
    breakdown: {
      localizacao: Math.round(localizacao * 10) / 10,
      preco: Math.round(preco * 10) / 10,
      caracteristicas: Math.round(caracteristicas * 10) / 10,
      amenidades: Math.round(amenidades * 10) / 10,
      documentacao: Math.round(documentacao * 10) / 10,
      potencial_investimento: Math.round(potencial * 10) / 10,
    },
    analise_texto: `Imóvel localizado em ${property.bairro ?? 'bairro não informado'}, ${property.cidade ?? 'Franca'}/SP. Score calculado automaticamente com base nas características e dados de mercado disponíveis.`,
    pontos_fortes: [
      ...(property.piscina ? ['Possui piscina'] : []),
      ...(property.condominio_fechado ? ['Condomínio fechado com segurança'] : []),
      ...((property.quartos ?? 0) >= 3 ? [`${property.quartos} quartos`] : []),
    ],
    pontos_fracos: [
      ...(marketContext.posicao_preco === 'acima_mercado' ? ['Preço acima da média do mercado local'] : []),
      ...(!(Array.isArray(property.fotos) && property.fotos.length > 0) ? ['Sem fotos cadastradas'] : []),
    ],
    roi_estimado_anual: property.finalidade === 'locacao' ? 6.5 : null,
    tempo_estimado_venda_meses: property.finalidade === 'venda' ? 4 : null,
    recomendacao: preco >= 7 ? 'COMPRAR' : preco >= 5 ? 'NEGOCIAR' : 'AGUARDAR',
    gerado_em: new Date().toISOString(),
  }
}
