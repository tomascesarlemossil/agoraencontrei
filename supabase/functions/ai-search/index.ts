import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchFilters {
  tipo?: string
  finalidade?: string
  preco_min?: number
  preco_max?: number
  quartos_min?: number
  cidade?: string
  bairro?: string
  status?: string
  amenidades?: string[]
}

interface ParsedAIFilters {
  tipo?: string | null
  finalidade?: 'venda' | 'locacao' | null
  quartos_min?: number | null
  preco_max?: number | null
  preco_min?: number | null
  cidade?: string | null
  bairro?: string | null
  amenidades?: string[]
  search_terms?: string
  corrected_query?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, filters, page = 1, limit = 12 } = await req.json() as {
      query?: string
      filters?: SearchFilters
      page?: number
      limit?: number
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let parsedFilters: ParsedAIFilters = {}

    // Parse natural language query using Claude if query is provided
    if (query && query.trim().length > 0) {
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (anthropicApiKey) {
        try {
          const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 600,
              system: 'You are a real estate search parser for a Brazilian real estate CRM. Parse search queries and return JSON only, no explanation.',
              messages: [{
                role: 'user',
                content: `Parse this Brazilian real estate search query and extract structured filters. Return ONLY valid JSON, nothing else.

Query: "${query}"

Valid property types (tipo): casa, apartamento, terreno, chacara, comercial, sala, galpao, studio, cobertura, flat
Valid purposes (finalidade): venda, locacao, temporada

Return this exact JSON structure:
{
  "tipo": string or null,
  "finalidade": "venda" or "locacao" or "temporada" or null,
  "quartos_min": number or null,
  "preco_max": number or null,
  "preco_min": number or null,
  "cidade": string or null,
  "bairro": string or null,
  "amenidades": array of strings (e.g. ["piscina", "churrasqueira"]),
  "search_terms": "key search words extracted from query",
  "corrected_query": "corrected and normalized version of the query in Portuguese"
}`
              }]
            })
          })

          if (aiResponse.ok) {
            const aiData = await aiResponse.json()
            const content = aiData.content?.[0]?.text ?? ''
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                parsedFilters = JSON.parse(jsonMatch[0]) as ParsedAIFilters
              } catch {
                // JSON parse failed, use empty filters
                parsedFilters = {}
              }
            }
          }
        } catch (aiError) {
          // AI parsing failed, continue with manual filters only
          console.error('AI parsing error:', aiError)
        }
      }
    }

    // Build Supabase query
    let dbQuery = supabaseClient
      .from('properties')
      .select(`
        id,
        codigo,
        titulo,
        tipo,
        finalidade,
        status,
        preco,
        preco_negociavel,
        preco_condominio,
        bairro,
        cidade,
        estado,
        area_total,
        area_construida,
        quartos,
        suites,
        banheiros,
        vagas,
        piscina,
        churrasqueira,
        jardim,
        varanda,
        sacada,
        ar_condicionado,
        pet_friendly,
        mobiliado,
        condominio_fechado,
        foto_principal,
        fotos,
        destaque,
        visualizacoes,
        favoritos,
        slug,
        investment_score,
        created_at
      `, { count: 'exact' })

    // Status filter: default to 'disponivel' for public searches
    const statusFilter = filters?.status ?? 'disponivel'
    dbQuery = dbQuery.eq('status', statusFilter)

    // Apply AI-extracted filters (with manual filter override)
    const tipoFilter = filters?.tipo ?? parsedFilters.tipo
    if (tipoFilter) {
      dbQuery = dbQuery.eq('tipo', tipoFilter)
    }

    const finalidadeFilter = filters?.finalidade ?? parsedFilters.finalidade
    if (finalidadeFilter) {
      dbQuery = dbQuery.eq('finalidade', finalidadeFilter)
    }

    const quartosMinFilter = filters?.quartos_min ?? parsedFilters.quartos_min
    if (quartosMinFilter) {
      dbQuery = dbQuery.gte('quartos', quartosMinFilter)
    }

    const precoMaxFilter = filters?.preco_max ?? parsedFilters.preco_max
    if (precoMaxFilter) {
      dbQuery = dbQuery.lte('preco', precoMaxFilter)
    }

    const precoMinFilter = filters?.preco_min ?? parsedFilters.preco_min
    if (precoMinFilter) {
      dbQuery = dbQuery.gte('preco', precoMinFilter)
    }

    // City filter (manual takes precedence)
    const cidadeFilter = filters?.cidade ?? parsedFilters.cidade
    if (cidadeFilter) {
      dbQuery = dbQuery.ilike('cidade', `%${cidadeFilter}%`)
    }

    // Neighborhood filter (manual takes precedence)
    const bairroFilter = filters?.bairro ?? parsedFilters.bairro
    if (bairroFilter) {
      dbQuery = dbQuery.ilike('bairro', `%${bairroFilter}%`)
    }

    // Amenities filter from AI (boolean fields)
    const amenidades = parsedFilters.amenidades ?? []
    for (const amenidade of amenidades) {
      const normalizedAmenidade = amenidade.toLowerCase().replace(/[^a-z_]/g, '')
      // Map common amenity names to database columns
      const amenityMap: Record<string, string> = {
        piscina: 'piscina',
        churrasqueira: 'churrasqueira',
        jardim: 'jardim',
        varanda: 'varanda',
        sacada: 'sacada',
        academia: 'academia',
        elevador: 'elevador',
        portaria: 'portaria_24h',
        pet: 'pet_friendly',
        mobiliado: 'mobiliado',
        condominio_fechado: 'condominio_fechado',
        ar_condicionado: 'ar_condicionado',
        alarme: 'alarme',
        cameras: 'cameras',
        piscina_aquecida: 'aquecimento_solar',
      }
      const column = amenityMap[normalizedAmenidade]
      if (column) {
        dbQuery = (dbQuery as any).eq(column, true)
      }
    }

    // Full-text search on titulo + descricao + bairro + cidade
    const searchTerms = parsedFilters.search_terms
    if (searchTerms && searchTerms.trim().length > 0) {
      // Use websearch mode for better natural language handling
      try {
        dbQuery = dbQuery.textSearch(
          'titulo',
          searchTerms,
          { type: 'websearch', config: 'portuguese' }
        )
      } catch {
        // Text search failed (e.g., invalid tokens), skip it
      }
    } else if (query && query.trim().length > 0 && Object.keys(parsedFilters).length === 0) {
      // Fallback: use raw query for text search if AI parsing returned nothing
      try {
        dbQuery = dbQuery.textSearch(
          'titulo',
          query,
          { type: 'websearch', config: 'portuguese' }
        )
      } catch {
        // Ignore text search errors
      }
    }

    // Pagination
    const offset = (page - 1) * limit
    dbQuery = dbQuery
      .range(offset, offset + limit - 1)
      .order('destaque', { ascending: false })
      .order('investment_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    const { data, count, error } = await dbQuery

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Increment view counts asynchronously (fire and forget)
    if (data && data.length > 0) {
      const ids = data.map((p: any) => p.id)
      supabaseClient.rpc('increment_property_views', { property_ids: ids }).then(() => {}).catch(() => {})
    }

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / limit)

    return new Response(
      JSON.stringify({
        properties: data ?? [],
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        correctedQuery: parsedFilters.corrected_query ?? null,
        parsedFilters: {
          tipo: parsedFilters.tipo ?? null,
          finalidade: parsedFilters.finalidade ?? null,
          quartos_min: parsedFilters.quartos_min ?? null,
          preco_min: parsedFilters.preco_min ?? null,
          preco_max: parsedFilters.preco_max ?? null,
          cidade: parsedFilters.cidade ?? null,
          bairro: parsedFilters.bairro ?? null,
          amenidades: parsedFilters.amenidades ?? [],
        },
        query: query ?? null,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
