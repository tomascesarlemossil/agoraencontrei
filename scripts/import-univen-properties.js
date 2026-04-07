#!/usr/bin/env node
/**
 * Import ALL 3858 Univen properties with complete data:
 * - Photos (CDN URLs from Foto principal)
 * - Full descriptions
 * - Features (Detalhes)
 * - Address, neighborhood, city, state, zip
 * - Broker/captador info
 * - IPTU, registration, year built
 * - ATIVO properties → authorizedPublish=true (public site)
 * - Other statuses → authorizedPublish=false (Lemosbank internal)
 */
const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require'
    }
  }
});

const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n';
const ADMIN_USER_ID = 'c2wi7zc86aky1uurzpa1xujm0'; // Noêmia ADMIN
const XLS_FILE = '/Users/tomaslemos/Downloads/univen /univen-imoveis_31-03-2026_16_03_49.xls';

// ── Type mappings ──────────────────────────────────────────────────────────────
const TYPE_MAP = {
  'APARTAMENTO': 'APARTMENT', 'Apartamento': 'APARTMENT',
  'CASA': 'HOUSE', 'Casa': 'HOUSE', 'SOBRADO': 'HOUSE',
  'TERRENO': 'LAND', 'Terreno': 'LAND', 'ÁREA': 'LAND', 'Área': 'LAND', 'LOTE': 'LAND',
  'CHÁCARA': 'FARM', 'Chácara': 'FARM', 'SÍTIO': 'FARM', 'Sítio': 'FARM',
  'FAZENDA': 'FARM', 'RANCHO': 'RANCH', 'Rancho': 'RANCH',
  'GALPÃO': 'WAREHOUSE', 'BARRACÃO': 'WAREHOUSE', 'ARMAZÉM': 'WAREHOUSE',
  'SALA': 'OFFICE', 'ESCRITÓRIO': 'OFFICE', 'SALÃO': 'STORE',
  'PONTO': 'STORE', 'LOJA': 'STORE', 'KITNET': 'KITNET', 'STUDIO': 'STUDIO',
  'Padrão': 'HOUSE',
};

function mapType(t) {
  if (!t || t === '0' || t === 'undefined') return 'HOUSE';
  const u = t.trim();
  return TYPE_MAP[u] || TYPE_MAP[u.toUpperCase()] || 'HOUSE';
}

function mapPurpose(f) {
  const u = (f || '').toUpperCase().trim();
  if (u.includes('TEMPORADA')) return 'SEASON';
  if (u === 'MISTO') return 'BOTH';
  if (u.includes('LOCAÇ') || u.includes('ALUGUEL') || u.includes('RESIDENCIAL') || u.includes('COMERCIAL') || u.includes('RURAL') || u.includes('INDUSTRIAL')) return 'SALE';
  return 'SALE';
}

function mapStatus(s) {
  const u = (s || '').toUpperCase().trim();
  if (u === 'ATIVO') return 'ACTIVE';
  if (u === 'LOCADO' || u === 'ALUGADO') return 'RENTED';
  if (u === 'VENDIDO') return 'SOLD';
  return 'INACTIVE'; // INATIVO, SUSPENSO, EM AVALIAÇÃO, etc.
}

function parseBRL(v) {
  if (!v || !v.trim()) return null;
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
  if (isNaN(n) || n === 0) return null;
  return Math.min(n, 9999999999.99); // cap at DECIMAL(12,2) max
}

function parseNum(v) {
  if (!v || !v.trim()) return null;
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) || n === 0 ? null : n;
}

