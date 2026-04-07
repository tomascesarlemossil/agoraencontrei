const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require'
    }
  }
});

const COMPANY_ID = 'cmnevj5it000075bq2de64f2u';
const SCRAPE_FILE = '/Users/tomaslemos/Downloads/squads/agoraencontrei/scripts/imobiliarialemos-scrape.json';
const BATCH_SIZE = 50;

function buildDescription(p, scraped) {
  const typeMap = {
    HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno',
    FARM: 'Chácara/Sítio', WAREHOUSE: 'Galpão', OFFICE: 'Escritório',
    STORE: 'Loja', STUDIO: 'Studio', PENTHOUSE: 'Cobertura',
    CONDO: 'Condomínio', KITNET: 'Kitnet', RANCH: 'Rancho'
  };
  const purposeMap = {
    SALE: 'à venda', RENT: 'para alugar', BOTH: 'à venda e para alugar', SEASON: 'para temporada'
  };

  const tipo = typeMap[p.type] || 'Imóvel';
  const fin = purposeMap[p.purpose] || '';
  const loc = [p.neighborhood, p.city, p.state].filter(Boolean).join(', ');

  const beds = scraped.bedrooms != null ? scraped.bedrooms : p.bedrooms;
  const suites = scraped.suites != null ? scraped.suites : p.suites;
  const baths = scraped.bathrooms != null ? scraped.bathrooms : p.bathrooms;
  const parking = scraped.parkingSpaces != null ? scraped.parkingSpaces : p.parkingSpaces;
  const totalArea = (scraped.totalArea != null && scraped.totalArea > 0) ? scraped.totalArea : p.totalArea;
  const builtArea = (scraped.builtArea != null && scraped.builtArea > 0) ? scraped.builtArea : p.builtArea;
  const price = (scraped.price != null && scraped.price > 0) ? scraped.price : Number(p.price);
  const priceRent = (scraped.priceRent != null && scraped.priceRent > 0) ? scraped.priceRent : Number(p.priceRent);

  let parts = [];
  let opening = tipo + ' ' + fin;
  if (loc) opening += ' em ' + loc;
  parts.push(opening + '.');

  let feats = [];
  if (beds > 0) feats.push(beds + ' dormitório' + (beds > 1 ? 's' : ''));
  if (suites > 0) feats.push(suites + ' suíte' + (suites > 1 ? 's' : ''));
  if (baths > 0) feats.push(baths + ' banheiro' + (baths > 1 ? 's' : ''));
  if (parking > 0) feats.push(parking + ' vaga' + (parking > 1 ? 's' : '') + ' de garagem');
  if (feats.length) parts.push('Conta com ' + feats.join(', ') + '.');

  let areas = [];
  if (totalArea) areas.push('área total de ' + totalArea + 'm²');
  if (builtArea) areas.push('área construída de ' + builtArea + 'm²');
  if (areas.length) parts.push('Possui ' + areas.join(' e ') + '.');

  if (price > 0) parts.push('Valor de venda: ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price) + '.');
  else if (priceRent > 0) parts.push('Valor do aluguel: ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(priceRent) + '/mês.');

  parts.push('Entre em contato com a Imobiliária Lemos para mais informações e agendar uma visita. CRECI 61053-F.');
  return parts.join(' ');
}

async function main() {
  console.log('Loading scraped data...');
  const scraped = JSON.parse(fs.readFileSync(SCRAPE_FILE, 'utf8'));
  console.log(`Loaded ${scraped.length} scraped properties.`);

  let matched = 0;
  let updated = 0;
  let notFound = 0;
  const samples = [];

  for (let i = 0; i < scraped.length; i += BATCH_SIZE) {
    const batch = scraped.slice(i, i + BATCH_SIZE);

    for (const s of batch) {
      // Extract numeric URL ref
      const urlRef = s.url ? s.url.match(/\/(\d{7,9})$/)?.[1] : null;
      if (!urlRef) {
        notFound++;
        continue;
      }

      // Find in DB
      const existing = await prisma.property.findFirst({
        where: { companyId: COMPANY_ID, reference: urlRef },
        select: {
          id: true, reference: true, type: true, purpose: true,
          neighborhood: true, city: true, state: true,
          bedrooms: true, suites: true, bathrooms: true, parkingSpaces: true,
          totalArea: true, builtArea: true, price: true, priceRent: true,
          description: true
        }
      });

      if (!existing) {
        notFound++;
        continue;
      }

      matched++;

      // Build update data — only update fields with non-null scraped values
      const updateData = {};

      if (s.bedrooms != null) updateData.bedrooms = s.bedrooms;
      if (s.suites != null) updateData.suites = s.suites;
      if (s.bathrooms != null) updateData.bathrooms = s.bathrooms;
      if (s.parkingSpaces != null) updateData.parkingSpaces = s.parkingSpaces;
      if (s.totalArea != null && s.totalArea > 0) updateData.totalArea = s.totalArea;
      if (s.builtArea != null && s.builtArea > 0) updateData.builtArea = s.builtArea;
      if (s.price != null && s.price > 0) updateData.price = s.price;
      if (s.priceRent != null && s.priceRent > 0) updateData.priceRent = s.priceRent;

      // Regenerate description
      updateData.description = buildDescription(existing, s);

      // Capture sample (first 5 updates)
      if (samples.length < 5) {
        samples.push({
          reference: urlRef,
          scrapeRef: s.reference,
          before: {
            bedrooms: existing.bedrooms,
            suites: existing.suites,
            bathrooms: existing.bathrooms,
            parkingSpaces: existing.parkingSpaces,
            totalArea: existing.totalArea,
            builtArea: existing.builtArea,
            price: existing.price?.toString(),
            priceRent: existing.priceRent?.toString()
          },
          after: {
            bedrooms: updateData.bedrooms ?? existing.bedrooms,
            suites: updateData.suites ?? existing.suites,
            bathrooms: updateData.bathrooms ?? existing.bathrooms,
            parkingSpaces: updateData.parkingSpaces ?? existing.parkingSpaces,
            totalArea: updateData.totalArea ?? existing.totalArea,
            builtArea: updateData.builtArea ?? existing.builtArea,
            price: (updateData.price ?? existing.price)?.toString(),
            priceRent: (updateData.priceRent ?? existing.priceRent)?.toString()
          }
        });
      }

      await prisma.property.update({
        where: { id: existing.id },
        data: updateData
      });

      updated++;
    }

    const processed = Math.min(i + BATCH_SIZE, scraped.length);
    console.log(`Progress: ${processed}/${scraped.length} — matched so far: ${matched}, updated: ${updated}, not found: ${notFound}`);
  }

  console.log('\n=== FINAL RESULTS ===');
  console.log(`Total scraped:  ${scraped.length}`);
  console.log(`Matched in DB:  ${matched}`);
  console.log(`Updated:        ${updated}`);
  console.log(`Not found:      ${notFound}`);

  console.log('\n=== SAMPLE UPDATES (first 5) ===');
  for (const sample of samples) {
    console.log(`\nRef: ${sample.reference} (scrape ref: ${sample.scrapeRef})`);
    console.log('  BEFORE:', JSON.stringify(sample.before));
    console.log('  AFTER: ', JSON.stringify(sample.after));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
