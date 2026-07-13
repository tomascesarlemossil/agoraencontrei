#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const DEFAULT_LEMOS_COMPANY_ID = 'cmr6k6kqy0001gle5y1x3xtwi'
function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
function normalizeCode(value) { return normalizeText(value).replace(/\s+/g, '') }
function addressKey(property) {
  const parts = [property.street, property.number, property.complement, property.neighborhood,
    property.city, property.state].map(normalizeText)
  if (!parts[0] || !parts[1] || !parts[4]) return ''
  return parts.join('|')
}
function groupBy(properties, keyFor) {
  const groups = new Map()
  for (const property of properties) {
    const key = keyFor(property)
    if (!key) continue
    groups.set(key, [...(groups.get(key) || []), property])
  }
  return [...groups.entries()].filter(([, values]) => values.length > 1).map(([key, values]) => ({
    key,
    properties: values.map(({ id, companyId, reference, externalId, title }) => ({
      id, companyId, reference, externalId, title,
    })),
  }))
}
function auditProperties(properties) {
  const duplicateExternalIds = groupBy(properties, property => {
    const externalId = normalizeCode(property.externalId)
    return externalId ? `${normalizeCode(property.importSource) || 'unknown'}|${externalId}` : ''
  })
  const duplicateIdentity = groupBy(properties, property => {
    const reference = normalizeCode(property.reference)
    const address = addressKey(property)
    return reference && address ? `${reference}|${address}` : ''
  })
  const duplicateAddresses = groupBy(properties, addressKey)
  const missingCover = properties.filter(property => !property.coverImage)
  const missingGallery = properties.filter(property => !Array.isArray(property.images) || property.images.length === 0)
  const missingDescription = properties.filter(property => !String(property.description || '').trim())
  const coverOutsideGallery = properties.filter(property =>
    property.coverImage && Array.isArray(property.images) && !property.images.includes(property.coverImage))
  const imageOwners = new Map()
  for (const property of properties) {
    for (const image of new Set([property.coverImage, ...(property.images || [])].filter(Boolean))) {
      imageOwners.set(image, [...(imageOwners.get(image) || []), { id: property.id, reference: property.reference }])
    }
  }
  const sharedImages = [...imageOwners.entries()].filter(([, owners]) => owners.length > 1)
    .map(([image, owners]) => ({ image, properties: owners }))
  const summarize = list => list.map(({ id, companyId, reference, externalId, title }) => ({
    id, companyId, reference, externalId, title,
  }))
  const findings = {
    duplicateExternalIds,
    duplicateIdentity,
    duplicateAddresses,
    missingCover: summarize(missingCover),
    missingGallery: summarize(missingGallery),
    missingDescription: summarize(missingDescription),
    coverOutsideGallery: summarize(coverOutsideGallery),
    sharedImages,
  }
  const blockingCount = duplicateExternalIds.length + duplicateIdentity.length + missingCover.length
    + missingGallery.length + missingDescription.length + sharedImages.length
  return { findings, blockingCount }
}
async function main() {
  const { PrismaClient } = require('@prisma/client')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const companyId = process.env.AUDIT_SCOPE === 'all'
    ? undefined
    : (process.env.COMPANY_ID || DEFAULT_LEMOS_COMPANY_ID)
  const includeUnpublished = process.env.AUDIT_INCLUDE_UNPUBLISHED === 'true'
  const prisma = new PrismaClient()
  try {
    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        ...(includeUnpublished ? {} : { authorizedPublish: true }),
        ...(companyId ? { companyId } : {}),
      },
      select: {
        id: true, companyId: true, reference: true, externalId: true, importSource: true,
        title: true, description: true, coverImage: true, images: true, street: true,
        number: true, complement: true, neighborhood: true, city: true, state: true,
      },
      orderBy: [{ companyId: 'asc' }, { reference: 'asc' }],
    })
    const { findings, blockingCount } = auditProperties(properties)
    const report = {
      generatedAt: new Date().toISOString(), scope: companyId || 'all',
      mode: includeUnpublished ? 'active-all-publication-states' : 'published-active',
      publishedProperties: properties.length, blockingCount,
      counts: Object.fromEntries(Object.entries(findings).map(([key, value]) => [key, value.length])),
      findings,
    }
    const reportFile = process.env.REPORT_FILE
      || path.join(__dirname, '..', 'relatorios', 'auditoria-imoveis-publicados.json')
    fs.mkdirSync(path.dirname(reportFile), { recursive: true })
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(JSON.stringify({ ...report, findings: undefined }, null, 2))
    if (blockingCount > 0) process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}
if (require.main === module) {
  main().catch(error => { console.error(error); process.exitCode = 1 })
}
module.exports = { normalizeText, normalizeCode, addressKey, groupBy, auditProperties }
