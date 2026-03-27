'use strict'

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const fs   = require('fs')
const path = require('path')
const { pool } = require('../config/database')

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const XLS_PATH = process.env.UNIVEN_XLS_PATH ||
  '/Users/tomaslemos/Downloads/univen-imoveis_27-03-2026_05_03_17.xls'

// ---------------------------------------------------------------------------
// Parse the HTML-formatted XLS (single-line HTML table, latin1 encoded)
// ---------------------------------------------------------------------------
function parseHTMLTable (filepath) {
  console.log(`Reading file: ${filepath}`)
  const content = fs.readFileSync(filepath, 'latin1')

  // Extract headers from <thead>
  const theadMatch = content.match(/<thead>([\s\S]*?)<\/thead>/i)
  if (!theadMatch) throw new Error('Could not find <thead> in file')

  const headers = []
  const thRegex = /<th>([\s\S]*?)<\/th>/gi
  let thMatch
  while ((thMatch = thRegex.exec(theadMatch[1])) !== null) {
    headers.push(thMatch[1].trim())
  }
  console.log(`Found ${headers.length} columns`)

  // Extract rows from <tbody>
  const tbodyMatch = content.match(/<tbody>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) throw new Error('Could not find <tbody> in file')

  const rows = []
  const trRegex = /<tr>([\s\S]*?)<\/tr>/gi
  let trMatch
  while ((trMatch = trRegex.exec(tbodyMatch[1])) !== null) {
    const rowHtml = trMatch[1]
    const cells = []
    const tdRegex = /<td>([\s\S]*?)<\/td>/gi
    let tdMatch
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      // Decode basic HTML entities and trim
      let val = tdMatch[1]
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&nbsp;/gi, ' ')
        .replace(/\r?\n/g, ' ')
        .trim()
      cells.push(val)
    }

    // Build object mapping header → value
    if (cells.length > 0) {
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = cells[i] !== undefined ? cells[i] : ''
      })
      rows.push(obj)
    }
  }

  return rows
}

// ---------------------------------------------------------------------------
// Number helpers
// ---------------------------------------------------------------------------

/** Convert Brazilian number format (1.234.567,89) to JS float or null */
function parsePrice (value) {
  if (!value || value.toString().trim() === '') return null
  const cleaned = value.toString().replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/** Parse integer or null */
function parseIntOrNull (value) {
  if (!value || value.toString().trim() === '') return null
  const num = parseInt(value, 10)
  return isNaN(num) ? null : num
}

// ---------------------------------------------------------------------------
// Date helper
// ---------------------------------------------------------------------------

/** Parse "2025-07-19 10:34:44.000000" → "2025-07-19 10:34:44" or null */
function parseDateTime (value) {
  if (!value || value.toString().trim() === '') return null
  const clean = value.toString().trim().replace(/\.(\d+)$/, '')  // remove microseconds
  // Accept YYYY-MM-DD HH:MM:SS or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(clean)) {
    return clean.length === 10 ? clean + ' 00:00:00' : clean
  }
  return null
}

// ---------------------------------------------------------------------------
// ENUM validators (fall back to defaults when Univen data is unexpected)
// ---------------------------------------------------------------------------
const VALID_TIPOS = new Set([
  'CASA','APARTAMENTO','TERRENO','CHÁCARA','ÁREA','BARRACÃO',
  'GALPÃO','SÍTIO','RANCHO','SALA','FLAT','STUDIO','COBERTURA','KITNET','RURAL'
])
const VALID_FINALIDADES = new Set([
  'RESIDENCIAL','COMERCIAL','RURAL','INDUSTRIAL','TEMPORADA','Misto'
])

function sanitizeTipo (val) {
  const v = (val || '').toUpperCase().trim()
  return VALID_TIPOS.has(v) ? v : 'CASA'
}

function sanitizeFinalidade (val) {
  const v = (val || '').toUpperCase().trim()
  if (VALID_FINALIDADES.has(val)) return val   // preserve original case for 'Misto'
  if (VALID_FINALIDADES.has(v)) return v
  return 'RESIDENCIAL'
}

// ---------------------------------------------------------------------------
// Slug generator
// ---------------------------------------------------------------------------

/**
 * Normalise a string for use in a URL slug.
 * Converts accented characters to ASCII equivalents.
 */
function slugify (str) {
  if (!str) return ''
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')                        // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')         // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')           // keep only alphanum, space, dash
    .trim()
    .replace(/\s+/g, '-')                    // spaces → dashes
    .replace(/-+/g, '-')                     // collapse multiple dashes
}

