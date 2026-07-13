#!/usr/bin/env node
/**
 * Rebuild property galleries from the main gallery on the Lemos website.
 *
 * The page also contains recommendation carousels. Restricting extraction to
 * #fotos_imovel prevents photos from other properties entering the gallery.
 *
 * Required: DATABASE_URL
 * Optional: COMPANY_ID, CONCURRENCY, APPLY_CHANGES=true, LIMIT
 */
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()
const COMPANY_ID = process.env.COMPANY_ID || 'cmr6k6kqy0001gle5y1x3xtwi'
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 10))
const APPLY_CHANGES = process.env.APPLY_CHANGES === 'true'
const LIMIT = Number(process.env.LIMIT || 0)
const CACHE_FILE = path.join(__dirname, '.gallery-main-cache.json')
const REPORT_FILE = path.join(__dirname, '..', 'relatorios', 'auditoria-galerias-lemos.json')

const cache = fs.existsSync(CACHE_FILE)
  ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  : {}

const PHOTO_RE = /https:\/\/(?:cdnuso\.com|cdn\.uso\.com\.br)\/145\/[^"'\s>)]+\.(?:jpg|jpeg|png|webp)/gi

function unique(values) {
  return [...new Set(values)]
}

function extractMainPhotos(html) {
  const start = html.indexOf('id="fotos_imovel"')
  if (start < 0) return []

  const endMarkers = ['class="descricao', 'class="mais_detalhes', 'class="resultado_novo']
  const end = endMarkers
    .map(marker => html.indexOf(marker, start))
    .filter(index => index > start)
    .sort((a, b) => a - b)[0] || html.length

  return unique((html.slice(start, end).match(PHOTO_RE) || []))
}

async function fetchGallery(property) {
  if (Array.isArray(cache[property.externalId])) return cache[property.externalId]

  const url = `https://www.imobiliarialemos.com.br/?imovel=${encodeURIComponent(property.externalId)}&referencia=${encodeURIComponent(property.reference || '')}`
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 AgoraEncontrei/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return []
    const photos = extractMainPhotos(await response.text())
    cache[property.externalId] = photos
    return photos
  } catch {
    return []
  }
}

async function main() {
  let properties = await prisma.property.findMany({
    where: {
      companyId: COMPANY_ID,
      status: 'ACTIVE',
      authorizedPublish: true,
      externalId: { not: null },
    },
    select: {
      id: true,
      externalId: true,
      reference: true,
      coverImage: true,
      images: true,
    },
    orderBy: { reference: 'asc' },
  })
  if (LIMIT > 0) properties = properties.slice(0, LIMIT)

  const report = {
    generatedAt: new Date().toISOString(),
    companyId: COMPANY_ID,
    applyChanges: APPLY_CHANGES,
    checked: properties.length,
    updated: 0,
    unchanged: 0,
    fallbackToCover: 0,
    unavailable: [],
    removedContaminatedEntries: 0,
  }

  for (let i = 0; i < properties.length; i += CONCURRENCY) {
    const batch = properties.slice(i, i + CONCURRENCY)
    const galleries = await Promise.all(batch.map(fetchGallery))

    for (let j = 0; j < batch.length; j++) {
      const property = batch[j]
      let photos = galleries[j]
      if (photos.length === 0 && property.coverImage) {
        photos = [property.coverImage]
        report.fallbackToCover++
      }
      if (photos.length === 0) {
        report.unavailable.push({ id: property.id, reference: property.reference })
        continue
      }

      const changed = JSON.stringify(photos) !== JSON.stringify(property.images)
        || photos[0] !== property.coverImage
      if (!changed) {
        report.unchanged++
        continue
      }

      report.removedContaminatedEntries += Math.max(0, property.images.length - photos.length)
      if (APPLY_CHANGES) {
        await prisma.property.update({
          where: { id: property.id },
          data: { images: photos, coverImage: photos[0] },
        })
      }
      report.updated++
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache))
    process.stdout.write(`\r${Math.min(i + CONCURRENCY, properties.length)}/${properties.length}`)
  }

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true })
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2))
  process.stdout.write('\n')
  console.log(JSON.stringify(report, null, 2))
}

if (require.main === module) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  main()
    .catch(error => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}

module.exports = { extractMainPhotos }
