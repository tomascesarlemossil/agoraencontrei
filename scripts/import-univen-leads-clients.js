#!/usr/bin/env node
/**
 * Import 1869 leads + 8244 clients from Univen XLS exports
 * - Associates leads with properties by reference
 * - Links leads to client records
 */
const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require' }
  }
});
const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n';
const ADMIN_USER_ID = 'c2wi7zc86aky1uurzpa1xujm0';

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

function makeId(prefix, key) {
  return prefix + crypto.createHash('md5').update(key).digest('hex').substring(0, 20);
}

function parseDate(str) {
  if (!str || !str.trim()) return null;
  // Format: "30/03/2026 13:53:01" or "2026-03-30"
  try {
    if (str.includes('/')) {
      const [d, m, y] = str.split(' ')[0].split('/');
      return new Date(`${y}-${m}-${d}T${str.split(' ')[1] || '00:00:00'}`);
    }
    return new Date(str);
  } catch { return null; }
}

function cleanPhone(p) {
  if (!p) return null;
  const digits = p.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

async function importClients() {
  console.log('\n📥 Importing clients...');
  const rows = parseHTMLTable('/Users/tomaslemos/Downloads/univen /univen-clientes_31-03-2026_16_03_22.xls');
  const hdrs = rows[0]; const h = {}; hdrs.forEach((v,i) => h[v]=i);
  const data = rows.slice(1);
  console.log(`  ${data.length} clients to process`);

  // Load existing clients by legacyId, email, and name
  const existing = await prisma.$queryRawUnsafe(
    `SELECT id, "legacyId", email, name, phone FROM clients WHERE "companyId" = $1`,
    COMPANY_ID
  );
  const byLegacy = new Map(existing.filter(c=>c.legacyId).map(c=>[c.legacyId, c]));
  const byEmail = new Map(existing.filter(c=>c.email).map(c=>[c.email.toLowerCase(), c]));

  let created=0, updated=0, skipped=0, errors=0;

  for (const row of data) {
    try {
      const code = row[h['Código']] || '';
      const name = row[h['Nome']] || '';
      if (!name.trim()) { skipped++; continue; }

      const email = row[h['E-mail']] || '';
      const phone = cleanPhone(row[h['Celular']] || row[h['Tel. Residencial']] || row[h['Tel. Comercial']] || '');
      const address = row[h['Endereço']] || null;
      const complement = row[h['Complemento']] || null;
      const neighborhood = row[h['Bairro']] || null;
      const city = row[h['Cidade']] || null;
      const state = row[h['UF']] || null;
      const zipCode = row[h['CEP']] || null;
      const captador = row[h['Captador']] || null;

      const ex = byLegacy.get(code) || (email ? byEmail.get(email.toLowerCase()) : null);

      if (ex) {
        // Update with better data if available
        await prisma.$queryRawUnsafe(`
          UPDATE clients SET
            name = CASE WHEN LENGTH($1) > LENGTH(name) THEN $1 ELSE name END,
            email = CASE WHEN $2::text IS NOT NULL AND email IS NULL THEN $2::text ELSE email END,
            "phoneMobile" = CASE WHEN $3::text IS NOT NULL AND "phoneMobile" IS NULL THEN $3::text ELSE "phoneMobile" END,
            address = COALESCE($4::text, address),
            neighborhood = COALESCE($5::text, neighborhood),
            city = COALESCE($6::text, city),
            state = COALESCE($7::text, state),
            "legacyId" = COALESCE("legacyId", $8::text),
            "updatedAt" = NOW()
          WHERE id = $9
        `, name, email||null, phone||null, address||null, neighborhood||null, city||null, state||null, code||null, ex.id);
        updated++;
      } else {
        const id = makeId('cl', COMPANY_ID + code + name);
        await prisma.$queryRawUnsafe(`
          INSERT INTO clients (
            id, "companyId", "legacyId", name, email, "phoneMobile",
            address, "addressComplement", neighborhood, city, state, "zipCode",
            roles, notes, "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3::text, $4, $5::text, $6::text,
            $7::text, $8::text, $9::text, $10::text, $11::text, $12::text,
            ARRAY['TENANT'::"ClientRole"], $13::text, NOW(), NOW()
          ) ON CONFLICT (id) DO NOTHING
        `, id, COMPANY_ID, code||null, name, email||null, phone||null,
           address||null, complement||null, neighborhood||null, city||null, state||null, zipCode||null,
           captador ? `Captador: ${captador}` : null
        );
        if (email) byEmail.set(email.toLowerCase(), { id, legacyId: code, email, name });
        byLegacy.set(code, { id });
        created++;
      }
    } catch(e) { errors++; if(errors<=2) console.error('Client err:', e.message.substring(0,150)); }
  }

  console.log(`  ✅ Created: ${created} | Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);
  return { byLegacy, byEmail };
}

async function importLeads(clientMaps) {
  console.log('\n📥 Importing leads...');
  const rows = parseHTMLTable('/Users/tomaslemos/Downloads/univen /leads_31-03-2026_16_03_27.xls');
  const hdrs = rows[0]; const h = {}; hdrs.forEach((v,i) => h[v]=i);
  const data = rows.slice(1);
  console.log(`  ${data.length} leads to process`);

  // Load property references
  const props = await prisma.$queryRawUnsafe(
    `SELECT id, reference FROM properties WHERE "companyId" = $1 AND reference IS NOT NULL`,
    COMPANY_ID
  );
  const propByRef = new Map(props.map(p=>[p.reference, p.id]));

  // Load existing leads to avoid duplicates (by email+property+date)
  const existingLeads = await prisma.$queryRawUnsafe(
    `SELECT email, notes, "createdAt"::text FROM leads WHERE "companyId" = $1`,
    COMPANY_ID
  );
  const leadKeys = new Set(existingLeads.map(l => `${l.email}|${l.notes?.substring(0,50)}`));

  // Load clients for linking
  const clients = await prisma.$queryRawUnsafe(
    `SELECT id, email, "phoneMobile", name FROM clients WHERE "companyId" = $1`,
    COMPANY_ID
  );
  const clientByEmail = new Map(clients.filter(c=>c.email).map(c=>[c.email.toLowerCase(), c]));
  const clientByPhone = new Map(clients.filter(c=>c.phoneMobile).map(c=>[c.phoneMobile, c]));

  let created=0, skipped=0, errors=0;

  for (const row of data) {
    try {
      const name = row[h['Interessado']] || '';
      const email = row[h['E-mail']] || '';
      const phone = cleanPhone(row[h['Telefone']] || '');
      const message = row[h['Mensagem']] || '';
      const propertyRef = row[h['Imóvel']] || '';
      const source = row[h['Origem']] || 'Site';
      const tipo = row[h['Tipo']] || 'Mensagem';
      const dateStr = row[h['Data']] || '';

      if (!name && !email) { skipped++; continue; }

      // Dedup check
      const key = `${email.toLowerCase()}|${message.substring(0,50)}`;
      if (leadKeys.has(key)) { skipped++; continue; }
      leadKeys.add(key);

      const createdAt = parseDate(dateStr) || new Date();
      const propertyId = propByRef.get(propertyRef) || null;

      // Find or create contact
      let contactId = null;
      const existingClient = (email && clientByEmail.get(email.toLowerCase())) ||
                             (phone && clientByPhone.get(phone));
      if (existingClient) {
        contactId = existingClient.id;
      } else if (name || email) {
        // Create new client
        const newClientId = makeId('cl', COMPANY_ID + (email||name) + dateStr);
        try {
          await prisma.$queryRawUnsafe(`
            INSERT INTO clients (id, "companyId", name, email, "phoneMobile", roles, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, ARRAY['TENANT'::"ClientRole"], $6, $6)
            ON CONFLICT (id) DO NOTHING
          `, newClientId, COMPANY_ID, name||'Interessado', email||null, phone, createdAt);
          contactId = newClientId;
          if (email) clientByEmail.set(email.toLowerCase(), { id: newClientId });
        } catch(e) { /* ignore duplicate */ }
      }

      const leadId = makeId('ld', COMPANY_ID + key + dateStr);
      const notes = [
        message,
        propertyRef ? `Imóvel: ${propertyRef}` : '',
        tipo !== 'Mensagem' ? `Tipo: ${tipo}` : '',
      ].filter(Boolean).join('\n');

      const sourceEnum = source.toLowerCase().includes('site') ? 'WEBSITE' :
                         source.toLowerCase().includes('whats') ? 'WHATSAPP' : 'WEBSITE';

      await prisma.$queryRawUnsafe(`
        INSERT INTO leads (
          id, "companyId", "contactId", name, email, phone,
          status, source, notes, tags, metadata,
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'NEW'::"LeadStatus", 'WEBSITE', $7, ARRAY[]::text[], $8::jsonb,
          $9, $9
        ) ON CONFLICT (id) DO NOTHING
      `,
        leadId, COMPANY_ID, contactId, name||'Interessado', email||null, phone,
        notes,
        JSON.stringify({ propertyRef, propertyId, origem: source, tipo, lido: row[h['Lido']] }),
        createdAt
      );

      // If we have propertyId, increment leads counter
      if (propertyId) {
        await prisma.$queryRawUnsafe(
          `UPDATE properties SET leads = leads + 1 WHERE id = $1`,
          propertyId
        );
      }

      created++;
    } catch(e) { errors++; if(errors<=3) console.error('Lead err:', e.message.substring(0,200)); }
  }

  console.log(`  ✅ Created: ${created} | Skipped: ${skipped} | Errors: ${errors}`);
}

async function main() {
  console.log('🚀 Importing clients and leads from Univen...\n');
  const clientMaps = await importClients();
  await importLeads(clientMaps);

  // Final stats
  const stats = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM clients WHERE "companyId" = $1) as clients,
      (SELECT COUNT(*) FROM leads WHERE "companyId" = $1) as leads,
      (SELECT COUNT(*) FROM properties WHERE "companyId" = $1 AND leads > 0) as props_with_leads
  `, COMPANY_ID);
  const s = stats[0];
  console.log(`\n📊 Final state:`);
  console.log(`  Clients: ${s.clients}`);
  console.log(`  Leads: ${s.leads}`);
  console.log(`  Properties with leads: ${s.props_with_leads}`);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('FATAL:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
