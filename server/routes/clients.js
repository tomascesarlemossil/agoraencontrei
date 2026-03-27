const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { authenticate, requireAdmin, requireAuth } = require('../middleware/auth')

// GET /api/clients - List with pagination and filters
router.get('/', authenticate, requireAuth, async (req, res) => {
  try {
    const {
      search,
      tipo,
      status,
      corretor_id,
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
      conditions.push('(c.nome LIKE ? OR c.email LIKE ? OR c.telefone LIKE ? OR c.cpf LIKE ?)')
      const s = `%${search}%`
      params.push(s, s, s, s)
    }

    if (tipo) {
      conditions.push('c.tipo = ?')
      params.push(tipo)
    }

    if (status) {
      conditions.push('c.status = ?')
      params.push(status)
    }

    if (corretor_id) {
      conditions.push('c.corretor_id = ?')
      params.push(corretor_id)
    } else if (req.user.role === 'corretor') {
      conditions.push('c.corretor_id = ?')
      params.push(req.user.id)
    }

    const allowedSorts = ['created_at', 'nome', 'email', 'updated_at']
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    const whereClause = conditions.join(' AND ')

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM clients c WHERE ${whereClause}`,
      params
    )
    const total = countResult[0].total

    const [clients] = await pool.execute(
      `SELECT
        c.id, c.nome, c.email, c.telefone, c.celular, c.cpf, c.cnpj,
        c.tipo, c.status, c.origem,
        c.endereco, c.bairro, c.cidade, c.uf, c.cep,
        c.renda_mensal, c.profissao,
        c.interesse_tipo, c.interesse_finalidade, c.interesse_cidade,
        c.interesse_bairro, c.interesse_preco_min, c.interesse_preco_max,
        c.interesse_quartos, c.interesse_garagens, c.interesse_area_min,
        c.observacoes, c.corretor_id, c.score,
        c.created_at, c.updated_at
      FROM clients c
      WHERE ${whereClause}
      ORDER BY c.${sortField} ${sortOrder}
      LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )

    return res.json({
      clients,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum
    })
  } catch (err) {
    console.error('List clients error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/clients/:id - Single client
router.get('/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE id = ? LIMIT 1',
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    const client = rows[0]

    if (req.user.role === 'corretor' && client.corretor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para visualizar este cliente' })
    }

    // Get recent interactions
    let interactions = []
    try {
      const [interRows] = await pool.execute(
        `SELECT * FROM client_interactions WHERE client_id = ? ORDER BY created_at DESC LIMIT 10`,
        [id]
      )
      interactions = interRows
    } catch (e) {
      // Table may not exist
    }

    return res.json({ client, interactions })
  } catch (err) {
    console.error('Get client error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/clients - Create client (also from public lead forms)
router.post('/', async (req, res) => {
  try {
    const {
      nome, email, telefone, celular, cpf, cnpj,
      tipo = 'comprador', status = 'ativo', origem = 'site',
      endereco, bairro, cidade, uf, cep,
      renda_mensal, profissao,
      interesse_tipo, interesse_finalidade, interesse_cidade,
      interesse_bairro, interesse_preco_min, interesse_preco_max,
      interesse_quartos, interesse_garagens, interesse_area_min,
      observacoes, corretor_id, score = 0
    } = req.body

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }

    // Check for duplicate email
    if (email) {
      const [existing] = await pool.execute(
        'SELECT id FROM clients WHERE email = ? LIMIT 1',
        [email.toLowerCase().trim()]
      )
      if (existing.length) {
        return res.status(409).json({ error: 'Email já cadastrado para outro cliente', clientId: existing[0].id })
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO clients (
        nome, email, telefone, celular, cpf, cnpj,
        tipo, status, origem,
        endereco, bairro, cidade, uf, cep,
        renda_mensal, profissao,
        interesse_tipo, interesse_finalidade, interesse_cidade,
        interesse_bairro, interesse_preco_min, interesse_preco_max,
        interesse_quartos, interesse_garagens, interesse_area_min,
        observacoes, corretor_id, score,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
      )`,
      [
        nome.trim(), email ? email.toLowerCase().trim() : null, telefone || null, celular || null, cpf || null, cnpj || null,
        tipo, status, origem,
        endereco || null, bairro || null, cidade || null, uf || null, cep || null,
        renda_mensal || null, profissao || null,
        interesse_tipo || null, interesse_finalidade || null, interesse_cidade || null,
        interesse_bairro || null, interesse_preco_min || null, interesse_preco_max || null,
        interesse_quartos || null, interesse_garagens || null, interesse_area_min || null,
        observacoes || null, corretor_id || null, score
      ]
    )

    const [newClient] = await pool.execute('SELECT * FROM clients WHERE id = ? LIMIT 1', [result.insertId])

    return res.status(201).json({ client: newClient[0] })
  } catch (err) {
    console.error('Create client error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/clients/:id - Update
router.put('/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute(
      'SELECT id, corretor_id FROM clients WHERE id = ? LIMIT 1',
      [id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    if (req.user.role === 'corretor' && existing[0].corretor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este cliente' })
    }

    const updatableFields = [
      'nome', 'email', 'telefone', 'celular', 'cpf', 'cnpj',
      'tipo', 'status', 'origem',
      'endereco', 'bairro', 'cidade', 'uf', 'cep',
      'renda_mensal', 'profissao',
      'interesse_tipo', 'interesse_finalidade', 'interesse_cidade',
      'interesse_bairro', 'interesse_preco_min', 'interesse_preco_max',
      'interesse_quartos', 'interesse_garagens', 'interesse_area_min',
      'observacoes', 'corretor_id', 'score'
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
      `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    const [updated] = await pool.execute('SELECT * FROM clients WHERE id = ? LIMIT 1', [id])

    return res.json({ client: updated[0] })
  } catch (err) {
    console.error('Update client error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// DELETE /api/clients/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute(
      'SELECT id FROM clients WHERE id = ? LIMIT 1',
      [id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    await pool.execute('DELETE FROM clients WHERE id = ?', [id])

    return res.json({ message: 'Cliente excluído com sucesso' })
  } catch (err) {
    console.error('Delete client error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/clients/:id/matches - Find matching properties
router.get('/:id/matches', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [clientRows] = await pool.execute(
      'SELECT * FROM clients WHERE id = ? LIMIT 1',
      [id]
    )

    if (!clientRows.length) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    const client = clientRows[0]

    const conditions = ["status != 'inativo'"]
    const params = []

    if (client.interesse_tipo) {
      conditions.push('tipo = ?')
      params.push(client.interesse_tipo)
    }

    if (client.interesse_finalidade) {
      conditions.push('finalidade = ?')
      params.push(client.interesse_finalidade)
    }

    if (client.interesse_cidade) {
      conditions.push('cidade LIKE ?')
      params.push(`%${client.interesse_cidade}%`)
    }

    if (client.interesse_preco_min) {
      conditions.push('COALESCE(preco_venda, preco_locacao) >= ?')
      params.push(client.interesse_preco_min)
    }

    if (client.interesse_preco_max) {
      conditions.push('COALESCE(preco_venda, preco_locacao) <= ?')
      params.push(client.interesse_preco_max)
    }

    if (client.interesse_quartos) {
      conditions.push('quartos >= ?')
      params.push(client.interesse_quartos)
    }

    if (client.interesse_garagens) {
      conditions.push('garagens >= ?')
      params.push(client.interesse_garagens)
    }

    if (client.interesse_area_min) {
      conditions.push('COALESCE(area_util, area_construida, area_total) >= ?')
      params.push(client.interesse_area_min)
    }

    const whereClause = conditions.join(' AND ')

    const [matches] = await pool.execute(
      `SELECT id, codigo, titulo, tipo, finalidade, status,
        preco_venda, preco_locacao, bairro, cidade, uf,
        quartos, suites, garagens, banheiros, area_util, area_construida,
        foto_principal, slug, destaque
      FROM properties
      WHERE ${whereClause}
      ORDER BY destaque DESC, visualizacoes DESC
      LIMIT 20`,
      params
    )

    return res.json({ matches, client })
  } catch (err) {
    console.error('Client matches error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
