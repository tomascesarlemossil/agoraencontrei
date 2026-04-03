#!/usr/bin/env node
/**
 * Enrich clients with profession + category data from Univen XLS
 * Also link contacts.cpf → clients.document where names/phones match
 */
const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' } }
});
const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n';

function parseHTMLTable(path) {
  const content = fs.readFileSync(path, 'latin1');
  const rows = []; let row=null,cell=null,inCell=false,i=0;
  while(i<content.length){
    if(content[i]==='<'){
      const end=content.indexOf('>',i); if(end<0) break;
      const tagRaw=content.slice(i+1,end).trim(); const closing=tagRaw.startsWith('/');
      const tag=(closing?tagRaw.slice(1):tagRaw).split(/[\s>]/)[0].toLowerCase();
      if(!closing){if(tag==='tr')row=[];else if(tag==='td'||tag==='th'){cell='';inCell=true;}}
      else{if(tag==='tr'){if(row&&row.length)rows.push(row);row=null;}else if(tag==='td'||tag==='th'){if(row)row.push(cell?cell.trim():'');inCell=false;cell=null;}}
      i=end+1;
    } else { if(inCell)cell+=content[i]; i++; }
  }
  return rows;
}

async function enrichProfession() {
  console.log('📥 Loading Univen clients XLS...');
  const rows = parseHTMLTable('/Users/tomaslemos/Downloads/univen /univen-clientes_31-03-2026_16_03_22.xls');
  const hdrs = rows[0]; const h = {}; hdrs.forEach((v,k) => h[v]=k);

  const enrichMap = new Map(); // code → {profession, category}
  for (const row of rows.slice(1)) {
    const code = (row[h['Código']]||'').trim();
    if (!code) continue;
    const prof = (row[h['Profissão']]||'').trim();
    const cat  = (row[h['Categoria']]||'').trim();
    const sex  = (row[h['Sexo']]||'').trim();
    if (prof || cat) enrichMap.set(code, { profession: prof||null, category: cat||null, sex: sex||null });
  }
  console.log(`  Enrichment map: ${enrichMap.size} entries with data`);

  // Get all clients needing profession
  const clients = await prisma.$queryRawUnsafe(`
    SELECT id, "legacyId" FROM clients
    WHERE "companyId" = $1 AND "legacyId" IS NOT NULL AND profession IS NULL
  `, COMPANY_ID);
  console.log(`  Clients needing enrichment: ${clients.length}`);

  let updated = 0;
  // Process in batches of 500
  for (let i = 0; i < clients.length; i += 500) {
    const batch = clients.slice(i, i + 500);
    for (const c of batch) {
      const e = enrichMap.get(c.legacyId);
      if (e) {
        await prisma.$queryRawUnsafe(`
          UPDATE clients SET
            profession = CASE WHEN $1::text IS NOT NULL THEN $1::text ELSE profession END,
            notes = CASE WHEN $2::text IS NOT NULL AND notes IS NULL THEN $2::text ELSE notes END,
            "updatedAt" = NOW()
          WHERE id = $3
        `, e.profession, e.category ? `Categoria Univen: ${e.category}` : null, c.id);
        updated++;
      }
    }
    if ((i+500) % 2000 === 0) console.log(`  Progress: ${i+500}/${clients.length}`);
  }
  console.log(`  ✅ Updated ${updated} clients with profession data`);
}

async function linkContactsCPF() {
  console.log('\n🔗 Linking contacts CPF → clients document...');

  // Get contacts with CPF that match clients by name+phone or email
  const contacts = await prisma.$queryRawUnsafe(`
    SELECT id, name, cpf, email, phone, "mobilePhone"
    FROM contacts
    WHERE "companyId" = $1 AND cpf IS NOT NULL AND cpf != '' AND LENGTH(cpf) >= 11
    LIMIT 5000
  `, COMPANY_ID);
  console.log(`  Contacts with CPF: ${contacts.length}`);

  let linked = 0;
  for (const contact of contacts) {
    const cpf = contact.cpf.replace(/\D/g,'');
    if (cpf.length < 11) continue;

    // Try to match by email first, then by phone
    let matched = null;
    if (contact.email) {
      const byEmail = await prisma.$queryRawUnsafe(`
        SELECT id FROM clients WHERE "companyId" = $1 AND email = $2 AND document IS NULL LIMIT 1
      `, COMPANY_ID, contact.email);
      if (byEmail.length) matched = byEmail[0].id;
    }

    if (!matched && (contact.phone || contact.mobilePhone)) {
      const phone = (contact.mobilePhone || contact.phone || '').replace(/\D/g,'').slice(-9);
      if (phone.length >= 8) {
        const byPhone = await prisma.$queryRawUnsafe(`
          SELECT id FROM clients WHERE "companyId" = $1
            AND (RIGHT(REGEXP_REPLACE("phoneMobile",'[^0-9]','','g'),9) = $2
              OR RIGHT(REGEXP_REPLACE(phone,'[^0-9]','','g'),9) = $2)
            AND document IS NULL LIMIT 1
        `, COMPANY_ID, phone);
        if (byPhone.length) matched = byPhone[0].id;
      }
    }

    if (matched) {
      await prisma.$queryRawUnsafe(`
        UPDATE clients SET document = $1, "updatedAt" = NOW() WHERE id = $2
      `, cpf, matched);
      linked++;
    }
  }
  console.log(`  ✅ Linked CPF to ${linked} clients`);
}

async function main() {
  console.log('🚀 Enriching client data...\n');
  await enrichProfession();
  await linkContactsCPF();

  // Final stats
  const stats = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*)::text as total,
      COUNT(*) FILTER (WHERE profession IS NOT NULL)::text as with_profession,
      COUNT(*) FILTER (WHERE document IS NOT NULL AND document != '')::text as with_cpf
    FROM clients WHERE "companyId" = $1
  `, COMPANY_ID);
  console.log('\n📊 Final client stats:', JSON.stringify(stats[0]));

  await prisma.$disconnect();
}
main().catch(async e => {
  console.error('FATAL:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