function generateSlug (prop) {
  const tipo    = slugify(prop['Tipo'])
  const local   = slugify(prop['Condomínio'] || prop['Bairro'] || '')
  const cidade  = slugify(prop['Cidade'] || '')
  const ref     = slugify(prop['Referência'] || '')
  return `${tipo}-${local}-${cidade}-${ref}`.replace(/-+/g, '-').substring(0, 255)
}

// ---------------------------------------------------------------------------
// Title generator
// ---------------------------------------------------------------------------

/**
 * Produces a human-readable title like:
 *   "Casa no Jardim Natal I, Franca SP"
 *   "Apartamento em Residencial Solar, Ribeirão Preto SP"
 */
function generateTitulo (prop) {
  const tipo = titleCase(prop['Tipo'] || 'Imóvel')

  // Prefer condominium name, then bairro
  const local = prop['Condomínio'] || prop['Bairro'] || ''
  const cidade = titleCase(prop['Cidade'] || '')
  const uf = (prop['UF'] || '').toUpperCase()

  const preposicao = /^[AEIOU]/i.test(local) ? 'em' : 'no'
  const localPart = local ? ` ${preposicao} ${titleCase(local)}` : ''
  const cidadePart = cidade ? `, ${cidade}` : ''
  const ufPart = uf ? ` ${uf}` : ''

  return `${tipo}${localPart}${cidadePart}${ufPart}`.substring(0, 300)
}

