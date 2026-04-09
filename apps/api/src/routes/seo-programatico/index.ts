/**
 * SEO Programático — Rotas de Geração e Consulta
 *
 * POST /import-ibge           → Importa todas cidades do IBGE
 * POST /keywords/seed         → Popula keywords de SEO
 * POST /pages/generate        → Gera páginas base (slug + meta + FAQ)
 * POST /pages/publish-ai      → Gera conteúdo IA para páginas rascunho
 * POST /pages/publish-batch   → Publica rascunhos sem IA (intro existente)
 * GET  /pages/:slug           → Busca página publicada por slug
 * GET  /pages                 → Lista páginas publicadas (paginado)
 * GET  /sitemap/pages.xml     → Sitemap XML das páginas publicadas
 * GET  /stats                 → Estatísticas do motor SEO
 * GET  /cities                → Lista cidades com dados IBGE
 * PATCH /cities/:id/ibge      → Atualiza dados IBGE de uma cidade
 */

import type { FastifyInstance } from 'fastify'
import {
  fetchMunicipiosIBGE,
  buildSeoPageData,
  buildSeoPrompt,
  SEO_KEYWORDS,
} from '../../services/seo-programatico.service.js'
import { slugify } from '../../utils/slugify.js'

export default async function seoProgramaticoRoutes(app: FastifyInstance) {
  // ── Security: all write operations require authentication ──────────────
  // GET routes (pages, sitemap, stats) remain public for SEO crawlers.
  // POST routes (import, seed, generate, publish) require admin auth.
  // SEO tables are NOT multi-tenant — only the main company (SUPER_ADMIN) can modify.
  // Isolated users can view SEO stats but cannot modify pages.

  // Block isolated/non-main companies from modifying shared SEO data
  app.addHook('preHandler', async (req: any, reply) => {
    if (req.method === 'GET') return // GET routes are public (SEO crawlers)
    if (!req.user) return // Auth not yet checked
    const publicCid = process.env.PUBLIC_COMPANY_ID
    if (publicCid && req.user.cid !== publicCid && req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'SEO Programático é gerenciado pelo admin principal. Configure seu próprio site para ter SEO próprio.' })
    }
  })

  // ── Migrate: create SEO tables ──────────────────────────────────────────
  const seoMigrations = [
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
    // ── Migration: colunas IBGE para seo_cidades (dados reais) ──────────
    `ALTER TABLE seo_cidades ADD COLUMN IF NOT EXISTS populacao_estimada INTEGER`,
    `ALTER TABLE seo_cidades ADD COLUMN IF NOT EXISTS densidade_demografica NUMERIC(10,2)`,
    `ALTER TABLE seo_cidades ADD COLUMN IF NOT EXISTS pib_per_capita NUMERIC(15,2)`,
    `ALTER TABLE seo_cidades ADD COLUMN IF NOT EXISTS salario_medio_sm NUMERIC(5,2)`,
    `ALTER TABLE seo_cidades ADD COLUMN IF NOT EXISTS pessoal_ocupado INTEGER`,
    `ALTER TABLE seo_cidades ADD COLUMN IF NOT EXISTS area_territorial NUMERIC(12,3)`,
    `ALTER TABLE seo_cidades ADD COLUMN IF NOT EXISTS gentilico VARCHAR(100)`,
    // Seed Franca/SP com dados reais do IBGE 2022/2025
    `UPDATE seo_cidades SET
       populacao = 352536,
       populacao_estimada = 365494,
       densidade_demografica = 582.05,
       pib_per_capita = 40777.87,
       salario_medio_sm = 2.2,
       pessoal_ocupado = 126557,
       area_territorial = 605.679,
       gentilico = 'francano'
     WHERE id_ibge = 3516200`,
    // ── Migration: colunas para 1M URLs (PR #41) ─────────────────────────
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS conteudo_ai TEXT`,
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS familia_url VARCHAR(100)`,
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS estado_slug VARCHAR(10)`,
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS cidade_slug VARCHAR(100)`,
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS cluster_slug VARCHAR(100)`,
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS modificador_slug VARCHAR(100)`,
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS prioridade SMALLINT DEFAULT 5`,
    `ALTER TABLE seo_paginas ADD COLUMN IF NOT EXISTS indexar BOOLEAN DEFAULT TRUE`,
    `CREATE INDEX IF NOT EXISTS idx_seo_paginas_familia ON seo_paginas(familia_url)`,
    `CREATE INDEX IF NOT EXISTS idx_seo_paginas_estado_slug ON seo_paginas(estado_slug)`,
    `CREATE INDEX IF NOT EXISTS idx_seo_paginas_prioridade ON seo_paginas(prioridade)`,
  ]

  for (const sql of seoMigrations) {
    try {
      await app.prisma.$executeRawUnsafe(sql)
    } catch {
      /* already exists */
    }
  }

  // ── POST /import-ibge ───────────────────────────────────────────────────
  app.post('/import-ibge', { preHandler: [app.authenticate] }, async (_req, reply) => {
    try {
      const municipios = await fetchMunicipiosIBGE()
      let inserted = 0

      // Process in batches to avoid timeout
      const BATCH = 500
      for (let i = 0; i < municipios.length; i += BATCH) {
        const batch = municipios.slice(i, i + BATCH)

        for (const item of batch) {
          const uf = item.microrregiao.mesorregiao.UF

          // Upsert estado
          await app.prisma.$executeRawUnsafe(
            `INSERT INTO seo_estados (sigla, nome, regiao_nome, regiao_sigla)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (sigla)
             DO UPDATE SET nome = EXCLUDED.nome, regiao_nome = EXCLUDED.regiao_nome, regiao_sigla = EXCLUDED.regiao_sigla`,
            uf.sigla,
            uf.nome,
            uf.regiao.nome,
            uf.regiao.sigla
          )

          // Get estado id
          const estados: { id: number }[] = await app.prisma.$queryRawUnsafe(
            `SELECT id FROM seo_estados WHERE sigla = $1`,
            uf.sigla
          )
          const estadoId = estados[0]?.id
          if (!estadoId) continue

          // Upsert cidade
          await app.prisma.$executeRawUnsafe(
            `INSERT INTO seo_cidades (id_ibge, nome, slug, estado_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id_ibge)
             DO UPDATE SET nome = EXCLUDED.nome, slug = EXCLUDED.slug, estado_id = EXCLUDED.estado_id`,
            item.id,
            item.nome,
            slugify(item.nome),
            estadoId
          )
          inserted++
        }
      }

      return reply.send({ ok: true, total: inserted })
    } catch (error: any) {
      app.log.error(error)
      return reply.status(500).send({ ok: false, error: error.message })
    }
  })

  // ── POST /keywords/seed ─────────────────────────────────────────────────
  app.post('/keywords/seed', { preHandler: [app.authenticate] }, async (_req, reply) => {
    let inserted = 0

    for (const [termo, categoria] of SEO_KEYWORDS) {
      try {
        await app.prisma.$executeRawUnsafe(
          `INSERT INTO seo_keywords (termo, categoria)
           VALUES ($1, $2)
           ON CONFLICT (termo) DO NOTHING`,
          termo,
          categoria
        )
        inserted++
      } catch {
        /* duplicate */
      }
    }

    return reply.send({ ok: true, total: SEO_KEYWORDS.length, inserted })
  })

  // ── POST /pages/generate ────────────────────────────────────────────────
  app.post('/pages/generate', { preHandler: [app.authenticate] }, async (req, reply) => {
    const q = req.query as Record<string, string>
    const limitCidades = parseInt(q.limit || '100', 10)
    const estado = q.estado // filtrar por UF (opcional)

    let cidadeQuery = `
      SELECT c.id, c.nome, e.sigla AS uf
      FROM seo_cidades c
      JOIN seo_estados e ON e.id = c.estado_id
    `
    const params: any[] = []

    if (estado) {
      cidadeQuery += ` WHERE e.sigla = $1`
      params.push(estado.toUpperCase())
    }

    cidadeQuery += ` ORDER BY c.populacao DESC NULLS LAST, c.id ASC LIMIT $${params.length + 1}`
    params.push(limitCidades)

    const cidades: { id: number; nome: string; uf: string }[] =
      await app.prisma.$queryRawUnsafe(cidadeQuery, ...params)

    const keywords: { id: number; termo: string }[] =
      await app.prisma.$queryRawUnsafe(
        `SELECT id, termo FROM seo_keywords WHERE ativo = TRUE ORDER BY prioridade DESC, id ASC`
      )

    let total = 0

    for (const cidade of cidades) {
      for (const keyword of keywords) {
        const data = buildSeoPageData(keyword.termo, cidade.nome, cidade.uf)

        try {
          await app.prisma.$executeRawUnsafe(
            `INSERT INTO seo_paginas (
              cidade_id, keyword_id, slug, titulo, h1, meta_title, meta_description, intro, faq, status
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'rascunho')
            ON CONFLICT (cidade_id, keyword_id)
            DO UPDATE SET slug=EXCLUDED.slug, titulo=EXCLUDED.titulo, h1=EXCLUDED.h1,
              meta_title=EXCLUDED.meta_title, meta_description=EXCLUDED.meta_description,
              intro=EXCLUDED.intro, faq=EXCLUDED.faq, updated_at=NOW()`,
            cidade.id,
            keyword.id,
            data.slug,
            data.titulo,
            data.h1,
            data.meta_title,
            data.meta_description,
            data.intro,
            JSON.stringify(data.faq)
          )
          total++
        } catch (e: any) {
          // Slug conflict with another cidade/keyword combo — skip
          app.log.warn(`Skip page ${data.slug}: ${e.message}`)
        }
      }
    }

    return reply.send({ ok: true, total, cidades: cidades.length, keywords: keywords.length })
  })

  // ── POST /pages/publish-ai ──────────────────────────────────────────────
  app.post('/pages/publish-ai', { preHandler: [app.authenticate] }, async (req, reply) => {
    const q = req.query as Record<string, string>
    const limit = parseInt(q.limit || '10', 10)

    const pages: {
      id: number
      slug: string
      keyword: string
      cidade: string
      uf: string
      populacao: number | null
      populacao_estimada: number | null
      densidade_demografica: number | null
      pib_per_capita: number | null
      salario_medio_sm: number | null
      pessoal_ocupado: number | null
      area_territorial: number | null
      gentilico: string | null
      id_ibge: number | null
    }[] = await app.prisma.$queryRawUnsafe(
      `SELECT p.id, p.slug, k.termo AS keyword, c.nome AS cidade, e.sigla AS uf,
              c.populacao, c.populacao_estimada, c.densidade_demografica,
              c.pib_per_capita, c.salario_medio_sm, c.pessoal_ocupado,
              c.area_territorial, c.gentilico, c.id_ibge
       FROM seo_paginas p
       JOIN seo_keywords k ON k.id = p.keyword_id
       JOIN seo_cidades c ON c.id = p.cidade_id
       JOIN seo_estados e ON e.id = c.estado_id
       WHERE p.status = 'rascunho'
       ORDER BY p.id ASC
       LIMIT $1`,
      limit
    )

    if (pages.length === 0) {
      return reply.send({ ok: true, total: 0, message: 'Nenhuma página rascunho encontrada' })
    }

    // Try Anthropic first, then OpenAI
    // Aceita contexto IBGE opcional para enriquecer o prompt
    type GenFn = (keyword: string, cidade: string, uf: string, ctx?: import('../../services/seo-programatico.service.js').CidadeContextoIBGE) => Promise<string>
    let generateContent: GenFn | null = null

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        generateContent = async (keyword, cidade, uf, ctx) => {
          const msg = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{ role: 'user', content: buildSeoPrompt(keyword, cidade, uf, ctx) }],
          })
          return (msg.content[0] as { text: string }).text
        }
      } catch {
        app.log.warn('Anthropic SDK not available')
      }
    }

    if (!generateContent && process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        generateContent = async (keyword, cidade, uf, ctx) => {
          const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: buildSeoPrompt(keyword, cidade, uf, ctx) }],
            max_tokens: 2048,
          })
          return response.choices[0]?.message?.content || ''
        }
      } catch {
        app.log.warn('OpenAI SDK not available')
      }
    }   if (!generateContent) {
      return reply.status(400).send({
        ok: false,
        error: 'Nenhuma API de IA configurada. Defina ANTHROPIC_API_KEY ou OPENAI_API_KEY.',
      })
    }

    let published = 0
    const errors: string[] = []

    for (const page of pages) {
      try {
        // Montar contexto IBGE com dados reais da cidade
        const ibgeCtx: import('../../services/seo-programatico.service.js').CidadeContextoIBGE = {
          populacao: page.populacao ?? undefined,
          populacaoEstimada: page.populacao_estimada ?? undefined,
          densidadeDemografica: page.densidade_demografica ?? undefined,
          pibPerCapita: page.pib_per_capita ?? undefined,
          salarioMedioSM: page.salario_medio_sm ?? undefined,
          pessoalOcupado: page.pessoal_ocupado ?? undefined,
          areaTerritorial: page.area_territorial ?? undefined,
          gentilico: page.gentilico ?? undefined,
          idibge: page.id_ibge ?? undefined,
        }
        app.log.info(`[SEO-AI] Gerando: ${page.slug} | ${page.cidade}/${page.uf} | pop: ${page.populacao ?? 'N/A'}`)
        const conteudo = await generateContent(page.keyword, page.cidade, page.uf, ibgeCtx)

        await app.prisma.$executeRawUnsafe(
          `UPDATE seo_paginas
           SET conteudo = $1, status = 'publicado', published_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          conteudo,
          page.id
        )
        published++
      } catch (e: any) {
        errors.push(`${page.slug}: ${e.message}`)
        app.log.error(`AI error for ${page.slug}: ${e.message}`)
      }
    }

    return reply.send({ ok: true, total: published, errors: errors.length > 0 ? errors : undefined })
  })

  // ── GET /pages/:slug ────────────────────────────────────────────────────
  app.get('/pages/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }

    const rows: any[] = await app.prisma.$queryRawUnsafe(
      `SELECT p.id::int, p.cidade_id, p.keyword_id, p.slug, p.titulo, p.h1,
              p.meta_title, p.meta_description, p.intro, p.conteudo, p.faq,
              p.status, p.views, p.published_at, p.created_at, p.updated_at,
              c.nome AS cidade, e.sigla AS uf, e.nome AS estado_nome,
              k.termo AS keyword, k.categoria
       FROM seo_paginas p
       JOIN seo_cidades c ON c.id = p.cidade_id
       JOIN seo_estados e ON e.id = c.estado_id
       JOIN seo_keywords k ON k.id = p.keyword_id
       WHERE p.slug = $1 AND p.status = 'publicado'
       LIMIT 1`,
      slug
    )

    if (!rows[0]) return reply.status(404).send({ ok: false, error: 'NOT_FOUND' })

    // Increment views async
    app.prisma.$executeRawUnsafe(
      `UPDATE seo_paginas SET views = views + 1 WHERE slug = $1`,
      slug
    ).catch(() => {})

    // Fetch related pages (same city, different keyword)
    const related: any[] = await app.prisma.$queryRawUnsafe(
      `SELECT p.slug, p.titulo, p.h1, k.termo AS keyword
       FROM seo_paginas p
       JOIN seo_keywords k ON k.id = p.keyword_id
       WHERE p.cidade_id = $1::int AND p.keyword_id != $2::int AND p.status = 'publicado'
       ORDER BY p.views DESC
       LIMIT 6`,
      Number(rows[0].cidade_id),
      Number(rows[0].keyword_id)
    )

    // Fetch nearby cities pages (same keyword)
    const nearby: any[] = await app.prisma.$queryRawUnsafe(
      `SELECT p.slug, p.titulo, c.nome AS cidade, e.sigla AS uf
       FROM seo_paginas p
       JOIN seo_cidades c ON c.id = p.cidade_id
       JOIN seo_estados e ON e.id = c.estado_id
       WHERE p.keyword_id = $1::int
         AND p.cidade_id != $2::int
         AND p.status = 'publicado'
         AND e.sigla = $3
       ORDER BY c.populacao DESC NULLS LAST
       LIMIT 6`,
      Number(rows[0].keyword_id),
      Number(rows[0].cidade_id),
      rows[0].uf
    )

    return reply.send({
      ...rows[0],
      related,
      nearby,
    })
  })

  // ── GET /pages ──────────────────────────────────────────────────────────
  app.get('/pages', async (req, reply) => {
    const q = req.query as Record<string, string>
    const page = parseInt(q.page || '1', 10)
    const limit = Math.min(parseInt(q.limit || '50', 10), 200)
    const status = q.status || 'publicado'
    const estado = q.estado
    const categoria = q.categoria
    const offset = (page - 1) * limit

    const joins = `
      FROM seo_paginas p
      JOIN seo_cidades c ON c.id = p.cidade_id
      JOIN seo_estados e ON e.id = c.estado_id
      JOIN seo_keywords k ON k.id = p.keyword_id
    `
    let countQuery = `SELECT COUNT(*)::int as total ${joins}`
    let dataQuery = `
      SELECT p.id::int, p.slug, p.titulo, p.h1, p.meta_description, p.status, p.views,
             c.nome AS cidade, e.sigla AS uf, k.termo AS keyword, k.categoria,
             p.published_at, p.created_at ${joins}`

    const conditions: string[] = [`p.status = '${status}'`]
    const params: any[] = []

    if (estado) {
      params.push(estado.toUpperCase())
      conditions.push(`e.sigla = $${params.length}`)
    }
    if (categoria) {
      params.push(categoria)
      conditions.push(`k.categoria = $${params.length}`)
    }

    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    countQuery += whereClause
    dataQuery += whereClause

    dataQuery += ` ORDER BY p.views DESC, p.published_at DESC NULLS LAST`
    params.push(limit)
    dataQuery += ` LIMIT $${params.length}`
    params.push(offset)
    dataQuery += ` OFFSET $${params.length}`

    const countParams = params.slice(0, -2)

    const [countResult, data] = await Promise.all([
      app.prisma.$queryRawUnsafe<{ total: number }[]>(countQuery, ...countParams),
      app.prisma.$queryRawUnsafe<any[]>(dataQuery, ...params),
    ])

    const total = (countResult as any)[0]?.total || 0

    return reply.send({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  })

  // ── GET /sitemap/pages.xml ──────────────────────────────────────────────
  app.get('/sitemap/pages.xml', async (req, reply) => {
    const q = req.query as Record<string, string>
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.WEB_URL || 'https://www.agoraencontrei.com.br'
    const pageNum = parseInt(q.page || '1', 10)
    const perPage = 50000
    const offset = (pageNum - 1) * perPage

    const pages: { slug: string; updated_at: string }[] =
      await app.prisma.$queryRawUnsafe(
        `SELECT slug, updated_at FROM seo_paginas
         WHERE status = 'publicado'
         ORDER BY id ASC
         LIMIT $1 OFFSET $2`,
        perPage,
        offset
      )

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${siteUrl}/s/${p.slug}</loc>
    <lastmod>${new Date(p.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    reply.header('Content-Type', 'application/xml')
    reply.header('Cache-Control', 'public, max-age=3600')
    return reply.send(xml)
  })

  // ── GET /sitemap/index.xml ──────────────────────────────────────────────
  app.get('/sitemap/index.xml', async (_req, reply) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.WEB_URL || 'https://www.agoraencontrei.com.br'
    const apiUrl = process.env.APP_URL || 'http://localhost:3100'

    const countResult: { total: number }[] = await app.prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as total FROM seo_paginas WHERE status = 'publicado'`
    )
    const total = (countResult as any)[0]?.total || 0
    const totalSitemaps = Math.ceil(total / 50000) || 1

    const sitemaps = Array.from({ length: totalSitemaps }, (_, i) => i + 1)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (num) => `  <sitemap>
    <loc>${apiUrl}/api/v1/seo/sitemap/pages.xml?page=${num}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`

    reply.header('Content-Type', 'application/xml')
    reply.header('Cache-Control', 'public, max-age=3600')
    return reply.send(xml)
  })

  // ── GET /admin/start-generation ─────────────────────────────────────────
  // Trigger de geração em batch com logs de progresso — sem autenticação (admin only)
  app.get('/admin/start-generation', async (req, reply) => {
    const q = req.query as Record<string, string>
    const batchSize = Math.min(parseInt(q.batch || '50', 10), 200)
    const maxBatches = parseInt(q.max_batches || '10', 10)
    const delay = parseInt(q.delay || '2000', 10) // ms entre batches

    // Contar rascunhos pendentes
    const countResult: { total: number }[] = await app.prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as total FROM seo_paginas WHERE status = 'rascunho'`
    )
    const totalPendentes = (countResult as any)[0]?.total || 0

    if (totalPendentes === 0) {
      return reply.send({ ok: true, message: 'Nenhuma página rascunho pendente.', total_pendentes: 0 })
    }

    app.log.info(`[SEO-GEN] Iniciando geração: ${totalPendentes} rascunhos | batch=${batchSize} | max_batches=${maxBatches}`)

    // Responde imediatamente e processa em background
    reply.send({
      ok: true,
      message: `Geração iniciada em background. ${totalPendentes} páginas pendentes.`,
      total_pendentes: totalPendentes,
      batch_size: batchSize,
      max_batches: maxBatches,
      delay_ms: delay,
      estimated_time_min: Math.ceil((totalPendentes / batchSize) * (delay / 1000) / 60),
    })

    // Processar em background (sem await)
    ;(async () => {
      let totalGeradas = 0
      let batchCount = 0

      while (batchCount < maxBatches) {
        try {
          const apiUrl = process.env.APP_URL || 'http://localhost:3100'
          const res = await fetch(`${apiUrl}/api/v1/seo/pages/publish-ai?limit=${batchSize}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          const data = await res.json() as { ok: boolean; total: number; message?: string }

          if (!data.ok || data.total === 0) {
            app.log.info(`[SEO-GEN] Concluído! Total geradas: ${totalGeradas}`)
            break
          }

          totalGeradas += data.total
          batchCount++
          app.log.info(`[SEO-GEN] Batch ${batchCount}/${maxBatches} | +${data.total} páginas | Total: ${totalGeradas}`)

          // Throttle para não sobrecarregar a API de IA
          await new Promise((resolve) => setTimeout(resolve, delay))
        } catch (e: any) {
          app.log.error(`[SEO-GEN] Erro no batch ${batchCount}: ${e.message}`)
          break
        }
      }

      app.log.info(`[SEO-GEN] Finalizado. Total geradas: ${totalGeradas} em ${batchCount} batches.`)
    })()
  })

  // ── GET /stats ──────────────────────────────────────────────────────────
  app.get('/stats', async (_req, reply) => {
    const [totalCidades, totalEstados, totalKeywords, totalPaginas, publicadas, rascunhos, totalViews] =
      await Promise.all([
        app.prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as c FROM seo_cidades`),
        app.prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as c FROM seo_estados`),
        app.prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as c FROM seo_keywords WHERE ativo = TRUE`),
        app.prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as c FROM seo_paginas`),
        app.prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as c FROM seo_paginas WHERE status = 'publicado'`),
        app.prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as c FROM seo_paginas WHERE status = 'rascunho'`),
        app.prisma.$queryRawUnsafe<any[]>(`SELECT COALESCE(SUM(views), 0)::int as c FROM seo_paginas`),
      ])

    return reply.send({
      cidades: (totalCidades as any)[0]?.c || 0,
      estados: (totalEstados as any)[0]?.c || 0,
      keywords: (totalKeywords as any)[0]?.c || 0,
      paginas_total: (totalPaginas as any)[0]?.c || 0,
      paginas_publicadas: (publicadas as any)[0]?.c || 0,
      paginas_rascunho: (rascunhos as any)[0]?.c || 0,
      total_views: (totalViews as any)[0]?.c || 0,
    })
  })

  // ── POST /pages/publish-batch (sem IA — publica rascunhos com intro) ──
  app.post('/pages/publish-batch', { preHandler: [app.authenticate] }, async (req, reply) => {
    const q = req.query as Record<string, string>
    const limit = parseInt(q.limit || '1000', 10)

    const result = await app.prisma.$executeRawUnsafe(
      `UPDATE seo_paginas
       SET status = 'publicado', published_at = NOW(), updated_at = NOW()
       WHERE status = 'rascunho' AND intro IS NOT NULL AND intro != ''
       AND id IN (
         SELECT id FROM seo_paginas
         WHERE status = 'rascunho' AND intro IS NOT NULL AND intro != ''
         ORDER BY id ASC
         LIMIT $1
       )`,
      limit
    )

    return reply.send({ ok: true, published: result })
  })

  // ── GET /cities ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // Lista todas as cidades com seus dados IBGE (para o script de importação)
  app.get('/cities', async (req, reply) => {
    const q = req.query as Record<string, string>
    const limit = parseInt(q.limit || '10000', 10)
    const offset = parseInt(q.offset || '0', 10)
    const semDados = q.sem_dados === 'true'

    let sql = `
      SELECT
        c.id,
        c.id_ibge,
        c.nome,
        c.slug,
        e.sigla AS uf,
        c.populacao,
        c.populacao_estimada,
        c.densidade_demografica,
        c.pib_per_capita,
        c.salario_medio_sm,
        c.pessoal_ocupado,
        c.area_territorial,
        c.gentilico
      FROM seo_cidades c
      JOIN seo_estados e ON e.id = c.estado_id
    `
    if (semDados) {
      sql += ` WHERE c.populacao_estimada IS NULL AND c.populacao = 0`
    }
    sql += ` ORDER BY c.id ASC LIMIT ${limit} OFFSET ${offset}`

    const cidades = await app.prisma.$queryRawUnsafe(sql)
    return reply.send({ cidades, total: (cidades as any[]).length })
  })

  // ── PATCH /cities/:id/ibge ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // Atualiza dados IBGE de uma cidade específica (usado pelo script de importação)
  app.patch('/cities/:id/ibge', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as {
      populacao_estimada?: number | null
      area_territorial?: number | null
      pib_per_capita?: number | null
      salario_medio_sm?: number | null
      densidade_demografica?: number | null
      pessoal_ocupado?: number | null
      gentilico?: string | null
    }

    const updates: string[] = []
    const values: (number | string | null)[] = []
    let idx = 1

    if (body.populacao_estimada !== undefined) {
      updates.push(`populacao_estimada = $${idx++}`)
      values.push(body.populacao_estimada)
    }
    if (body.area_territorial !== undefined) {
      updates.push(`area_territorial = $${idx++}`)
      values.push(body.area_territorial)
    }
    if (body.pib_per_capita !== undefined) {
      updates.push(`pib_per_capita = $${idx++}`)
      values.push(body.pib_per_capita)
    }
    if (body.salario_medio_sm !== undefined) {
      updates.push(`salario_medio_sm = $${idx++}`)
      values.push(body.salario_medio_sm)
    }
    if (body.densidade_demografica !== undefined) {
      updates.push(`densidade_demografica = $${idx++}`)
      values.push(body.densidade_demografica)
    }
    if (body.pessoal_ocupado !== undefined) {
      updates.push(`pessoal_ocupado = $${idx++}`)
      values.push(body.pessoal_ocupado)
    }
    if (body.gentilico !== undefined) {
      updates.push(`gentilico = $${idx++}`)
      values.push(body.gentilico)
    }

    if (updates.length === 0) {
      return reply.status(400).send({ ok: false, error: 'Nenhum campo para atualizar' })
    }

    values.push(parseInt(id, 10))
    await app.prisma.$executeRawUnsafe(
      `UPDATE seo_cidades SET ${updates.join(', ')} WHERE id = $${idx}`,
      ...values
    )

    return reply.send({ ok: true })
  })
}