function parseInt2(v) {
  if (!v || !v.trim()) return 0;
  const n = parseInt(v.trim(), 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

// ── Parse features ─────────────────────────────────────────────────────────────
const DETAIL_COLS = ['Detalhes Básico', 'Detalhes Serviços', 'Detalhes Lazer', 'Detalhes Social', 'Detalhes Íntima', 'Detalhes Armários', 'Detalhes Acabamento', 'Detalhes Destaque', 'Outras características'];
function parseFeatures(row, h) {
  const all = [];
  for (const col of DETAIL_COLS) {
    if (h[col] !== undefined && row[h[col]]) {
      row[h[col]].split(',').map(s => s.trim()).filter(Boolean).forEach(f => all.push(f));
    }
  }
  return [...new Set(all)].slice(0, 50); // max 50 features, deduplicated
}

// ── ID & slug generation ───────────────────────────────────────────────────────
function makeId(extId, ref) {
  const key = extId ? 'univen-' + extId : 'univen-ref-' + ref;
  return 'uv' + crypto.createHash('md5').update(key).digest('hex').substring(0, 22);
}

function makeSlug(title, ref) {
  const b = (title || ref)
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .substring(0, 70).replace(/-$/, '');
  return b + '-' + (ref || '').toLowerCase().replace(/\W/g, '').substring(0, 10);
}

// ── Parse HTML table ──────────────────────────────────────────────────────────
function parseHTMLTable(filePath) {
  const content = fs.readFileSync(filePath, 'latin1');
  const rows = [];
  let row = null, cell = null, inCell = false;
  let i = 0;
  while (i < content.length) {
    if (content[i] === '<') {
      const end = content.indexOf('>', i);
      if (end < 0) break;
      const tagRaw = content.slice(i + 1, end).trim();
      const closing = tagRaw.startsWith('/');
      const tag = (closing ? tagRaw.slice(1) : tagRaw).split(/[\s>]/)[0].toLowerCase();
      if (!closing) {
        if (tag === 'tr') row = [];
        else if (tag === 'td' || tag === 'th') { cell = ''; inCell = true; }
      } else {
        if (tag === 'tr') { if (row && row.length) rows.push(row); row = null; }
        else if (tag === 'td' || tag === 'th') {
          if (row) row.push(cell ? cell.trim() : '');
          inCell = false; cell = null;
        }
      }
      i = end + 1;
    } else {
      if (inCell) cell += content[i];
      i++;
    }
  }
  return rows;
}

// ── Build title from data ──────────────────────────────────────────────────────
function buildTitle(row, h) {
  const desc = (row[h['Descrição']] || '').trim();
  if (desc.length > 15) {
    // First line of description, cleaned
    return desc.split(/[\n\r]/)[0].trim().substring(0, 120);
  }
  const tipo = (row[h['Tipo']] || '').toUpperCase().replace('PADRÃO', 'IMÓVEL');
  const bairro = row[h['Bairro']] || '';
  const cidade = row[h['Cidade']] || 'Franca';
  const finLabel = (row[h['Finalidade']] || '').toUpperCase().includes('LOCAÇ') ? 'PARA ALUGAR' : 'À VENDA';
  const parts = [tipo, finLabel];
  if (bairro) parts.push(`NO ${bairro.toUpperCase()}`);
  parts.push(`EM ${cidade.toUpperCase()}/SP`);
  return parts.join(' ').substring(0, 120);
}

// ── SEO keywords ──────────────────────────────────────────────────────────────
function buildKeywords(row, h) {
  return [
    row[h['Tipo']], row[h['Bairro']], row[h['Cidade']],
    row[h['UF']], row[h['Referência']], 'imobiliária lemos', 'franca sp'
  ].filter(Boolean).map(s => s.toLowerCase().trim()).filter(Boolean);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📂 Parsing Univen XLS...');
  const rows = parseHTMLTable(XLS_FILE);
  const hdrs = rows[0];
  const h = {};
  hdrs.forEach((v, i) => { h[v] = i; });
  const data = rows.slice(1);
  console.log(`✅ Parsed ${data.length} properties\n`);

  // Load existing properties
  const existing = await prisma.$queryRawUnsafe(
    `SELECT id, reference, "externalId", slug FROM properties WHERE "companyId" = $1`,
    COMPANY_ID
  );
  const byRef = new Map(existing.map(r => [r.reference, r]));
  const byExtId = new Map(existing.filter(r => r.externalId).map(r => [r.externalId, r]));
  const slugSet = new Set(existing.map(r => r.slug).filter(Boolean));
  console.log(`📊 Existing: ${existing.length} properties in DB\n`);

  // SQL templates (enum types require double-quoted casts)
  const INSERT_SQL = `INSERT INTO properties (
    id, "companyId", "userId",
    reference, "externalId", slug, title, description,
    type, purpose, status, "authorizedPublish", "importSource",
    neighborhood, city, state, "zipCode", street, "number", complement, "condoName",
    bedrooms, suites, bathrooms, "parkingSpaces",
    "builtArea", "totalArea", price, "priceRent", "priceSeason",
    "condoFee", iptu,
    "coverImage", images, features, "metaKeywords", "portalDescriptions",
    "captorName", "iptuRegistration", "cartorioMatricula",
    "yearBuilt", "currentState", standard, "constructionCompany", region,
    "publishedAt", "createdAt", "updatedAt",
    country, "priceNegotiable", "showAddress", "isFeatured", "isPremium", "isHighlighted",
    views, favorites, leads
  ) VALUES (
    $1, $2, $3,
    $4, $5, $6, $7, $8,
    $9::"PropertyType", $10::"PropertyPurpose", $11::"PropertyStatus", $12, 'univen',
    $13, $14, $15, $16, $17, $18, $19, $20,
    $21, $22, $23, $24,
    $25, $26, $27, $28, $29,
    $30, $31,
    $32, ARRAY[$33]::text[], ARRAY[$34::text]::text[], ARRAY[$35::text]::text[], '{}'::jsonb,
    $36, $37, $38,
    $39, $40, $41, $42, $43,
    CASE WHEN $12 THEN NOW() ELSE NULL END, NOW(), NOW(),
    'BR', false, true, false, false, false,
    0, 0, 0
  ) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description,
    type = EXCLUDED.type, purpose = EXCLUDED.purpose, status = EXCLUDED.status,
    "authorizedPublish" = EXCLUDED."authorizedPublish",
    neighborhood = EXCLUDED.neighborhood, city = EXCLUDED.city, state = EXCLUDED.state,
    "zipCode" = EXCLUDED."zipCode", street = EXCLUDED.street,
    bedrooms = EXCLUDED.bedrooms, suites = EXCLUDED.suites,
    bathrooms = EXCLUDED.bathrooms, "parkingSpaces" = EXCLUDED."parkingSpaces",
    "builtArea" = EXCLUDED."builtArea", "totalArea" = EXCLUDED."totalArea",
    price = EXCLUDED.price, "priceRent" = EXCLUDED."priceRent",
    "coverImage" = EXCLUDED."coverImage", images = EXCLUDED.images,
    features = EXCLUDED.features, description = EXCLUDED.description,
    "captorName" = EXCLUDED."captorName",
    "updatedAt" = NOW()`;

  const UPDATE_SQL = `UPDATE properties SET
    title = $1, description = $2,
    type = $3::"PropertyType", purpose = $4::"PropertyPurpose",
    status = $5::"PropertyStatus", "authorizedPublish" = $6,
    "externalId" = $7, "importSource" = 'univen',
    neighborhood = $8, city = $9, state = $10, "zipCode" = $11,
    street = $12, "number" = $13, complement = $14, "condoName" = $15,
    bedrooms = $16, suites = $17, bathrooms = $18, "parkingSpaces" = $19,
    "builtArea" = $20, "totalArea" = $21,
    price = $22, "priceRent" = $23, "priceSeason" = $24,
    "condoFee" = $25, iptu = $26,
    "coverImage" = $27, images = ARRAY[$28]::text[],
    "captorName" = $29, "iptuRegistration" = $30, "cartorioMatricula" = $31,
    "yearBuilt" = $32, "currentState" = $33, standard = $34,
    "constructionCompany" = $35, region = $36,
    "publishedAt" = CASE WHEN $6 AND "publishedAt" IS NULL THEN NOW() ELSE "publishedAt" END,
    "updatedAt" = NOW()
  WHERE id = $37`;

  let created = 0, updated = 0, errors = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (i % 200 === 0) {
      process.stdout.write(`\r[${i}/${data.length}] ✅${created} 🔄${updated} ❌${errors}  `);
    }

    try {
      const ref = row[h['Referência']] || '';
      const extId = row[h['ID Internet']] || '';
      const situacao = row[h['Situação']] || '';
      const desc = (row[h['Descrição']] || '').trim();

      const type = mapType(row[h['Tipo']]);
      const purpose = mapPurpose(row[h['Finalidade']]);
      const status = mapStatus(situacao);
      const authorizedPublish = status === 'ACTIVE'; // Only ATIVO → public

      const title = buildTitle(row, h);
      const neighborhood = row[h['Bairro']] || null;
      const city = row[h['Cidade']] || 'Franca';
      const state = row[h['UF']] || 'SP';
      const zipCode = row[h['CEP']] || null;
      const street = row[h['Endereço']] || null;
      const number = row[h['Número']] || null;
      const complement = [
        row[h['Complemento']], row[h['Apto']] ? `Apto ${row[h['Apto']]}` : '',
        row[h['Bloco']] ? `Bloco ${row[h['Bloco']]}` : ''
      ].filter(Boolean).join(' - ') || null;
      const condoName = row[h['Edifício']] || row[h['Condomínio']] || row[h['Empreendimento']] || null;

      const price = parseBRL(row[h['Valor Venda']]);
      const priceRent = parseBRL(row[h['Valor Locação']]);
      const priceSeason = parseBRL(row[h['Valor Temporada']]);
      const condoFee = parseBRL(row[h['Valor Condomínio']]);
      const iptu = parseBRL(row[h['Valor IPTU']]);

      const bedrooms = parseInt2(row[h['Dorms.']]);
      const suites = parseInt2(row[h['Suíte']]);
      const bathrooms = parseInt2(row[h['Banh.']]);
      const parkingSpaces = parseInt2(row[h['Gar.']]);
      const builtArea = parseNum(row[h['Área Construída']]) || parseNum(row[h['Área Útil']]);
      const totalArea = parseNum(row[h['Área Total']]);

      const coverImage = row[h['Foto principal']] || null;
      const features = parseFeatures(row, h);
      const keywords = buildKeywords(row, h);
      const captorName = row[h['Captador']] || null;
      const iptuReg = row[h['Cad. Pref. (N.IPTU)']] || null;
      const cartorio = row[h['Cartório (N.Matrícula)']] || null;
      const yearBuilt = parseInt2(row[h['Ano Construção']]) || null;
      const currentState = row[h['Estado Atual']] || null;
      const standard = row[h['Padrão']] || null;
      const construction = row[h['Construtora']] || null;
      const region = row[h['Região']] || null;

      // Find existing record
      const ex = (ref && byRef.get(ref)) || (extId && byExtId.get(extId));

      if (ex) {
        await prisma.$queryRawUnsafe(UPDATE_SQL,
          title, desc || null,
          type, purpose, status, authorizedPublish,
          extId || null,
          neighborhood, city, state, zipCode,
          street, number, complement, condoName,
          bedrooms, suites, bathrooms, parkingSpaces,
          builtArea, totalArea,
          price, priceRent, priceSeason, condoFee, iptu,
          coverImage, coverImage || '',
          captorName, iptuReg, cartorio,
          yearBuilt, currentState, standard, construction, region,
          ex.id
        );
        updated++;
      } else {
        const id = makeId(extId, ref);
        let slug = makeSlug(title, ref);
        let c = 1;
        while (slugSet.has(slug)) slug = makeSlug(title, ref) + c++;
        slugSet.add(slug);

        // Build feature string for single array param
        const featStr = features.join('|||');
        const kwStr = keywords.join('|||');

        await prisma.$queryRawUnsafe(`INSERT INTO properties (
          id, "companyId", "userId",
          reference, "externalId", slug, title, description,
          type, purpose, status, "authorizedPublish", "importSource",
          neighborhood, city, state, "zipCode", street, "number", complement, "condoName",
          bedrooms, suites, bathrooms, "parkingSpaces",
          "builtArea", "totalArea", price, "priceRent", "priceSeason",
          "condoFee", iptu,
          "coverImage", images, features, "metaKeywords", "portalDescriptions",
          "captorName", "iptuRegistration", "cartorioMatricula",
          "yearBuilt", "currentState", standard, "constructionCompany", region,
          "publishedAt", "createdAt", "updatedAt",
          country, "priceNegotiable", "showAddress", "isFeatured", "isPremium", "isHighlighted",
          views, favorites, leads
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6, $7, $8,
          $9::"PropertyType", $10::"PropertyPurpose", $11::"PropertyStatus", $12, 'univen',
          $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28, $29,
          $30, $31,
          $32::text,
          CASE WHEN $32::text IS NOT NULL THEN ARRAY[$32::text] ELSE ARRAY[]::text[] END,
          string_to_array($33, '|||'),
          string_to_array($34, '|||'),
          '{}'::jsonb,
          $35, $36, $37,
          $38, $39, $40, $41, $42,
          CASE WHEN $12 THEN NOW() ELSE NULL END, NOW(), NOW(),
          'BR', false, true, false, false, false,
          0, 0, 0
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, "authorizedPublish" = EXCLUDED."authorizedPublish",
          status = EXCLUDED.status, "updatedAt" = NOW()`,
          id, COMPANY_ID, ADMIN_USER_ID,
          ref || null, extId || null, slug, title, desc || null,
          type, purpose, status, authorizedPublish,
          neighborhood, city, state, zipCode, street, number, complement, condoName,
          bedrooms, suites, bathrooms, parkingSpaces,
          builtArea, totalArea, price, priceRent, priceSeason,
          condoFee, iptu,
          coverImage,
          featStr,
          kwStr,
          captorName, iptuReg, cartorio,
          yearBuilt, currentState, standard, construction, region
        );

        byRef.set(ref, { id, reference: ref, externalId: extId, slug });
        created++;
      }
    } catch (e) {
      errors++;
      if (errors <= 3) console.error(`\n  ❌ Row ${i} [${data[i]?.[0]}]: ${e.message.substring(0, 200)}`);
    }
  }

  console.log(`\n\n✅ Import complete!`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);

  // Final stats
  const stats = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE "authorizedPublish" = true) as public_count,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
      COUNT(*) FILTER (WHERE status = 'RENTED') as rented,
      COUNT(*) FILTER (WHERE status = 'SOLD') as sold,
      COUNT(*) FILTER (WHERE status = 'INACTIVE') as inactive,
      COUNT(*) FILTER (WHERE "importSource" = 'univen') as univen,
      COUNT(*) FILTER (WHERE "importSource" = 'uniloc') as uniloc,
      COUNT(*) FILTER (WHERE "coverImage" IS NOT NULL) as with_photo,
      COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as with_desc
    FROM properties WHERE "companyId" = $1
  `, COMPANY_ID);

  const s = stats[0];
  console.log('\n📊 Final Database State:');
  console.log(`  Total: ${s.total} properties`);
  console.log(`  ACTIVE: ${s.active} | RENTED: ${s.rented} | SOLD: ${s.sold} | INACTIVE: ${s.inactive}`);
  console.log(`  ✅ Publicly visible (authorizedPublish=true): ${s.public_count}`);
  console.log(`  Univen: ${s.univen} | Uniloc: ${s.uniloc}`);
  console.log(`  With photos: ${s.with_photo}`);
  console.log(`  With descriptions: ${s.with_desc}`);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('\nFATAL:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
