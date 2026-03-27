const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '4000'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-03:00',
  charset: 'utf8mb4'
})

async function testConnection() {
  try {
    const conn = await pool.getConnection()
    console.log('✅ TiDB MySQL connected successfully')
    conn.release()
  } catch (err) {
    console.error('❌ Database connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = { pool, testConnection }
