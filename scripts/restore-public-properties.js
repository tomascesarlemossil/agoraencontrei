#!/usr/bin/env node
/**
 * Restore 940 public property listings from scrape data via raw SQL
 * Bypasses Prisma validation issues with nullable Int fields
 */
const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n';
const ADMIN_USER_ID = 'c2wi7zc86aky1uurzpa1xujm0';
const SCRAPE_FILE = '/Users/tomaslemos/Downloads/squads/agoraencontrei/scripts/imobiliarialemos-scrape.json';

const TYPE_MAP = {
  'APARTAMENTO': 'APARTMENT', 'CASA': 'HOUSE', 'TERRENO': 'LAND',
  'CHÁCARA': 'FARM', 'ÁREA': 'LAND', 'LOTE': 'LAND', 'GALPÃO': 'WAREHOUSE',
  'ESCRITÓRIO': 'OFFICE', 'LOJA': 'STORE', 'STUDIO': 'STUDIO',
  'COBERTURA': 'PENTHOUSE', 'SÍTIO': 'FARM', 'RANCHO': 'RANCH',
  'KITNET': 'KITNET', 'FLAT': 'APARTMENT', 'BARRACÃO': 'WAREHOUSE',
  'PRÉDIO': 'CONDO', 'SOBRADO': 'HOUSE',
};

function mapType(t) {
  if (!t) return 'HOUSE';
  const upper = t.toUpperCase().trim();
  for (const [key, val] of Object.entries(TYPE_MAP)) {
    if (upper.includes(key)) return val;
  }
  return 'HOUSE';
}

function parseNeighborhood(str) {
  if (!str) return { neighborhood: 'Franca', city: 'Franca', state: 'SP' };
  const parts = str.split(' - ');
  const neighborhood = parts[0]?.trim() || 'Franca';
  let city = 'Franca', state = 'SP';
  if (parts[1]) {
    const cs = parts[1].split('/');
    city = cs[0]?.trim() || 'Franca';
    state = cs[1]?.trim() || 'SP';
  }
  return { neighborhood, city, state };
}

function makeSlug(title, reference) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .substring(0, 70).replace(/-$/, '') + '-' + reference.toLowerCase();
}

function makeId(reference) {
  return 'uprop' + crypto.createHash('md5').update('univen-pub-' + reference).digest('hex').substring(0, 19);
}

function buildDesc(s, neighborhood, city) {
  const typeLabel = s.propertyType || 'Imóvel';
  const purposeLabel = s.purpose === 'SALE' ? 'à venda' : 'para alugar';
  let desc = `${typeLabel} ${purposeLabel} em ${neighborhood}, ${city}/SP.`;
  const feats = [];
  if (s.bedrooms > 0) feats.push(`${s.bedrooms} dormitório${s.bedrooms > 1 ? 's' : ''}`);
  if (s.suites > 0) feats.push(`${s.suites} suíte${s.suites > 1 ? 's' : ''}`);
  if (s.bathrooms > 0) feats.push(`${s.bathrooms} banheiro${s.bathrooms > 1 ? 's' : ''}`);
  if (s.parkingSpaces > 0) feats.push(`${s.parkingSpaces} vaga${s.parkingSpaces > 1 ? 's' : ''}`);
  if (feats.length) desc += ` Conta com ${feats.join(', ')}.`;
  const areas = [];
  if (s.totalArea > 0) areas.push(`área total ${s.totalArea}m²`);
  if (s.builtArea > 0 && s.builtArea !== s.totalArea) areas.push(`área construída ${s.builtArea}m²`);
  if (areas.length) desc += ` ${areas.join(', ')}.`;
  if (s.price > 0) desc += ` Venda: R$ ${Number(s.price).toLocaleString('pt-BR')}.`;
  if (s.priceRent > 0) desc += ` Aluguel: R$ ${Number(s.priceRent).toLocaleString('pt-BR')}/mês.`;
  desc += ' Imobiliária Lemos, CRECI 61053-F.';
  return desc;
}

