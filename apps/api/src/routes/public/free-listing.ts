// @ts-nocheck
/* eslint-disable */
import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { emailService } from '../../services/email.service.js'

// Turnstile verification
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  // In development or if no secret, skip verification
  if (!secret || secret === 'test-secret') return true
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch {
    return false
  }
}

// Slugify helper
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Get or create the "AgoraEncontrei Direto" company for owner-direct listings
async function getOwnerDirectCompany() {
  const OWNER_DIRECT_COMPANY_SLUG = 'agoraencontrei-direto'
  let company = await prisma.company.findFirst({
    where: { slug: OWNER_DIRECT_COMPANY_SLUG },
  })
  if (!company) {
    // Find admin user to associate
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      orderBy: { createdAt: 'asc' },
    })
    if (!adminUser) throw new Error('No admin user found to create owner-direct company')

    company = await prisma.company.create({
      data: {
        name: 'AgoraEncontrei Direto',
        slug: OWNER_DIRECT_COMPANY_SLUG,
        email: 'contato@agoraencontrei.com.br',
        phone: '16999999999',
        city: 'Franca',
        state: 'SP',
        isActive: true,
        userId: adminUser.id,
      },
    })
  }
  return company
}

// Get or create a system user for owner-direct listings
async function getOwnerDirectUser(company: { id: string }) {
  const SYSTEM_USER_EMAIL = 'proprietario-direto@agoraencontrei.com.br'
  let user = await prisma.user.findUnique({ where: { email: SYSTEM_USER_EMAIL } })
  if (!user) {
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    })
    if (!adminUser) throw new Error('No admin user found')
    user = await prisma.user.create({
      data: {
        email: SYSTEM_USER_EMAIL,
        name: 'Proprietário Direto',
        role: 'AGENT',
        companyId: company.id,
        isActive: true,
        password: '',
      },
    })
  }
  return user
}

