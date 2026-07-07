/**
 * Rota de Especialistas / Parceiros Profissionais
 * POST /api/v1/specialists — cadastro público (sem auth)
 * GET  /api/v1/specialists — listagem pública
 * GET  /api/v1/specialists/:slug — perfil público
 * GET  /api/v1/specialists/buildings — lista de edifícios para o formulário
 * PATCH /api/v1/specialists/:id/approve — aprovação pelo admin
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { slugify } from '../../utils/slugify.js'
import { specialistTokenOrAdmin, generateSpecialistAccessToken } from './auth.js'

const categoryLabels: Record<string, string> = {
  ARQUITETO: 'Arquiteto(a)',
  ENGENHEIRO: 'Engenheiro(a)',
  CORRETOR: 'Corretor(a)',
  AVALIADOR: 'Avaliador(a)',
  DESIGNER_INTERIORES: 'Designer de Interiores',
  FOTOGRAFO: 'Fotógrafo(a)',
  VIDEOMAKER: 'Videomaker',
  ADVOGADO_IMOBILIARIO: 'Advogado(a) Imobiliário',
  DESPACHANTE: 'Despachante',
  IMOBILIARIA: 'Imobiliaria',
  LOTEADORA: 'Loteadora',
  OUTRO: 'Outro',
}

function specialistVisibilityRank(s: any) {
  const now = Date.now()
  const featuredUntil = s.featuredUntil ? new Date(s.featuredUntil).getTime() : null
  const activeFeatured = !!s.isFeatured && (!featuredUntil || featuredUntil >= now)
  const planRank: Record<string, number> = { VIP: 0, PREMIUM: 1, PRIME: 2, PROFISSIONAL: 3, ESSENCIAL: 4, START: 5 }
  const commercialPlan = s.adPlan || s.plan || ''
  return [
    activeFeatured ? 0 : 1,
    -(Number(s.featuredWeight ?? 0)),
    planRank[commercialPlan] ?? 6,
    s.name || '',
  ] as const
}

function sortSpecialistsForVisibility(list: any[]) {
  return [...list].sort((a, b) => {
    const ar = specialistVisibilityRank(a)
    const br = specialistVisibilityRank(b)
    if (ar[0] !== br[0]) return ar[0] - br[0]
    if (ar[1] !== br[1]) return ar[1] - br[1]
    if (ar[2] !== br[2]) return ar[2] - br[2]
    return String(ar[3]).localeCompare(String(br[3]), 'pt-BR')
  })
}

export default async function specialistsRoute(app: FastifyInstance) {
  const prisma = (app as any).prisma

  // ─── GET /buildings — lista de edifícios para o formulário de cadastro ───
  app.get('/buildings', async (request, reply) => {
    try {
      // Buscar edifícios cadastrados no banco
      const buildings = await prisma.building.findMany({
        select: { id: true, slug: true, name: true, neighborhood: true, city: true },
        orderBy: { name: 'asc' },
      })

      // Se não há edifícios no banco, retornar lista dos condomínios do seo-condo-slugs
      if (buildings.length === 0) {
        // Seed automático dos condomínios mais populares
        const seedCondos = [
          { name: 'Condomínio Collis Residence', neighborhood: 'Centro' },
          { name: 'Condomínio Di Villaggio Firenze', neighborhood: 'Jardim Francano' },
          { name: 'Condomínio Gaia', neighborhood: 'Jardim Aeroporto' },
          { name: 'Condomínio Olivito', neighborhood: 'Centro' },
          { name: 'Condomínio Piemonte', neighborhood: 'Jardim Piemonte' },
          { name: 'Condomínio Porto dos Sonhos', neighborhood: 'Jardim Aeroporto' },
          { name: 'Condomínio Reserva das Amoreiras', neighborhood: 'Jardim Amoreiras' },
          { name: 'Condomínio Residencial Brasil', neighborhood: 'Vila Brasil' },
          { name: 'Condomínio Residencial Dom Bosco', neighborhood: 'Dom Bosco' },
          { name: 'Condomínio Residencial Piemonte', neighborhood: 'Jardim Piemonte' },
          { name: 'Condomínio Residencial Safra', neighborhood: 'Jardim Safra' },
          { name: 'Condomínio Spazio Florence', neighborhood: 'Jardim Florence' },
          { name: 'Condomínio Spazio Fratelli', neighborhood: 'Jardim Fratelli' },
          { name: 'Condomínio Terras de Paragon', neighborhood: 'Paragon' },
          { name: 'Condomínio Vila di Capri', neighborhood: 'Vila Capri' },
          { name: 'Condomínio Vila Hípica', neighborhood: 'Vila Hípica' },
          { name: 'Condomínio Vila Piemonte', neighborhood: 'Jardim Piemonte' },
          { name: 'Edifício Prime Franca', neighborhood: 'Centro' },
          { name: 'Edifício Siracusa', neighborhood: 'Centro' },
          { name: 'Edifício Franca Garden', neighborhood: 'Jardim Aeroporto' },
          { name: 'Condomínio Fechado de Franca', neighborhood: 'Jardim Francano' },
          { name: 'Condomínio Riacho Doce', neighborhood: 'Jardim Riacho Doce' },
          { name: 'Condomínio Villaggio San Rafaello', neighborhood: 'Jardim Villaggio' },
          { name: 'Condomínio Parque Freemont', neighborhood: 'Jardim Freemont' },
          { name: 'Condomínio Pérola', neighborhood: 'Centro' },
        ]

        const created = await Promise.all(
          seedCondos.map(c =>
            prisma.building.upsert({
              where: { slug: slugify(c.name) },
              update: {},
              create: {
                slug: slugify(c.name),
                name: c.name,
                neighborhood: c.neighborhood,
                city: 'Franca',
                state: 'SP',
              },
              select: { id: true, slug: true, name: true, neighborhood: true, city: true },
            })
          )
        )
        return reply.send({ data: created })
      }

      return reply.send({ data: buildings })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar edifícios', details: err.message })
    }
  })

  // ─── GET / — listagem pública de especialistas ativos ───────────────────
  app.get('/', async (request, reply) => {
    const { category, city, q, page = '1', limit = '20' } = (request.query as any)
    const skip = (parseInt(page) - 1) * parseInt(limit)

    try {
      const where: any = { status: 'ACTIVE' }
      if (category) where.category = category
      if (city) where.city = { contains: city, mode: 'insensitive' }
      if (q) where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
      ]

      const [specialists, total] = await Promise.all([
        prisma.specialist.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            buildings: {
              include: { building: { select: { id: true, slug: true, name: true, neighborhood: true } } },
            },
          },
        }),
        prisma.specialist.count({ where }),
      ])

      return reply.send({
        data: sortSpecialistsForVisibility(specialists).map((s: any) => ({
          ...s,
          categoryLabel: categoryLabels[s.category] || s.category,
          profileUrl: `https://www.agoraencontrei.com.br/especialistas/${s.slug}`,
        })),
        meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar especialistas', details: err.message })
    }
  })

  // ─── GET /:slug — perfil público de um especialista ─────────────────────
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }

    try {
      const specialist = await prisma.specialist.findUnique({
        where: { slug },
        include: {
          buildings: {
            include: { building: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!specialist || specialist.status !== 'ACTIVE') {
        return reply.status(404).send({ error: 'Especialista não encontrado' })
      }

      return reply.send({
        data: {
          ...specialist,
          categoryLabel: categoryLabels[specialist.category] || specialist.category,
          profileUrl: `https://www.agoraencontrei.com.br/especialistas/${specialist.slug}`,
        },
      })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar especialista', details: err.message })
    }
  })

  // ─── POST / — cadastro público de novo especialista ──────────────────────
  app.post('/', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      category: z.enum([
        'ARQUITETO', 'ENGENHEIRO', 'CORRETOR', 'AVALIADOR',
        'DESIGNER_INTERIORES', 'FOTOGRAFO', 'VIDEOMAKER',
        'ADVOGADO_IMOBILIARIO', 'DESPACHANTE', 'OUTRO',
        'IMOBILIARIA', 'LOTEADORA',
      ]),
      bio: z.string().optional(),
      city: z.string().default('Franca'),
      state: z.string().default('SP'),
      crea: z.string().optional(),
      instagram: z.string().optional(),
      website: z.string().optional(),
      tags: z.array(z.string()).default([]),
      buildingIds: z.array(z.string()).default([]), // IDs dos edifícios selecionados
      // "Divulgue seu Negócio": dados da landing page editável.
      cpfcnpj: z.string().optional(),
      photoUrl: z.string().optional(),
      logoUrl: z.string().optional(),
      address: z.string().optional(),
      businessType: z.string().optional(),
      landingPage: z.any().optional(),
    })

    const parsed = schema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const data = parsed.data

    // Gerar slug único
    let baseSlug = slugify(`${data.name}-${categoryLabels[data.category] || data.category}-franca-sp`)
    let slug = baseSlug
    let counter = 1
    while (await prisma.specialist.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    try {
      // Criar especialista
      const specialist = await prisma.specialist.create({
        data: {
          slug,
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          category: data.category,
          bio: data.bio,
          city: data.city,
          state: data.state,
          crea: data.crea,
          instagram: data.instagram,
          website: data.website,
          tags: data.tags,
          cpfCnpj: data.cpfcnpj,
          photoUrl: data.photoUrl,
          logoUrl: data.logoUrl,
          address: data.address,
          businessType: data.businessType,
          landingPage: data.landingPage ?? undefined,
          adPlan: data.landingPage?.adPlan ?? undefined,
          status: 'PENDING',
          buildings: data.buildingIds.length > 0 ? {
            create: data.buildingIds.map((buildingId: string) => ({ buildingId })),
          } : undefined,
        },
        include: {
          buildings: { include: { building: { select: { name: true, slug: true } } } },
        },
      })

      const profileUrl = `https://www.agoraencontrei.com.br/especialistas/${slug}`

      // Enviar email de boas-vindas
      try {
        const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
        if (isEmailConfigured()) {
          const categoryLabel = categoryLabels[data.category] || data.category
          const buildingNames = specialist.buildings.map((b: any) => b.building.name).join(', ')

          await sendEmail({
            to: data.email,
            subject: `Bem-vindo(a) ao AgoraEncontrei, ${data.name}! 🎉`,
            html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#1B2B5B;padding:40px 32px;text-align:center;">
      <h1 style="color:#C9A84C;font-size:28px;margin:0;font-weight:700;">AgoraEncontrei</h1>
      <p style="color:#fff;margin:8px 0 0;font-size:14px;opacity:0.8;">Marketplace Imobiliário de Franca e Região</p>
    </div>
    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#1B2B5B;font-size:22px;margin:0 0 16px;">Olá, ${data.name}! 👋</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 20px;">
        Seu cadastro como <strong style="color:#1B2B5B;">${categoryLabel}</strong> no AgoraEncontrei foi recebido com sucesso!
        Nossa equipe irá revisar seu perfil em até <strong>24 horas</strong> e você receberá uma confirmação por e-mail assim que for aprovado.
      </p>
      ${buildingNames ? `
      <div style="background:#f8f6f1;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="color:#1B2B5B;font-weight:600;margin:0 0 8px;font-size:14px;">🏢 Edifícios vinculados ao seu perfil:</p>
        <p style="color:#555;margin:0;font-size:14px;">${buildingNames}</p>
      </div>
      ` : ''}
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">
        Após a aprovação, seu perfil estará disponível em:
      </p>
      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${profileUrl}" style="display:inline-block;background:#C9A84C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.5px;">
          Ver Meu Perfil →
        </a>
      </div>
      <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 16px;">
        Compartilhe este link nas suas redes sociais para atrair mais clientes que buscam imóveis em Franca e região!
      </p>
      <div style="background:#f0f4ff;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
        <p style="color:#1B2B5B;font-size:13px;margin:0;word-break:break-all;">${profileUrl}</p>
      </div>
    </div>
    <!-- Footer -->
    <div style="background:#f8f6f1;padding:24px 32px;text-align:center;border-top:1px solid #e8e4dc;">
      <p style="color:#888;font-size:12px;margin:0;">
        AgoraEncontrei — Criado pela Imobiliária Lemos, referência desde 2002<br>
        Rua Simão Caleiro, 2383 — Vila França — Franca/SP — CNPJ 10.962.301/0001-50
      </p>
    </div>
  </div>
</body>
</html>
            `,
            text: `Bem-vindo(a) ao AgoraEncontrei, ${data.name}! Seu cadastro como ${categoryLabel} foi recebido. Seu perfil: ${profileUrl}`,
          })

          await prisma.specialist.update({
            where: { id: specialist.id },
            data: { welcomeEmailSentAt: new Date() },
          })
        }
      } catch (emailErr) {
        console.error('Email de boas-vindas falhou:', emailErr)
        // Não falha o cadastro por causa do email
      }

      return reply.status(201).send({
        success: true,
        data: {
          id: specialist.id,
          slug: specialist.slug,
          name: specialist.name,
          status: specialist.status,
          profileUrl,
          message: 'Cadastro recebido! Você receberá um e-mail de confirmação em até 24 horas.',
        },
      })
    } catch (err: any) {
      if (err.code === 'P2002') {
        return reply.status(409).send({ error: 'Este e-mail já está cadastrado.' })
      }
      return reply.status(500).send({ error: 'Erro ao cadastrar especialista', details: err.message })
    }
  })

  // ─── PATCH /:id — edição da própria landing page (magic-link OU admin) ────
  // O parceiro edita sua página pelo painel: serviços, fotos, vídeos, logo,
  // contatos, endereço e template. Autoriza pelo accessToken (?token=) do
  // próprio especialista ou por admin autenticado.
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const schema = z.object({
      name: z.string().min(3).optional(),
      phone: z.string().optional().nullable(),
      whatsapp: z.string().optional().nullable(),
      bio: z.string().optional().nullable(),
      crea: z.string().optional().nullable(),
      instagram: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      photoUrl: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      businessType: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      landingPage: z.any().optional(),
    })

    const parsed = schema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    try {
      const existing = await prisma.specialist.findUnique({
        where: { id },
        select: { id: true, accessToken: true },
      })
      if (!existing) return reply.status(404).send({ error: 'Especialista não encontrado' })

      const ok = await specialistTokenOrAdmin(request, reply, (existing as any).accessToken)
      if (!ok) return // 401/403 já enviado

      const data: any = { ...parsed.data }
      if (data.landingPage !== undefined) {
        data.adPlan = data.landingPage?.adPlan ?? undefined
      }

      const updated = await prisma.specialist.update({ where: { id }, data })
      const { asaasCustomerId, asaasSubscriptionId, cpfCnpj, accessToken, ...safe } = updated as any
      return reply.send({ success: true, data: safe })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao atualizar', details: err.message })
    }
  })

  // ─── GET /:id/stats — métricas do parceiro (magic-link OU admin) ─────────
  // Lê os eventos em partner_analytics (mesma tabela do /partner-track) pelo
  // id do especialista. Autoriza pelo accessToken do próprio parceiro.
  app.get('/:id/stats', async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.specialist.findUnique({
      where: { id },
      select: { id: true, accessToken: true },
    })
    if (!existing) return reply.status(404).send({ error: 'Especialista não encontrado' })

    const ok = await specialistTokenOrAdmin(request, reply, (existing as any).accessToken)
    if (!ok) return // 401/403 já enviado

    try {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const [monthly, allTime, recent, recentLeads] = await Promise.all([
        prisma.$queryRawUnsafe(
          `SELECT
             COUNT(*) FILTER (WHERE event = 'profile_view')   as profile_views,
             COUNT(*) FILTER (WHERE event = 'whatsapp_click')  as whatsapp_clicks,
             COUNT(*) FILTER (WHERE event = 'phone_click')     as phone_clicks,
             COUNT(*) FILTER (WHERE event = 'qualified_lead')  as qualified_leads,
             COUNT(DISTINCT "visitorIp")                       as unique_visitors
           FROM partner_analytics
           WHERE "partnerId" = $1 AND "createdAt" >= $2`,
          id, firstOfMonth,
        ).catch(() => [{}]),
        prisma.$queryRawUnsafe(
          `SELECT
             COUNT(*)                                          as total_events,
             COUNT(*) FILTER (WHERE event = 'whatsapp_click')  as total_whatsapp,
             COUNT(*) FILTER (WHERE event = 'profile_view')    as total_views,
             COUNT(*) FILTER (WHERE event = 'qualified_lead')  as total_qualified_leads
           FROM partner_analytics
           WHERE "partnerId" = $1`,
          id,
        ).catch(() => [{}]),
        prisma.$queryRawUnsafe(
          `SELECT event, "pageUrl", "createdAt"
           FROM partner_analytics
           WHERE "partnerId" = $1
           ORDER BY "createdAt" DESC LIMIT 10`,
          id,
        ).catch(() => []),
        prisma.$queryRawUnsafe(
          `SELECT id, name, phone, email, city, "projectType", objective, budget,
                  timeline, property, score, "scoreLabel", "recommendedAction",
                  summary, "createdAt"
           FROM partner_leads
           WHERE "partnerId" = $1
           ORDER BY "createdAt" DESC LIMIT 12`,
          id,
        ).catch(() => []),
      ])
      const m = monthly[0] || {}
      const a = allTime[0] || {}
      return reply.send({
        monthly: {
          profileViews: Number(m.profile_views || 0),
          whatsappClicks: Number(m.whatsapp_clicks || 0),
          phoneClicks: Number(m.phone_clicks || 0),
          qualifiedLeads: Number(m.qualified_leads || 0),
          uniqueVisitors: Number(m.unique_visitors || 0),
        },
        allTime: {
          totalEvents: Number(a.total_events || 0),
          totalWhatsapp: Number(a.total_whatsapp || 0),
          totalViews: Number(a.total_views || 0),
          totalQualifiedLeads: Number(a.total_qualified_leads || 0),
        },
        recentEvents: recent,
        recentLeads,
      })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao carregar métricas', details: err.message })
    }
  })

  // ─── PATCH /:id/approve — aprovação pelo admin ───────────────────────────
  app.patch('/:id/approve', {
    preHandler: [(app as any).authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = (request as any).user

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    try {
      const specialist = await prisma.specialist.update({
        where: { id },
        data: { status: 'ACTIVE' },
      })

      return reply.send({ success: true, data: specialist })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao aprovar especialista', details: err.message })
    }
  })

  // ─── PATCH /:id/suspend — suspensão pelo admin ───────────────────────────
  app.patch('/:id/suspend', {
    preHandler: [(app as any).authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = (request as any).user

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }

    try {
      const specialist = await prisma.specialist.update({
        where: { id },
        data: { status: 'SUSPENDED' },
      })

      return reply.send({ success: true, data: specialist })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao suspender especialista', details: err.message })
    }
  })

  // ─── POST /request-access — envia magic-link do painel por e-mail/WhatsApp ─
  // Login sem senha do especialista. Recebe o e-mail, rotaciona o accessToken
  // e entrega o link por e-mail + WhatsApp. Responde SEMPRE 200 (mesmo quando
  // o e-mail não existe) para não permitir enumeração de cadastro.
  app.post('/request-access', async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'E-mail inválido' })
    }
    const email = parsed.data.email.toLowerCase().trim()
    const genericOk = {
      success: true,
      message: 'Se houver um cadastro com este e-mail, enviamos um link de acesso.',
    }

    try {
      const specialist = await prisma.specialist.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, phone: true, whatsapp: true },
      })
      // Resposta idêntica quando não existe — evita enumeração.
      if (!specialist) return reply.send(genericOk)

      const token = generateSpecialistAccessToken()
      await prisma.specialist.update({
        where: { id: specialist.id },
        data: { accessToken: token, accessTokenSentAt: new Date() },
      })

      const panelUrl = `https://www.agoraencontrei.com.br/meu-painel?token=${token}`

      // E-mail (best-effort)
      try {
        const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
        if (isEmailConfigured()) {
          await sendEmail({
            to: specialist.email,
            subject: 'Seu link de acesso ao painel — AgoraEncontrei',
            html: `
              <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f6f1;color:#1B2B5B">
                <h1 style="color:#1B2B5B;margin:0 0 8px">Acesso ao seu painel</h1>
                <p style="margin:0 0 16px;color:#475569">Olá${specialist.name ? `, ${specialist.name}` : ''}! Clique no botão para acessar o painel do seu perfil no AgoraEncontrei.</p>
                <div style="text-align:center;margin:24px 0">
                  <a href="${panelUrl}" style="display:inline-block;background:#C9A84C;color:#1B2B5B;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none">Acessar meu painel →</a>
                </div>
                <p style="margin:16px 0;color:#475569;font-size:13px">Se você não pediu este link, ignore este e-mail. Não compartilhe este link — ele dá acesso ao seu perfil.</p>
                <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">AgoraEncontrei — Marketplace Imobiliário de Franca e Região</p>
              </div>`,
            text: `Acesse seu painel no AgoraEncontrei: ${panelUrl}`,
          })
        }
      } catch (e) {
        request.log.error({ err: e }, '[specialists] request-access email failed')
      }

      // WhatsApp (best-effort)
      const notifyPhone = specialist.whatsapp || specialist.phone
      if (notifyPhone) {
        try {
          const { sendWhatsappText } = await import('../../services/whatsapp-notify.service.js')
          await sendWhatsappText(
            notifyPhone,
            `🔑 *AgoraEncontrei*\n\nSeu link de acesso ao painel:\n${panelUrl}\n\nNão compartilhe — ele dá acesso ao seu perfil.`,
          )
        } catch (e) {
          request.log.error({ err: e }, '[specialists] request-access whatsapp failed')
        }
      }

      return reply.send(genericOk)
    } catch (err: any) {
      request.log.error({ err }, '[specialists] request-access failed')
      // Mesmo em erro devolvemos a mensagem genérica para não vazar estado.
      return reply.send(genericOk)
    }
  })

  // ─── GET /session — resolve o painel a partir do magic-link (?token=) ─────
  // Resolvedor primário do login sem senha: o especialista chega pelo link
  // recebido por e-mail/WhatsApp e o token opaco (256 bits, coluna única)
  // identifica o próprio cadastro. Não expõe campos sensíveis nem o token.
  app.get('/session', async (request, reply) => {
    const token = (request.query as any)?.token as string | undefined
    if (!token || typeof token !== 'string') {
      return reply.status(401).send({ error: 'MISSING_TOKEN', message: 'Link de acesso ausente.' })
    }
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { accessToken: token },
        include: {
          buildings: {
            include: { building: { select: { name: true, slug: true } } },
          },
        },
      })
      if (!specialist) {
        return reply.status(401).send({ error: 'INVALID_TOKEN', message: 'Link inválido ou expirado. Solicite um novo.' })
      }
      const { asaasCustomerId, asaasSubscriptionId, cpfCnpj, accessToken, ...safe } = specialist as any
      return reply.send(safe)
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao carregar painel', details: err.message })
    }
  })

  // ─── GET /by-email/:email — dados privados do painel do parceiro ──────────
  // SEGURANÇA: rota antes era pública — qualquer um lia telefone/plano/status
  // de qualquer especialista informando o e-mail. Agora exige o magic-link
  // (?token=) do próprio especialista OU um admin autenticado.
  app.get('/by-email/:email', async (request, reply) => {
    const { email } = request.params as { email: string }
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { email: decodeURIComponent(email).toLowerCase().trim() },
        include: {
          buildings: {
            include: { building: { select: { name: true, slug: true } } },
          },
        },
      })
      if (!specialist) return reply.status(404).send({ error: 'Especialista não encontrado' })

      const ok = await specialistTokenOrAdmin(request, reply, (specialist as any).accessToken)
      if (!ok) return // resposta 401/403 já enviada

      // Não retornar campos sensíveis (inclui o próprio accessToken).
      const { asaasCustomerId, asaasSubscriptionId, cpfCnpj, accessToken, ...safe } = specialist as any
      return reply.send(safe)
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao buscar especialista', details: err.message })
    }
  })
}
