const express = require('express')
const router = express.Router()
const { pool } = require('../config/database')
const { authenticate, requireAuth } = require('../middleware/auth')

// GET /api/dashboard/stats - KPI cards
router.get('/stats', authenticate, requireAuth, async (req, res) => {
  try {
    const isAdmin = ['admin', 'gerente'].includes(req.user.role)
    const userId = req.user.id

    const corretorFilter = isAdmin ? '' : 'AND corretor_id = ?'
    const corretorParam = isAdmin ? [] : [userId]

    // Total imoveis
    let totalImoveis = 0
    try {
      const [r] = await pool.execute(
        `SELECT COUNT(*) as total FROM properties WHERE status != 'inativo'`
      )
      totalImoveis = r[0].total
    } catch (e) {}

    // Novos leads do mes
    let novosLeadsMes = 0
    try {
      const [r] = await pool.execute(
        `SELECT COUNT(*) as total FROM leads
         WHERE MONTH(created_at) = MONTH(NOW())
           AND YEAR(created_at) = YEAR(NOW())
           ${corretorFilter}`,
        corretorParam
      )
      novosLeadsMes = r[0].total
    } catch (e) {}

    // Negociacoes ativas
    let negociacoesAtivas = 0
    try {
      const [r] = await pool.execute(
        `SELECT COUNT(*) as total FROM negotiations
         WHERE status = 'ativo'
           ${corretorFilter}`,
        corretorParam
      )
      negociacoesAtivas = r[0].total
    } catch (e) {}

    // Receita do mes (fechamentos)
    let receitaMes = 0
    try {
      const [r] = await pool.execute(
        `SELECT COALESCE(SUM(valor), 0) as total FROM negotiations
         WHERE status = 'fechado'
           AND MONTH(updated_at) = MONTH(NOW())
           AND YEAR(updated_at) = YEAR(NOW())
           ${corretorFilter}`,
        corretorParam
      )
      receitaMes = parseFloat(r[0].total) || 0
    } catch (e) {}

    // Imoveis ativos por tipo
    let imoveisPorTipo = []
    try {
      const [r] = await pool.execute(
        `SELECT tipo, COUNT(*) as total
         FROM properties
         WHERE status != 'inativo'
         GROUP BY tipo
         ORDER BY total DESC
         LIMIT 10`
      )
      imoveisPorTipo = r
    } catch (e) {}

    // Leads por temperatura
    let leadsPorTemperatura = []
    try {
      const [r] = await pool.execute(
        `SELECT temperatura, COUNT(*) as total
         FROM leads
         WHERE status != 'convertido' AND status != 'perdido'
         ${corretorFilter}
         GROUP BY temperatura`,
        corretorParam
      )
      leadsPorTemperatura = r
    } catch (e) {}

    // Imoveis adicionados este mes
    let imoveisNovosMes = 0
    try {
      const [r] = await pool.execute(
        `SELECT COUNT(*) as total FROM properties
         WHERE MONTH(created_at) = MONTH(NOW())
           AND YEAR(created_at) = YEAR(NOW())`
      )
      imoveisNovosMes = r[0].total
    } catch (e) {}

    // Visualizacoes totais
    let visualizacoesTotais = 0
    try {
      const [r] = await pool.execute(
        `SELECT COALESCE(SUM(visualizacoes), 0) as total FROM properties`
      )
      visualizacoesTotais = parseInt(r[0].total) || 0
    } catch (e) {}

    return res.json({
      stats: {
        total_imoveis: totalImoveis,
        novos_leads_mes: novosLeadsMes,
        negociacoes_ativas: negociacoesAtivas,
        receita_mes: receitaMes,
        imoveis_novos_mes: imoveisNovosMes,
        visualizacoes_totais: visualizacoesTotais,
        imoveis_por_tipo: imoveisPorTipo,
        leads_por_temperatura: leadsPorTemperatura
      }
    })
  } catch (err) {
    console.error('Dashboard stats error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/dashboard/charts/negotiations-by-month - Last 12 months
router.get('/charts/negotiations-by-month', authenticate, requireAuth, async (req, res) => {
  try {
    const isAdmin = ['admin', 'gerente'].includes(req.user.role)
    const corretorFilter = isAdmin ? '' : 'AND corretor_id = ?'
    const corretorParam = isAdmin ? [] : [req.user.id]

    let data = []
    try {
      const [rows] = await pool.execute(
        `SELECT
          DATE_FORMAT(created_at, '%Y-%m') as mes,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'fechado' THEN 1 ELSE 0 END) as fechados,
          SUM(CASE WHEN status = 'perdido' THEN 1 ELSE 0 END) as perdidos,
          COALESCE(SUM(CASE WHEN status = 'fechado' THEN valor ELSE 0 END), 0) as valor_fechado
        FROM negotiations
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          ${corretorFilter}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mes ASC`,
        corretorParam
      )
      data = rows
    } catch (e) {
      console.error('Negotiations by month query error:', e.message)
    }

    // Fill missing months
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const found = data.find(r => r.mes === key)
      months.push({
        mes: key,
        total: found ? found.total : 0,
        fechados: found ? found.fechados : 0,
        perdidos: found ? found.perdidos : 0,
        valor_fechado: found ? parseFloat(found.valor_fechado) : 0
      })
    }

    return res.json({ data: months })
  } catch (err) {
    console.error('Negotiations by month error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/dashboard/charts/leads-by-origin - Lead sources
router.get('/charts/leads-by-origin', authenticate, requireAuth, async (req, res) => {
  try {
    const isAdmin = ['admin', 'gerente'].includes(req.user.role)
    const corretorFilter = isAdmin ? '' : 'AND corretor_id = ?'
    const corretorParam = isAdmin ? [] : [req.user.id]

    let data = []
    try {
      const [rows] = await pool.execute(
        `SELECT
          COALESCE(origem, 'desconhecido') as origem,
          COUNT(*) as total,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM leads ${isAdmin ? '' : 'WHERE corretor_id = ?'}), 1) as percentual
        FROM leads
        WHERE 1=1 ${corretorFilter}
        GROUP BY origem
        ORDER BY total DESC`,
        isAdmin ? corretorParam : [...corretorParam, ...corretorParam]
      )
      data = rows
    } catch (e) {
      console.error('Leads by origin query error:', e.message)
    }

    return res.json({ data })
  } catch (err) {
    console.error('Leads by origin error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/dashboard/charts/properties-by-city
router.get('/charts/properties-by-city', authenticate, requireAuth, async (req, res) => {
  try {
    const [data] = await pool.execute(
      `SELECT
        cidade,
        COUNT(*) as total,
        SUM(CASE WHEN finalidade = 'venda' THEN 1 ELSE 0 END) as venda,
        SUM(CASE WHEN finalidade = 'locacao' THEN 1 ELSE 0 END) as locacao
      FROM properties
      WHERE status != 'inativo' AND cidade IS NOT NULL AND cidade != ''
      GROUP BY cidade
      ORDER BY total DESC
      LIMIT 10`
    )

    return res.json({ data })
  } catch (err) {
    console.error('Properties by city error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/dashboard/activity - Recent 20 activities
router.get('/activity', authenticate, requireAuth, async (req, res) => {
  try {
    const isAdmin = ['admin', 'gerente'].includes(req.user.role)
    const activities = []

    // Recent leads
    try {
      const corretorFilter = isAdmin ? '' : 'AND corretor_id = ?'
      const params = isAdmin ? [] : [req.user.id]
      const [leads] = await pool.execute(
        `SELECT
          id,
          'lead' as tipo,
          nome as titulo,
          email as subtitulo,
          origem as detalhes,
          created_at as timestamp
        FROM leads
        WHERE 1=1 ${corretorFilter}
        ORDER BY created_at DESC
        LIMIT 5`,
        params
      )
      activities.push(...leads)
    } catch (e) {}

    // Recent negotiations stage changes
    try {
      const corretorFilter = isAdmin ? '' : 'AND n.corretor_id = ?'
      const params = isAdmin ? [] : [req.user.id]
      const [negs] = await pool.execute(
        `SELECT
          n.id,
          'negociacao' as tipo,
          CONCAT(COALESCE(c.nome, 'Cliente'), ' - ', COALESCE(p.titulo, 'Imóvel')) as titulo,
          n.estagio as subtitulo,
          n.status as detalhes,
          n.updated_at as timestamp
        FROM negotiations n
        LEFT JOIN clients c ON n.client_id = c.id
        LEFT JOIN properties p ON n.property_id = p.id
        WHERE 1=1 ${corretorFilter}
        ORDER BY n.updated_at DESC
        LIMIT 5`,
        params
      )
      activities.push(...negs)
    } catch (e) {}

    // Recent properties
    try {
      const [props] = await pool.execute(
        `SELECT
          id,
          'imovel' as tipo,
          titulo,
          CONCAT(bairro, ', ', cidade) as subtitulo,
          status as detalhes,
          created_at as timestamp
        FROM properties
        ORDER BY created_at DESC
        LIMIT 5`
      )
      activities.push(...props)
    } catch (e) {}

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return res.json({ activities: activities.slice(0, 20) })
  } catch (err) {
    console.error('Activity error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/dashboard/agenda-today - Today's appointments
router.get('/agenda-today', authenticate, requireAuth, async (req, res) => {
  try {
    const isAdmin = ['admin', 'gerente'].includes(req.user.role)
    const corretorFilter = isAdmin ? '' : 'AND n.corretor_id = ?'
    const params = isAdmin ? [] : [req.user.id]

    let agenda = []
    try {
      const [rows] = await pool.execute(
        `SELECT
          n.id,
          n.estagio,
          n.status,
          n.data_visita,
          n.observacoes,
          c.nome as client_nome,
          c.telefone as client_telefone,
          p.titulo as property_titulo,
          p.endereco as property_endereco,
          p.bairro as property_bairro,
          p.cidade as property_cidade,
          p.foto_principal as property_foto
        FROM negotiations n
        LEFT JOIN clients c ON n.client_id = c.id
        LEFT JOIN properties p ON n.property_id = p.id
        WHERE DATE(n.data_visita) = CURDATE()
          AND n.status = 'ativo'
          ${corretorFilter}
        ORDER BY n.data_visita ASC`,
        params
      )
      agenda = rows
    } catch (e) {
      console.error('Agenda query error:', e.message)
    }

    return res.json({ agenda })
  } catch (err) {
    console.error('Agenda today error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/dashboard/funnel - Conversion funnel
router.get('/funnel', authenticate, requireAuth, async (req, res) => {
  try {
    const isAdmin = ['admin', 'gerente'].includes(req.user.role)
    const corretorFilter = isAdmin ? '' : 'AND corretor_id = ?'
    const params = isAdmin ? [] : [req.user.id]

    let funnel = []
    try {
      const [rows] = await pool.execute(
        `SELECT
          estagio,
          COUNT(*) as total,
          COALESCE(SUM(valor), 0) as valor_total
        FROM negotiations
        WHERE status = 'ativo' ${corretorFilter}
        GROUP BY estagio
        ORDER BY FIELD(estagio, 'novo_lead', 'qualificacao', 'visita_agendada', 'visita_realizada', 'proposta', 'documentacao', 'fechamento', 'pos_venda')`,
        params
      )
      funnel = rows
    } catch (e) {
      console.error('Funnel query error:', e.message)
    }

    return res.json({ funnel })
  } catch (err) {
    console.error('Funnel error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