export async function freeListingRoutes(app: FastifyInstance) {
  // POST /api/v1/public/free-listing — cadastrar imóvel grátis
  app.post('/free-listing', async (request, reply) => {
    const ip = request.ip || '0.0.0.0'
    const body = request.body as {
      zipCode?: string
      street?: string
      number?: string
      neighborhood?: string
      city?: string
      state?: string
      price?: number
      ownerPhone?: string
      ownerName?: string
      ownerEmail?: string
      propertyType?: string
      bedrooms?: number
      totalArea?: number
      description?: string
      turnstileToken?: string
    }

    // Validate required fields
    if (!body.zipCode || !body.price || !body.ownerPhone || !body.ownerName || !body.ownerEmail) {
      return reply.status(400).send({ error: 'Campos obrigatórios: CEP, preço, WhatsApp, nome e e-mail.' })
    }

    // Verify Turnstile
    const turnstileOk = await verifyTurnstile(body.turnstileToken || '', ip)
    if (!turnstileOk) {
      return reply.status(400).send({ error: 'Verificação de segurança falhou. Tente novamente.' })
    }

    // Rate limiting: max 3 listings per phone per 24h
    const recentCount = await prisma.property.count({
      where: {
        // We store ownerPhone in the captorName field as a workaround
        captorName: `OWNER_DIRECT:${body.ownerPhone}`,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (recentCount >= 3) {
      return reply.status(429).send({ error: 'Limite de 3 cadastros por dia atingido. Tente novamente amanhã.' })
    }

    try {
      const company = await getOwnerDirectCompany()
      const systemUser = await getOwnerDirectUser(company)

      // Build title and slug
      const typeLabels: Record<string, string> = {
        HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno',
        COMMERCIAL: 'Comercial', FARM: 'Chácara', OTHER: 'Imóvel',
      }
      const typeLabel = typeLabels[body.propertyType || 'HOUSE'] || 'Imóvel'
      const neighborhood = body.neighborhood || ''
      const city = body.city || 'Franca'
      const title = `${typeLabel} à Venda${neighborhood ? ` no ${neighborhood}` : ''} — ${city}/SP`

      // Ensure unique slug
      const baseSlug = slugify(`${typeLabel}-venda-${neighborhood || city}-${body.zipCode}`)
      let slug = baseSlug
      let attempt = 0
      while (await prisma.property.findFirst({ where: { companyId: company.id, slug } })) {
        attempt++
        slug = `${baseSlug}-${attempt}`
      }

      // Featured until 30 days from now
      const featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Create the property
      const property = await prisma.property.create({
        data: {
          companyId: company.id,
          userId: systemUser.id,
          title,
          slug,
          description: body.description || `${typeLabel} à venda por proprietário direto em ${neighborhood ? `${neighborhood}, ` : ''}${city}/SP. Contato direto com o proprietário, sem intermediários.`,
          type: (body.propertyType as any) || 'HOUSE',
          purpose: 'SALE',
          category: 'RESIDENTIAL',
          status: 'ACTIVE',
          price: body.price,
          zipCode: body.zipCode,
          street: body.street || '',
          number: body.number || '',
          neighborhood,
          city,
          state: body.state || 'SP',
          bedrooms: body.bedrooms || 0,
          totalArea: body.totalArea || null,
          isFeatured: true,
          featuredUntil,
          authorizedPublish: true,
          // Store owner info in available fields
          captorName: `OWNER_DIRECT:${body.ownerPhone}`,
          descriptionInternal: JSON.stringify({
            ownerName: body.ownerName,
            ownerEmail: body.ownerEmail,
            ownerPhone: body.ownerPhone,
            isOwnerDirect: true,
          }),
          importSource: 'owner_direct_free',
          publishedAt: new Date(),
        },
      })

      const propertyUrl = `https://www.agoraencontrei.com.br/imoveis/${slug}`

      // Send welcome email
      try {
        await emailService.sendEmail({
          to: body.ownerEmail,
          subject: '🏠 Seu imóvel está em destaque no AgoraEncontrei!',
          html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:20px;">
    <div style="background:#1B2B5B;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">AgoraEncontrei</h1>
      <p style="color:#C9A84C;margin:8px 0 0;">Marketplace Imobiliário de Franca e Região</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1B2B5B;margin-top:0;">Olá, ${body.ownerName}! 🎉</h2>
      <p style="color:#555;">Seu imóvel foi cadastrado com sucesso e já está em <strong>destaque</strong> no AgoraEncontrei!</p>
      
      <div style="background:#f8f6f1;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#1B2B5B;font-weight:bold;">📍 ${title}</p>
        <p style="margin:0;color:#666;font-size:14px;">Destaque ativo até: <strong>${featuredUntil.toLocaleDateString('pt-BR')}</strong></p>
      </div>

      <p style="color:#555;">Compartilhe o link abaixo para receber contatos de compradores:</p>
      <div style="background:#1B2B5B;border-radius:12px;padding:16px;text-align:center;margin:16px 0;">
        <a href="${propertyUrl}" style="color:#C9A84C;font-weight:bold;word-break:break-all;">${propertyUrl}</a>
      </div>

      <div style="border-top:1px solid #eee;margin-top:24px;padding-top:24px;">
        <h3 style="color:#1B2B5B;">O que acontece agora?</h3>
        <ul style="color:#555;padding-left:20px;">
          <li>Seu imóvel aparece com <strong>pin verde</strong> no mapa interativo</li>
          <li>Está em destaque na página inicial por <strong>30 dias</strong></li>
          <li>Compradores podem entrar em contato pelo seu WhatsApp</li>
          <li>Em 28 dias, você receberá um aviso antes do destaque encerrar</li>
        </ul>
      </div>

      <div style="background:#C9A84C20;border:1px solid #C9A84C50;border-radius:12px;padding:16px;margin-top:20px;">
        <p style="margin:0;color:#1B2B5B;font-size:14px;">
          💡 <strong>Dica:</strong> Adicione fotos ao seu anúncio para receber até 5x mais contatos. 
          Acesse o link do seu anúncio e clique em "Editar".
        </p>
      </div>
    </div>
    <div style="background:#f8f6f1;padding:16px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">
        AgoraEncontrei · Rua Simão Caleiro, 2383 · Franca/SP<br>
        CNPJ: 10.962.301/0001-50
      </p>
    </div>
  </div>
</body>
</html>`,
        })
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr)
        // Don't fail the request if email fails
      }

      // Schedule expiry email (store in DB for cron job to pick up)
      // The cron job will check properties where featuredUntil is in 2 days and isOwnerDirect
      // This is handled by the existing scheduler or a new cron endpoint

      return reply.status(201).send({
        success: true,
        slug,
        title,
        propertyUrl,
        featuredUntil: featuredUntil.toISOString(),
        message: 'Imóvel cadastrado com sucesso! E-mail de confirmação enviado.',
      })
    } catch (err) {
      console.error('Free listing error:', err)
      return reply.status(500).send({ error: 'Erro interno ao cadastrar imóvel. Tente novamente.' })
    }
  })

  // GET /api/v1/public/free-listing/expiring — cron endpoint to send expiry emails
  // Called by Railway cron or external scheduler
  app.get('/free-listing/expiring', async (request, reply) => {
    // Only allow internal calls
    const authHeader = request.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    // Find properties expiring in 2 days that are owner-direct
    const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const expiring = await prisma.property.findMany({
      where: {
        importSource: 'owner_direct_free',
        isFeatured: true,
        featuredUntil: {
          gte: yesterday,
          lte: in2Days,
        },
      },
    })

    let sent = 0
    for (const prop of expiring) {
      try {
        const internal = JSON.parse(prop.descriptionInternal || '{}')
        if (!internal.ownerEmail) continue

        const propertyUrl = `https://www.agoraencontrei.com.br/imoveis/${prop.slug}`
        await emailService.sendEmail({
          to: internal.ownerEmail,
          subject: '⏰ Seu destaque encerra em 2 dias — Renove agora',
          html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1B2B5B;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
    <h2 style="color:#C9A84C;margin:0;">AgoraEncontrei</h2>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;">
    <h3 style="color:#1B2B5B;">Olá, ${internal.ownerName || 'Proprietário'}!</h3>
    <p>O período de destaque do seu imóvel <strong>${prop.title}</strong> encerra em <strong>2 dias</strong>.</p>
    <p>Quer continuar recebendo leads qualificados e aparecer no topo das buscas?</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://www.agoraencontrei.com.br/seja-parceiro" 
         style="background:#C9A84C;color:#1B2B5B;padding:14px 28px;border-radius:8px;font-weight:bold;text-decoration:none;display:inline-block;">
        Ver planos de destaque
      </a>
    </div>
    <p style="color:#666;font-size:14px;">
      Seu anúncio continua ativo mesmo após o período de destaque. 
      <a href="${propertyUrl}" style="color:#1B2B5B;">Ver meu anúncio</a>
    </p>
  </div>
</div>`,
        })
        sent++
      } catch (e) {
        console.error('Failed to send expiry email for', prop.id, e)
      }
    }

    // Also update featuredUntil for expired properties
    await prisma.property.updateMany({
      where: {
        importSource: 'owner_direct_free',
        isFeatured: true,
        featuredUntil: { lt: new Date() },
      },
      data: { isFeatured: false },
    })

    return reply.send({ success: true, sent, total: expiring.length })
  })
  // GET /api/v1/public/free-listing/map-pins — owner-direct properties for green pins on map
  app.get('/free-listing/map-pins', async (request, reply) => {
    try {
      const pins = await prisma.property.findMany({
        where: {
          importSource: 'owner_direct_free',
          status: 'ACTIVE',
          authorizedPublish: true,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          neighborhood: true,
          city: true,
          latitude: true,
          longitude: true,
          type: true,
          bedrooms: true,
          totalArea: true,
          isFeatured: true,
        },
        take: 500,
      })
      return reply.send(pins.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: p.price ? Number(p.price) : null,
        neighborhood: p.neighborhood,
        city: p.city,
        lat: p.latitude,
        lng: p.longitude,
        type: p.type,
        bedrooms: p.bedrooms,
        totalArea: p.totalArea,
        isFeatured: p.isFeatured,
        isOwnerDirect: true,
      })))
    } catch (err) {
      console.error('Map pins error:', err)
      return reply.status(500).send({ error: 'Internal error' })
    }
  })

}
