#!/usr/bin/env node
/**
 * Scrape full photo galleries from old Univen portal (imobiliarialemos.com.br)
 * and update properties.images + properties.coverImage in the database.
 *
 * Strategy:
 *  - Fetch https://www.imobiliarialemos.com.br/?imovel=EXTID for each property
 *  - Extract all cdnuso.com photo URLs from the HTML
 *  - Filter out fake images (logos, banners, etc.)
 *  - Update images[] and coverImage in DB
 *  - Cache results to disk for resumability
 *  - Concurrency: 4 parallel requests, 300ms delay between batches
 */

const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb' } }
});
const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n';
const CACHE_FILE = path.join(__dirname, '.gallery-cache.json');
const CONCURRENCY = 10;
const DELAY_MS = 150;

const FAKE_PATTERNS = [
  'send.png', 'telefone.png', 'logotopo.png', 'foto_vazio.png',
  'foto-corretor.png', 'logo_uso.png', 'logo_rodape.png',
  '/images/logo', '/images/banner', 'whatsapp', '/noimage',
  'placeholder', 'default.jpg', 'sem-foto',
];
function isRealImage(url) {
  if (!url) return false;
  return !FAKE_PATTERNS.some(p => url.toLowerCase().includes(p));
}

// Load cache
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch {}
}
function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractPhotos(html) {
  if (!html) return [];
  // Find all cdnuso.com image URLs
  const regex = /https:\/\/cdnuso\.com\/[^"'\s>)]+\.(jpg|jpeg|png|webp)/gi;
  const found = new Set();
  let m;
  while ((m = regex.exec(html)) !== null) {
    const url = m[0];
    if (isRealImage(url)) found.add(url);
  }
  return Array.from(found);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function processProperty(prop) {
  if (cache[prop.externalId] !== undefined) {
    return { id: prop.id, photos: cache[prop.externalId], cached: true };
  }

  const url = `https://www.imobiliarialemos.com.br/?imovel=${prop.externalId}`;
  const html = await fetchPage(url);
  const photos = extractPhotos(html);

  cache[prop.externalId] = photos;
  return { id: prop.id, photos, cached: false };
}

async function main() {
  console.log('🖼️  Fetching full photo galleries from Univen portal...\n');

  // Load all properties with externalId
  const properties = await prisma.property.findMany({
    where: { companyId: COMPANY_ID, externalId: { not: null } },
    select: { id: true, externalId: true, coverImage: true, reference: true },
    orderBy: { updatedAt: 'desc' },
  });

  console.log(`Properties to process: ${properties.length}`);
  const cached = properties.filter(p => cache[p.externalId] !== undefined).length;
  console.log(`Already cached: ${cached} | To fetch: ${properties.length - cached}\n`);

  let updated = 0, skipped = 0, errors = 0, fetched = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < properties.length; i += CONCURRENCY) {
    const batch = properties.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(p => processProperty(p).catch(e => ({ id: p.id, photos: [], error: e.message }))));

    if (i % 200 === 0) {
      process.stdout.write(`\r[${i}/${properties.length}] ✅${updated} ⏭️${skipped} ❌${errors}  `);
      saveCache(); // Save progress periodically
    }

    for (const result of results) {
      if (!result) continue;
      if (!result.cached) fetched++;

      if (result.photos.length === 0) {
        skipped++;
        continue;
      }

      try {
        const cover = result.photos[0];
        await prisma.property.update({
          where: { id: result.id },
          data: {
            coverImage: cover,
            images: result.photos,
          },
        });
        updated++;
      } catch {
        errors++;
      }
    }

    // Throttle requests (only delay if there were network fetches)
    const hadFetches = results.some(r => r && !r.cached);
    if (hadFetches) await sleep(DELAY_MS);
  }

  saveCache();
  process.stdout.write('\r' + ' '.repeat(60) + '\r');

  console.log(`\n✅ Gallery import complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  No photos found: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Network fetches: ${fetched}`);

  // Final stats
  const [withPhotos, multiPhoto] = await Promise.all([
    prisma.property.count({ where: { companyId: COMPANY_ID, coverImage: { not: null } } }),
    prisma.$queryRaw`SELECT COUNT(*) as cnt FROM properties WHERE "companyId" = ${COMPANY_ID} AND array_length(images, 1) > 1`,
  ]);

  console.log(`\n📊 Final photo stats:`);
  console.log(`  With cover photo: ${withPhotos}`);
  console.log(`  With gallery (2+ photos): ${multiPhoto[0].cnt}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
