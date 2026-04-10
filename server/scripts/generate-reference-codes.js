/**
 * Script to generate AE-XXXX reference codes for all properties
 * that don't already have one.
 *
 * Usage: node server/scripts/generate-reference-codes.js
 */
const { pool } = require('../config/database')

async function generateReferenceCodes() {
  try {
    console.log('Generating reference codes for properties...')

    // Get the highest existing AE- code
    const [existing] = await pool.execute(
      "SELECT codigo FROM properties WHERE codigo LIKE 'AE-%' ORDER BY codigo DESC LIMIT 1"
    )
    let nextNum = 1
    if (existing.length > 0) {
      const num = parseInt(existing[0].codigo.replace('AE-', ''), 10)
      if (!isNaN(num)) nextNum = num + 1
    }

    // Get all properties without a reference code (null or empty)
    const [properties] = await pool.execute(
      "SELECT id, titulo FROM properties WHERE codigo IS NULL OR codigo = '' ORDER BY id ASC"
    )

    if (properties.length === 0) {
      console.log('All properties already have reference codes.')
      process.exit(0)
    }

    console.log(`Found ${properties.length} properties without reference codes.`)

    for (const prop of properties) {
      const code = `AE-${String(nextNum).padStart(4, '0')}`
      await pool.execute(
        'UPDATE properties SET codigo = ? WHERE id = ?',
        [code, prop.id]
      )
      console.log(`  ${code} -> ${prop.titulo || `ID ${prop.id}`}`)
      nextNum++
    }

    console.log(`Done! Generated ${properties.length} reference codes.`)
    process.exit(0)
  } catch (err) {
    console.error('Error generating reference codes:', err)
    process.exit(1)
  }
}

generateReferenceCodes()
