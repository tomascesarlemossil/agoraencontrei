const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { authenticate, optionalAuth } = require('../middleware/auth')

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

async function callAnthropic(systemPrompt, userMessage, maxTokens = 1024) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || apiKey === 'your-anthropic-api-key') {
    return null
  }

  const fetch = require('node-fetch')

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.content[0].text
}

// POST /api/ai/search - Intelligent property search
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' })
    }

    let searchParams = {
      search: query,
      limit,
      page: 1
    }

    let aiInterpretation = null

    // Try AI-powered query parsing
    const aiResponse = await callAnthropic(
      `Você é um assistente especializado em busca de imóveis no Brasil. Analise a consulta do usuário e extraia os parâmetros de busca.

      Retorne um JSON válido com os campos (use null para campos não mencionados):
      {
        "tipo": "apartamento|casa|comercial|terreno|rural|etc" ou null,
        "finalidade": "venda|locacao|temporada" ou null,
        "cidade": "nome da cidade" ou null,
        "bairro": "nome do bairro" ou null,
        "preco_min": número ou null,
        "preco_max": número ou null,
        "quartos": número ou null,
        "garagens": número ou null,
        "area_min": número ou null,
        "search": "termos de busca corrigidos ortograficamente",
        "resumo": "interpretação em português do que o usuário quer"
      }

      Corrija erros de ortografia. Interprete linguagem natural como "2 quartos perto da praia" ou "apartamento até 500 mil".`,
      query,
      512
    )

    if (aiResponse) {
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          aiInterpretation = parsed.resumo
          searchParams = {
            ...searchParams,
            tipo: parsed.tipo || undefined,
            finalidade: parsed.finalidade || undefined,
            cidade: parsed.cidade || undefined,
            bairro: parsed.bairro || undefined,
            preco_min: parsed.preco_min || undefined,
            preco_max: parsed.preco_max || undefined,
            quartos: parsed.quartos || undefined,
            garagens: parsed.garagens || undefined,
            area_min: parsed.area_min || undefined,
            search: parsed.search || query
          }
        }
      } catch (parseErr) {
        // Use original query if parsing fails
      }
    }

    // Build and execute the search
    const conditions = ["status != 'inativo'"]
    const params = []

    if (searchParams.search) {
      conditions.push('(titulo LIKE ? OR descricao LIKE ? OR bairro LIKE ? OR cidade LIKE ? OR codigo LIKE ?)')
      const s = `%${searchParams.search}%`
      params.push(s, s, s, s, s)
    }

    if (searchParams.tipo) {
      conditions.push('tipo = ?')
      params.push(searchParams.tipo)
    }

    if (searchParams.finalidade) {
      conditions.push('finalidade = ?')
      params.push(searchParams.finalidade)
    }

    if (searchParams.cidade) {
      conditions.push('cidade LIKE ?')
      params.push(`%${searchParams.cidade}%`)
    }

    if (searchParams.bairro) {
      conditions.push('bairro LIKE ?')
      params.push(`%${searchParams.bairro}%`)
    }

    if (searchParams.preco_min) {
      conditions.push('COALESCE(preco_venda, preco_locacao) >= ?')
      params.push(searchParams.preco_min)
    }

    if (searchParams.preco_max) {
      conditions.push('COALESCE(preco_venda, preco_locacao) <= ?')
      params.push(searchParams.preco_max)
    }

    if (searchParams.quartos) {
      conditions.push('quartos >= ?')
      params.push(searchParams.quartos)
    }

    if (searchParams.garagens) {
      conditions.push('garagens >= ?')
      params.push(searchParams.garagens)
    }

    if (searchParams.area_min) {
      conditions.push('COALESCE(area_util, area_construida) >= ?')
      params.push(searchParams.area_min)
    }

    const whereClause = conditions.join(' AND ')
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))

    const [properties] = await pool.execute(
      `SELECT
        id, codigo, titulo, tipo, finalidade, status,
        preco_venda, preco_locacao, preco_temporada,
        bairro, cidade, uf,
        quartos, suites, garagens, banheiros,
        area_util, area_construida,
        foto_principal, fotos, slug, destaque, visualizacoes
      FROM properties
      WHERE ${whereClause}
      ORDER BY destaque DESC, visualizacoes DESC
      LIMIT ${limitNum}`,
      params
    )

    const processed = properties.map(p => ({
      ...p,
      fotos: (() => {
        if (!p.fotos) return []
        if (typeof p.fotos === 'string') {
          try { return JSON.parse(p.fotos) } catch { return [] }
        }
        return p.fotos
      })()
    }))

    return res.json({
      properties: processed,
      total: processed.length,
      query: query,
      interpretation: aiInterpretation || `Buscando: "${query}"`,
      searchParams
    })
  } catch (err) {
    console.error('AI search error:', err)
    return res.status(500).json({ error: 'Erro na busca inteligente' })
  }
})

