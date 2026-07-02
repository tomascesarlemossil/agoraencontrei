#!/usr/bin/env node
/**
 * Import the clean Lemos backup (produced by scrape-imobiliarialemos.py) into
 * the database — fixing wrong info and mixed-up photos, and adding new listings.
 *
 * Matching is resilient to the historical externalId/reference inconsistency:
 * a property is matched by externalId === siteId, then by reference === siteId,
 * then by reference === <AP code>. On a match we ALSO backfill externalId with
 * the site numeric id so every row becomes consistent going forward.
 *
 * New listings (not yet in the DB) are created with a createdAt that follows the
 * site's publication order (newest first), so the latest listings sort to the
 * top of the public listings by recency — no featured flag needed.
 *
 * Env:
 *   DATABASE_URL   Postgres connection string        (required)
 *   COMPANY_ID     Imobiliária Lemos company id      (required)
 *   USER_ID        owner user id for NEW inserts     (required to create)
 *   BACKUP_FILE    path to the JSON backup           (default scripts/lemos-backup.json)
 *   DRY_RUN=1      report only, do NOT write
 */

const { PrismaClient } = require('../packages/database/generated/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

if (!process.env.DATABASE_URL) { console.error('❌ Set DATABASE_URL'); process.exit(1); }
if (!process.env.COMPANY_ID)   { console.error('❌ Set COMPANY_ID');   process.exit(1); }

const prisma = new PrismaClient();
const COMPANY_ID = process.env.COMPANY_ID;
const USER_ID = process.env.USER_ID || null;
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const BACKUP_FILE = process.env.BACKUP_FILE || path.join(__dirname, 'lemos-backup.json');

const TYPE_LABEL = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara/Sítio',
  RANCH: 'Rancho', WAREHOUSE: 'Galpão', OFFICE: 'Escritório', STORE: 'Loja',
  STUDIO: 'Studio', PENTHOUSE: 'Cobertura', CONDO: 'Prédio', KITNET: 'Kitnet',
};
const PURPOSE_LABEL = { SALE: 'à venda', RENT: 'para alugar', BOTH: 'à venda e para locação', SEASON: 'para temporada' };

const money = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function buildDescription(p) {
  const loc = [p.neighborhood, p.city, p.state].filter(Boolean).join(', ');
  const parts = [`${TYPE_LABEL[p.type] || 'Imóvel'} ${PURPOSE_LABEL[p.purpose] || ''}${loc ? ' em ' + loc : ''}.`];
  const feats = [];
  if (p.bedrooms > 0) feats.push(`${p.bedrooms} dormitório${p.bedrooms > 1 ? 's' : ''}`);
  if (p.suites > 0) feats.push(`${p.suites} suíte${p.suites > 1 ? 's' : ''}`);
  if (p.bathrooms > 0) feats.push(`${p.bathrooms} banheiro${p.bathrooms > 1 ? 's' : ''}`);
  if (p.parkingSpaces > 0) feats.push(`${p.parkingSpaces} vaga${p.parkingSpaces > 1 ? 's' : ''} de garagem`);
  if (feats.length) parts.push(`Conta com ${feats.join(', ')}.`);
  const areas = [];
  if (p.totalArea) areas.push(`área total de ${p.totalArea}m²`);
  if (p.builtArea) areas.push(`área construída de ${p.builtArea}m²`);
  if (areas.length) parts.push(`Possui ${areas.join(' e ')}.`);
  if (p.price > 0) parts.push(`Valor de venda: ${money(p.price)}.`);
  else if (p.priceRent > 0) parts.push(`Valor do aluguel: ${money(p.priceRent)}/mês.`);
  parts.push('Entre em contato com a Imobiliária Lemos para mais informações e agendar uma visita. CRECI 61053-F.');
  return parts.join(' ');
}

function makeSlug(title, siteId) {
  const base = (title || 'imovel')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 70).replace(/-+$/, '');
  return `${base}-${siteId}`;
}
function makeId(siteId) {
  return 'lemos' + crypto.createHash('md5').update('lemos-' + siteId).digest('hex').substring(0, 19);
}

