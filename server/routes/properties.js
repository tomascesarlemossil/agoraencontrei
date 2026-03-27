const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { authenticate, requireAdmin, requireAuth, optionalAuth } = require('../middleware/auth')

function buildSlug(titulo, id) {
  const slug = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return `${slug}-${id}`
}

// GET /api/properties - List with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      tipo,
      finalidade,
      cidade,
      bairro,
      uf,
      preco_min,
      preco_max,
      quartos,
      suites,
      garagens,
      area_min,
      area_max,
      destaque,
      status,
      page = 1,
      limit = 12,
      sort = 'created_at',
      order = 'DESC'
    } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    const conditions = ['1=1']
    const params = []

    if (status) {
      conditions.push('p.status = ?')
      params.push(status)
    } else {
      conditions.push("p.status != 'inativo'")
    }

    if (search) {
      conditions.push('(p.titulo LIKE ? OR p.descricao LIKE ? OR p.bairro LIKE ? OR p.cidade LIKE ? OR p.codigo LIKE ?)')
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (tipo) {
      conditions.push('p.tipo = ?')
      params.push(tipo)
    }

    if (finalidade) {
      conditions.push('p.finalidade = ?')
      params.push(finalidade)
    }

    if (cidade) {
      conditions.push('p.cidade LIKE ?')
      params.push(`%${cidade}%`)
    }

    if (bairro) {
      conditions.push('p.bairro LIKE ?')
      params.push(`%${bairro}%`)
    }

    if (uf) {
      conditions.push('p.uf = ?')
      params.push(uf.toUpperCase())
    }

    if (preco_min) {
      conditions.push('(COALESCE(p.preco_venda, p.preco_locacao, p.preco_temporada) >= ?)')
      params.push(parseFloat(preco_min))
    }

    if (preco_max) {
      conditions.push('(COALESCE(p.preco_venda, p.preco_locacao, p.preco_temporada) <= ?)')
      params.push(parseFloat(preco_max))
    }

    if (quartos) {
      const qNum = parseInt(quartos)
      if (qNum >= 4) {
        conditions.push('p.quartos >= ?')
        params.push(qNum)
      } else {
        conditions.push('p.quartos = ?')
        params.push(qNum)
      }
    }

    if (suites) {
      conditions.push('p.suites >= ?')
      params.push(parseInt(suites))
    }

    if (garagens) {
      conditions.push('p.garagens >= ?')
      params.push(parseInt(garagens))
    }

    if (area_min) {
      conditions.push('COALESCE(p.area_util, p.area_construida, p.area_total) >= ?')
      params.push(parseFloat(area_min))
    }

    if (area_max) {
      conditions.push('COALESCE(p.area_util, p.area_construida, p.area_total) <= ?')
      params.push(parseFloat(area_max))
    }

    if (destaque !== undefined) {
      conditions.push('p.destaque = ?')
      params.push(destaque === 'true' || destaque === '1' ? 1 : 0)
    }

    const allowedSorts = ['created_at', 'data_cadastro', 'preco_venda', 'preco_locacao', 'area_util', 'area_construida', 'visualizacoes', 'titulo']
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    const whereClause = conditions.join(' AND ')

    const countQuery = `SELECT COUNT(*) as total FROM properties p WHERE ${whereClause}`
    const [countResult] = await pool.execute(countQuery, params)
    const total = countResult[0].total

    const dataQuery = `
      SELECT
        p.id, p.codigo, p.id_internet, p.titulo, p.tipo, p.finalidade, p.categoria, p.status,
        p.preco_venda, p.preco_locacao, p.preco_temporada, p.preco_m2, p.preco_condominio, p.preco_iptu,
        p.endereco, p.numero, p.complemento, p.bairro, p.cidade, p.uf, p.cep, p.regiao,
        p.edificio, p.condominio, p.empreendimento, p.construtora,
        p.quartos, p.suites, p.garagens, p.banheiros,
        p.area_construida, p.area_util, p.area_comum, p.area_total,
        p.descricao, p.detalhes_destaque,
        p.foto_principal, p.fotos,
        p.destaque, p.visualizacoes, p.favoritos,
        p.slug, p.link_site,
        p.situacao, p.estado_atual,
        p.data_cadastro, p.data_atualizacao, p.created_at, p.updated_at
      FROM properties p
      WHERE ${whereClause}
      ORDER BY p.${sortField} ${sortOrder}
      LIMIT ${limitNum} OFFSET ${offset}
    `

    const [properties] = await pool.execute(dataQuery, params)

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
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum
    })
  } catch (err) {
    console.error('List properties error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/properties/featured
router.get('/featured', async (req, res) => {
  try {
    const [properties] = await pool.execute(
      `SELECT
        p.id, p.codigo, p.titulo, p.tipo, p.finalidade, p.status,
        p.preco_venda, p.preco_locacao, p.preco_temporada,
        p.bairro, p.cidade, p.uf,
        p.quartos, p.suites, p.garagens, p.banheiros,
        p.area_construida, p.area_util, p.area_total,
        p.foto_principal, p.fotos,
        p.destaque, p.visualizacoes, p.slug
      FROM properties p
      WHERE p.destaque = 1 AND p.status != 'inativo'
      ORDER BY p.visualizacoes DESC, p.created_at DESC
      LIMIT 6`
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

    return res.json({ properties: processed })
  } catch (err) {
    console.error('Featured properties error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/properties/cities
router.get('/cities', async (req, res) => {
  try {
    const [cities] = await pool.execute(
      `SELECT cidade, uf, COUNT(*) as total
       FROM properties
       WHERE status != 'inativo' AND cidade IS NOT NULL AND cidade != ''
       GROUP BY cidade, uf
       ORDER BY total DESC, cidade ASC
       LIMIT 50`
    )

    return res.json({ cities })
  } catch (err) {
    console.error('Cities error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/properties/types - Get distinct types
router.get('/types', async (req, res) => {
  try {
    const [types] = await pool.execute(
      `SELECT tipo, COUNT(*) as total
       FROM properties
       WHERE status != 'inativo' AND tipo IS NOT NULL AND tipo != ''
       GROUP BY tipo
       ORDER BY total DESC`
    )

    return res.json({ types })
  } catch (err) {
    console.error('Types error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/properties/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params

    let property = null

    // Try by ID first
    if (!isNaN(parseInt(id))) {
      const [rows] = await pool.execute(
        'SELECT * FROM properties WHERE id = ? LIMIT 1',
        [parseInt(id)]
      )
      if (rows.length) property = rows[0]
    }

    // Try by slug
    if (!property) {
      const [rows] = await pool.execute(
        'SELECT * FROM properties WHERE slug = ? LIMIT 1',
        [id]
      )
      if (rows.length) property = rows[0]
    }

    // Try by codigo
    if (!property) {
      const [rows] = await pool.execute(
        'SELECT * FROM properties WHERE codigo = ? LIMIT 1',
        [id]
      )
      if (rows.length) property = rows[0]
    }

    if (!property) {
      return res.status(404).json({ error: 'Imóvel não encontrado' })
    }

    // Parse JSON fields
    const processed = {
      ...property,
      fotos: (() => {
        if (!property.fotos) return []
        if (typeof property.fotos === 'string') {
          try { return JSON.parse(property.fotos) } catch { return [] }
        }
        return property.fotos
      })(),
      detalhes_basico: (() => {
        if (!property.detalhes_basico) return null
        if (typeof property.detalhes_basico === 'string') {
          try { return JSON.parse(property.detalhes_basico) } catch { return property.detalhes_basico }
        }
        return property.detalhes_basico
      })(),
      detalhes_servicos: (() => {
        if (!property.detalhes_servicos) return null
        if (typeof property.detalhes_servicos === 'string') {
          try { return JSON.parse(property.detalhes_servicos) } catch { return property.detalhes_servicos }
        }
        return property.detalhes_servicos
      })(),
      detalhes_lazer: (() => {
        if (!property.detalhes_lazer) return null
        if (typeof property.detalhes_lazer === 'string') {
          try { return JSON.parse(property.detalhes_lazer) } catch { return property.detalhes_lazer }
        }
        return property.detalhes_lazer
      })()
    }

    return res.json({ property: processed })
  } catch (err) {
    console.error('Get property error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/properties - Create
router.post('/', authenticate, requireAuth, async (req, res) => {
  try {
    const {
      codigo, id_internet, titulo, tipo, finalidade, categoria, status = 'ativo',
      preco_venda, preco_locacao, preco_temporada, preco_m2, preco_condominio, preco_iptu,
      endereco, numero, complemento, bairro, cidade, uf, cep, regiao,
      edificio, condominio, empreendimento, construtora,
      quartos, suites, garagens, banheiros,
      area_construida, area_util, area_comum, area_total,
      descricao, detalhes_basico, detalhes_servicos, detalhes_lazer, detalhes_social,
      detalhes_intima, detalhes_armarios, detalhes_acabamento, detalhes_destaque, outras_caracteristicas,
      foto_principal, fotos,
      proprietario_nome, proprietario_telefone, proprietario_email,
      destaque = 0, situacao, estado_atual, captador, corretor_id
    } = req.body

    if (!titulo || !tipo || !finalidade) {
      return res.status(400).json({ error: 'Título, tipo e finalidade são obrigatórios' })
    }

    const fotosJson = fotos ? JSON.stringify(Array.isArray(fotos) ? fotos : [fotos]) : null
    const detalhesBasicoJson = detalhes_basico ? JSON.stringify(detalhes_basico) : null
    const detalhesServicosJson = detalhes_servicos ? JSON.stringify(detalhes_servicos) : null
    const detalhesLazerJson = detalhes_lazer ? JSON.stringify(detalhes_lazer) : null
    const detalhesSocialJson = detalhes_social ? JSON.stringify(detalhes_social) : null
    const detalhesIntimaJson = detalhes_intima ? JSON.stringify(detalhes_intima) : null
    const detalhesArmarioJson = detalhes_armarios ? JSON.stringify(detalhes_armarios) : null
    const detalhesAcabamentoJson = detalhes_acabamento ? JSON.stringify(detalhes_acabamento) : null

    const [result] = await pool.execute(
      `INSERT INTO properties (
        codigo, id_internet, titulo, tipo, finalidade, categoria, status,
        preco_venda, preco_locacao, preco_temporada, preco_m2, preco_condominio, preco_iptu,
        endereco, numero, complemento, bairro, cidade, uf, cep, regiao,
        edificio, condominio, empreendimento, construtora,
        quartos, suites, garagens, banheiros,
        area_construida, area_util, area_comum, area_total,
        descricao, detalhes_basico, detalhes_servicos, detalhes_lazer, detalhes_social,
        detalhes_intima, detalhes_armarios, detalhes_acabamento, detalhes_destaque, outras_caracteristicas,
        foto_principal, fotos,
        proprietario_nome, proprietario_telefone, proprietario_email,
        destaque, situacao, estado_atual, captador, corretor_id,
        data_cadastro, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        NOW(), NOW(), NOW()
      )`,
      [
        codigo || null, id_internet || null, titulo, tipo, finalidade, categoria || null, status,
        preco_venda || null, preco_locacao || null, preco_temporada || null, preco_m2 || null, preco_condominio || null, preco_iptu || null,
        endereco || null, numero || null, complemento || null, bairro || null, cidade || null, uf || null, cep || null, regiao || null,
        edificio || null, condominio || null, empreendimento || null, construtora || null,
        quartos || null, suites || null, garagens || null, banheiros || null,
        area_construida || null, area_util || null, area_comum || null, area_total || null,
        descricao || null, detalhesBasicoJson, detalhesServicosJson, detalhesLazerJson, detalhesSocialJson,
        detalhesIntimaJson, detalhesArmarioJson, detalhesAcabamentoJson, detalhes_destaque || null, outras_caracteristicas || null,
        foto_principal || null, fotosJson,
        proprietario_nome || null, proprietario_telefone || null, proprietario_email || null,
        destaque ? 1 : 0, situacao || null, estado_atual || null, captador || null, corretor_id || req.user.id
      ]
    )

    const newId = result.insertId
    const slug = buildSlug(titulo, newId)

    await pool.execute('UPDATE properties SET slug = ? WHERE id = ?', [slug, newId])

    const [newProp] = await pool.execute('SELECT * FROM properties WHERE id = ? LIMIT 1', [newId])

    return res.status(201).json({ property: newProp[0] })
  } catch (err) {
    console.error('Create property error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/properties/:id - Update
router.put('/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute(
      'SELECT id, corretor_id FROM properties WHERE id = ? LIMIT 1',
      [id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'Imóvel não encontrado' })
    }

    const prop = existing[0]

    if (req.user.role !== 'admin' && req.user.role !== 'gerente' && prop.corretor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este imóvel' })
    }

    const updatableFields = [
      'codigo', 'titulo', 'tipo', 'finalidade', 'categoria', 'status',
      'preco_venda', 'preco_locacao', 'preco_temporada', 'preco_m2', 'preco_condominio', 'preco_iptu',
      'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'regiao',
      'edificio', 'condominio', 'empreendimento', 'construtora',
      'quartos', 'suites', 'garagens', 'banheiros',
      'area_construida', 'area_util', 'area_comum', 'area_total',
      'descricao', 'detalhes_destaque', 'outras_caracteristicas',
      'foto_principal', 'proprietario_nome', 'proprietario_telefone', 'proprietario_email',
      'destaque', 'situacao', 'estado_atual', 'captador', 'corretor_id'
    ]

    const jsonFields = ['fotos', 'detalhes_basico', 'detalhes_servicos', 'detalhes_lazer',
      'detalhes_social', 'detalhes_intima', 'detalhes_armarios', 'detalhes_acabamento']

    const fields = []
    const values = []

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`)
        values.push(req.body[field])
      }
    }

    for (const field of jsonFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`)
        values.push(JSON.stringify(req.body[field]))
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    }

    fields.push('updated_at = NOW()', 'data_atualizacao = NOW()')
    values.push(id)

    await pool.execute(
      `UPDATE properties SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    // Update slug if titulo changed
    if (req.body.titulo) {
      const slug = buildSlug(req.body.titulo, id)
      await pool.execute('UPDATE properties SET slug = ? WHERE id = ?', [slug, id])
    }

    const [updated] = await pool.execute('SELECT * FROM properties WHERE id = ? LIMIT 1', [id])

    return res.json({ property: updated[0] })
  } catch (err) {
    console.error('Update property error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// DELETE /api/properties/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute(
      'SELECT id FROM properties WHERE id = ? LIMIT 1',
      [id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'Imóvel não encontrado' })
    }

    await pool.execute('DELETE FROM properties WHERE id = ?', [id])

    return res.json({ message: 'Imóvel excluído com sucesso' })
  } catch (err) {
    console.error('Delete property error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/properties/:id/views - Increment view count
router.post('/:id/views', async (req, res) => {
  try {
    const { id } = req.params

    await pool.execute(
      'UPDATE properties SET visualizacoes = COALESCE(visualizacoes, 0) + 1 WHERE id = ?',
      [id]
    )

    const [rows] = await pool.execute(
      'SELECT visualizacoes FROM properties WHERE id = ? LIMIT 1',
      [id]
    )

    return res.json({ visualizacoes: rows[0]?.visualizacoes || 0 })
  } catch (err) {
    console.error('Increment views error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/properties/:id/favorite - Toggle favorite
router.post('/:id/favorite', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const [existing] = await pool.execute(
      'SELECT id FROM property_favorites WHERE property_id = ? AND user_id = ? LIMIT 1',
      [id, userId]
    )

    let isFavorite = false

    if (existing.length) {
      await pool.execute(
        'DELETE FROM property_favorites WHERE property_id = ? AND user_id = ?',
        [id, userId]
      )
      await pool.execute(
        'UPDATE properties SET favoritos = GREATEST(COALESCE(favoritos, 0) - 1, 0) WHERE id = ?',
        [id]
      )
      isFavorite = false
    } else {
      await pool.execute(
        'INSERT INTO property_favorites (property_id, user_id, created_at) VALUES (?, ?, NOW())',
        [id, userId]
      )
      await pool.execute(
        'UPDATE properties SET favoritos = COALESCE(favoritos, 0) + 1 WHERE id = ?',
        [id]
      )
      isFavorite = true
    }

    const [rows] = await pool.execute(
      'SELECT favoritos FROM properties WHERE id = ? LIMIT 1',
      [id]
    )

    return res.json({ isFavorite, favoritos: rows[0]?.favoritos || 0 })
  } catch (err) {
    // If favorites table doesn't exist, just return a basic response
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ isFavorite: false, favoritos: 0 })
    }
    console.error('Toggle favorite error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
