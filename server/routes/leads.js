const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { authenticate, requireAdmin, requireAuth } = require('../middleware/auth')

// GET /api/leads - List with filters
router.get('/', authenticate, requireAuth, async (req, res) => {
  try {
    const {
      search,
      status,
      temperatura,
      origem,
      corretor_id,
      property_id,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC'
    } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    const conditions = ['1=1']
    const params = []

    if (search) {
      conditions.push('(l.nome LIKE ? OR l.email LIKE ? OR l.telefone LIKE ?)')
      const s = `%${search}%`
      params.push(s, s, s)
    }

    if (status) {
      conditions.push('l.status = ?')
      params.push(status)
    }

    if (temperatura) {
      conditions.push('l.temperatura = ?')
      params.push(temperatura)
    }

    if (origem) {
      conditions.push('l.origem = ?')
      params.push(origem)
    }

    if (property_id) {
      conditions.push('l.property_id = ?')
      params.push(property_id)
    }

    if (corretor_id) {
      conditions.push('l.corretor_id = ?')
      params.push(corretor_id)
    } else if (req.user.role === 'corretor') {
      conditions.push('(l.corretor_id = ? OR l.corretor_id IS NULL)')
      params.push(req.user.id)
    }

    const allowedSorts = ['created_at', 'nome', 'score', 'updated_at', 'temperatura']
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const whereClause = conditions.join(' AND ')

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM leads l WHERE ${whereClause}`,
      params
    )
    const total = countResult[0].total

    const [leads] = await pool.execute(
      `SELECT
        l.*,
        p.titulo as property_titulo,
        p.codigo as property_codigo,
        p.foto_principal as property_foto
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE ${whereClause}
      ORDER BY l.${sortField} ${sortOrder}
      LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )

    return res.json({
      leads,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum
    })
  } catch (err) {
    console.error('List leads error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/leads/:id - Single lead
router.get('/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.execute(
      `SELECT
        l.*,
        p.titulo as property_titulo,
        p.codigo as property_codigo,
        p.tipo as property_tipo,
        p.finalidade as property_finalidade,
        p.bairro as property_bairro,
        p.cidade as property_cidade,
        p.preco_venda as property_preco_venda,
        p.preco_locacao as property_preco_locacao,
        p.foto_principal as property_foto
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE l.id = ?
      LIMIT 1`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' })
    }

    return res.json({ lead: rows[0] })
  } catch (err) {
    console.error('Get lead error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/leads - Create lead (PUBLIC - from contact forms)
router.post('/', async (req, res) => {
  try {
    const {
      nome, email, telefone, mensagem,
      origem = 'site', property_id,
      interesse_tipo, interesse_finalidade, interesse_cidade,
      interesse_preco_min, interesse_preco_max,
      interesse_quartos, interesse_garagens,
      score = 0, temperatura = 'frio',
      corretor_id, utm_source, utm_medium, utm_campaign
    } = req.body

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }

    if (!email && !telefone) {
      return res.status(400).json({ error: 'Email ou telefone é obrigatório' })
    }

    // Auto-assign corretor if property has one
    let assignedCorretor = corretor_id || null
    if (!assignedCorretor && property_id) {
      try {
        const [propRows] = await pool.execute(
          'SELECT corretor_id FROM properties WHERE id = ? LIMIT 1',
          [property_id]
        )
        if (propRows.length && propRows[0].corretor_id) {
          assignedCorretor = propRows[0].corretor_id
        }
      } catch (e) {
        // ignore
      }
    }

    // Calculate initial score based on data completeness
    let calculatedScore = score
    if (email) calculatedScore += 10
    if (telefone) calculatedScore += 10
    if (mensagem && mensagem.length > 50) calculatedScore += 10
    if (property_id) calculatedScore += 20

    const [result] = await pool.execute(
      `INSERT INTO leads (
        nome, email, telefone, mensagem,
        origem, property_id, status,
        interesse_tipo, interesse_finalidade, interesse_cidade,
        interesse_preco_min, interesse_preco_max,
        interesse_quartos, interesse_garagens,
        score, temperatura, corretor_id,
        utm_source, utm_medium, utm_campaign,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, 'novo',
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
      )`,
      [
        nome.trim(), email ? email.toLowerCase().trim() : null, telefone || null, mensagem || null,
        origem, property_id || null,
        interesse_tipo || null, interesse_finalidade || null, interesse_cidade || null,
        interesse_preco_min || null, interesse_preco_max || null,
        interesse_quartos || null, interesse_garagens || null,
        calculatedScore, temperatura, assignedCorretor,
        utm_source || null, utm_medium || null, utm_campaign || null
      ]
    )

    const [newLead] = await pool.execute('SELECT * FROM leads WHERE id = ? LIMIT 1', [result.insertId])

    return res.status(201).json({
      lead: newLead[0],
      message: 'Lead criado com sucesso'
    })
  } catch (err) {
    console.error('Create lead error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/leads/:id - Update
router.put('/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute(
      'SELECT id, corretor_id FROM leads WHERE id = ? LIMIT 1',
      [id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'Lead não encontrado' })
    }

    const updatableFields = [
      'nome', 'email', 'telefone', 'mensagem',
      'status', 'origem', 'temperatura', 'score',
      'property_id', 'corretor_id',
      'interesse_tipo', 'interesse_finalidade', 'interesse_cidade',
      'interesse_preco_min', 'interesse_preco_max',
      'interesse_quartos', 'interesse_garagens',
      'observacoes', 'proxima_acao'
    ]

    const fields = []
    const values = []

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`)
        values.push(req.body[field])
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    await pool.execute(
      `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    const [updated] = await pool.execute('SELECT * FROM leads WHERE id = ? LIMIT 1', [id])

    return res.json({ lead: updated[0] })
  } catch (err) {
    console.error('Update lead error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// DELETE /api/leads/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute('SELECT id FROM leads WHERE id = ? LIMIT 1', [id])
    if (!existing.length) {
      return res.status(404).json({ error: 'Lead não encontrado' })
    }

    await pool.execute('DELETE FROM leads WHERE id = ?', [id])

    return res.json({ message: 'Lead excluído com sucesso' })
  } catch (err) {
    console.error('Delete lead error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/leads/:id/convert - Convert to client
router.post('/:id/convert', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [leadRows] = await pool.execute('SELECT * FROM leads WHERE id = ? LIMIT 1', [id])
    if (!leadRows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' })
    }

    const lead = leadRows[0]

    // Check if already a client with this email
    if (lead.email) {
      const [existingClient] = await pool.execute(
        'SELECT id FROM clients WHERE email = ? LIMIT 1',
        [lead.email]
      )

      if (existingClient.length) {
        await pool.execute(
          "UPDATE leads SET status = 'convertido', client_id = ?, updated_at = NOW() WHERE id = ?",
          [existingClient[0].id, id]
        )
        return res.json({
          message: 'Lead vinculado ao cliente existente',
          clientId: existingClient[0].id
        })
      }
    }

    // Create new client from lead
    const [result] = await pool.execute(
      `INSERT INTO clients (
        nome, email, telefone, tipo, status, origem,
        interesse_tipo, interesse_finalidade, interesse_cidade,
        interesse_preco_min, interesse_preco_max,
        interesse_quartos, interesse_garagens,
        observacoes, corretor_id, score,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'comprador', 'ativo', ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
      )`,
      [
        lead.nome, lead.email || null, lead.telefone || null, lead.origem || 'site',
        lead.interesse_tipo || null, lead.interesse_finalidade || null, lead.interesse_cidade || null,
        lead.interesse_preco_min || null, lead.interesse_preco_max || null,
        lead.interesse_quartos || null, lead.interesse_garagens || null,
        lead.observacoes || lead.mensagem || null, lead.corretor_id || null, lead.score || 0
      ]
    )

    const newClientId = result.insertId

    await pool.execute(
      "UPDATE leads SET status = 'convertido', client_id = ?, updated_at = NOW() WHERE id = ?",
      [newClientId, id]
    )

    const [newClient] = await pool.execute('SELECT * FROM clients WHERE id = ? LIMIT 1', [newClientId])

    return res.status(201).json({
      message: 'Lead convertido em cliente com sucesso',
      client: newClient[0]
    })
  } catch (err) {
    console.error('Convert lead error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