// Only overwrite a field when the backup actually has a value for it — never
// blank out existing data with a null/empty scrape.
function cleaned(p) {
  const d = {
    title: p.title || undefined,
    type: p.type || undefined,
    purpose: p.purpose || undefined,
    neighborhood: p.neighborhood || undefined,
    city: p.city || undefined,
    state: p.state || undefined,
    bedrooms: p.bedrooms != null ? p.bedrooms : undefined,
    suites: p.suites != null ? p.suites : undefined,
    bathrooms: p.bathrooms != null ? p.bathrooms : undefined,
    parkingSpaces: p.parkingSpaces != null ? p.parkingSpaces : undefined,
    totalArea: p.totalArea > 0 ? p.totalArea : undefined,
    builtArea: p.builtArea > 0 ? p.builtArea : undefined,
    price: p.price > 0 ? p.price : undefined,
    priceRent: p.priceRent > 0 ? p.priceRent : undefined,
    description: (p.description && p.description.length > 20) ? p.description : buildDescription(p),
    externalId: p.siteId,
  };
  // Photos: only replace when we actually scraped a gallery (never wipe to []).
  if (Array.isArray(p.images) && p.images.length) {
    d.images = p.images;
    d.coverImage = p.coverImage || p.images[0];
  }
  Object.keys(d).forEach((k) => d[k] === undefined && delete d[k]);
  return d;
}

async function main() {
  console.log(`Loading ${BACKUP_FILE} ...`);
  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  console.log(`Loaded ${backup.length} properties${DRY_RUN ? '  (DRY RUN — no writes)' : ''}\n`);

  let matched = 0, updated = 0, created = 0, skipped = 0, errors = 0;
  const samples = [];
  const base = Date.now();

  for (let i = 0; i < backup.length; i++) {
    const p = backup[i];
    if (!p.siteId) { skipped++; continue; }

    try {
      const existing = await prisma.property.findFirst({
        where: {
          companyId: COMPANY_ID,
          OR: [
            { externalId: p.siteId },
            { reference: p.siteId },
            ...(p.reference ? [{ reference: p.reference }] : []),
          ],
        },
        select: { id: true, reference: true, images: true, coverImage: true, bedrooms: true, price: true, priceRent: true },
      });

      const data = cleaned(p);

      if (existing) {
        matched++;
        if (samples.length < 5) {
          samples.push({
            siteId: p.siteId, ref: existing.reference,
            photosBefore: (existing.images || []).length, photosAfter: (data.images || existing.images || []).length,
            title: (data.title || '').slice(0, 50),
          });
        }
        if (!DRY_RUN) {
          await prisma.property.update({ where: { id: existing.id }, data: { ...data, status: 'ACTIVE', authorizedPublish: true, importSource: 'lemos_site', importedAt: new Date() } });
        }
        updated++;
      } else {
        // New listing → recency-ordered createdAt (index 0 = newest).
        if (!USER_ID) { skipped++; continue; }
        const createdAt = new Date(base - i * 1000);
        if (samples.length < 5) samples.push({ siteId: p.siteId, ref: p.reference, NEW: true, title: (data.title || '').slice(0, 50) });
        if (!DRY_RUN) {
          const id = makeId(p.siteId);
          await prisma.property.create({
            data: {
              id, companyId: COMPANY_ID, userId: USER_ID,
              reference: p.reference || p.siteId, slug: makeSlug(p.title, p.siteId),
              status: 'ACTIVE', authorizedPublish: true, importSource: 'lemos_site', importedAt: new Date(),
              createdAt, publishedAt: createdAt,
              type: p.type || 'HOUSE', purpose: p.purpose || 'SALE',
              ...data,
            },
          });
        }
        created++;
      }
    } catch (e) {
      errors++;
      if (errors <= 5) console.error(`  ❌ ${p.siteId}: ${e.message.slice(0, 160)}`);
    }

    if ((i + 1) % 100 === 0) console.log(`  [${i + 1}/${backup.length}] matched=${matched} created=${created} skipped=${skipped} errors=${errors}`);
  }

  console.log('\n=== RESULT ===');
  console.log(`Total:    ${backup.length}`);
  console.log(`Matched:  ${matched}  (updated: ${updated})`);
  console.log(`Created:  ${created}${!USER_ID ? '  (set USER_ID to enable creating new listings)' : ''}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Errors:   ${errors}`);
  console.log('\n=== SAMPLES ===');
  for (const s of samples) console.log(' ', JSON.stringify(s));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
