#!/usr/bin/env node
/**
 * Import Univen clients into the clients table.
 * Source: univen-clientes_31-03-2026_16_03_22.xls (HTML table, latin-1)
 *
 * Columns: Código, Nome, Empresa, Endereço, Complemento, Bairro, Cidade,
 *          UF, CEP, Tel. Residencial, Tel. Comercial, Celular, E-mail,
 *          Captador, Mídia, Sexo, Escolaridade, Profissão, Cargo, Ramo,
 *          Data de Cadastro, Último Contato, Termometro de Neg., Categoria
 *
 * Strategy:
 *  - Map Categoria → ClientRole
 *  - Upsert by legacyId (Código) — skip if already present
 *  - Also import into contacts table (for CRM use)
 */
const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require' } }
});

const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n';
const XLS_FILE = '/Users/tomaslemos/Downloads/univen /univen-clientes_31-03-2026_16_03_22.xls';

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

function parseDate(str) {
  if (!str || !str.trim()) return null;
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
}

function normalizePhone(p) {
  if (!p) return null;
  const clean = p.replace(/\D/g, '').trim();
  return clean.length >= 7 ? clean : null;
}

function makeClientId(legacyId) {
  return 'cl' + crypto.createHash('md5').update('univen-client-' + legacyId).digest('hex').substring(0, 22);
}

// Map Univen Categoria → ClientRole enum values
// Valid: TENANT, LANDLORD, GUARANTOR, BENEFICIARY, SECONDARY
function mapRoles(categoria) {
  const c = (categoria || '').toLowerCase();
  const roles = [];
  if (c.includes('proprietar') || c.includes('locador')) roles.push('LANDLORD');
  if (c.includes('inquilino') || c.includes('locatario') || c.includes('locatário')) roles.push('TENANT');
  if (c.includes('fiador') || c.includes('avalista') || c.includes('garantidor')) roles.push('GUARANTOR');
  if (roles.length === 0) roles.push('SECONDARY'); // default for unknown/buyer
  return roles;
}

async function main() {
  console.log('Parsing Univen clients XLS...');
  const rows = parseHTMLTable(XLS_FILE);
  const hdrs = rows[0];
  const h = {};
  hdrs.forEach((v, i) => { h[v] = i; });
  const data = rows.slice(1).filter(r => r.length > 2 && (r[h['Nome']] || '').trim());
  console.log(`Parsed ${data.length} clients`);

  // Get existing legacyIds
  const existingClients = await prisma.$queryRawUnsafe(
    `SELECT "legacyId" FROM clients WHERE "companyId" = $1 AND "legacyId" IS NOT NULL`,
    COMPANY_ID
  );
  const existingLegacy = new Set(existingClients.map(r => r.legacyId));
  console.log(`Existing clients with legacyId: ${existingLegacy.size}`);

  // Get existing contacts by externalId
  const existingContacts = await prisma.$queryRawUnsafe(
    `SELECT "externalId" FROM contacts WHERE "companyId" = $1 AND "externalId" IS NOT NULL`,
    COMPANY_ID
  );
  const existingContactExtIds = new Set(existingContacts.map(r => r.externalId));
  console.log(`Existing contacts with externalId: ${existingContactExtIds.size}`);

  let createdClients = 0, skippedClients = 0;
  let createdContacts = 0, skippedContacts = 0;
  let errors = 0;

  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx];
    const legacyId = (row[h['Código']] || '').trim();
    const name = (row[h['Nome']] || '').trim();
    if (!name) { skippedClients++; continue; }

    const empresa = (row[h['Empresa']] || '').trim();
    const address = (row[h['Endereço']] || '').trim();
    const complement = (row[h['Complemento']] || '').trim();
    const neighborhood = (row[h['Bairro']] || '').trim();
    const city = (row[h['Cidade']] || '').trim();
    const state = (row[h['UF']] || '').trim();
    const zipCode = normalizePhone(row[h['CEP']] || '');
    const telRes = normalizePhone(row[h['Tel. Residencial']]);
    const telCom = normalizePhone(row[h['Tel. Comercial']]);
    const celular = normalizePhone(row[h['Celular']]);
    const email = (row[h['E-mail']] || '').trim().toLowerCase() || null;
    const profissao = (row[h['Profissão']] || '').trim();
    const categoria = (row[h['Categoria']] || '').trim();
    const dataCadastro = parseDate(row[h['Data de Cadastro']] || '');
    const roles = mapRoles(categoria);

    try {
      // ── Import into clients table ──────────────────────────────────────────
      if (legacyId && !existingLegacy.has(legacyId)) {
        const clientId = makeClientId(legacyId);
        const rolesCast = '{' + roles.map(r => '"' + r + '"').join(',') + '}';
        await prisma.$executeRawUnsafe(`
          INSERT INTO clients (
            id, "companyId", "legacyId", name, email, phone, "phoneMobile", "phoneWork",
            address, "addressComplement", neighborhood, city, state, "zipCode",
            profession, notes, roles, "createdAt", "updatedAt"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::"ClientRole"[],$18,$18)
          ON CONFLICT (id) DO NOTHING
        `,
          clientId, COMPANY_ID, legacyId, name,
          email, telRes, celular, telCom,
          address || null, complement || null, neighborhood || null, city || null, state || null, zipCode || null,
          profissao || null,
          empresa ? `Empresa: ${empresa}` : null,
          rolesCast,
          dataCadastro || new Date('2026-03-31')
        );

        existingLegacy.add(legacyId);
        createdClients++;
      } else {
        skippedClients++;
      }

      // ── Import into contacts table (CRM) ──────────────────────────────────
      const extId = legacyId || null;
      if (extId && !existingContactExtIds.has(extId)) {
        await prisma.contact.create({
          data: {
            companyId: COMPANY_ID,
            name,
            email: email || undefined,
            phone: telRes || undefined,
            mobilePhone: celular || undefined,
            address: address || undefined,
            neighborhood: neighborhood || undefined,
            city: city || undefined,
            state: state || undefined,
            zipCode: zipCode || undefined,
            externalId: extId,
            source: 'uniloc',
            notes: empresa ? `Empresa: ${empresa}` : undefined,
          }
        });
        existingContactExtIds.add(extId);
        createdContacts++;
      } else {
        skippedContacts++;
      }

      if ((createdClients + skippedClients) % 500 === 0) {
        console.log(`  Progress: clients=${createdClients} created, ${skippedClients} skipped | contacts=${createdContacts} created`);
      }
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  Error row ${idx} (${name}): ${err.message}`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Clients: ${createdClients} created, ${skippedClients} skipped`);
  console.log(`  Contacts: ${createdContacts} created, ${skippedContacts} skipped`);
  console.log(`  Errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