// POST /api/ai/property-score - Investment score
router.post('/property-score', optionalAuth, async (req, res) => {
  try {
    const { property_id, property } = req.body

    let propertyData = property

    if (property_id && !propertyData) {
      const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ? LIMIT 1', [property_id])
      if (!rows.length) {
        return res.status(404).json({ error: 'Imóvel não encontrado' })
      }
      propertyData = rows[0]
    }

    if (!propertyData) {
      return res.status(400).json({ error: 'Dados do imóvel são obrigatórios' })
    }

    const fallbackScore = {
      score: 7.5,
      classificacao: 'Bom',
      pontos_positivos: [
        'Imóvel bem localizado',
        'Preço compatível com o mercado',
        'Boa condição geral'
      ],
      pontos_atencao: [
        'Verificar documentação',
        'Avaliar infraestrutura do entorno'
      ],
      analise: 'Imóvel apresenta boas características para investimento. Recomenda-se verificação presencial.',
      recomendacao: 'Compra recomendada',
      potencial_valorizacao: 'Médio',
      liquidez: 'Média'
    }

    const aiResponse = await callAnthropic(
      `Você é um especialista em avaliação de imóveis e investimentos imobiliários no Brasil. Analise o imóvel fornecido e retorne uma pontuação de investimento.

      Retorne APENAS um JSON válido com esta estrutura:
      {
        "score": número de 0 a 10,
        "classificacao": "Excelente|Muito Bom|Bom|Regular|Ruim",
        "pontos_positivos": ["ponto1", "ponto2", "ponto3"],
        "pontos_atencao": ["ponto1", "ponto2"],
        "analise": "análise detalhada em 2-3 frases",
        "recomendacao": "Compra recomendada|Compra condicionada|Não recomendado",
        "potencial_valorizacao": "Alto|Médio|Baixo",
        "liquidez": "Alta|Média|Baixa"
      }`,
      `Analise este imóvel para investimento:
      - Tipo: ${propertyData.tipo || 'N/A'}
      - Finalidade: ${propertyData.finalidade || 'N/A'}
      - Cidade: ${propertyData.cidade || 'N/A'}, ${propertyData.uf || 'N/A'}
      - Bairro: ${propertyData.bairro || 'N/A'}
      - Preço de venda: R$ ${propertyData.preco_venda ? Number(propertyData.preco_venda).toLocaleString('pt-BR') : 'N/A'}
      - Preço de locação: R$ ${propertyData.preco_locacao ? Number(propertyData.preco_locacao).toLocaleString('pt-BR') : 'N/A'}
      - Área útil: ${propertyData.area_util || propertyData.area_construida || 'N/A'} m²
      - Quartos: ${propertyData.quartos || 'N/A'}
      - Suítes: ${propertyData.suites || 'N/A'}
      - Garagens: ${propertyData.garagens || 'N/A'}
      - Condomínio: R$ ${propertyData.preco_condominio ? Number(propertyData.preco_condominio).toLocaleString('pt-BR') : 'N/A'}/mês
      - IPTU: R$ ${propertyData.preco_iptu ? Number(propertyData.preco_iptu).toLocaleString('pt-BR') : 'N/A'}/ano
      - Descrição: ${propertyData.descricao ? propertyData.descricao.substring(0, 300) : 'N/A'}`,
      1024
    )

    if (!aiResponse) {
      return res.json({ score: fallbackScore, source: 'fallback' })
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const scoreData = JSON.parse(jsonMatch[0])
        return res.json({ score: scoreData, source: 'ai' })
      }
    } catch (e) {
      // fall through
    }

    return res.json({ score: fallbackScore, source: 'fallback' })
  } catch (err) {
    console.error('Property score error:', err)
    return res.status(500).json({ error: 'Erro ao calcular score do imóvel' })
  }
})

