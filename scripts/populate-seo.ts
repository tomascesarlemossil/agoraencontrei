/**
 * Script para importar cidades IBGE e popular SEO diretamente no banco
 * Roda independente da API — usa Prisma Client direto
 */
import 'dotenv/config'

const DB_URL = process.env.DATABASE_URL || 'postgresql://agorauser:agorapass123@localhost:5432/agoraencontrei'

async function main() {
const pg = require('pg')
const { Client } = pg
const client = new Client({ connectionString: DB_URL })
await client.connect()

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Step 1: Create tables ──────────────────────────────────────────────────
console.log('📦 Creating SEO tables...')
const migrations = [
  `CREATE TABLE IF NOT EXISTS seo_estados (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(2) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    regiao_nome VARCHAR(100),
    regiao_sigla VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS seo_cidades (
    id SERIAL PRIMARY KEY,
    id_ibge BIGINT UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    populacao INTEGER DEFAULT 0,
    estado_id INT NOT NULL REFERENCES seo_estados(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS seo_keywords (
    id SERIAL PRIMARY KEY,
    termo VARCHAR(200) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    prioridade INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS seo_paginas (
    id BIGSERIAL PRIMARY KEY,
    cidade_id INT NOT NULL REFERENCES seo_cidades(id) ON DELETE CASCADE,
    keyword_id INT NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
    slug VARCHAR(300) UNIQUE NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    h1 VARCHAR(300) NOT NULL,
    meta_title VARCHAR(300) NOT NULL,
    meta_description VARCHAR(320) NOT NULL,
    intro TEXT,
    conteudo TEXT,
    faq JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'rascunho',
    views INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cidade_id, keyword_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_seo_cidades_slug ON seo_cidades(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_seo_cidades_estado ON seo_cidades(estado_id)`,
  `CREATE INDEX IF NOT EXISTS idx_seo_paginas_slug ON seo_paginas(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_seo_paginas_status ON seo_paginas(status)`,
  `CREATE INDEX IF NOT EXISTS idx_seo_paginas_cidade ON seo_paginas(cidade_id)`,
  `CREATE INDEX IF NOT EXISTS idx_seo_paginas_keyword ON seo_paginas(keyword_id)`,
  `CREATE INDEX IF NOT EXISTS idx_seo_keywords_categoria ON seo_keywords(categoria)`,
]

for (const sql of migrations) {
  try { await client.query(sql) } catch {}
}
console.log('✅ Tables ready')

// ── Step 2: Import IBGE ────────────────────────────────────────────────────
console.log('🌍 Fetching IBGE municipalities...')
const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios')
const municipios: any[] = await response.json()
console.log(`📊 ${municipios.length} municipalities fetched`)

console.log('💾 Importing estados & cidades...')
let imported = 0
const estadoCache = new Map<string, number>()

for (const item of municipios) {
  const uf = item.microrregiao.mesorregiao.UF

  // Upsert estado
  if (!estadoCache.has(uf.sigla)) {
    const res = await client.query(
      `INSERT INTO seo_estados (sigla, nome, regiao_nome, regiao_sigla)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (sigla)
       DO UPDATE SET nome = EXCLUDED.nome, regiao_nome = EXCLUDED.regiao_nome, regiao_sigla = EXCLUDED.regiao_sigla
       RETURNING id`,
      [uf.sigla, uf.nome, uf.regiao.nome, uf.regiao.sigla]
    )
    estadoCache.set(uf.sigla, res.rows[0].id)
  }

  const estadoId = estadoCache.get(uf.sigla)!

  // Upsert cidade
  await client.query(
    `INSERT INTO seo_cidades (id_ibge, nome, slug, estado_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_ibge)
     DO UPDATE SET nome = EXCLUDED.nome, slug = EXCLUDED.slug, estado_id = EXCLUDED.estado_id`,
    [item.id, item.nome, slugify(item.nome), estadoId]
  )
  imported++

  if (imported % 500 === 0) {
    console.log(`  ... ${imported}/${municipios.length} imported`)
  }
}
console.log(`✅ ${imported} cidades imported, ${estadoCache.size} estados`)

// ── Step 3: Seed Keywords ──────────────────────────────────────────────────
console.log('🔑 Seeding keywords...')

const KEYWORDS: [string, string][] = [
  // VENDA
  ['imoveis a venda', 'venda'], ['casas a venda', 'venda'], ['apartamentos a venda', 'venda'],
  ['terrenos a venda', 'venda'], ['sobrados a venda', 'venda'], ['kitnet a venda', 'venda'],
  ['cobertura a venda', 'venda'], ['sala comercial a venda', 'venda'],
  ['galpao a venda', 'venda'], ['imovel comercial a venda', 'venda'],
  ['ponto comercial a venda', 'venda'], ['predio comercial a venda', 'venda'],
  // ALUGUEL
  ['casas para alugar', 'aluguel'], ['apartamentos para alugar', 'aluguel'],
  ['kitnet para alugar', 'aluguel'], ['sala comercial para alugar', 'aluguel'],
  ['galpao para alugar', 'aluguel'], ['imoveis para alugar', 'aluguel'],
  ['loja para alugar', 'aluguel'], ['sobrado para alugar', 'aluguel'],
  // OPORTUNIDADE
  ['imoveis baratos', 'oportunidade'], ['oportunidade de imoveis', 'oportunidade'],
  ['imoveis abaixo do mercado', 'oportunidade'], ['imoveis com desconto', 'oportunidade'],
  ['investimento imobiliario', 'oportunidade'], ['imoveis para investir', 'oportunidade'],
  ['imoveis para renda', 'oportunidade'], ['imoveis retomados', 'oportunidade'],
  // LEILAO
  ['leilao de imoveis', 'leilao'], ['leilao judicial de imoveis', 'leilao'],
  ['leilao extrajudicial de imoveis', 'leilao'], ['imoveis caixa', 'leilao'],
  ['leilao caixa', 'leilao'], ['leilao banco do brasil', 'leilao'],
  ['leilao bradesco', 'leilao'], ['leilao itau', 'leilao'],
  ['leilao santander', 'leilao'], ['imoveis de leilao', 'leilao'],
  ['arrematacao de imoveis', 'leilao'], ['imoveis retomados caixa', 'leilao'],
  // FINANCIAMENTO
  ['casas para financiar', 'financiamento'], ['apartamentos para financiar', 'financiamento'],
  ['imoveis para financiar', 'financiamento'], ['financiamento imobiliario', 'financiamento'],
  ['financiamento caixa', 'financiamento'], ['financiamento minha casa minha vida', 'financiamento'],
  ['simulador de financiamento', 'financiamento'], ['credito imobiliario', 'financiamento'],
  ['consorcio de imoveis', 'financiamento'], ['fgts para comprar imovel', 'financiamento'],
  // TIPO
  ['casa com piscina', 'tipo'], ['casa em condominio fechado', 'tipo'],
  ['casa terrea', 'tipo'], ['casa nova', 'tipo'], ['apartamento novo', 'tipo'],
  ['apartamento alto padrao', 'tipo'], ['apartamento na planta', 'tipo'],
  ['terreno em condominio', 'tipo'], ['terreno comercial', 'tipo'],
  // RURAL
  ['chacara a venda', 'rural'], ['sitio a venda', 'rural'],
  ['fazenda a venda', 'rural'], ['area rural a venda', 'rural'],
  // QUARTOS
  ['casa 2 quartos', 'quartos'], ['casa 3 quartos', 'quartos'],
  ['casa 4 quartos', 'quartos'], ['apartamento 1 quarto', 'quartos'],
  ['apartamento 2 quartos', 'quartos'], ['apartamento 3 quartos', 'quartos'],
  // PRECO
  ['imoveis ate 100 mil', 'preco'], ['imoveis ate 200 mil', 'preco'],
  ['imoveis ate 300 mil', 'preco'], ['imoveis ate 500 mil', 'preco'],
  ['imoveis de luxo', 'preco'], ['imoveis alto padrao', 'preco'],
  ['imoveis populares', 'preco'],
  // SERVICO
  ['imobiliaria', 'servico'], ['corretor de imoveis', 'servico'],
  ['avaliacao de imoveis', 'servico'], ['consultoria imobiliaria', 'servico'],
  ['vistoria de imoveis', 'servico'], ['documentacao imobiliaria', 'servico'],
  ['regularizacao de imoveis', 'servico'],
  // CONSTRUCAO
  ['lancamento imobiliario', 'construcao'], ['imovel na planta', 'construcao'],
  ['construtora', 'construcao'], ['incorporadora', 'construcao'],
  // LOCALIZACAO
  ['imoveis no centro', 'localizacao'], ['imoveis perto de escola', 'localizacao'],
  ['imoveis perto de shopping', 'localizacao'], ['imoveis em bairro nobre', 'localizacao'],
  // CONDOMINIO
  ['condominio fechado', 'condominio'], ['condominio de casas', 'condominio'],
  ['condominio de lotes', 'condominio'], ['condominio com lazer', 'condominio'],
  // JURIDICO
  ['direito imobiliario', 'juridico'], ['advogado imobiliario', 'juridico'],
  ['contrato de compra e venda', 'juridico'], ['contrato de aluguel', 'juridico'],
  ['usucapiao', 'juridico'],
  // MERCADO
  ['mercado imobiliario', 'mercado'], ['preco do metro quadrado', 'mercado'],
  ['valorizacao de imoveis', 'mercado'],
  // TEMPORADA
  ['aluguel por temporada', 'temporada'], ['casa de temporada', 'temporada'],
  // PERMUTA
  ['permuta de imoveis', 'permuta'], ['imovel aceita permuta', 'permuta'],
  // LOTEAMENTO
  ['loteamento', 'loteamento'], ['lotes a venda', 'loteamento'],
  // LONGTAIL
  ['como comprar primeiro imovel', 'longtail'],
  ['documentos para comprar imovel', 'longtail'],
  ['como funciona leilao de imovel', 'longtail'],
  ['como participar de leilao de imoveis', 'longtail'],
  ['riscos de comprar imovel em leilao', 'longtail'],
  ['quanto custa escritura de imovel', 'longtail'],
  ['melhor bairro para morar', 'longtail'],
  ['como negociar preco de imovel', 'longtail'],
  ['vantagens de comprar imovel na planta', 'longtail'],
  ['quando vale a pena alugar ou comprar', 'longtail'],
  ['como calcular valor de aluguel', 'longtail'],
  ['como usar fgts para comprar imovel', 'longtail'],
  ['comprar casa com fgts', 'longtail'],
  ['energia solar residencial', 'sustentabilidade'],
  ['casa sustentavel', 'sustentabilidade'],
  ['seguro residencial', 'seguro'],
  ['seguro de imovel', 'seguro'],
]

let kwInserted = 0
for (const [termo, categoria] of KEYWORDS) {
  try {
    await client.query(
      `INSERT INTO seo_keywords (termo, categoria) VALUES ($1, $2) ON CONFLICT (termo) DO NOTHING`,
      [termo, categoria]
    )
    kwInserted++
  } catch {}
}
console.log(`✅ ${kwInserted} keywords seeded`)

// ── Step 4: Generate pages ─────────────────────────────────────────────────
console.log('📄 Generating SEO pages...')

// Get top cities (capitais + cidades grandes primeiro)
const cidadesResult = await client.query(`
  SELECT c.id, c.nome, e.sigla AS uf
  FROM seo_cidades c
  JOIN seo_estados e ON e.id = c.estado_id
  ORDER BY c.populacao DESC NULLS LAST, c.id ASC
  LIMIT 200
`)
const cidades = cidadesResult.rows

const keywordsResult = await client.query(
  `SELECT id, termo FROM seo_keywords WHERE ativo = TRUE ORDER BY id ASC`
)
const keywords = keywordsResult.rows

console.log(`  ${cidades.length} cidades x ${keywords.length} keywords = ${cidades.length * keywords.length} pages to generate`)

function capitalize(t: string) {
  return t.replace(/\b\w/g, (c: string) => c.toUpperCase())
}

let generated = 0
let skipped = 0

for (const cidade of cidades) {
  for (const keyword of keywords) {
    const slug = slugify(`${keyword.termo}-${cidade.nome}-${cidade.uf}`)
    const keywordCap = capitalize(keyword.termo)
    const cidadeCap = capitalize(cidade.nome)
    const uf = cidade.uf.toUpperCase()

    const titulo = `${keywordCap} em ${cidadeCap} ${uf} | AgoraEncontrei`
    const h1 = `${keywordCap} em ${cidadeCap} - ${uf}`
    const metaTitle = `${keywordCap} em ${cidadeCap} ${uf} — Melhores Oportunidades | AgoraEncontrei`
    const metaDesc = `Encontre ${keyword.termo.toLowerCase()} em ${cidadeCap} ${uf}. Compare opções, preços e detalhes de imóveis. Oportunidades verificadas no AgoraEncontrei.`
    const intro = `Explore as melhores oportunidades de ${keyword.termo.toLowerCase()} em ${cidadeCap}, ${uf}. No AgoraEncontrei, você encontra opções verificadas, com informações detalhadas sobre preços, localização e condições de pagamento.`
    const faq = JSON.stringify([
      {
        pergunta: `Como encontrar ${keyword.termo.toLowerCase()} em ${cidadeCap} ${uf}?`,
        resposta: `No AgoraEncontrei você pode comparar anúncios, localização, faixa de preço e detalhes do imóvel para identificar as melhores oportunidades em ${cidadeCap}.`
      },
      {
        pergunta: `Quais os preços de ${keyword.termo.toLowerCase()} em ${cidadeCap}?`,
        resposta: `Os preços variam conforme localização, tamanho e estado de conservação. Acesse os anúncios para ver valores atualizados e condições de financiamento.`
      },
      {
        pergunta: `Vale a pena investir em ${keyword.termo.toLowerCase()} em ${cidadeCap} ${uf}?`,
        resposta: `${cidadeCap} ${uf} pode oferecer ótimas oportunidades dependendo da localização e do potencial de valorização.`
      },
      {
        pergunta: `Como financiar ${keyword.termo.toLowerCase()} em ${cidadeCap}?`,
        resposta: `Existem diversas opções de financiamento bancário, incluindo Caixa, Bradesco, Itaú e Santander. Use nosso simulador para comparar taxas e prazos.`
      },
      {
        pergunta: `O AgoraEncontrei é confiável para buscar ${keyword.termo.toLowerCase()}?`,
        resposta: `Sim. O AgoraEncontrei é um marketplace verificado com imóveis de imobiliárias credenciadas, parceiros e leilões oficiais.`
      }
    ])

    try {
      await client.query(
        `INSERT INTO seo_paginas (
          cidade_id, keyword_id, slug, titulo, h1, meta_title, meta_description, intro, faq, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'rascunho')
        ON CONFLICT (cidade_id, keyword_id) DO NOTHING`,
        [cidade.id, keyword.id, slug, titulo, h1, metaTitle, metaDesc, intro, faq]
      )
      generated++
    } catch {
      skipped++
    }
  }

  if (cidades.indexOf(cidade) % 20 === 0) {
    console.log(`  ... ${cidades.indexOf(cidade) + 1}/${cidades.length} cidades processed (${generated} pages)`)
  }
}
console.log(`✅ ${generated} pages generated (${skipped} skipped)`)

// ── Step 5: Publish batch (all with intro) ─────────────────────────────────
console.log('🚀 Publishing pages batch...')
const publishResult = await client.query(
  `UPDATE seo_paginas
   SET status = 'publicado', published_at = NOW(), updated_at = NOW()
   WHERE status = 'rascunho' AND intro IS NOT NULL AND intro != ''`
)
console.log(`✅ ${publishResult.rowCount} pages published`)

// ── Final stats ────────────────────────────────────────────────────────────
const stats = await client.query(`
  SELECT
    (SELECT COUNT(*) FROM seo_estados) AS estados,
    (SELECT COUNT(*) FROM seo_cidades) AS cidades,
    (SELECT COUNT(*) FROM seo_keywords) AS keywords,
    (SELECT COUNT(*) FROM seo_paginas) AS total_paginas,
    (SELECT COUNT(*) FROM seo_paginas WHERE status = 'publicado') AS publicadas
`)
console.log('\n📊 RESULTADO FINAL:')
console.log(JSON.stringify(stats.rows[0], null, 2))

await client.end()
console.log('\n🎉 Done! Motor SEO populado com sucesso.')
}

main().catch(e => { console.error(e); process.exit(1) })
