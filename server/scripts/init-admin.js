'use strict'

/**
 * init-admin.js
 * Creates or updates the admin user in the `users` table.
 *
 * Usage:
 *   node scripts/init-admin.js
 *   ADMIN_PASSWORD=mySecret node scripts/init-admin.js
 *
 * If ADMIN_PASSWORD env var is not set, a secure random password is generated
 * and printed to stdout once — save it immediately.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { pool } = require('../config/database')

// ---------------------------------------------------------------------------
// Admin user details
// ---------------------------------------------------------------------------
const ADMIN = {
  name    : 'Tomás César Lemos Silva',
  email   : 'tomas@agoraencontrei.com.br',
  role    : 'admin',
  phone   : null,
  creci   : null,
  company : 'Imobiliária Lemos',
  website : 'https://www.imobiliarialemos.com.br',
  isVerified : 1
}

async function initAdmin () {
  // Resolve password: env var → random
  let rawPassword = process.env.ADMIN_PASSWORD
  let passwordWasGenerated = false

  if (!rawPassword || rawPassword.trim() === '') {
    rawPassword = crypto.randomBytes(18).toString('base64url')
    passwordWasGenerated = true
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12)

  console.log('Initialising admin user...')
  console.log(`  Name  : ${ADMIN.name}`)
  console.log(`  Email : ${ADMIN.email}`)
  console.log(`  Role  : ${ADMIN.role}`)
  console.log()

  // -------------------------------------------------------------------------
  // Check whether 'password' column exists on the users table.
  // The users table was pre-existing; this script adapts to its schema.
  // -------------------------------------------------------------------------
  const [cols] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'users'`
  )
  const columnNames = cols.map(c => c.COLUMN_NAME)

  const hasPassword     = columnNames.includes('password')
  const hasPasswordHash = columnNames.includes('passwordHash')
  const hasOpenId       = columnNames.includes('openId')
  const hasLoginMethod  = columnNames.includes('loginMethod')

  // Build dynamic INSERT fields
  const fields = ['name', 'email', 'role', 'isVerified']
  const placeholders = ['?', '?', '?', '?']
  const values = [ADMIN.name, ADMIN.email, ADMIN.role, ADMIN.isVerified]

  const updateParts = [
    'name        = VALUES(name)',
    'role        = VALUES(role)',
    'isVerified  = VALUES(isVerified)',
    'updatedAt   = NOW()'
  ]

  if (hasPassword) {
    fields.push('password')
    placeholders.push('?')
    values.push(passwordHash)
    updateParts.push('password = VALUES(password)')
  }

  if (hasPasswordHash) {
    fields.push('passwordHash')
    placeholders.push('?')
    values.push(passwordHash)
    updateParts.push('passwordHash = VALUES(passwordHash)')
  }

  if (hasOpenId) {
    fields.push('openId')
    placeholders.push('?')
    values.push(`local_${ADMIN.email}`)
  }

  if (hasLoginMethod) {
    fields.push('loginMethod')
    placeholders.push('?')
    values.push('local')
    updateParts.push("loginMethod = 'local'")
  }

  if (columnNames.includes('phone') && ADMIN.phone) {
    fields.push('phone')
    placeholders.push('?')
    values.push(ADMIN.phone)
    updateParts.push('phone = VALUES(phone)')
  }

  if (columnNames.includes('creci') && ADMIN.creci) {
    fields.push('creci')
    placeholders.push('?')
    values.push(ADMIN.creci)
  }

  if (columnNames.includes('company')) {
    fields.push('company')
    placeholders.push('?')
    values.push(ADMIN.company)
    updateParts.push('company = VALUES(company)')
  }

  if (columnNames.includes('website')) {
    fields.push('website')
    placeholders.push('?')
    values.push(ADMIN.website)
    updateParts.push('website = VALUES(website)')
  }

  if (columnNames.includes('createdAt')) {
    fields.push('createdAt')
    placeholders.push('NOW()')
    // no ? placeholder needed — literal function
    values.pop() // undo the last push since NOW() is a literal
    // Actually rebuild properly:
  }

  // Rebuild cleanly using a helper that avoids the NOW() complexity
  await upsertAdmin(pool, columnNames, passwordHash, rawPassword, passwordWasGenerated)
}

async function upsertAdmin (pool, columnNames, passwordHash, rawPassword, passwordWasGenerated) {
  // Check if user already exists
  const [existing] = await pool.execute(
    'SELECT id, role FROM users WHERE email = ? LIMIT 1',
    [ADMIN.email]
  )

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  if (existing.length > 0) {
    // UPDATE path — only touch columns that exist
    const setParts = [`role = 'admin'`, `isVerified = 1`, `updatedAt = NOW()`]

    if (columnNames.includes('name'))        setParts.push(`name = '${ADMIN.name.replace(/'/g, "\\'")}'`)
    if (columnNames.includes('company'))     setParts.push(`company = '${ADMIN.company}'`)
    if (columnNames.includes('website'))     setParts.push(`website = '${ADMIN.website}'`)
    if (columnNames.includes('password'))    setParts.push(`password = ?`)
    if (columnNames.includes('passwordHash')) setParts.push(`passwordHash = ?`)
    if (columnNames.includes('loginMethod')) setParts.push(`loginMethod = 'local'`)

    const hashValues = []
    if (columnNames.includes('password'))    hashValues.push(passwordHash)
    if (columnNames.includes('passwordHash')) hashValues.push(passwordHash)

    const sql = `UPDATE users SET ${setParts.join(', ')} WHERE email = ?`
    await pool.execute(sql, [...hashValues, ADMIN.email])

    console.log(`✅ Admin user UPDATED (id: ${existing[0].id})`)
  } else {
    // INSERT path
    const insertCols = ['name', 'email', 'role', 'isVerified']
    const insertVals = [ADMIN.name, ADMIN.email, 'admin', 1]

    if (columnNames.includes('openId')) {
      insertCols.push('openId')
      insertVals.push(`local_${ADMIN.email}`)
    }
    if (columnNames.includes('loginMethod')) {
      insertCols.push('loginMethod')
      insertVals.push('local')
    }
    if (columnNames.includes('password')) {
      insertCols.push('password')
      insertVals.push(passwordHash)
    }
    if (columnNames.includes('passwordHash')) {
      insertCols.push('passwordHash')
      insertVals.push(passwordHash)
    }
    if (columnNames.includes('company')) {
      insertCols.push('company')
      insertVals.push(ADMIN.company)
    }
    if (columnNames.includes('website')) {
      insertCols.push('website')
      insertVals.push(ADMIN.website)
    }
    if (columnNames.includes('createdAt')) {
      insertCols.push('createdAt')
      insertVals.push(now)
    }
    if (columnNames.includes('updatedAt')) {
      insertCols.push('updatedAt')
      insertVals.push(now)
    }

    const sql = `
      INSERT INTO users (${insertCols.join(', ')})
      VALUES (${insertCols.map(() => '?').join(', ')})`

    const [result] = await pool.execute(sql, insertVals)
    console.log(`✅ Admin user CREATED (id: ${result.insertId})`)
  }

  // -------------------------------------------------------------------------
  // Print credentials
  // -------------------------------------------------------------------------
  console.log()
  console.log('Admin credentials:')
  console.log(`  Email    : ${ADMIN.email}`)

  if (passwordWasGenerated) {
    console.log(`  Password : ${rawPassword}  ← SAVE THIS NOW (shown once)`)
  } else {
    console.log('  Password : (set from ADMIN_PASSWORD env var)')
  }

  await pool.end()
  process.exit(0)
}

initAdmin().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
