const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { authenticate, requireAdmin, requireAuth } = require('../middleware/auth')

const KANBAN_STAGES = [
  'novo_lead',
  'qualificacao',
  'visita_agendada',
  'visita_realizada',
  'proposta',
  'documentacao',
  'fechamento',
  'pos_venda'
]

// GET /api/negotiations - List
router.get('/', authenticate, requireAuth, async (req, res) => {
  try {
    const {
      corretor_id,
      client_id,
      property_id,
      estagio,
      status,
      page = 1,
      limit = 50,
      sort = 'updated_at',
      order = 'DESC'
    } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    const conditions = ['1=1']
    const params = []

    if (corretor_id) {
      conditions.push('n.corretor_id = ?')
      params.push(corretor_id)
    } else if (req.user.role === 'corretor') {
      conditions.push('n.corretor_id = ?')
      params.push(req.user.id)
    }

    if (client_id) {
      conditions.push('n.client_id = ?')
      params.push(client_id)
    }

    if (property_id) {
      conditions.push('n.property_id = ?')
      params.push(property_id)
    }

    if (estagio) {
      conditions.push('n.estagio = ?')
      params.push(estagio)
    }

    if (status) {
      conditions.push('n.status = ?')
      params.push(status)
    }

    const allowedSorts = ['created_at', 'updated_at', 'valor', 'estagio', 'data_previsao']
    const sortField = allowedSorts.includes(sort) ? sort : 'updated_at'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const whereClause = conditions.join(' AND ')

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM negotiations n WHERE ${whereClause}`,
      params
    )
    const total = countResult[0].total

    const [negotiations] = await pool.execute(
      `SELECT
        n.*,
        c.nome as client_nome,
        c.telefone as client_telefone,
        c.email as client_email,
        p.titulo as property_titulo,
        p.codigo as property_codigo,
        p.bairro as property_bairro,
        p.cidade as property_cidade,
        p.foto_principal as property_foto,
        p.preco_venda as property_preco_venda,
        p.preco_locacao as property_preco_locacao,
        u.name as corretor_nome,
        u.avatar as corretor_avatar,
        u.phone as corretor_telefone
      FROM negotiations n
      LEFT JOIN clients c ON n.client_id = c.id
      LEFT JOIN properties p ON n.property_id = p.id
      LEFT JOIN users u ON n.corretor_id = u.id
      WHERE ${whereClause}
      ORDER BY n.${sortField} ${sortOrder}
      LIMIT ${limitNum} OFFSET ${offset}`,
      params
    )

    return res.json({
      negotiations,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum
    })
  } catch (err) {
    console.error('List negotiations error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/negotiations/kanban - Grouped by stage
router.get('/kanban', authenticate, requireAuth, async (req, res) => {
  try {
    const { corretor_id } = req.query

    const conditions = ["n.status != 'cancelado' AND n.status != 'perdido'"]
    const params = []

    if (corretor_id) {
      conditions.push('n.corretor_id = ?')
      params.push(corretor_id)
    } else if (req.user.role === 'corretor') {
      conditions.push('n.corretor_id = ?')
      params.push(req.user.id)
    }

    const whereClause = conditions.join(' AND ')

    const [negotiations] = await pool.execute(
      `SELECT
        n.*,
        c.nome as client_nome,
        c.telefone as client_telefone,
        c.email as client_email,
        p.titulo as property_titulo,
        p.codigo as property_codigo,
        p.bairro as property_bairro,
        p.cidade as property_cidade,
        p.foto_principal as property_foto,
        p.preco_venda as property_preco_venda,
        p.preco_locacao as property_preco_locacao,
        u.name as corretor_nome,
        u.avatar as corretor_avatar
      FROM negotiations n
      LEFT JOIN clients c ON n.client_id = c.id
      LEFT JOIN properties p ON n.property_id = p.id
      LEFT JOIN users u ON n.corretor_id = u.id
      WHERE ${whereClause}
      ORDER BY n.updated_at DESC`,
      params
    )

    // Group by stage
    const kanban = {}
    for (const stage of KANBAN_STAGES) {
      kanban[stage] = {
        stage,
        label: getStageLabel(stage),
        items: [],
        total_valor: 0,
        count: 0
      }
    }

    for (const neg of negotiations) {
      const stage = neg.estagio || 'novo_lead'
      if (!kanban[stage]) {
        kanban[stage] = {
          stage,
          label: stage,
          items: [],
          total_valor: 0,
          count: 0
        }
      }
      kanban[stage].items.push(neg)
      kanban[stage].total_valor += parseFloat(neg.valor || 0)
      kanban[stage].count++
    }

    return res.json({ kanban, stages: KANBAN_STAGES })
  } catch (err) {
    console.error('Kanban error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

function getStageLabel(stage) {
  const labels = {
    novo_lead: 'Novo Lead',
    qualificacao: 'Qualificação',
    visita_agendada: 'Visita Agendada',
    visita_realizada: 'Visita Realizada',
    proposta: 'Proposta',
    documentacao: 'Documentação',
    fechamento: 'Fechamento',
    pos_venda: 'Pós-venda'
  }
  return labels[stage] || stage
}

// GET /api/negotiations/:id - Single
router.get('/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.execute(
      `SELECT
        n.*,
        c.nome as client_nome,
        c.telefone as client_telefone,
        c.email as client_email,
        c.cpf as client_cpf,
        p.titulo as property_titulo,
        p.codigo as property_codigo,
        p.tipo as property_tipo,
        p.finalidade as property_finalidade,
        p.endereco as property_endereco,
        p.bairro as property_bairro,
        p.cidade as property_cidade,
        p.uf as property_uf,
        p.foto_principal as property_foto,
        p.preco_venda as property_preco_venda,
        p.preco_locacao as property_preco_locacao,
        u.name as corretor_nome,
        u.email as corretor_email,
        u.phone as corretor_telefone,
        u.avatar as corretor_avatar,
        u.creci as corretor_creci
      FROM negotiations n
      LEFT JOIN clients c ON n.client_id = c.id
      LEFT JOIN properties p ON n.property_id = p.id
      LEFT JOIN users u ON n.corretor_id = u.id
      WHERE n.id = ?
      LIMIT 1`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Negociação não encontrada' })
    }

    // Get history/activities
    let history = []
    try {
      const [histRows] = await pool.execute(
        'SELECT * FROM negotiation_history WHERE negotiation_id = ? ORDER BY created_at DESC LIMIT 20',
        [id]
      )
      history = histRows
    } catch (e) {
      // Table may not exist
    }

    return res.json({ negotiation: rows[0], history })
  } catch (err) {
    console.error('Get negotiation error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/negotiations - Create
router.post('/', authenticate, requireAuth, async (req, res) => {
  try {
    const {
      client_id, property_id, lead_id,
      estagio = 'novo_lead', status = 'ativo',
      valor, tipo_negocio,
      data_previsao, data_visita, data_proposta, data_fechamento,
      observacoes, condicoes, corretor_id
    } = req.body

    if (!client_id && !lead_id) {
      return res.status(400).json({ error: 'Cliente ou lead é obrigatório' })
    }

    const assignedCorretor = corretor_id || req.user.id

    const [result] = await pool.execute(
      `INSERT INTO negotiations (
        client_id, property_id, lead_id,
        estagio, status, valor, tipo_negocio,
        data_previsao, data_visita, data_proposta, data_fechamento,
        observacoes, condicoes, corretor_id,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
      )`,
      [
        client_id || null, property_id || null, lead_id || null,
        estagio, status, valor || null, tipo_negocio || null,
        data_previsao || null, data_visita || null, data_proposta || null, data_fechamento || null,
        observacoes || null, condicoes || null, assignedCorretor
      ]
    )

    const newId = result.insertId

    // Log creation in history
    try {
      await pool.execute(
        `INSERT INTO negotiation_history (negotiation_id, estagio, observacao, usuario_id, created_at)
         VALUES (?, ?, 'Negociação criada', ?, NOW())`,
        [newId, estagio, req.user.id]
      )
    } catch (e) {
      // History table may not exist
    }

    const [newNeg] = await pool.execute('SELECT * FROM negotiations WHERE id = ? LIMIT 1', [newId])

    return res.status(201).json({ negotiation: newNeg[0] })
  } catch (err) {
    console.error('Create negotiation error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/negotiations/:id - Update
router.put('/:id', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute(
      'SELECT id, corretor_id, estagio FROM negotiations WHERE id = ? LIMIT 1',
      [id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'Negociação não encontrada' })
    }

    if (req.user.role === 'corretor' && existing[0].corretor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta negociação' })
    }

    const updatableFields = [
      'client_id', 'property_id', 'lead_id',
      'estagio', 'status', 'valor', 'tipo_negocio',
      'data_previsao', 'data_visita', 'data_proposta', 'data_fechamento',
      'observacoes', 'condicoes', 'corretor_id'
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

    const oldEstagio = existing[0].estagio
    const newEstagio = req.body.estagio

    fields.push('updated_at = NOW()')
    values.push(id)

    await pool.execute(
      `UPDATE negotiations SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    // Log stage change
    if (newEstagio && newEstagio !== oldEstagio) {
      try {
        await pool.execute(
          `INSERT INTO negotiation_history (negotiation_id, estagio_anterior, estagio, observacao, usuario_id, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [id, oldEstagio, newEstagio, req.body.observacoes || `Mudou de ${oldEstagio} para ${newEstagio}`, req.user.id]
        )
      } catch (e) {
        // History table may not exist
      }
    }

    const [updated] = await pool.execute('SELECT * FROM negotiations WHERE id = ? LIMIT 1', [id])

    return res.json({ negotiation: updated[0] })
  } catch (err) {
    console.error('Update negotiation error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/negotiations/:id/stage - Move to different stage
router.put('/:id/stage', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { estagio, observacao } = req.body

    if (!estagio) {
      return res.status(400).json({ error: 'Estágio é obrigatório' })
    }

    if (!KANBAN_STAGES.includes(estagio)) {
      return res.status(400).json({ error: `Estágio inválido. Use: ${KANBAN_STAGES.join(', ')}` })
    }

    const [existing] = await pool.execute(
      'SELECT id, corretor_id, estagio FROM negotiations WHERE id = ? LIMIT 1',
      [id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'Negociação não encontrada' })
    }

    if (req.user.role === 'corretor' && existing[0].corretor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para mover esta negociação' })
    }

    const oldEstagio = existing[0].estagio

    await pool.execute(
      'UPDATE negotiations SET estagio = ?, updated_at = NOW() WHERE id = ?',
      [estagio, id]
    )

    try {
      await pool.execute(
        `INSERT INTO negotiation_history (negotiation_id, estagio_anterior, estagio, observacao, usuario_id, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, oldEstagio, estagio, observacao || `Movido para ${getStageLabel(estagio)}`, req.user.id]
      )
    } catch (e) {
      // History table may not exist
    }

    const [updated] = await pool.execute('SELECT * FROM negotiations WHERE id = ? LIMIT 1', [id])

    return res.json({
      negotiation: updated[0],
      message: `Negociação movida para ${getStageLabel(estagio)}`
    })
  } catch (err) {
    console.error('Stage change error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// DELETE /api/negotiations/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [existing] = await pool.execute('SELECT id FROM negotiations WHERE id = ? LIMIT 1', [id])
    if (!existing.length) {
      return res.status(404).json({ error: 'Negociação não encontrada' })
    }

    await pool.execute('DELETE FROM negotiations WHERE id = ?', [id])

    return res.json({ message: 'Negociação excluída com sucesso' })
  } catch (err) {
    console.error('Delete negotiation error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
