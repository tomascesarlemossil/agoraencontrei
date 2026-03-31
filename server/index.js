const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const { testConnection } = require('./config/database')
const authRoutes = require('./routes/auth')
const propertiesRoutes = require('./routes/properties')
const clientsRoutes = require('./routes/clients')
const leadsRoutes = require('./routes/leads')
const negotiationsRoutes = require('./routes/negotiations')
const dashboardRoutes = require('./routes/dashboard')
const aiRoutes = require('./routes/ai')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://www.agoraencontrei.com.br',
  'https://agoraencontrei.com.br',
  'https://lemospremium-kyeb4hlp.manus.space'
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    // Allow any localhost in dev
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// Public leads limiter (more generous for forms)
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { error: 'Limite de envios atingido. Tente novamente mais tarde.' }
})
app.use('/api/leads', (req, res, next) => {
  if (req.method === 'POST' && !req.headers.authorization) {
    return publicLimiter(req, res, next)
  }
  next()
})

// Request logger (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
    next()
  })
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/properties', propertiesRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/negotiations', negotiationsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/ai', aiRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Imobiliária Lemos / AgoraEncontrei API',
    version: '1.0.0',
    endpoints: [
      'GET  /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET  /api/auth/me',
      'GET  /api/properties',
      'GET  /api/properties/featured',
      'GET  /api/properties/cities',
      'GET  /api/properties/:id',
      'GET  /api/clients',
      'POST /api/clients',
      'GET  /api/leads',
      'POST /api/leads',
      'GET  /api/negotiations',
      'GET  /api/negotiations/kanban',
      'GET  /api/dashboard/stats',
      'POST /api/ai/search',
      'POST /api/ai/chat'
    ]
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origem não permitida' })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no body da requisição' })
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message })
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  process.exit(0)
})

// Start server
async function start() {
  try {
    await testConnection()
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Imobiliária Lemos API running on port ${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🌐 CORS allowed: ${allowedOrigins.join(', ')}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()

module.exports = app