function titleCase (str) {
  if (!str) return ''
  const lower = ['de','da','do','das','dos','e','em','no','na','nos','nas','a','o','ao']
  return str
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i === 0 || !lower.includes(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ')
}

// ---------------------------------------------------------------------------
// Main importer
// ---------------------------------------------------------------------------
async function importProperties () {
  console.log('📊 Reading Univen XLS file...')
  const properties = parseHTMLTable(XLS_PATH)
  console.log(`Found ${properties.length} properties\n`)

  let imported = 0
  let updated  = 0
  let errors   = 0
  const errorLog = []

  for (const prop of properties) {
    const codigo = (prop['Referência'] || '').trim()
    if (!codigo) {
      errors++
      errorLog.push({ ref: '(empty)', msg: 'Missing Referência, skipping row' })
      continue
    }

    try {
      const slug  = generateSlug(prop)
      const titulo = generateTitulo(prop)
      const situacao = (prop['Situação'] || '').toString().trim()

      // Map Univen situação to platform status enum
      let status = 'inativo'
      if (situacao === 'ATIVO') status = 'disponivel'
      else if (situacao === 'VENDIDO') status = 'vendido'
      else if (situacao === 'LOCADO' || situacao === 'ALUGADO') status = 'alugado'
      else if (situacao === 'SUSPENSO') status = 'suspenso'

      const values = [
        // identifiers
        codigo,
        prop['ID Internet'] || null,

        // classification
        sanitizeTipo(prop['Tipo']),
        sanitizeFinalidade(prop['Finalidade']),
        prop['Categoria'] || null,

        // prices
        parsePrice(prop['Valor Venda']),
        parsePrice(prop['Valor Locação']),
        parsePrice(prop['Valor Temporada']),
        parsePrice(prop['Valor m2']),

        // address
        prop['Endereço']    || null,
        prop['Número']      || null,
        prop['Complemento'] || null,
        prop['Bloco']       || null,
        prop['Apto']        || null,
        prop['Quadra']      || null,
        prop['Lote']        || null,
        prop['Bairro']      || null,
        prop['Cidade']      || null,
        prop['UF']          || null,
        prop['CEP']         || null,
        prop['Região']      || null,
        prop['Edifício']    || null,
        prop['Condomínio']  || null,
        parsePrice(prop['Valor Condomínio']),
        prop['Empreendimento'] || null,
        prop['Construtora']    || null,

        // status fields
        situacao           || null,
        prop['Última Ativação'] || null,
        prop['Estado Atual']    || null,
        prop['Pelo']            || null,
        prop['Padrão']          || null,
        prop['Localização']     || null,

        // rooms
        parseIntOrNull(prop['Dorms.'])  || 0,
        parseIntOrNull(prop['Suíte'])   || 0,
        parseIntOrNull(prop['Gar.'])    || 0,
        parseIntOrNull(prop['Banh.'])   || 0,

        // areas
        parsePrice(prop['Área Construída']),
        parsePrice(prop['Área Útil']),
        parsePrice(prop['Área Comum']),
        parsePrice(prop['Área Total']),
        parsePrice(prop['Dist. mar']),

        // administrative
        prop['Local das Chaves'] || null,
        prop['Equipe']           || null,
        prop['Captador']         || null,
        prop['Indicação']        || null,
        prop['Parceria']         || null,
        prop['Vistoria']         || null,
        prop['Corretor']         || null,

        // dates
        parseDateTime(prop['Data Cadastro']),
        parseDateTime(prop['Data Atualização']),

        // registry & tax
        prop['Cad. Pref. (N.IPTU)']   || null,
        parsePrice(prop['Valor IPTU']),
        prop['Cartório (N.Matrícula)'] || null,
        parseIntOrNull(prop['Ano Construção']),

        // exclusivity
        prop['Exclusividade']  || null,
        prop['Fim Exclus.']    || null,
        prop['Aut. Publicar']  || null,
        prop['Fim Aut. Pub.']  || null,

        // temp rental
        parseIntOrNull(prop['N. Acomodações']),
        parsePrice(prop['Taxa Limpeza']),

        // auction
        prop['1.leilão']              || null,
        parsePrice(prop['Valor 1.leilão']),
        prop['2.Leilão']              || null,
        parsePrice(prop['Valor 2.leilão']),

        // media
        prop['Foto principal'] || null,
        prop['Link no Site']   || null,

        // text details
        prop['Descrição']               || null,
        prop['Detalhes Básico']         || null,
        prop['Detalhes Serviços']       || null,
        prop['Detalhes Lazer']          || null,
        prop['Detalhes Social']         || null,
        prop['Detalhes Íntima']         || null,
        prop['Detalhes Armários']       || null,
        prop['Detalhes Acabamento']     || null,
        prop['Detalhes Destaque']       || null,
        prop['Outras características'] || null,

        // owner
        prop['Proprietário']     || null,
        prop['Empresa']          || null,
        prop['Celular/Telefone'] || null,
        prop['E-mail']           || null,

        // generated/CRM
        titulo,
        slug,
        status,
        0   // destaque
      ]

      const [result] = await pool.execute(`
        INSERT INTO properties (
          codigo, id_internet,
          tipo, finalidade, categoria,
          preco_venda, preco_locacao, preco_temporada, preco_m2,
          endereco, numero, complemento, bloco, apto, quadra, lote,
          bairro, cidade, uf, cep, regiao, edificio, condominio, preco_condominio,
          empreendimento, construtora,
          situacao, ultima_ativacao, estado_atual, pelo, padrao, localizacao,
          quartos, suites, garagens, banheiros,
          area_construida, area_util, area_comum, area_total, dist_mar,
          local_chaves, equipe, captador, indicacao, parceria, vistoria, corretor,
          data_cadastro, data_atualizacao,
          n_iptu, preco_iptu, n_matricula, ano_construcao,
          exclusividade, fim_exclusividade, aut_publicar, fim_aut_pub,
          n_acomodacoes, taxa_limpeza,
          primeiro_leilao, valor_primeiro_leilao, segundo_leilao, valor_segundo_leilao,
          foto_principal, link_site,
          descricao, detalhes_basico, detalhes_servicos, detalhes_lazer,
          detalhes_social, detalhes_intima, detalhes_armarios,
          detalhes_acabamento, detalhes_destaque, outras_caracteristicas,
          proprietario_nome, proprietario_empresa, proprietario_telefone, proprietario_email,
          titulo, slug, status, destaque
        ) VALUES (
          ?,?,
          ?,?,?,
          ?,?,?,?,
          ?,?,?,?,?,?,?,
          ?,?,?,?,?,?,?,?,
          ?,?,
          ?,?,?,?,?,?,
          ?,?,?,?,
          ?,?,?,?,?,
          ?,?,?,?,?,?,?,
          ?,?,
          ?,?,?,?,
          ?,?,?,?,
          ?,?,
          ?,?,?,?,
          ?,?,
          ?,?,?,?,?,?,?,?,?,?,
          ?,?,?,?,
          ?,?,?,?
        )
        ON DUPLICATE KEY UPDATE
          id_internet         = VALUES(id_internet),
          titulo              = VALUES(titulo),
          tipo                = VALUES(tipo),
          finalidade          = VALUES(finalidade),
          categoria           = VALUES(categoria),
          preco_venda         = VALUES(preco_venda),
          preco_locacao       = VALUES(preco_locacao),
          preco_temporada     = VALUES(preco_temporada),
          preco_m2            = VALUES(preco_m2),
          endereco            = VALUES(endereco),
          numero              = VALUES(numero),
          complemento         = VALUES(complemento),
          bloco               = VALUES(bloco),
          apto                = VALUES(apto),
          quadra              = VALUES(quadra),
          lote                = VALUES(lote),
          bairro              = VALUES(bairro),
          cidade              = VALUES(cidade),
          uf                  = VALUES(uf),
          cep                 = VALUES(cep),
          regiao              = VALUES(regiao),
          edificio            = VALUES(edificio),
          condominio          = VALUES(condominio),
          preco_condominio    = VALUES(preco_condominio),
          empreendimento      = VALUES(empreendimento),
          construtora         = VALUES(construtora),
          situacao            = VALUES(situacao),
          ultima_ativacao     = VALUES(ultima_ativacao),
          estado_atual        = VALUES(estado_atual),
          pelo                = VALUES(pelo),
          padrao              = VALUES(padrao),
          localizacao         = VALUES(localizacao),
          quartos             = VALUES(quartos),
          suites              = VALUES(suites),
          garagens            = VALUES(garagens),
          banheiros           = VALUES(banheiros),
          area_construida     = VALUES(area_construida),
          area_util           = VALUES(area_util),
          area_comum          = VALUES(area_comum),
          area_total          = VALUES(area_total),
          dist_mar            = VALUES(dist_mar),
          local_chaves        = VALUES(local_chaves),
          equipe              = VALUES(equipe),
          captador            = VALUES(captador),
          indicacao           = VALUES(indicacao),
          parceria            = VALUES(parceria),
          vistoria            = VALUES(vistoria),
          corretor            = VALUES(corretor),
          data_cadastro       = VALUES(data_cadastro),
          data_atualizacao    = VALUES(data_atualizacao),
          n_iptu              = VALUES(n_iptu),
          preco_iptu          = VALUES(preco_iptu),
          n_matricula         = VALUES(n_matricula),
          ano_construcao      = VALUES(ano_construcao),
          exclusividade       = VALUES(exclusividade),
          fim_exclusividade   = VALUES(fim_exclusividade),
          aut_publicar        = VALUES(aut_publicar),
          fim_aut_pub         = VALUES(fim_aut_pub),
          n_acomodacoes       = VALUES(n_acomodacoes),
          taxa_limpeza        = VALUES(taxa_limpeza),
          primeiro_leilao     = VALUES(primeiro_leilao),
          valor_primeiro_leilao = VALUES(valor_primeiro_leilao),
          segundo_leilao      = VALUES(segundo_leilao),
          valor_segundo_leilao = VALUES(valor_segundo_leilao),
          foto_principal      = VALUES(foto_principal),
          link_site           = VALUES(link_site),
          descricao           = VALUES(descricao),
          detalhes_basico     = VALUES(detalhes_basico),
          detalhes_servicos   = VALUES(detalhes_servicos),
          detalhes_lazer      = VALUES(detalhes_lazer),
          detalhes_social     = VALUES(detalhes_social),
          detalhes_intima     = VALUES(detalhes_intima),
          detalhes_armarios   = VALUES(detalhes_armarios),
          detalhes_acabamento = VALUES(detalhes_acabamento),
          detalhes_destaque   = VALUES(detalhes_destaque),
          outras_caracteristicas = VALUES(outras_caracteristicas),
          proprietario_nome   = VALUES(proprietario_nome),
          proprietario_empresa = VALUES(proprietario_empresa),
          proprietario_telefone = VALUES(proprietario_telefone),
          proprietario_email  = VALUES(proprietario_email),
          status              = VALUES(status),
          slug                = VALUES(slug),
          updated_at          = NOW()
      `, values)

      // result.affectedRows = 1 for INSERT, 2 for UPDATE via ON DUPLICATE KEY
      if (result.affectedRows === 1) imported++
      else updated++

      const total = imported + updated
      if (total % 50 === 0) {
        console.log(`  Progress: ${total}/${properties.length} (${imported} new, ${updated} updated)`)
      }
    } catch (err) {
      errors++
      errorLog.push({ ref: codigo, msg: err.message })
      if (errors <= 10) {
        console.error(`  ⚠ Error on ${codigo}: ${err.message}`)
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Import complete`)
  console.log(`   New:     ${imported}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Errors:  ${errors}`)
  console.log('='.repeat(60))

  if (errorLog.length > 0) {
    const logPath = path.resolve(__dirname, 'import-errors.json')
    fs.writeFileSync(logPath, JSON.stringify(errorLog, null, 2), 'utf8')
    console.log(`\nError details saved to: ${logPath}`)
  }

  await pool.end()
  process.exit(errors > 0 ? 1 : 0)
}

importProperties().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