// POST /api/ai/valuation - Property valuation
router.post('/valuation', authenticate, async (req, res) => {
  try {
    const { property_id, property, comparable_count = 5 } = req.body

    let propertyData = property

    if (property_id && !propertyData) {
      const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ? LIMIT 1', [property_id])
      if (!rows.length) {
        return res.status(404).json({ error: 'Imóvel não encontrado' })
      }
      propertyData = rows[0]
    }

    if (!propertyData) {
      return res.status(400).json({ error: 'Dados do imóvel são obrigatórios' })
    }

    // Get comparables from database
    let comparables = []
    try {
      const conditions = ["status != 'inativo'"]
      const params = []

      if (propertyData.tipo) {
        conditions.push('tipo = ?')
        params.push(propertyData.tipo)
      }

      if (propertyData.cidade) {
        conditions.push('cidade = ?')
        params.push(propertyData.cidade)
      } else if (propertyData.uf) {
        conditions.push('uf = ?')
        params.push(propertyData.uf)
      }

      if (propertyData.id) {
        conditions.push('id != ?')
        params.push(propertyData.id)
      }

      const [rows] = await pool.execute(
        `SELECT titulo, tipo, finalidade, bairro, cidade, uf,
          preco_venda, preco_locacao, preco_m2,
          area_util, area_construida, quartos, garagens
        FROM properties
        WHERE ${conditions.join(' AND ')}
          AND (preco_venda IS NOT NULL OR preco_locacao IS NOT NULL)
        ORDER BY RAND()
        LIMIT ?`,
        [...params, comparable_count]
      )
      comparables = rows
    } catch (e) {
      console.error('Comparables query error:', e.message)
    }

    const fallbackValuation = {
      valor_estimado: propertyData.preco_venda || propertyData.preco_locacao || 0,
      faixa_min: 0,
      faixa_max: 0,
      preco_m2_estimado: null,
      confianca: 'Baixa',
      metodologia: 'Avaliação simplificada',
      analise_mercado: 'Dados de mercado insuficientes para análise completa.',
      comparaveis_encontrados: comparables.length,
      recomendacoes: ['Solicite avaliação presencial de corretor', 'Pesquise imóveis similares na região']
    }

    const aiResponse = await callAnthropic(
      `Você é um avaliador imobiliário especialista no mercado brasileiro. Com base nos dados fornecidos, realize uma avaliação de mercado do imóvel.

      Retorne APENAS um JSON válido com esta estrutura:
      {
        "valor_estimado": número,
        "faixa_min": número,
        "faixa_max": número,
        "preco_m2_estimado": número ou null,
        "confianca": "Alta|Média|Baixa",
        "metodologia": "descrição da metodologia usada",
        "analise_mercado": "análise do mercado em 2-3 frases",
        "comparaveis_encontrados": número,
        "recomendacoes": ["rec1", "rec2", "rec3"]
      }`,
      `Avalie este imóvel:
      Imóvel Principal:
      - Tipo: ${propertyData.tipo}, Finalidade: ${propertyData.finalidade}
      - Localização: ${propertyData.bairro}, ${propertyData.cidade}/${propertyData.uf}
      - Área: ${propertyData.area_util || propertyData.area_construida || 'N/A'} m²
      - Quartos: ${propertyData.quartos}, Garagens: ${propertyData.garagens}
      - Preço atual anunciado: R$ ${propertyData.preco_venda ? Number(propertyData.preco_venda).toLocaleString('pt-BR') : 'N/A'}

      Imóveis Comparáveis (${comparables.length} encontrados):
      ${comparables.map((c, i) => `
        ${i + 1}. ${c.tipo} - ${c.bairro}, ${c.cidade}
           Área: ${c.area_util || c.area_construida || 'N/A'} m², Quartos: ${c.quartos || 'N/A'}
           Preço: R$ ${c.preco_venda ? Number(c.preco_venda).toLocaleString('pt-BR') : 'N/A'} (venda) / R$ ${c.preco_locacao ? Number(c.preco_locacao).toLocaleString('pt-BR') : 'N/A'} (locação/mês)
      `).join('')}`,
      1024
    )

    if (!aiResponse) {
      if (comparables.length > 0) {
        const prices = comparables
          .map(c => parseFloat(c.preco_venda || c.preco_locacao) || 0)
          .filter(p => p > 0)

        if (prices.length > 0) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length
          fallbackValuation.valor_estimado = Math.round(avg)
          fallbackValuation.faixa_min = Math.round(avg * 0.9)
          fallbackValuation.faixa_max = Math.round(avg * 1.1)
          fallbackValuation.confianca = 'Média'
          fallbackValuation.comparaveis_encontrados = comparables.length
        }
      }
      return res.json({ valuation: fallbackValuation, source: 'fallback' })
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const valuationData = JSON.parse(jsonMatch[0])
        return res.json({ valuation: valuationData, source: 'ai' })
      }
    } catch (e) {
      // fall through
    }

    return res.json({ valuation: fallbackValuation, source: 'fallback' })
  } catch (err) {
    console.error('Valuation error:', err)
    return res.status(500).json({ error: 'Erro ao realizar avaliação' })
  }
})

