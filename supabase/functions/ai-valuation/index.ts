import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValuationRequest {
  imovel_id?: string
  endereco?: string
  tipo: string
  finalidade?: string
  cidade?: string
  bairro?: string
  area: number
  quartos?: number
  suites?: number
  banheiros?: number
  vagas?: number
  amenidades?: string[]
  descricao?: string
  solicitado_por?: string
}

interface ComparableProperty {
  id: string
  codigo: string
  titulo: string
  preco: number
  area_total: number
  quartos: number
  bairro: string
  cidade: string
  preco_m2: number
  finalidade: string
  status: string
}

interface ValuationResult {
  preco_sugerido_min: number
  preco_sugerido_max: number
  preco_recomendado: number
  preco_medio_m2: number
  total_comparaveis: number
  comparaveis: ComparableProperty[]
  analise_mercado: string
  tendencia_mercado: 'alta' | 'estavel' | 'queda'
  tempo_estimado_venda_meses: number
  fatores_valorizacao: string[]
  fatores_desvalorizacao: string[]
  notas_corretor: string
  metodologia: string
  gerado_em: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json() as ValuationRequest

    if (!body.tipo || !body.area || body.area <= 0) {
      return new Response(
        JSON.stringify({ error: 'Fields tipo and area (> 0) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const cidade = body.cidade ?? 'Franca'
    const finalidade = body.finalidade ?? 'venda'

    // Step 1: Fetch comparable properties from the database
    let comparablesQuery = supabaseClient
      .from('properties')
      .select('id, codigo, titulo, preco, area_total, quartos, bairro, cidade, finalidade, status')
      .eq('tipo', body.tipo)
      .eq('finalidade', finalidade)
      .ilike('cidade', `%${cidade}%`)
      .in('status', ['disponivel', 'vendido', 'locado'])
      .gt('area_total', 0)
      .limit(30)

    // Narrow by bairro if provided (prefer nearby)
    if (body.bairro) {
      const { data: bairroComparables } = await supabaseClient
        .from('properties')
        .select('id, codigo, titulo, preco, area_total, quartos, bairro, cidade, finalidade, status')
        .eq('tipo', body.tipo)
        .eq('finalidade', finalidade)
        .ilike('cidade', `%${cidade}%`)
        .ilike('bairro', `%${body.bairro}%`)
        .in('status', ['disponivel', 'vendido', 'locado'])
        .gt('area_total', 0)
        .limit(15)

      if (bairroComparables && bairroComparables.length >= 3) {
        // Use neighborhood-specific comparables if we have enough
        const processedComparables = processComparables(bairroComparables as any[], body.area)
        const result = await generateValuation(
          body, processedComparables, cidade, finalidade, supabaseClient
        )
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Fallback: use city-wide comparables
    const { data: cityComparables, error: dbError } = await comparablesQuery

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    const processedComparables = processComparables((cityComparables ?? []) as any[], body.area)
    const result = await generateValuation(
      body, processedComparables, cidade, finalidade, supabaseClient
    )

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('ai-valuation error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function processComparables(raw: any[], targetArea: number): ComparableProperty[] {
  return raw
    .filter((c: any) => c.area_total && c.area_total > 0 && c.preco && c.preco > 0)
    .map((c: any) => ({
      id: c.id,
      codigo: c.codigo,
      titulo: c.titulo,
      preco: c.preco,
      area_total: c.area_total,
      quartos: c.quartos ?? 0,
      bairro: c.bairro ?? '',
      cidade: c.cidade ?? '',
      preco_m2: Math.round(c.preco / c.area_total),
      finalidade: c.finalidade,
      status: c.status,
    }))
    // Sort by area similarity to target
    .sort((a: any, b: any) => Math.abs(a.area_total - targetArea) - Math.abs(b.area_total - targetArea))
    .slice(0, 15)
}

async function generateValuation(
  request: ValuationRequest,
  comparables: ComparableProperty[],
  cidade: string,
  finalidade: string,
  supabaseClient: ReturnType<typeof createClient>
): Promise<ValuationResult> {

  // Calculate statistical reference values
  const pricesPerM2 = comparables.map(c => c.preco_m2)
  const avgM2 = pricesPerM2.length > 0
    ? pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length
    : 3500 // Default Franca SP average

  const sortedM2 = [...pricesPerM2].sort((a, b) => a - b)
  const medianM2 = sortedM2.length > 0
    ? sortedM2[Math.floor(sortedM2.length / 2)]
    : avgM2

  // Statistical floor and ceiling
  const stdDev = pricesPerM2.length > 1
    ? Math.sqrt(pricesPerM2.reduce((sum, v) => sum + Math.pow(v - avgM2, 2), 0) / pricesPerM2.length)
    : avgM2 * 0.15

  const baseM2 = medianM2
  const estimatedMin = Math.round((baseM2 - stdDev * 0.5) * request.area / 1000) * 1000
  const estimatedMax = Math.round((baseM2 + stdDev * 0.5) * request.area / 1000) * 1000
  const estimatedRecommended = Math.round(baseM2 * request.area / 1000) * 1000

  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

  if (!anthropicApiKey) {
    // Return statistical estimate without AI
    const result: ValuationResult = {
      preco_sugerido_min: estimatedMin,
      preco_sugerido_max: estimatedMax,
      preco_recomendado: estimatedRecommended,
      preco_medio_m2: Math.round(avgM2),
      total_comparaveis: comparables.length,
      comparaveis,
      analise_mercado: `Avaliação baseada em ${comparables.length} imóveis comparáveis em ${cidade}. Preço médio por m² de R$${Math.round(avgM2).toLocaleString('pt-BR')}.`,
      tendencia_mercado: 'estavel',
      tempo_estimado_venda_meses: 3,
      fatores_valorizacao: ['Localização em Franca SP', 'Mercado imobiliário em desenvolvimento'],
      fatores_desvalorizacao: [],
      notas_corretor: 'Avaliação estatística baseada em comparáveis. Recomenda-se vistoria presencial.',
      metodologia: 'Comparativo de mercado (sem IA)',
      gerado_em: new Date().toISOString(),
    }

    await saveValuation(request, result, supabaseClient)
    return result
  }

  const prompt = `Você é um avaliador imobiliário certificado especialista no mercado de Franca/SP e região.
Analise os dados e forneça uma avaliação detalhada de preço de mercado.

IMÓVEL A AVALIAR:
- Tipo: ${request.tipo}
- Finalidade: ${finalidade === 'venda' ? 'Venda' : 'Locação'}
- Cidade: ${cidade}
- Bairro: ${request.bairro ?? 'Não informado'}
- Endereço: ${request.endereco ?? 'Não informado'}
- Área total: ${request.area}m²
- Quartos: ${request.quartos ?? 'Não informado'}
- Suítes: ${request.suites ?? 'Não informado'}
- Banheiros: ${request.banheiros ?? 'Não informado'}
- Vagas: ${request.vagas ?? 'Não informado'}
- Amenidades: ${(request.amenidades ?? []).join(', ') || 'Não informadas'}
- Descrição: ${request.descricao ?? 'Não informada'}

IMÓVEIS COMPARÁVEIS NO MERCADO (${comparables.length} encontrados):
${JSON.stringify(comparables.slice(0, 10), null, 2)}

REFERÊNCIA ESTATÍSTICA:
- Preço médio/m²: R$ ${Math.round(avgM2).toLocaleString('pt-BR')}
- Preço mediano/m²: R$ ${Math.round(medianM2).toLocaleString('pt-BR')}
- Faixa estimada: R$ ${estimatedMin.toLocaleString('pt-BR')} a R$ ${estimatedMax.toLocaleString('pt-BR')}

Retorne APENAS um JSON válido com esta estrutura:
{
  "preco_sugerido_min": número em reais,
  "preco_sugerido_max": número em reais,
  "preco_recomendado": número em reais,
  "preco_medio_m2": número em reais por m²,
  "analise_mercado": "Análise de 3-4 frases sobre o mercado local e posicionamento do imóvel",
  "tendencia_mercado": "alta" ou "estavel" ou "queda",
  "tempo_estimado_venda_meses": número inteiro de meses,
  "fatores_valorizacao": ["fator 1", "fator 2", "fator 3"],
  "fatores_desvalorizacao": ["fator 1"] ou [],
  "notas_corretor": "Dica prática de 1-2 frases para o corretor sobre estratégia de preço",
  "metodologia": "Breve descrição da metodologia usada"
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
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!aiResponse.ok) {
    throw new Error(`Anthropic API error: ${aiResponse.status}`)
  }

  const aiData = await aiResponse.json()
  const content = aiData.content?.[0]?.text ?? ''
  const jsonMatch = content.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON')
  }

  const aiResult = JSON.parse(jsonMatch[0])

  const result: ValuationResult = {
    preco_sugerido_min: aiResult.preco_sugerido_min,
    preco_sugerido_max: aiResult.preco_sugerido_max,
    preco_recomendado: aiResult.preco_recomendado,
    preco_medio_m2: aiResult.preco_medio_m2,
    total_comparaveis: comparables.length,
    comparaveis,
    analise_mercado: aiResult.analise_mercado,
    tendencia_mercado: aiResult.tendencia_mercado,
    tempo_estimado_venda_meses: aiResult.tempo_estimado_venda_meses,
    fatores_valorizacao: aiResult.fatores_valorizacao ?? [],
    fatores_desvalorizacao: aiResult.fatores_desvalorizacao ?? [],
    notas_corretor: aiResult.notas_corretor,
    metodologia: aiResult.metodologia ?? 'Análise comparativa de mercado com IA',
    gerado_em: new Date().toISOString(),
  }

  await saveValuation(request, result, supabaseClient)
  return result
}

async function saveValuation(
  request: ValuationRequest,
  result: ValuationResult,
  supabaseClient: ReturnType<typeof createClient>
): Promise<void> {
  try {
    await supabaseClient.from('property_valuations').insert({
      imovel_id: request.imovel_id ?? null,
      endereco: request.endereco ?? null,
      tipo: request.tipo,
      area: request.area,
      preco_sugerido_min: result.preco_sugerido_min,
      preco_sugerido_max: result.preco_sugerido_max,
      preco_medio_m2: result.preco_medio_m2,
      comparaveis: result.comparaveis,
      analise_ia: result.analise_mercado,
      solicitado_por: request.solicitado_por ?? null,
    })
  } catch (e) {
    console.error('Failed to save valuation:', e)
  }
}
