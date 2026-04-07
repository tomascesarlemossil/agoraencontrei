/**
 * dedup-clients.js
 *
 * TASK 1: Deduplication of clients
 * - Merges duplicates by normalized name + phone
 * - Priority: record with most data (document > email > phoneMobile > oldest)
 * - Special case: GUSTAVO ALVARENGA FONSECA (legacyId 000028) is canonical
 * - Updates foreign keys: contracts.landlordId/tenantId/guarantorId
 * - Task 1b: Links contacts.cpf to clients.document where name/email match
 */

'use strict'

const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client')

const DB_URL = 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require'
const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n'
const GUSTAVO_CANONICAL_ID = 'cmnhzieqf0001mx1cqcqgfv4n' // will be determined dynamically

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
  log: ['error'],
})

// Normalize a name for comparison
function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-záàâãéèêíïóôõúüç0-9 ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Normalize phone to digits only
function normalizePhone(phone) {
  return (phone || '').replace(/[^0-9]/g, '')
}

// Score a record by richness (higher = better canonical)
function richness(c) {
  let score = 0
  if (c.document) score += 100
  if (c.email) score += 50
  if (c.phoneMobile) score += 20
  if (c.phone) score += 15
  if (c.profession) score += 10
  if (c.address) score += 10
  if (c.rg) score += 5
  if (c.birthDate) score += 5
  // Prefer records with legacyId 000028 (the canonical Gustavo)
  if (c.legacyId === '000028') score += 1000
  return score
}

// Merge two client records, keeping the richest fields
function mergeRecords(canonical, duplicate) {
  const merged = { ...canonical }
  const fields = ['document', 'rg', 'profession', 'birthDate', 'email', 'phone', 'phoneMobile',
                  'phoneWork', 'address', 'addressComplement', 'neighborhood', 'city', 'state',
                  'zipCode', 'notes']

  for (const f of fields) {
    if (!merged[f] && duplicate[f]) {
      merged[f] = duplicate[f]
    }
  }

  // Merge roles (union)
  const allRoles = [...new Set([...(canonical.roles || []), ...(duplicate.roles || [])])]
  merged.roles = allRoles

  return merged
}

