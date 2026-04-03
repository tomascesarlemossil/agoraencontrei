#!/usr/bin/env node
/**
 * Import Univen leads into the leads + contacts tables.
 * Source: leads_31-03-2026_16_03_27.xls (HTML table, latin-1)
 *
 * Columns: Data, Origem, Tipo, Imóvel, Interessado, E-mail, Telefone,
 *          Resposta por, Mensagem, Lido, Data Lido, Corretor Lido,
 *          Atendido, Data Atendido, Corretor Atendido, Código Cliente
 *
 * Strategy:
 *  - For each row create (or upsert) a Contact by email OR phone
 *  - Create a Lead linked to that contact
 *  - Try to link the Lead to a Property via externalId (reference code like AP00632)
 *  - If "Atendido" == "Sim" mark lead CONTACTED, otherwise NEW
 */
const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' } }
});

const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n';
const XLS_FILE = '/Users/tomaslemos/Downloads/univen /leads_31-03-2026_16_03_27.xls';

// ── HTML table parser (latin-1) ───────────────────────────────────────────────
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

function makeId(seed) {
  return 'lv' + crypto.createHash('md5').update(seed).digest('hex').substring(0, 22);
}

function parseDate(str) {
  if (!str || !str.trim()) return null;
  // Format: "30/03/2026 13:53:01"
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6] || '00'}`);
}

function normalizePhone(p) {
  if (!p) return null;
  return p.replace(/\D/g, '').trim() || null;
}

function normalizeEmail(e) {
  if (!e) return null;
  const t = e.trim().toLowerCase();
  return t || null;
}

// Map Univen reference codes (AP00632, CA01595) to property externalId
// The reference column in properties is the Univen ref like "AP00632"
async function buildPropertyMap() {
  const props = await prisma.$queryRawUnsafe(
    `SELECT id, reference, "externalId" FROM properties WHERE "companyId" = $1`,
    COMPANY_ID
  );
  const m = new Map();
  for (const p of props) {
    if (p.reference) m.set(p.reference.toUpperCase().trim(), p.id);
    if (p.externalId) m.set(p.externalId.toUpperCase().trim(), p.id);
  }
  return m;
}

async function main() {
  console.log('Parsing Univen leads XLS...');
  const rows = parseHTMLTable(XLS_FILE);
  const hdrs = rows[0];
  const h = {};
  hdrs.forEach((v, i) => { h[v] = i; });
  const data = rows.slice(1).filter(r => r.length > 3);
  console.log(`Parsed ${data.length} leads`);

  // Build property map
  const propMap = await buildPropertyMap();
  console.log(`Property map: ${propMap.size} entries`);

  // Check existing leads by externalId stored in metadata
  const existingLeads = await prisma.$queryRawUnsafe(
    `SELECT metadata->>'univenKey' as key FROM leads WHERE "companyId" = $1 AND metadata->>'univenKey' IS NOT NULL`,
    COMPANY_ID
  );
  const existingKeys = new Set(existingLeads.map(r => r.key));
  console.log(`Existing univen leads: ${existingKeys.size}`);

  let created = 0, skipped = 0, errors = 0;

  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx];
    const dateStr = row[h['Data']] || '';
    const origem = row[h['Origem']] || 'Univen';
    const imovelRef = (row[h['Imóvel']] || '').trim();
    const name = (row[h['Interessado']] || '').trim();
    const email = normalizeEmail(row[h['E-mail']]);
    const phone = normalizePhone(row[h['Telefone']]);
    const message = (row[h['Mensagem']] || '').trim();
    const atendido = (row[h['Atendido']] || '').trim().toLowerCase() === 'sim';
    const corretorAtendido = (row[h['Corretor Atendido']] || '').trim();
    const dateAtendido = parseDate(row[h['Data Atendido']] || '');
    const createdAt = parseDate(dateStr) || new Date('2026-03-31');

    if (!name && !email && !phone) { skipped++; continue; }

    // Build unique key for this lead
    const univenKey = `${dateStr}|${imovelRef}|${email || phone || name}`;
    if (existingKeys.has(univenKey)) { skipped++; continue; }

    try {
      // Find or create contact
      let contactId = null;
      if (email || phone) {
        // Try to find existing contact
        const existing = await prisma.contact.findFirst({
          where: {
            companyId: COMPANY_ID,
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone: { contains: phone.slice(-8) } }] : []),
              ...(phone ? [{ mobilePhone: { contains: phone.slice(-8) } }] : []),
            ]
          },
          select: { id: true }
        });
        if (existing) {
          contactId = existing.id;
        } else {
          const contact = await prisma.contact.create({
            data: {
              companyId: COMPANY_ID,
              name: name || 'Contato Univen',
              email: email || undefined,
              mobilePhone: phone || undefined,
              source: 'uniloc',
            }
          });
          contactId = contact.id;
        }
      }

      // Determine lead status
      const status = atendido ? 'CONTACTED' : 'NEW';

      // Find property
      const propertyId = imovelRef ? propMap.get(imovelRef.toUpperCase()) : undefined;

      // Create lead
      const leadId = makeId(univenKey);
      await prisma.$executeRawUnsafe(`
        INSERT INTO leads (id, "companyId", "contactId", name, email, phone, status, source, notes, metadata, "lastContactAt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7::\"LeadStatus\", $8, $9, $10::jsonb, $11, $12, $12)
        ON CONFLICT (id) DO NOTHING
      `,
        leadId,
        COMPANY_ID,
        contactId,
        name || 'Sem nome',
        email,
        phone,
        status,
        origem.toLowerCase(),
        message || null,
        JSON.stringify({
          univenKey,
          imovelRef,
          corretorAtendido,
          origem,
          message,
        }),
        dateAtendido,
        createdAt
      );

      // Link to property if found
      if (propertyId) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO lead_properties (id, "leadId", "propertyId", "createdAt")
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ("leadId", "propertyId") DO NOTHING
        `,
          makeId(leadId + propertyId),
          leadId,
          propertyId,
          createdAt
        );
      }

      created++;
      existingKeys.add(univenKey);

      if (created % 100 === 0) {
        console.log(`  Progress: ${created} created, ${skipped} skipped, ${errors} errors`);
      }
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  Error row ${idx}: ${err.message}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