// POST /api/ai/content - Generate social media content
router.post('/content', authenticate, async (req, res) => {
  try {
    const { property_id, property, platform = 'instagram', tipo_conteudo = 'anuncio' } = req.body

    let propertyData = property

    if (property_id && !propertyData) {
      const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ? LIMIT 1', [property_id])
      if (!rows.length) {
        return res.status(404).json({ error: 'Imóvel não encontrado' })
      }
      propertyData = rows[0]
    }

    if (!propertyData) {
      return res.status(400).json({ error: 'Dados do imóvel são obrigatórios' })
    }

    const platformInstructions = {
      instagram: 'Caption para Instagram com emojis, hashtags relevantes (15-20 tags), máximo 2200 caracteres',
      facebook: 'Post para Facebook mais descritivo, com call-to-action, sem limite rígido de caracteres',
      whatsapp: 'Mensagem para WhatsApp/grupo, amigável e informativa, máximo 1000 caracteres',
      linkedin: 'Post profissional para LinkedIn, focado em investimento e mercado imobiliário',
      tiktok: 'Script curto para TikTok/Reels (30-60 segundos), dinâmico e envolvente'
    }

    const tipoInstructions = {
      anuncio: 'Anúncio de venda/locação do imóvel',
      destaque: 'Post de destaque mostrando o melhor do imóvel',
      mercado: 'Análise de mercado usando o imóvel como exemplo',
      dica: 'Dica imobiliária relacionada ao tipo de imóvel'
    }

    const fallbackContent = {
      titulo: `${propertyData.tipo || 'Imóvel'} à ${propertyData.finalidade === 'locacao' ? 'locação' : 'venda'}`,
      conteudo: `✨ ${propertyData.titulo || 'Imóvel disponível'}\n\n📍 ${propertyData.bairro || ''}, ${propertyData.cidade || ''}\n🛏️ ${propertyData.quartos || ''} quartos | 🚗 ${propertyData.garagens || ''} vagas\n📐 ${propertyData.area_util || propertyData.area_construida || ''} m²\n\n💰 R$ ${propertyData.preco_venda ? Number(propertyData.preco_venda).toLocaleString('pt-BR') : propertyData.preco_locacao ? Number(propertyData.preco_locacao).toLocaleString('pt-BR') + '/mês' : 'Consulte'}\n\n📞 Entre em contato para mais informações!\n\n#imóveis #${propertyData.cidade?.toLowerCase().replace(/\s/g, '') || 'imoveis'} #${propertyData.tipo?.toLowerCase() || 'imovel'} #imobiliarialemos`,
      hashtags: ['#imóveis', '#imobiliarialemos', '#agoraencontrei'],
      plataforma: platform
    }

    const aiResponse = await callAnthropic(
      `Você é um especialista em marketing imobiliário digital no Brasil. Crie conteúdo envolvente para redes sociais para venda/locação de imóveis.

      Plataforma: ${platformInstructions[platform] || platform}
      Tipo: ${tipoInstructions[tipo_conteudo] || tipo_conteudo}

      Retorne APENAS um JSON válido:
      {
        "titulo": "título chamativo",
        "conteudo": "texto completo do post com emojis apropriados",
        "hashtags": ["#tag1", "#tag2"],
        "call_to_action": "chamada para ação",
        "plataforma": "${platform}"
      }

      Use linguagem brasileira natural. Seja entusiasmante mas profissional. Inclua o nome da imobiliária Lemos ou AgoraEncontrei naturalmente.`,
      `Crie conteúdo para este imóvel:
      - Nome: ${propertyData.titulo || 'N/A'}
      - Tipo: ${propertyData.tipo || 'N/A'}
      - Finalidade: ${propertyData.finalidade || 'N/A'}
      - Localização: ${propertyData.bairro || 'N/A'}, ${propertyData.cidade || 'N/A'}/${propertyData.uf || 'N/A'}
      - Preço venda: R$ ${propertyData.preco_venda ? Number(propertyData.preco_venda).toLocaleString('pt-BR') : 'N/A'}
      - Preço locação: R$ ${propertyData.preco_locacao ? Number(propertyData.preco_locacao).toLocaleString('pt-BR') : 'N/A'}/mês
      - Área: ${propertyData.area_util || propertyData.area_construida || 'N/A'} m²
      - Quartos: ${propertyData.quartos || 'N/A'}, Suítes: ${propertyData.suites || 'N/A'}
      - Garagens: ${propertyData.garagens || 'N/A'}
      - Destaques: ${propertyData.detalhes_destaque || propertyData.descricao?.substring(0, 200) || 'N/A'}`,
      1024
    )

    if (!aiResponse) {
      return res.json({ content: fallbackContent, source: 'fallback' })
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const contentData = JSON.parse(jsonMatch[0])
        return res.json({ content: contentData, source: 'ai' })
      }
    } catch (e) {
      // fall through
    }

    return res.json({ content: fallbackContent, source: 'fallback' })
  } catch (err) {
    console.error('Content generation error:', err)
    return res.status(500).json({ error: 'Erro ao gerar conteúdo' })
  }
})