async function runDedup() {
  console.log('=== Client Deduplication Script ===')
  console.log('Company:', COMPANY_ID)
  console.log('')

  // ── Step 1: Handle GUSTAVO ALVARENGA FONSECA special case ────────────────
  console.log('Step 1: Handling Gustavo Alvarenga Fonseca special case...')

  // Find all Gustavo Alvarenga variants
  const gustavos = await prisma.client.findMany({
    where: {
      companyId: COMPANY_ID,
      name: { contains: 'GUSTAVO', mode: 'insensitive' },
      AND: [
        { OR: [
          { name: { contains: 'ALVARENGA', mode: 'insensitive' } }
        ]}
      ]
    }
  })

  console.log(`Found ${gustavos.length} Gustavo Alvarenga variants`)

  // Find canonical (legacyId 000028 with CPF 07176684871)
  const gustavoCanonical = gustavos.find(g => g.legacyId === '000028') ||
    gustavos.sort((a, b) => richness(b) - richness(a))[0]

  if (gustavoCanonical) {
    console.log(`  Canonical: ${gustavoCanonical.name} (id: ${gustavoCanonical.id}, legacy: ${gustavoCanonical.legacyId})`)

    const gustavoDuplicates = gustavos.filter(g => g.id !== gustavoCanonical.id)
    console.log(`  Merging ${gustavoDuplicates.length} duplicates into canonical`)

    for (const dup of gustavoDuplicates) {
      // Update contracts
      await Promise.all([
        prisma.contract.updateMany({ where: { landlordId: dup.id }, data: { landlordId: gustavoCanonical.id } }),
        prisma.contract.updateMany({ where: { tenantId: dup.id }, data: { tenantId: gustavoCanonical.id } }),
        prisma.contract.updateMany({ where: { guarantorId: dup.id }, data: { guarantorId: gustavoCanonical.id } }),
      ])

      // Update leads
      await prisma.lead.updateMany({
        where: { contactId: dup.id },
        data: { contactId: gustavoCanonical.id }
      }).catch(() => {})

      // Delete duplicate
      await prisma.client.delete({ where: { id: dup.id } }).catch(e => {
        console.warn(`  Could not delete ${dup.id}: ${e.message}`)
      })
    }

    // Ensure canonical has CPF
    if (!gustavoCanonical.document) {
      await prisma.client.update({
        where: { id: gustavoCanonical.id },
        data: { document: '07176684871', email: gustavoCanonical.email || 'g9651@hotmail.com.br' }
      }).catch(() => {})
    }

    console.log('  Gustavo consolidation done')
  }

  // ── Step 2: Find and merge all duplicates by name+phone ──────────────────
  console.log('\nStep 2: Finding all duplicates by name + phone...')

  const dupGroups = await prisma.$queryRawUnsafe(`
    SELECT
      lower(trim(regexp_replace(name, '[^a-zA-ZÀ-ÿ0-9 ]', '', 'g'))) as nname,
      regexp_replace(COALESCE(NULLIF(TRIM("phoneMobile"), ''), NULLIF(TRIM(phone), ''), ''), '[^0-9]', '', 'g') as phone_digits,
      COUNT(*)::text as cnt,
      array_agg(id ORDER BY
        CASE WHEN document IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN email IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN "phoneMobile" IS NOT NULL THEN 0 ELSE 1 END,
        "createdAt" ASC
      ) as ids
    FROM clients
    WHERE "companyId" = '${COMPANY_ID}'
      AND COALESCE(NULLIF(TRIM("phoneMobile"), ''), NULLIF(TRIM(phone), ''), '') != ''
    GROUP BY
      lower(trim(regexp_replace(name, '[^a-zA-ZÀ-ÿ0-9 ]', '', 'g'))),
      regexp_replace(COALESCE(NULLIF(TRIM("phoneMobile"), ''), NULLIF(TRIM(phone), ''), ''), '[^0-9]', '', 'g')
    HAVING COUNT(*) > 1
      AND length(lower(trim(regexp_replace(name, '[^a-zA-ZÀ-ÿ0-9 ]', '', 'g')))) > 5
    ORDER BY COUNT(*) DESC
  `)

  console.log(`Found ${dupGroups.length} duplicate groups to process`)

  let mergedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const group of dupGroups) {
    const ids = group.ids
    if (!ids || ids.length < 2) continue

    // Load all records in group
    const records = await prisma.client.findMany({ where: { id: { in: ids } } })
    if (records.length < 2) continue

    // Sort by richness (best first)
    records.sort((a, b) => richness(b) - richness(a))

    const canonical = records[0]
    const duplicates = records.slice(1)

    // Merge data into canonical
    let mergedData = canonical
    for (const dup of duplicates) {
      mergedData = mergeRecords(mergedData, dup)
    }

    // Update canonical with merged data
    const { id, companyId, legacyId, createdAt, updatedAt, ...updateData } = mergedData

    try {
      await prisma.client.update({
        where: { id: canonical.id },
        data: updateData,
      })

      // Update foreign keys and delete duplicates
      for (const dup of duplicates) {
        await Promise.all([
          prisma.contract.updateMany({ where: { landlordId: dup.id }, data: { landlordId: canonical.id } }),
          prisma.contract.updateMany({ where: { tenantId: dup.id }, data: { tenantId: canonical.id } }),
          prisma.contract.updateMany({ where: { guarantorId: dup.id }, data: { guarantorId: canonical.id } }),
          prisma.lead.updateMany({ where: { contactId: dup.id }, data: { contactId: canonical.id } }).catch(() => {}),
        ])

        await prisma.client.delete({ where: { id: dup.id } }).catch(e => {
          // Might have other FK constraints, skip
          skippedCount++
        })
        mergedCount++
      }
    } catch (e) {
      errorCount++
      // console.error(`Error merging group ${group.nname}: ${e.message}`)
    }
  }

  console.log(`  Merged: ${mergedCount} duplicates`)
  console.log(`  Skipped (FK issues): ${skippedCount}`)
  console.log(`  Errors: ${errorCount}`)

  // ── Step 3: Link contacts.cpf to clients.document ────────────────────────
  console.log('\nStep 3: Linking contacts CPF to clients...')

  // contacts table has cpf field
  const contactsWithCpf = await prisma.contact.findMany({
    where: {
      companyId: COMPANY_ID,
      cpf: { not: null }
    },
    select: { id: true, name: true, cpf: true, email: true, phone: true, mobilePhone: true }
  })

  console.log(`Contacts with CPF: ${contactsWithCpf.length}`)

  let cpfLinked = 0

  for (const contact of contactsWithCpf) {
    if (!contact.cpf) continue

    // Try to find matching client by email first
    let matchedClient = null

    if (contact.email) {
      matchedClient = await prisma.client.findFirst({
        where: { companyId: COMPANY_ID, email: contact.email, document: null }
      })
    }

    // Try by name similarity + phone
    if (!matchedClient) {
      const normName = normalizeName(contact.name)
      const phone = normalizePhone(contact.phone || contact.mobilePhone || '')

      if (normName.length > 5) {
        const nameClients = await prisma.client.findMany({
          where: {
            companyId: COMPANY_ID,
            name: { contains: contact.name.split(' ')[0], mode: 'insensitive' },
            document: null
          },
          take: 10
        })

        for (const c of nameClients) {
          if (normalizeName(c.name) === normName) {
            if (!phone || normalizePhone(c.phone || c.phoneMobile || '') === phone) {
              matchedClient = c
              break
            }
          }
        }
      }
    }

    if (matchedClient) {
      await prisma.client.update({
        where: { id: matchedClient.id },
        data: { document: contact.cpf }
      }).catch(() => {})
      cpfLinked++
    }
  }

  console.log(`CPF linked to clients: ${cpfLinked}`)

  // ── Final stats ──────────────────────────────────────────────────────────
  const finalCount = await prisma.client.count({ where: { companyId: COMPANY_ID } })
  console.log(`\n=== Done ===`)
  console.log(`Final client count: ${finalCount}`)

  await prisma.$disconnect()
}

runDedup().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
