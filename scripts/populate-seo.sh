#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AgoraEncontrei — SEO Programático — Population Script
# Importa IBGE + Seeds Keywords + Gera Páginas + Publica
# ═══════════════════════════════════════════════════════════════

DB="postgresql://agorauser:agorapass123@localhost:5432/agoraencontrei"
PSQL="psql $DB"

echo "📦 Step 1: Creating SEO tables..."
$PSQL -q <<'SQL'
CREATE TABLE IF NOT EXISTS seo_estados (
  id SERIAL PRIMARY KEY,
  sigla VARCHAR(2) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  regiao_nome VARCHAR(100),
  regiao_sigla VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS seo_cidades (
  id SERIAL PRIMARY KEY,
  id_ibge BIGINT UNIQUE NOT NULL,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  populacao INTEGER DEFAULT 0,
  estado_id INT NOT NULL REFERENCES seo_estados(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS seo_keywords (
  id SERIAL PRIMARY KEY,
  termo VARCHAR(200) UNIQUE NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  prioridade INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS seo_paginas (
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
);
CREATE INDEX IF NOT EXISTS idx_seo_cidades_slug ON seo_cidades(slug);
CREATE INDEX IF NOT EXISTS idx_seo_cidades_estado ON seo_cidades(estado_id);
CREATE INDEX IF NOT EXISTS idx_seo_paginas_slug ON seo_paginas(slug);
CREATE INDEX IF NOT EXISTS idx_seo_paginas_status ON seo_paginas(status);
CREATE INDEX IF NOT EXISTS idx_seo_paginas_cidade ON seo_paginas(cidade_id);
CREATE INDEX IF NOT EXISTS idx_seo_paginas_keyword ON seo_paginas(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_categoria ON seo_keywords(categoria);
SQL
echo "✅ Tables ready"

echo ""
echo "🔑 Step 2: Seeding keywords..."
$PSQL -q <<'SQL'
INSERT INTO seo_keywords (termo, categoria) VALUES
  ('imoveis a venda','venda'),('casas a venda','venda'),('apartamentos a venda','venda'),
  ('terrenos a venda','venda'),('sobrados a venda','venda'),('kitnet a venda','venda'),
  ('cobertura a venda','venda'),('sala comercial a venda','venda'),
  ('galpao a venda','venda'),('imovel comercial a venda','venda'),
  ('ponto comercial a venda','venda'),('predio comercial a venda','venda'),
  ('casas para alugar','aluguel'),('apartamentos para alugar','aluguel'),
  ('kitnet para alugar','aluguel'),('sala comercial para alugar','aluguel'),
  ('galpao para alugar','aluguel'),('imoveis para alugar','aluguel'),
  ('loja para alugar','aluguel'),('sobrado para alugar','aluguel'),
  ('imoveis baratos','oportunidade'),('oportunidade de imoveis','oportunidade'),
  ('imoveis abaixo do mercado','oportunidade'),('imoveis com desconto','oportunidade'),
  ('investimento imobiliario','oportunidade'),('imoveis para investir','oportunidade'),
  ('imoveis para renda','oportunidade'),('imoveis retomados','oportunidade'),
  ('leilao de imoveis','leilao'),('leilao judicial de imoveis','leilao'),
  ('leilao extrajudicial de imoveis','leilao'),('imoveis caixa','leilao'),
  ('leilao caixa','leilao'),('leilao banco do brasil','leilao'),
  ('leilao bradesco','leilao'),('leilao itau','leilao'),
  ('leilao santander','leilao'),('imoveis de leilao','leilao'),
  ('arrematacao de imoveis','leilao'),('imoveis retomados caixa','leilao'),
  ('casas para financiar','financiamento'),('apartamentos para financiar','financiamento'),
  ('imoveis para financiar','financiamento'),('financiamento imobiliario','financiamento'),
  ('financiamento caixa','financiamento'),('financiamento minha casa minha vida','financiamento'),
  ('simulador de financiamento','financiamento'),('credito imobiliario','financiamento'),
  ('consorcio de imoveis','financiamento'),('fgts para comprar imovel','financiamento'),
  ('casa com piscina','tipo'),('casa em condominio fechado','tipo'),
  ('casa terrea','tipo'),('casa nova','tipo'),('apartamento novo','tipo'),
  ('apartamento alto padrao','tipo'),('apartamento na planta','tipo'),
  ('terreno em condominio','tipo'),('terreno comercial','tipo'),
  ('chacara a venda','rural'),('sitio a venda','rural'),
  ('fazenda a venda','rural'),('area rural a venda','rural'),
  ('casa 2 quartos','quartos'),('casa 3 quartos','quartos'),
  ('casa 4 quartos','quartos'),('apartamento 1 quarto','quartos'),
  ('apartamento 2 quartos','quartos'),('apartamento 3 quartos','quartos'),
  ('imoveis ate 100 mil','preco'),('imoveis ate 200 mil','preco'),
  ('imoveis ate 300 mil','preco'),('imoveis ate 500 mil','preco'),
  ('imoveis de luxo','preco'),('imoveis alto padrao','preco'),
  ('imoveis populares','preco'),
  ('imobiliaria','servico'),('corretor de imoveis','servico'),
  ('avaliacao de imoveis','servico'),('consultoria imobiliaria','servico'),
  ('vistoria de imoveis','servico'),('documentacao imobiliaria','servico'),
  ('regularizacao de imoveis','servico'),
  ('lancamento imobiliario','construcao'),('imovel na planta','construcao'),
  ('construtora','construcao'),('incorporadora','construcao'),
  ('condominio fechado','condominio'),('condominio de casas','condominio'),
  ('condominio de lotes','condominio'),('condominio com lazer','condominio'),
  ('direito imobiliario','juridico'),('advogado imobiliario','juridico'),
  ('contrato de compra e venda','juridico'),('usucapiao','juridico'),
  ('mercado imobiliario','mercado'),('preco do metro quadrado','mercado'),
  ('valorizacao de imoveis','mercado'),
  ('aluguel por temporada','temporada'),('casa de temporada','temporada'),
  ('permuta de imoveis','permuta'),('imovel aceita permuta','permuta'),
  ('loteamento','loteamento'),('lotes a venda','loteamento'),
  ('como comprar primeiro imovel','longtail'),
  ('documentos para comprar imovel','longtail'),
  ('como funciona leilao de imovel','longtail'),
  ('como participar de leilao de imoveis','longtail'),
  ('riscos de comprar imovel em leilao','longtail'),
  ('quanto custa escritura de imovel','longtail'),
  ('melhor bairro para morar','longtail'),
  ('como negociar preco de imovel','longtail'),
  ('como usar fgts para comprar imovel','longtail'),
  ('comprar casa com fgts','longtail'),
  ('energia solar residencial','sustentabilidade'),
  ('seguro residencial','seguro'),('seguro de imovel','seguro')
ON CONFLICT (termo) DO NOTHING;
SQL
echo "✅ Keywords seeded"
$PSQL -t -c "SELECT COUNT(*) || ' keywords total' FROM seo_keywords;"

echo ""
echo "🌍 Step 3: Importing IBGE cities..."
# Download IBGE data, parse with node, import via COPY
node -e "
const https = require('https');
const url = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
let data = '';
https.get(url, res => {
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const munis = JSON.parse(data);
    // Output estados
    const estados = new Map();
    munis.forEach(m => {
      const uf = m.microrregiao.mesorregiao.UF;
      if (!estados.has(uf.sigla)) {
        estados.set(uf.sigla, { sigla: uf.sigla, nome: uf.nome, regiao: uf.regiao.nome, regiaoSigla: uf.regiao.sigla });
      }
    });
    // Write estados SQL
    let sql = '';
    estados.forEach(e => {
      const nome = e.nome.replace(/'/g, \"''\");
      const regiao = e.regiao.replace(/'/g, \"''\");
      sql += \"INSERT INTO seo_estados (sigla, nome, regiao_nome, regiao_sigla) VALUES ('\" + e.sigla + \"', '\" + nome + \"', '\" + regiao + \"', '\" + e.regiaoSigla + \"') ON CONFLICT (sigla) DO UPDATE SET nome = EXCLUDED.nome, regiao_nome = EXCLUDED.regiao_nome, regiao_sigla = EXCLUDED.regiao_sigla;\n\";
    });
    // Write cidades SQL
    munis.forEach(m => {
      const uf = m.microrregiao.mesorregiao.UF;
      const nome = m.nome.replace(/'/g, \"''\");
      const slug = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      sql += \"INSERT INTO seo_cidades (id_ibge, nome, slug, estado_id) VALUES (\" + m.id + \", '\" + nome + \"', '\" + slug + \"', (SELECT id FROM seo_estados WHERE sigla = '\" + uf.sigla + \"')) ON CONFLICT (id_ibge) DO UPDATE SET nome = EXCLUDED.nome, slug = EXCLUDED.slug;\n\";
    });
    process.stdout.write(sql);
  });
}).on('error', e => { console.error(e); process.exit(1); });
" > /tmp/ibge_import.sql 2>&1

if [ $? -eq 0 ] && [ -s /tmp/ibge_import.sql ]; then
  echo "  SQL generated: $(wc -l < /tmp/ibge_import.sql) lines"
  $PSQL -q -f /tmp/ibge_import.sql
  echo "✅ IBGE import done"
  $PSQL -t -c "SELECT COUNT(*) || ' estados, ' FROM seo_estados;"
  $PSQL -t -c "SELECT COUNT(*) || ' cidades total' FROM seo_cidades;"
else
  echo "❌ Failed to fetch IBGE data"
  exit 1
fi

echo ""
echo "📄 Step 4: Generating SEO pages (200 cidades x all keywords)..."
# Generate pages using SQL cross join
$PSQL -q <<'SQL'
INSERT INTO seo_paginas (cidade_id, keyword_id, slug, titulo, h1, meta_title, meta_description, intro, faq, status)
SELECT
  c.id,
  k.id,
  -- slug
  lower(translate(
    regexp_replace(
      regexp_replace(k.termo || '-' || c.nome || '-' || e.sigla, '[^a-zA-ZÀ-ÿ0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    'ÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåèéêëìíîïòóôõöùúûüýÇçÑñ',
    'AAAAAAEEEEIIIIOOOOOUUUUYaaaaaaeeeeiiiioooouuuuyCcNn'
  )),
  -- titulo
  initcap(k.termo) || ' em ' || c.nome || ' ' || e.sigla || ' | AgoraEncontrei',
  -- h1
  initcap(k.termo) || ' em ' || c.nome || ' - ' || e.sigla,
  -- meta_title
  initcap(k.termo) || ' em ' || c.nome || ' ' || e.sigla || ' — Melhores Oportunidades | AgoraEncontrei',
  -- meta_description
  left('Encontre ' || lower(k.termo) || ' em ' || c.nome || ' ' || e.sigla || '. Compare opções, preços e detalhes de imóveis. Oportunidades verificadas no AgoraEncontrei.', 320),
  -- intro
  'Explore as melhores oportunidades de ' || lower(k.termo) || ' em ' || c.nome || ', ' || e.sigla || '. No AgoraEncontrei, você encontra opções verificadas, com informações detalhadas sobre preços, localização e condições de pagamento.',
  -- faq
  jsonb_build_array(
    jsonb_build_object('pergunta', 'Como encontrar ' || lower(k.termo) || ' em ' || c.nome || ' ' || e.sigla || '?', 'resposta', 'No AgoraEncontrei você pode comparar anúncios, localização, faixa de preço e detalhes do imóvel para identificar as melhores oportunidades em ' || c.nome || '.'),
    jsonb_build_object('pergunta', 'Quais os preços de ' || lower(k.termo) || ' em ' || c.nome || '?', 'resposta', 'Os preços variam conforme localização, tamanho e estado de conservação. Acesse os anúncios para ver valores atualizados e condições de financiamento.'),
    jsonb_build_object('pergunta', 'Vale a pena investir em ' || lower(k.termo) || ' em ' || c.nome || ' ' || e.sigla || '?', 'resposta', c.nome || ' ' || e.sigla || ' pode oferecer ótimas oportunidades dependendo da localização e do potencial de valorização.'),
    jsonb_build_object('pergunta', 'Como financiar ' || lower(k.termo) || ' em ' || c.nome || '?', 'resposta', 'Existem diversas opções de financiamento bancário, incluindo Caixa, Bradesco, Itaú e Santander. Use nosso simulador para comparar taxas e prazos.'),
    jsonb_build_object('pergunta', 'O AgoraEncontrei é confiável?', 'resposta', 'Sim. O AgoraEncontrei é um marketplace verificado com imóveis de imobiliárias credenciadas, parceiros e leilões oficiais.')
  ),
  'rascunho'
FROM seo_cidades c
JOIN seo_estados e ON e.id = c.estado_id
CROSS JOIN seo_keywords k
WHERE k.ativo = TRUE
AND c.id IN (SELECT id FROM seo_cidades ORDER BY populacao DESC NULLS LAST, id ASC LIMIT 200)
ON CONFLICT (cidade_id, keyword_id) DO NOTHING;
SQL
echo "✅ Pages generated"
$PSQL -t -c "SELECT COUNT(*) || ' total pages' FROM seo_paginas;"

echo ""
echo "🚀 Step 5: Publishing all pages..."
$PSQL -q -c "UPDATE seo_paginas SET status = 'publicado', published_at = NOW(), updated_at = NOW() WHERE status = 'rascunho' AND intro IS NOT NULL AND intro != '';"
echo "✅ Published"

echo ""
echo "📊 FINAL STATS:"
$PSQL -t <<'SQL'
SELECT
  'Estados: ' || (SELECT COUNT(*) FROM seo_estados) ||
  ' | Cidades: ' || (SELECT COUNT(*) FROM seo_cidades) ||
  ' | Keywords: ' || (SELECT COUNT(*) FROM seo_keywords WHERE ativo = TRUE) ||
  ' | Paginas Total: ' || (SELECT COUNT(*) FROM seo_paginas) ||
  ' | Publicadas: ' || (SELECT COUNT(*) FROM seo_paginas WHERE status = 'publicado');
SQL

echo ""
echo "🎯 TOP 10 pages:"
$PSQL -t -c "SELECT slug FROM seo_paginas WHERE status = 'publicado' ORDER BY id LIMIT 10;"

echo ""
echo "🎉 Done! Motor SEO populado com sucesso."