// POST /api/ai/chat - AI chatbot
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, context, history = [] } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    // Get some context from DB if not provided
    let propertyContext = ''
    if (context?.property_id) {
      try {
        const [rows] = await pool.execute(
          'SELECT titulo, tipo, finalidade, bairro, cidade, preco_venda, preco_locacao, quartos, area_util, descricao FROM properties WHERE id = ? LIMIT 1',
          [context.property_id]
        )
        if (rows.length) {
          const p = rows[0]
          propertyContext = `\n\nImóvel em contexto: ${p.titulo} - ${p.tipo} para ${p.finalidade} em ${p.bairro}, ${p.cidade}. Preço: R$ ${p.preco_venda ? Number(p.preco_venda).toLocaleString('pt-BR') : p.preco_locacao ? Number(p.preco_locacao).toLocaleString('pt-BR') + '/mês' : 'Consulte'}. Área: ${p.area_util || 'N/A'} m². Quartos: ${p.quartos || 'N/A'}.`
        }
      } catch (e) {}
    }

    const fallbackResponses = {
      visita: 'Para agendar uma visita, entre em contato conosco pelo WhatsApp ou preencha o formulário de contato. Teremos prazer em arranjar um horário conveniente para você!',
      preco: 'O preço do imóvel está disponível na página do anúncio. Para negociação ou mais informações, fale diretamente com nosso corretor.',
      documentos: 'Para fechar negócio, geralmente precisamos de RG, CPF, comprovante de renda e comprovante de residência. Nosso corretor pode orientar sobre o processo completo.',
      financiamento: 'Trabalhamos com os principais bancos para financiamento imobiliário. Podemos ajudar a simular as melhores condições para o seu perfil.',
      default: 'Olá! Sou o assistente da Imobiliária Lemos. Posso ajudar com informações sobre imóveis, visitas, documentação e mais. Como posso ajudar?'
    }

    const lowerMessage = message.toLowerCase()
    let fallbackResponse = fallbackResponses.default
    if (lowerMessage.includes('visit') || lowerMessage.includes('agendar')) {
      fallbackResponse = fallbackResponses.visita
    } else if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo')) {
      fallbackResponse = fallbackResponses.preco
    } else if (lowerMessage.includes('document') || lowerMessage.includes('papel')) {
      fallbackResponse = fallbackResponses.documentos
    } else if (lowerMessage.includes('financ') || lowerMessage.includes('banco') || lowerMessage.includes('parcel')) {
      fallbackResponse = fallbackResponses.financiamento
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your-anthropic-api-key') {
      return res.json({ response: fallbackResponse, source: 'fallback' })
    }

    const fetch = require('node-fetch')

    // Build conversation history
    const messages = []
    for (const h of history.slice(-10)) {
      if (h.role && h.content) {
        messages.push({ role: h.role, content: h.content })
      }
    }
    messages.push({ role: 'user', content: message })

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: `Você é um assistente virtual da Imobiliária Lemos / AgoraEncontrei, uma imobiliária brasileira de confiança. Ajude clientes com informações sobre imóveis, processos de compra/aluguel, documentação e agendamento de visitas.

Seja amigável, profissional e use português brasileiro natural. Seja conciso (máximo 3-4 parágrafos).

Sempre direcione para o corretor humano para: negociações de preço, visitas, contratos e documentos específicos.

Não invente informações sobre imóveis específicos que não foram fornecidos no contexto.${propertyContext}`,
        messages
      })
    })

    if (!response.ok) {
      return res.json({ response: fallbackResponse, source: 'fallback' })
    }

    const data = await response.json()
    const aiReply = data.content[0].text

    return res.json({ response: aiReply, source: 'ai' })
  } catch (err) {
    console.error('AI chat error:', err)
    return res.status(500).json({ error: 'Erro no chat AI' })
  }
})

