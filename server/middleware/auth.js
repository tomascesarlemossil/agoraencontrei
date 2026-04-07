const jwt = require('jsonwebtoken')
const { pool } = require('../config/database')

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : null

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const [rows] = await pool.execute(
      'SELECT id, openId, name, email, role, phone, avatar, creci, bio, company, website, isVerified, planId, planExpiresAt, createdAt, updatedAt, lastSignedIn FROM users WHERE id = ?',
      [decoded.userId]
    )

    if (!rows.length) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    req.user = rows[0]
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Somente administradores.' })
  }
  next()
}

function requireAuth(req, res, next) {
  if (!req.user || !['admin', 'corretor', 'gerente'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado' })
  }
  next()
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null

  if (!token) {
    req.user = null
    return next()
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null
      return next()
    }

    try {
      const [rows] = await pool.execute(
        'SELECT id, openId, name, email, role, phone, avatar, creci, bio, company, website, isVerified, planId, planExpiresAt FROM users WHERE id = ?',
        [decoded.userId]
      )
      req.user = rows.length ? rows[0] : null
    } catch (dbErr) {
      req.user = null
    }
    next()
  })
}

module.exports = { authenticate, requireAdmin, requireAuth, optionalAuth }