async function main() {
  console.log('📂 Loading scraped data...');
  const scraped = JSON.parse(fs.readFileSync(SCRAPE_FILE, 'utf8'));
  console.log(`✅ ${scraped.length} properties loaded\n`);

  // Get existing references for this company
  const existingRows = await prisma.$queryRawUnsafe(
    `SELECT id, reference, slug, "importSource" FROM properties WHERE "companyId" = $1`,
    COMPANY_ID
  );
  const existingByRef = new Map(existingRows.map(r => [r.reference, r]));
  const existingSlugs = new Set(existingRows.map(r => r.slug).filter(Boolean));

  console.log(`📊 Existing: ${existingRows.length} properties in DB`);

  let created = 0, updated = 0, errors = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < scraped.length; i++) {
    const s = scraped[i];
    if (i % 50 === 0) process.stdout.write(`\r[${i}/${scraped.length}] created=${created} updated=${updated} errors=${errors}`);

    try {
      const { neighborhood, city, state } = parseNeighborhood(s.neighborhood);
      const type = mapType(s.propertyType);
      const purpose = s.purpose || 'SALE';
      const ref = s.reference;
      const desc = buildDesc(s, neighborhood, city);

      const bedrooms = s.bedrooms || 0;
      const suites = s.suites || 0;
      const bathrooms = s.bathrooms || 0;
      const parkingSpaces = s.parkingSpaces || 0;
      const totalArea = s.totalArea || null;
      const builtArea = s.builtArea || null;
      const price = s.price || null;
      const priceRent = s.priceRent || null;

      const existing = existingByRef.get(ref);

      if (existing) {
        // Update existing property (whether uniloc or other)
        await prisma.$queryRawUnsafe(`
          UPDATE properties SET
            title = $1, type = $2, purpose = $3, status = 'ACTIVE',
            "authorizedPublish" = true, "importSource" = 'univen',
            neighborhood = $4, city = $5, state = $6,
            bedrooms = $7, suites = $8, bathrooms = $9, "parkingSpaces" = $10,
            "totalArea" = $11, "builtArea" = $12, price = $13, "priceRent" = $14,
            description = $15, "publishedAt" = NOW(), "updatedAt" = NOW()
          WHERE id = $16
        `, s.title, type, purpose, neighborhood, city, state,
           bedrooms, suites, bathrooms, parkingSpaces,
           totalArea, builtArea, price, priceRent, desc, existing.id);
        updated++;
      } else {
        // Generate slug - ensure uniqueness
        let slug = makeSlug(s.title, ref);
        if (existingSlugs.has(slug)) {
          slug = slug + '-' + i;
        }
        existingSlugs.add(slug);
        const id = makeId(ref);

        await prisma.$queryRawUnsafe(`
          INSERT INTO properties (
            id, "companyId", "userId", reference, slug, title, type, purpose,
            status, "authorizedPublish", "importSource",
            neighborhood, city, state, country,
            bedrooms, suites, bathrooms, "parkingSpaces",
            "totalArea", "builtArea", price, "priceRent",
            description, "publishedAt", "createdAt", "updatedAt",
            images, features, "metaKeywords", "portalDescriptions",
            views, favorites, leads, "priceNegotiable", "showAddress",
            "isFeatured", "isPremium", "isHighlighted"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            'ACTIVE', true, 'univen',
            $9, $10, $11, 'BR',
            $12, $13, $14, $15,
            $16, $17, $18, $19,
            $20, NOW(), NOW(), NOW(),
            '{}', '{}', '{}', '{}',
            0, 0, 0, false, true,
            false, false, false
          ) ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title, type = EXCLUDED.type,
            "authorizedPublish" = true, status = 'ACTIVE', "importSource" = 'univen',
            "updatedAt" = NOW()
        `, id, COMPANY_ID, ADMIN_USER_ID, ref, slug, s.title, type, purpose,
           neighborhood, city, state,
           bedrooms, suites, bathrooms, parkingSpaces,
           totalArea, builtArea, price, priceRent, desc);
        existingByRef.set(ref, { id, reference: ref, slug, importSource: 'univen' });
        created++;
      }
    } catch (e) {
      errors++;
      if (errors <= 3) console.error(`\n  ❌ ${s.reference}: ${e.message.substring(0, 200)}`);
    }
  }

  console.log(`\n\n✅ Done! Created=${created} Updated=${updated} Errors=${errors}`);

  // Final stats
  const stats = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE "authorizedPublish" = true) as public_count,
      COUNT(*) FILTER (WHERE "authorizedPublish" = true AND status = 'ACTIVE') as active_public,
      COUNT(*) FILTER (WHERE "importSource" = 'univen') as univen_count,
      COUNT(*) FILTER (WHERE "importSource" = 'uniloc') as uniloc_count
    FROM properties WHERE "companyId" = $1
  `, COMPANY_ID);

  console.log('\n📊 Final state:');
  console.log(`  Total: ${stats[0].total}`);
  console.log(`  Public: ${stats[0].public_count}`);
  console.log(`  Active & Public: ${stats[0].active_public}`);
  console.log(`  Univen (public site): ${stats[0].univen_count}`);
  console.log(`  Uniloc (Lemosbank internal): ${stats[0].uniloc_count}`);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('\nFATAL:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
