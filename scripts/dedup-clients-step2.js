/**
 * dedup-clients-step2.js
 *
 * Step 2: Merge all remaining duplicates by name+phone
 * (Gustavo special case already done in dedup-clients.js)
 */

'use strict'

const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client')

const DB_URL = 'postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n'

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
  log: ['error'],
})

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
  return score
}

function mergeRecords(canonical, duplicate) {
  const merged = { ...canonical }
  const fields = ['document', 'rg', 'profession', 'birthDate', 'email', 'phone', 'phoneMobile',
                  'phoneWork', 'address', 'addressComplement', 'neighborhood', 'city', 'state',
                  'zipCode', 'notes']
  for (const f of fields) {
    if (!merged[f] && duplicate[f]) merged[f] = duplicate[f]
  }
  merged.roles = [...new Set([...(canonical.roles || []), ...(duplicate.roles || [])])]
  return merged
}

async function run() {
  console.log('=== Dedup Step 2: Name+Phone matching ===')

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

  console.log(`Total duplicate groups: ${dupGroups.length}`)

  let mergedCount = 0
  let skippedCount = 0

  for (let gi = 0; gi < dupGroups.length; gi++) {
    const group = dupGroups[gi]
    const ids = group.ids
    if (!ids || ids.length < 2) continue

    const records = await prisma.client.findMany({ where: { id: { in: ids } } })
    if (records.length < 2) continue

    records.sort((a, b) => richness(b) - richness(a))
    const canonical = records[0]
    const duplicates = records.slice(1)

    let mergedData = canonical
    for (const dup of duplicates) mergedData = mergeRecords(mergedData, dup)

    const { id, companyId, legacyId, createdAt, updatedAt, ...updateData } = mergedData

    try {
      await prisma.client.update({ where: { id: canonical.id }, data: updateData })

      for (const dup of duplicates) {
        // Update FK references
        await Promise.all([
          prisma.contract.updateMany({ where: { landlordId: dup.id }, data: { landlordId: canonical.id } }),
          prisma.contract.updateMany({ where: { tenantId: dup.id }, data: { tenantId: canonical.id } }),
          prisma.contract.updateMany({ where: { guarantorId: dup.id }, data: { guarantorId: canonical.id } }),
        ])

        await prisma.client.delete({ where: { id: dup.id } })
        mergedCount++
      }
    } catch (e) {
      skippedCount++
    }

    if ((gi + 1) % 100 === 0) {
      process.stdout.write(`\rProcessed ${gi + 1}/${dupGroups.length} groups, merged ${mergedCount}, skipped ${skippedCount}`)
    }
  }

  console.log(`\n\nMerged: ${mergedCount}, Skipped: ${skippedCount}`)

  // Step 3: Link contacts CPF to clients
  console.log('\nStep 3: Link contacts CPF to clients...')

  // contacts table has cpf
  const contactsWithCpf = await prisma.$queryRawUnsafe(`
    SELECT id, name, cpf, email, phone, "mobilePhone"
    FROM contacts
    WHERE "companyId" = '${COMPANY_ID}' AND cpf IS NOT NULL AND cpf != ''
  `)

  console.log(`Contacts with CPF: ${contactsWithCpf.length}`)

  let cpfLinked = 0
  for (const contact of contactsWithCpf) {
    if (!contact.cpf) continue

    let matched = null

    // Try by email first
    if (contact.email) {
      matched = await prisma.client.findFirst({
        where: { companyId: COMPANY_ID, email: contact.email, document: null }
      })
    }

    // Try by normalized name + phone
    if (!matched) {
      const normName = (contact.name || '').toLowerCase().trim().replace(/[^a-z0-9àáâãéèêíïóôõúüç ]/g, '').replace(/\s+/g, ' ').trim()
      if (normName.length > 5) {
        const firstName = contact.name.split(' ')[0]
        const candidates = await prisma.client.findMany({
          where: { companyId: COMPANY_ID, name: { contains: firstName, mode: 'insensitive' }, document: null },
          take: 20
        })
        for (const c of candidates) {
          const cn = (c.name || '').toLowerCase().trim().replace(/[^a-z0-9àáâãéèêíïóôõúüç ]/g, '').replace(/\s+/g, ' ').trim()
          if (cn === normName) {
            matched = c
            break
          }
        }
      }
    }

    if (matched) {
      await prisma.client.update({ where: { id: matched.id }, data: { document: contact.cpf } }).catch(() => {})
      cpfLinked++
    }
  }

  console.log(`CPF linked: ${cpfLinked}`)

  const finalCount = await prisma.client.count({ where: { companyId: COMPANY_ID } })
  console.log(`\nFinal client count: ${finalCount}`)

  await prisma.$disconnect()
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
