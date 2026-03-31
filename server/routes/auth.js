const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/database')
const { authenticate, requireAdmin } = require('../middleware/auth')

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

function sanitizeUser(user) {
  const { password, ...safe } = user
  return safe
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    )

    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const user = rows[0]

    if (!user.password) {
      return res.status(401).json({ error: 'Usuário sem senha definida. Use outro método de login.' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    await pool.execute(
      'UPDATE users SET lastSignedIn = NOW() WHERE id = ?',
      [user.id]
    )

    const token = generateToken(user.id)

    return res.json({
      token,
      user: sanitizeUser(user)
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role = 'corretor', creci, company } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' })
    }

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    )

    if (existing.length) {
      return res.status(409).json({ error: 'Email já cadastrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const { v4: uuidv4 } = require('uuid')
    const userId = uuidv4()

    const allowedRoles = ['admin', 'corretor', 'gerente', 'cliente']
    const finalRole = allowedRoles.includes(role) ? role : 'corretor'

    await pool.execute(
      `INSERT INTO users (id, name, email, password, phone, role, creci, company, loginMethod, isVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'email', 1, NOW(), NOW())`,
      [userId, name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, finalRole, creci || null, company || null]
    )

    const [newUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    )

    const token = generateToken(userId)

    return res.status(201).json({
      token,
      user: sanitizeUser(newUser[0])
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, openId, name, email, role, phone, avatar, creci, bio, company, website, isVerified, planId, planExpiresAt, createdAt, updatedAt, lastSignedIn FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    return res.json({ user: rows[0] })
  } catch (err) {
    console.error('Get me error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, avatar, creci, bio, company, website } = req.body
    const userId = req.user.id

    const fields = []
    const values = []

    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()) }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null) }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar || null) }
    if (creci !== undefined) { fields.push('creci = ?'); values.push(creci || null) }
    if (bio !== undefined) { fields.push('bio = ?'); values.push(bio || null) }
    if (company !== undefined) { fields.push('company = ?'); values.push(company || null) }
    if (website !== undefined) { fields.push('website = ?'); values.push(website || null) }

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    }

    fields.push('updatedAt = NOW()')
    values.push(userId)

    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    const [updated] = await pool.execute(
      'SELECT id, openId, name, email, role, phone, avatar, creci, bio, company, website, isVerified, planId, planExpiresAt, createdAt, updatedAt FROM users WHERE id = ? LIMIT 1',
      [userId]
    )

    return res.json({ user: updated[0] })
  } catch (err) {
    console.error('Update profile error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' })
    }

    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (!rows.length || !rows[0].password) {
      return res.status(400).json({ error: 'Usuário sem senha definida' })
    }

    const passwordMatch = await bcrypt.compare(currentPassword, rows[0].password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Senha atual incorreta' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await pool.execute(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, req.user.id]
    )

    return res.json({ message: 'Senha alterada com sucesso' })
  } catch (err) {
    console.error('Change password error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = generateToken(req.user.id)
    return res.json({ token, user: req.user })
  } catch (err) {
    console.error('Refresh token error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/auth/create-admin (utility to create first admin)
router.post('/create-admin', async (req, res) => {
  try {
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    )

    if (existing.length) {
      return res.status(409).json({ error: 'Administrador já existe' })
    }

    const { name = 'Administrador', email = 'admin@imobiliarialemos.com.br', password = 'admin123' } = req.body
    const hashedPassword = await bcrypt.hash(password, 12)
    const { v4: uuidv4 } = require('uuid')
    const userId = uuidv4()

    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, loginMethod, isVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'admin', 'email', 1, NOW(), NOW())`,
      [userId, name, email, hashedPassword]
    )

    const token = generateToken(userId)

    return res.status(201).json({
      message: 'Admin criado com sucesso',
      token,
      credentials: { email, password }
    })
  } catch (err) {
    console.error('Create admin error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

module.exports = router