// POST /api/ai/describe-property - Generate property description
router.post('/describe-property', authenticate, async (req, res) => {
  try {
    const { property } = req.body

    if (!property) {
      return res.status(400).json({ error: 'Dados do imóvel são obrigatórios' })
    }

    const fallbackDescription = `${property.tipo || 'Imóvel'} ${property.finalidade === 'locacao' ? 'para locação' : 'à venda'} localizado em ${property.bairro || 'região privilegiada'}, ${property.cidade || ''}. ${property.quartos ? `Composto por ${property.quartos} quartos` : ''}${property.suites ? `, sendo ${property.suites} suítes` : ''}${property.garagens ? `, ${property.garagens} vaga(s) de garagem` : ''}${property.area_util ? ` e ${property.area_util} m² de área útil` : ''}. ${property.detalhes_destaque || 'Imóvel em excelente estado de conservação, pronto para morar.'}`

    const aiResponse = await callAnthropic(
      `Você é um especialista em descrições imobiliárias. Crie uma descrição atraente e profissional para o imóvel, destacando seus principais atributos. Use linguagem brasileira, seja detalhado mas conciso (4-6 parágrafos). Não use bullet points, escreva em prosa.`,
      `Crie uma descrição completa para:
      Tipo: ${property.tipo}, Finalidade: ${property.finalidade}
      Localização: ${property.bairro}, ${property.cidade}/${property.uf}
      Área total: ${property.area_total || 'N/A'} m², Área útil: ${property.area_util || 'N/A'} m²
      Quartos: ${property.quartos || 'N/A'}, Suítes: ${property.suites || 'N/A'}
      Banheiros: ${property.banheiros || 'N/A'}, Garagens: ${property.garagens || 'N/A'}
      Preço venda: ${property.preco_venda || 'N/A'}, Locação: ${property.preco_locacao || 'N/A'}
      Condomínio: ${property.condominio || property.edificio || 'N/A'}
      Destaques informados: ${property.detalhes_destaque || property.outras_caracteristicas || 'padrão'}
      Lazer: ${property.detalhes_lazer || 'N/A'}`,
      1024
    )

    if (!aiResponse) {
      return res.json({ description: fallbackDescription, source: 'fallback' })
    }

    return res.json({ description: aiResponse, source: 'ai' })
  } catch (err) {
    console.error('Describe property error:', err)
    return res.status(500).json({ error: 'Erro ao gerar descrição' })
  }
})

module.exports = router
