-- 20260407000001_add_seo_pages_bairros_geo.sql
-- Motor SEO Programático: tabelas de cidades IBGE, bairros, vizinhança e páginas SEO

-- ============================================================
-- 1. ESTADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS "seo_estados" (
  "id"           SERIAL PRIMARY KEY,
  "sigla"        VARCHAR(2)  UNIQUE NOT NULL,
  "nome"         VARCHAR(100) NOT NULL,
  "regiao_nome"  VARCHAR(100),
  "regiao_sigla" VARCHAR(10),
  "created_at"   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. CIDADES (base IBGE + geo)
-- ============================================================
CREATE TABLE IF NOT EXISTS "seo_cidades" (
  "id"                  BIGSERIAL PRIMARY KEY,
  "id_ibge"             BIGINT UNIQUE NOT NULL,
  "nome"                VARCHAR(150) NOT NULL,
  "slug"                VARCHAR(180) NOT NULL,
  "uf"                  VARCHAR(2) NOT NULL,
  "estado_id"           INT NOT NULL REFERENCES "seo_estados"("id") ON DELETE CASCADE,
  "mesorregiao_ibge"    BIGINT,
  "microrregiao_ibge"   BIGINT,
  "population"          INTEGER,
  "latitude"            NUMERIC(10,7),
  "longitude"           NUMERIC(10,7),
  "quality_tier"        SMALLINT DEFAULT 2,
  "created_at"          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_seo_cidades_slug"    ON "seo_cidades"("slug");
CREATE INDEX IF NOT EXISTS "idx_seo_cidades_uf"      ON "seo_cidades"("uf");
CREATE INDEX IF NOT EXISTS "idx_seo_cidades_tier"    ON "seo_cidades"("quality_tier");

-- ============================================================
-- 3. BAIRROS
-- ============================================================
CREATE TABLE IF NOT EXISTS "seo_bairros" (
  "id"               BIGSERIAL PRIMARY KEY,
  "cidade_id"        BIGINT NOT NULL REFERENCES "seo_cidades"("id") ON DELETE CASCADE,
  "nome"             VARCHAR(160) NOT NULL,
  "slug"             VARCHAR(180) NOT NULL,
  "normalized_name"  VARCHAR(180) NOT NULL,
  "source"           VARCHAR(30) DEFAULT 'manual',
  "population"       INTEGER,
  "median_price_m2"  NUMERIC(12,2),
  "active"           BOOLEAN DEFAULT TRUE,
  "created_at"       TIMESTAMP DEFAULT NOW(),
  "updated_at"       TIMESTAMP DEFAULT NOW(),
  UNIQUE ("cidade_id", "slug")
);

CREATE TABLE IF NOT EXISTS "seo_bairro_aliases" (
  "id"               BIGSERIAL PRIMARY KEY,
  "bairro_id"        BIGINT NOT NULL REFERENCES "seo_bairros"("id") ON DELETE CASCADE,
  "alias"            VARCHAR(160) NOT NULL,
  "normalized_alias" VARCHAR(180) NOT NULL,
  UNIQUE ("bairro_id", "normalized_alias")
);

CREATE INDEX IF NOT EXISTS "idx_seo_bairros_cidade_slug" ON "seo_bairros"("cidade_id", "slug");

-- ============================================================
-- 4. VIZINHANÇA DE CIDADES (para interlinking)
-- ============================================================
CREATE TABLE IF NOT EXISTS "seo_city_neighbors" (
  "city_id"          BIGINT NOT NULL REFERENCES "seo_cidades"("id") ON DELETE CASCADE,
  "neighbor_city_id" BIGINT NOT NULL REFERENCES "seo_cidades"("id") ON DELETE CASCADE,
  "distance_km"      NUMERIC(8,2) NOT NULL,
  "source"           VARCHAR(30) DEFAULT 'haversine',
  PRIMARY KEY ("city_id", "neighbor_city_id")
);

CREATE INDEX IF NOT EXISTS "idx_seo_city_neighbors_city" ON "seo_city_neighbors"("city_id");

-- ============================================================
-- 5. KEYWORDS SEO (364 keywords do growth pack)
-- ============================================================
CREATE TABLE IF NOT EXISTS "seo_keywords" (
  "id"          SERIAL PRIMARY KEY,
  "termo"       VARCHAR(200) UNIQUE NOT NULL,
  "categoria"   VARCHAR(50) NOT NULL,  -- leilao | venda | aluguel | guia | investimento
  "cluster"     VARCHAR(50),           -- landing-leilao | landing-venda | guia-investimento
  "priority"    VARCHAR(10) DEFAULT 'media', -- alta | media | baixa
  "ativo"       BOOLEAN DEFAULT TRUE,
  "created_at"  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. PÁGINAS SEO PROGRAMÁTICAS
-- ============================================================
CREATE TABLE IF NOT EXISTS "seo_paginas" (
  "id"               BIGSERIAL PRIMARY KEY,
  "cidade_id"        BIGINT NOT NULL REFERENCES "seo_cidades"("id") ON DELETE CASCADE,
  "bairro_id"        BIGINT REFERENCES "seo_bairros"("id") ON DELETE CASCADE,
  "keyword_id"       INT NOT NULL REFERENCES "seo_keywords"("id") ON DELETE CASCADE,
  "slug"             VARCHAR(255) UNIQUE NOT NULL,
  "titulo"           VARCHAR(255) NOT NULL,
  "h1"               VARCHAR(255) NOT NULL,
  "meta_title"       VARCHAR(255) NOT NULL,
  "meta_description" VARCHAR(320) NOT NULL,
  "intro"            TEXT,
  "conteudo"         TEXT,
  "faq"              JSONB,
  "page_type"        VARCHAR(30) DEFAULT 'landing',  -- landing | guia | comparativo | faq
  "scope"            VARCHAR(15) DEFAULT 'cidade',   -- cidade | bairro | guia | comparativo
  "cluster"          VARCHAR(50),
  "quality_score"    NUMERIC(8,2) DEFAULT 0,
  "ctr_estimate"     NUMERIC(6,3),
  "canonical_slug"   VARCHAR(255),
  "status"           VARCHAR(20) DEFAULT 'rascunho', -- rascunho | publicado | pausado
  "published_at"     TIMESTAMP,
  "created_at"       TIMESTAMP DEFAULT NOW(),
  "updated_at"       TIMESTAMP DEFAULT NOW(),
  UNIQUE ("cidade_id", "keyword_id"),
  UNIQUE ("bairro_id", "keyword_id")
);

CREATE INDEX IF NOT EXISTS "idx_seo_paginas_slug"     ON "seo_paginas"("slug");
CREATE INDEX IF NOT EXISTS "idx_seo_paginas_status"   ON "seo_paginas"("status");
CREATE INDEX IF NOT EXISTS "idx_seo_paginas_bairro"   ON "seo_paginas"("bairro_id");
CREATE INDEX IF NOT EXISTS "idx_seo_paginas_score"    ON "seo_paginas"("quality_score" DESC);
CREATE INDEX IF NOT EXISTS "idx_seo_paginas_cidade"   ON "seo_paginas"("cidade_id");

-- ============================================================
-- 7. SEED: KEYWORDS PRIORITÁRIAS (Alta prioridade — Semana 1)
-- ============================================================
INSERT INTO "seo_keywords" ("termo", "categoria", "cluster", "priority") VALUES
  ('leilao de imoveis',              'leilao',      'landing-leilao',    'alta'),
  ('imoveis caixa economica',        'leilao',      'landing-leilao',    'alta'),
  ('leilao caixa economica federal', 'leilao',      'landing-leilao',    'alta'),
  ('imoveis a venda',                'venda',       'landing-venda',     'alta'),
  ('casas a venda',                  'venda',       'landing-venda',     'alta'),
  ('apartamentos a venda',           'venda',       'landing-venda',     'alta'),
  ('terrenos a venda',               'venda',       'landing-venda',     'alta'),
  ('casas para alugar',              'aluguel',     'landing-aluguel',   'alta'),
  ('apartamentos para alugar',       'aluguel',     'landing-aluguel',   'alta'),
  ('imoveis para alugar',            'aluguel',     'landing-aluguel',   'alta'),
  ('preco do m2',                    'guia',        'guia-investimento', 'alta'),
  ('investimento imobiliario',       'investimento','guia-investimento', 'alta'),
  ('financiamento imobiliario',      'guia',        'guia-investimento', 'alta'),
  ('imoveis baratos',                'venda',       'landing-venda',     'alta'),
  ('casas baratas',                  'venda',       'landing-venda',     'alta'),
  ('imoveis de leilao',              'leilao',      'landing-leilao',    'alta'),
  ('leilao judicial',                'leilao',      'landing-leilao',    'alta'),
  ('leilao extrajudicial',           'leilao',      'landing-leilao',    'alta'),
  ('imoveis comerciais',             'venda',       'landing-venda',     'media'),
  ('salas comerciais',               'venda',       'landing-venda',     'media'),
  ('galpoes industriais',            'venda',       'landing-venda',     'media'),
  ('casas de condominio',            'venda',       'landing-venda',     'media'),
  ('condominio fechado',             'venda',       'landing-venda',     'media'),
  ('imoveis rurais',                 'venda',       'landing-venda',     'media'),
  ('chacaras a venda',               'venda',       'landing-venda',     'media'),
  ('sitios a venda',                 'venda',       'landing-venda',     'media'),
  ('fazendas a venda',               'venda',       'landing-venda',     'media'),
  ('avaliacao de imoveis',           'guia',        'guia-investimento', 'media'),
  ('custo de vida',                  'guia',        'guia-investimento', 'media'),
  ('melhores bairros',               'guia',        'guia-investimento', 'media'),
  ('imoveis novos lancamentos',      'venda',       'landing-venda',     'media'),
  ('studios a venda',                'venda',       'landing-venda',     'media'),
  ('kitnet para alugar',             'aluguel',     'landing-aluguel',   'media'),
  ('casa com piscina',               'venda',       'landing-venda',     'baixa'),
  ('imoveis pet friendly',           'aluguel',     'landing-aluguel',   'baixa'),
  ('imoveis proximo escola',         'venda',       'landing-venda',     'baixa'),
  ('imoveis proximo hospital',       'venda',       'landing-venda',     'baixa'),
  ('imoveis proximo shopping',       'venda',       'landing-venda',     'baixa'),
  ('reforma de imoveis',             'guia',        'guia-investimento', 'baixa'),
  ('documentacao imovel',            'guia',        'guia-investimento', 'baixa')
ON CONFLICT ("termo") DO NOTHING;
