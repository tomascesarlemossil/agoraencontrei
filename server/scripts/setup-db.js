'use strict'

/**
 * setup-db.js
 * Run schema.sql against TiDB Cloud to create all tables.
 *
 * Usage:
 *   node scripts/setup-db.js
 *   node scripts/setup-db.js --drop   (drops & recreates - DESTRUCTIVE)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const fs    = require('fs')
const path  = require('path')
const mysql = require('mysql2/promise')

const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql')
const DROP_FLAG   = process.argv.includes('--drop')

async function setupDatabase () {
  console.log('Connecting to TiDB Cloud...')
  console.log(`  Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 4000}`)
  console.log(`  DB:   ${process.env.DB_NAME}\n`)

  const connection = await mysql.createConnection({
    host              : process.env.DB_HOST,
    port              : parseInt(process.env.DB_PORT || '4000', 10),
    user              : process.env.DB_USER,
    password          : process.env.DB_PASSWORD,
    database          : process.env.DB_NAME,
    ssl               : { rejectUnauthorized: true },
    multipleStatements: true,
    charset           : 'utf8mb4'
  })

  console.log('Connected.\n')

  // -------------------------------------------------------------------------
  // Optional: drop all managed tables (for a clean rebuild)
  // -------------------------------------------------------------------------
  if (DROP_FLAG) {
    console.log('--drop flag detected. Dropping existing tables...\n')
    const tablesToDrop = [
      'notifications',
      'saved_searches',
      'property_views',
      'property_favorites',
      'property_valuations',
      'cms_banners',
      'social_media_posts',
      'property_renewals',
      'mass_messages',
      'activity_log',
      'financings',
      'commissions',
      'contracts',
      'appointments',
      'negotiations',
      'leads',
      'clients',
      'property_images',
      'properties',
      'plans'
    ]
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0')
    for (const tbl of tablesToDrop) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS \`${tbl}\``)
        console.log(`  Dropped: ${tbl}`)
      } catch (err) {
        console.error(`  Could not drop ${tbl}: ${err.message}`)
      }
    }
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1')
    console.log()
  }

  // -------------------------------------------------------------------------
  // Read & split schema.sql
  // -------------------------------------------------------------------------
  console.log(`Reading schema: ${SCHEMA_PATH}`)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')

  // Split on semicolons that end actual statements.
  // We strip comments first to avoid false splits inside comment blocks.
  const cleaned = schema
    .replace(/--[^\n]*\n/g, '\n')   // remove single-line SQL comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments

  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^(\s*SET\s+NAMES|^\s*SET\s+CHARACTER)/i.test(s))

  // -------------------------------------------------------------------------
  // Execute statements one by one for clear error reporting
  // -------------------------------------------------------------------------
  let ok     = 0
  let skipped = 0
  let failed  = 0

  for (const stmt of statements) {
    // Detect table name for logging
    const tableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i)
    const label = tableMatch ? `CREATE TABLE ${tableMatch[1]}` : stmt.substring(0, 60).replace(/\s+/g, ' ')

    try {
      await connection.execute(stmt)
      console.log(`  ✅ ${label}`)
      ok++
    } catch (err) {
      const msg = err.message || ''
      // "already exists" is expected when re-running without --drop
      if (msg.includes('already exists') || err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`  ⏭  ${label} (already exists)`)
        skipped++
      } else {
        console.error(`  ❌ ${label}`)
        console.error(`     ${msg}`)
        console.error(`     Statement: ${stmt.substring(0, 120)}...`)
        failed++
      }
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(60))
  console.log('Database setup complete')
  console.log(`  Executed : ${ok}`)
  console.log(`  Skipped  : ${skipped} (already existed)`)
  console.log(`  Failed   : ${failed}`)
  console.log('='.repeat(60))

  // Verify tables were created
  console.log('\nVerifying tables...')
  const [rows] = await connection.execute(
    `SELECT table_name, table_rows
     FROM information_schema.tables
     WHERE table_schema = ?
     ORDER BY table_name`,
    [process.env.DB_NAME]
  )
  for (const row of rows) {
    console.log(`  ${row.table_name.padEnd(30)} ~${row.table_rows || 0} rows`)
  }

  await connection.end()
  process.exit(failed > 0 ? 1 : 0)
}

setupDatabase().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
