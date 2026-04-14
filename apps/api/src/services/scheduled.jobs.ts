// @ts-nocheck
/**
 * Scheduled Jobs — emits automation triggers based on time-based conditions
 * Runs every 30 minutes via setInterval (wired in automation.ts plugin)
 *
 * Social media jobs run once per day at ~09:00 BRT (UTC-3 = 12:00 UTC)
 */

import type { FastifyInstance } from 'fastify'
import { emitAutomation } from './automation.emitter.js'
import { syncYouTubeToBlog, syncInstagramToBlog } from './social-sync.service.js'
import { processDueFollowUps } from './followup.service.js'
import { env } from '../utils/env.js'

export async function runScheduledJobs(app: FastifyInstance) {
  const now = new Date()

  // ── 1. boleto_vencendo: rentals que vencem em ≤ 3 dias e ainda PENDING ───
  try {
    const dueInThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    // `take` limit + deterministic ordering — without these the job would
    // load every PENDING rental in the window and emit one automation per
    // row. On a busy multi-tenant DB that easily means tens of thousands of
    // objects in memory plus a flood of queued jobs every 30 minutes.
    const boletosVencendo = await app.prisma.rental.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: now, lte: dueInThreeDays },
      },
      include: {
        contract: {
          select: {
            companyId: true,
            tenantName: true,
            propertyAddress: true,
            landlordName: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 500,
    })

    for (const boleto of boletosVencendo) {
      const cid = boleto.contract?.companyId ?? boleto.companyId
      emitAutomation({
        companyId: cid,
        event: 'boleto_vencendo',
        data: {
          rentalId:        boleto.id,
          contractId:      boleto.contractId ?? '',
          tenantName:      boleto.contract?.tenantName ?? '',
          propertyAddress: boleto.contract?.propertyAddress ?? '',
          amount:          boleto.rentAmount?.toString() ?? '0',
          dueDate:         boleto.dueDate?.toISOString() ?? '',
          daysUntilDue:    boleto.dueDate
            ? Math.ceil((boleto.dueDate.getTime() - now.getTime()) / 86_400_000)
            : 0,
        },
      })
    }

    if (boletosVencendo.length > 0) {
      app.log.info(`[scheduled] boleto_vencendo: emitted ${boletosVencendo.length} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] boleto_vencendo failed')
  }

  // ── 2. lead_sem_resposta_48h: leads NEW/CONTACTED sem atividade em 48h ───
  try {
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    // Same rationale as boletosVencendo: bound the result set and process
    // oldest first so progress is monotonic instead of revisiting recent
    // rows on every tick.
    const staleLeads = await app.prisma.lead.findMany({
      where: {
        status: { in: ['NEW', 'CONTACTED'] },
        updatedAt: { lt: cutoff48h },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'asc' },
      take: 200,
    })

    for (const lead of staleLeads) {
      emitAutomation({
        companyId: lead.companyId,
        event: 'lead_sem_resposta_48h',
        data: {
          leadId:         lead.id,
          leadName:       lead.name,
          leadEmail:      lead.email ?? '',
          leadPhone:      lead.phone ?? '',
          status:         lead.status,
          assignedToId:   lead.assignedToId ?? '',
          assignedToName: lead.assignedTo?.name ?? '',
          lastActivity:   lead.updatedAt.toISOString(),
          hoursIdle:      Math.floor((now.getTime() - lead.updatedAt.getTime()) / 3_600_000),
        },
      })
    }

    if (staleLeads.length > 0) {
      app.log.info(`[scheduled] lead_sem_resposta_48h: emitted ${staleLeads.length} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] lead_sem_resposta_48h failed')
  }

  // ── 3. visita_agendada: atividades tipo 'visit' marcadas para as próximas 2h ─
  try {
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const visits = await app.prisma.activity.findMany({
      where: {
        type: 'visit',
        scheduledAt: { gte: now, lte: twoHoursFromNow },
      },
      include: {
        lead:     { select: { id: true, name: true, phone: true } },
        user:     { select: { id: true, name: true } },
      },
    })

    for (const visit of visits) {
      emitAutomation({
        companyId: visit.companyId,
        event: 'visita_agendada',
        data: {
          activityId: visit.id,
          leadId:     visit.leadId ?? '',
          leadName:   visit.lead?.name ?? '',
          leadPhone:  visit.lead?.phone ?? '',
          brokerId:   visit.userId ?? '',
          brokerName: visit.user?.name ?? '',
          scheduledAt: visit.scheduledAt?.toISOString() ?? '',
          propertyId: visit.propertyId ?? '',
        },
      })
    }

    if (visits.length > 0) {
      app.log.info(`[scheduled] visita_agendada: emitted ${visits.length} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] visita_agendada failed')
  }

  // ── 4. contrato_vencendo_30d: contratos ativos cujo endDate calculado ≤ 30d ─
  // Contract.endDate = startDate + duration months
  try {
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const activeContracts = await app.prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
        startDate: { not: null },
        duration:  { not: null, gt: 0 },
      },
      select: {
        id: true, companyId: true, tenantName: true, landlordName: true,
        propertyAddress: true, startDate: true, duration: true, rentValue: true,
      },
    })

    let emitted = 0
    for (const contract of activeContracts) {
      if (!contract.startDate || !contract.duration) continue
      const endDate = new Date(contract.startDate)
      endDate.setMonth(endDate.getMonth() + contract.duration)

      if (endDate >= now && endDate <= in30Days) {
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000)
        emitAutomation({
          companyId: contract.companyId,
          event: 'contrato_vencendo_30d',
          data: {
            contractId:      contract.id,
            tenantName:      contract.tenantName ?? '',
            landlordName:    contract.landlordName ?? '',
            propertyAddress: contract.propertyAddress ?? '',
            endDate:         endDate.toISOString(),
            daysLeft,
            rentValue:       contract.rentValue?.toString() ?? '0',
          },
        })
        emitted++
      }
    }

    if (emitted > 0) {
      app.log.info(`[scheduled] contrato_vencendo_30d: emitted ${emitted} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] contrato_vencendo_30d failed')
  }

  // ── 5. Relatório mensal de performance para parceiros Prime/VIP (dia 1, 09h BRT) ──
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  const dayOfMonth = now.getUTCDate()

  if (dayOfMonth === 1 && hour === 12 && minute < 30) {
    try {
      const { sendEmail, isEmailConfigured } = await import('./email.service.js')
      if (isEmailConfigured()) {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        const monthName = lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

        const partners = await app.prisma.specialist.findMany({
          where: {
            planStatus: { in: ['PRIME', 'VIP', 'ELITE', 'FOUNDER'] },
            status: 'ACTIVE',
            email: { not: null },
          },
          select: { id: true, name: true, email: true, planStatus: true, slug: true },
        })

        let sent = 0
        for (const partner of partners) {
          if (!partner.email) continue
          try {
            const analyticsRows = await app.prisma.$queryRawUnsafe<any[]>(
              `SELECT
                COUNT(*) FILTER (WHERE event = 'profile_view') as profile_views,
                COUNT(*) FILTER (WHERE event = 'whatsapp_click') as whatsapp_clicks,
                COUNT(*) FILTER (WHERE event = 'phone_click') as phone_clicks,
                COUNT(*) FILTER (WHERE event = 'condo_impression') as impressions
               FROM partner_analytics
               WHERE "partnerId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3`,
              partner.id, lastMonth, lastMonthEnd
            ).catch(() => [{}])

            const s = analyticsRows[0] || {}
            const profileViews = Number(s.profile_views || 0)
            const whatsappClicks = Number(s.whatsapp_clicks || 0)
            const phoneClicks = Number(s.phone_clicks || 0)
            const impressions = Number(s.impressions || 0)
            const totalContacts = whatsappClicks + phoneClicks
            const convRate = impressions > 0 ? ((totalContacts / impressions) * 100).toFixed(1) : '0'
            const planLabel = partner.planStatus === 'VIP' ? 'VIP 💎' : 'Prime ⭐'
            const profileUrl = `https://agoraencontrei.com.br/especialistas/${partner.slug}`

            await sendEmail({
              to: partner.email,
              subject: `📊 Seu Relatório de ${monthName} — AgoraEncontrei`,
              html: `
                <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fff">
                  <div style="background:linear-gradient(135deg,#1B2B5B,#2d4a8a);padding:28px;text-align:center">
                    <h1 style="color:#C9A84C;margin:0;font-size:20px">📊 Relatório Mensal</h1>
                    <p style="color:#fff;margin:6px 0 0;font-size:13px">${monthName} — Parceiro ${planLabel}</p>
                  </div>
                  <div style="padding:28px">
                    <p style="color:#555;font-size:15px">Olá, <strong>${partner.name?.split(' ')[0] || 'Parceiro'}</strong>! Aqui estão seus números do mês passado:</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
                      <div style="background:#f8faff;border-radius:10px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:800;color:#1B2B5B">${profileViews}</div>
                        <div style="font-size:12px;color:#888;margin-top:4px">👁️ Visualizações do Perfil</div>
                      </div>
                      <div style="background:#f8faff;border-radius:10px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:800;color:#25D366">${whatsappClicks}</div>
                        <div style="font-size:12px;color:#888;margin-top:4px">📱 Cliques no WhatsApp</div>
                      </div>
                      <div style="background:#f8faff;border-radius:10px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:800;color:#C9A84C">${impressions}</div>
                        <div style="font-size:12px;color:#888;margin-top:4px">🏗️ Impressões em Cond.</div>
                      </div>
                      <div style="background:#f8faff;border-radius:10px;padding:16px;text-align:center">
                        <div style="font-size:28px;font-weight:800;color:#16a34a">${convRate}%</div>
                        <div style="font-size:12px;color:#888;margin-top:4px">🎯 Taxa de Conversão</div>
                      </div>
                    </div>
                    ${totalContacts === 0 ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:16px;margin:16px 0"><p style="margin:0;color:#856404;font-size:14px">💡 <strong>Dica:</strong> Você não recebeu contatos este mês. Complete seu perfil com foto, bio e WhatsApp para aparecer no topo das buscas.</p></div>` : ''}
                    <div style="text-align:center;margin:24px 0">
                      <a href="${profileUrl}" style="background:linear-gradient(135deg,#C9A84C,#e6c96a);color:#1B2B5B;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;display:inline-block">Ver Meu Perfil Público →</a>
                    </div>
                    <div style="text-align:center">
                      <a href="https://agoraencontrei.com.br/meu-painel" style="color:#1B2B5B;font-size:13px;text-decoration:underline">Acessar Meu Painel</a>
                    </div>
                  </div>
                  <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:11px;color:#999">
                    AgoraEncontrei — Relatório automático mensal para parceiros ${planLabel}
                  </div>
                </div>`,
            }).catch(() => {})
            sent++
          } catch { /* skip individual errors */ }
        }
        app.log.info(`[scheduled] relatorio-mensal-parceiros: enviado para ${sent}/${partners.length} parceiros`)
      }
    } catch (err) {
      app.log.error({ err }, '[scheduled] relatorio-mensal-parceiros failed')
    }
  }

  // ── Daily social media sync — once per day at ~12:00 UTC (09:00 BRT) ────
  if (hour === 12 && minute < 30) {
    // YouTube: sync new videos to blog
    try {
      const company = await app.prisma.company.findFirst({ where: { isActive: true } })
      const companyId = env.PUBLIC_COMPANY_ID ?? company?.id
      if (companyId) {
        const channelId = env.YOUTUBE_CHANNEL_ID ?? 'UCKpTcdWhQZIPMX8EF_nNckw'
        const ytSynced = await syncYouTubeToBlog(app.prisma as any, companyId, env.YOUTUBE_API_KEY ?? null, channelId)
        if (ytSynced > 0) app.log.info(`[scheduled] YouTube: synced ${ytSynced} new videos`)

        // Instagram @tomaslemosbr
        if (env.INSTAGRAM_TOKEN_TOMAS) {
          const igSynced = await syncInstagramToBlog(app.prisma as any, companyId, env.INSTAGRAM_TOKEN_TOMAS, 'tomaslemosbr')
          if (igSynced > 0) app.log.info(`[scheduled] Instagram @tomaslemosbr: synced ${igSynced} new posts`)
        }

        // Instagram @imobiliarialemos
        if (env.INSTAGRAM_TOKEN_LEMOS) {
          const igSynced = await syncInstagramToBlog(app.prisma as any, companyId, env.INSTAGRAM_TOKEN_LEMOS, 'imobiliarialemos')
          if (igSynced > 0) app.log.info(`[scheduled] Instagram @imobiliarialemos: synced ${igSynced} new posts`)
        }

        // Daily property post to Instagram
        try {
          const { runDailySocialPost } = await import('../jobs/daily-social-post.js')
          runDailySocialPost(app).catch((err: Error) => app.log.error(err, '[scheduled] daily-social-post failed'))
        } catch {
          // daily-social-post not configured — skip silently
        }
      }
    } catch (err) {
      app.log.error({ err }, '[scheduled] social daily sync failed')
    }
  }

  // ── 6. Robô de Cobrança: inadimplência > 5 dias → WhatsApp automático ────
  try {
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const overdueRentals = await app.prisma.rental.findMany({
      where: {
        status: { in: ['PENDING', 'LATE'] },
        dueDate: { lt: fiveDaysAgo },
      },
      include: {
        contract: {
          select: {
            companyId: true, tenantName: true, tenantId: true,
            propertyAddress: true, landlordName: true,
          },
        },
      },
      take: 100,
    })

    let cobranças = 0
    for (const rental of overdueRentals) {
      const cid = rental.contract?.companyId ?? rental.companyId
      const daysOverdue = Math.ceil((now.getTime() - (rental.dueDate?.getTime() || now.getTime())) / 86_400_000)

      // Only send once per rental (check if already notified via audit log)
      const alreadyNotified = await app.prisma.auditLog.findFirst({
        where: {
          resource: 'rental',
          resourceId: rental.id,
          action: 'cobranca.whatsapp.5d',
        },
      }).catch(() => null)

      if (alreadyNotified) continue

      // Get tenant phone from Client record
      let tenantPhone = ''
      if (rental.contract?.tenantId) {
        const client = await app.prisma.client.findUnique({
          where: { id: rental.contract.tenantId },
          select: { phone: true, whatsapp: true },
        }).catch(() => null)
        tenantPhone = client?.whatsapp || client?.phone || ''
      }

      if (tenantPhone) {
        // Send WhatsApp via automation system
        emitAutomation({
          companyId: cid,
          event: 'cobranca_inadimplencia_5d',
          data: {
            rentalId: rental.id,
            contractId: rental.contractId ?? '',
            tenantName: rental.contract?.tenantName ?? 'Inquilino',
            tenantPhone,
            propertyAddress: rental.contract?.propertyAddress ?? '',
            amount: rental.rentAmount?.toString() ?? '0',
            dueDate: rental.dueDate?.toISOString() ?? '',
            daysOverdue,
            paymentLink: (rental as any).asaasInvoiceUrl || (rental as any).asaasBoletoUrl || '',
          },
        })

        // Mark as notified to avoid duplicate sends
        await app.prisma.auditLog.create({
          data: {
            companyId: cid,
            action: 'cobranca.whatsapp.5d' as any,
            resource: 'rental',
            resourceId: rental.id,
            payload: { daysOverdue, tenantPhone, sentAt: now.toISOString() },
          },
        }).catch(() => {})

        cobranças++
      }
    }

    if (cobranças > 0) {
      app.log.info(`[scheduled] cobranca-5d: sent ${cobranças} WhatsApp notifications`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] cobranca-5d failed')
  }

  // ── 7. Leilão Pérola → Instagram auto-post (diário, 09:00 BRT) ──────────
  if (hour === 12 && minute < 30) {
    try {
      const pearlAuctions = await app.prisma.auction.findMany({
        where: {
          status: { in: ['UPCOMING', 'OPEN'] },
          discountPercent: { gte: 40 },
        },
        orderBy: { discountPercent: 'desc' },
        take: 3,
        select: {
          id: true, title: true, city: true, state: true, neighborhood: true,
          minimumBid: true, appraisalValue: true, discountPercent: true,
          coverImage: true, streetViewUrl: true, slug: true,
          propertyType: true, totalArea: true, bedrooms: true,
        },
      })

      if (pearlAuctions.length > 0) {
        const igToken = env.INSTAGRAM_PAGE_ACCESS_TOKEN
        const igAccountId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID

        if (igToken && igAccountId) {
          const { publishPropertyToInstagram } = await import('./instagram-publisher.service.js')

          for (const auction of pearlAuctions) {
            // Check if already posted (avoid duplicates)
            const alreadyPosted = await app.prisma.auditLog.findFirst({
              where: { resource: 'auction', resourceId: auction.id, action: 'pearl.instagram.post' as any },
            }).catch(() => null)

            if (alreadyPosted) continue

            const imageUrl = auction.coverImage || auction.streetViewUrl
            if (!imageUrl) continue

            const discount = Math.round(Number(auction.discountPercent) || 0)
            const minBid = Number(auction.minimumBid || 0)
            const appraisal = Number(auction.appraisalValue || 0)
            const location = [auction.neighborhood, auction.city, auction.state].filter(Boolean).join(', ')

            const caption = [
              `🔥 OPORTUNIDADE PÉROLA — ${discount}% ABAIXO DO MERCADO`,
              '',
              `📍 ${location}`,
              `🏠 ${auction.title}`,
              auction.totalArea ? `📐 ${auction.totalArea}m²` : '',
              auction.bedrooms ? `🛏️ ${auction.bedrooms} quartos` : '',
              '',
              `💰 Avaliação: R$ ${appraisal.toLocaleString('pt-BR')}`,
              `🎯 Lance mínimo: R$ ${minBid.toLocaleString('pt-BR')}`,
              `📉 Desconto: ${discount}%`,
              '',
              `Saiba mais: agoraencontrei.com.br/leiloes/${auction.slug}`,
              '',
              '#leilao #imoveis #oportunidade #investimento #leilaodeimóveis',
              '#agoraencontrei #imobiliaria #francasp #pérola',
            ].filter(Boolean).join('\n')

            try {
              const result = await publishPropertyToInstagram(imageUrl, caption, igAccountId, igToken)
              if (result.success) {
                const company = await app.prisma.company.findFirst({ where: { isActive: true } })
                await app.prisma.auditLog.create({
                  data: {
                    companyId: company?.id || 'system',
                    action: 'pearl.instagram.post' as any,
                    resource: 'auction',
                    resourceId: auction.id,
                    payload: { postId: result.postId, permalink: result.permalink, discount },
                  },
                }).catch(() => {})
                app.log.info(`[scheduled] pearl-post: Posted auction ${auction.id} to Instagram (${discount}% off)`)
              }
            } catch (postErr) {
              app.log.warn({ postErr }, `[scheduled] pearl-post: Failed to post auction ${auction.id}`)
            }
          }
        }
      }
    } catch (err) {
      app.log.error({ err }, '[scheduled] pearl-instagram failed')
    }
  }

  // ── 8. Follow-up automático: processa follow-ups agendados (D+1, D+3, D+7) ───
  try {
    const followUpResult = await processDueFollowUps(app.prisma, app.outboundQueue)
    const total = followUpResult.sent + followUpResult.skipped + followUpResult.cancelled
    if (total > 0) {
      app.log.info(`[scheduled] follow-ups: sent=${followUpResult.sent} skipped=${followUpResult.skipped} cancelled=${followUpResult.cancelled}`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] follow-ups failed')
  }

  // ── 9. Street View batch: capture facades for auctions/properties missing images ──
  if (hour === 13 && minute < 30) {
    try {
      const { batchGenerateStreetView } = await import('./streetview.service.js')

      // Process auctions first (most likely to be missing images)
      const auctionResult = await batchGenerateStreetView(app.prisma, {
        type: 'auction', limit: 30, onlyWithCoords: false,
      })
      if (auctionResult.updated > 0) {
        app.log.info(`[scheduled] streetview-batch: Updated ${auctionResult.updated}/${auctionResult.processed} auctions`)
      }

      // Then properties
      const propResult = await batchGenerateStreetView(app.prisma, {
        type: 'property', limit: 20, onlyWithCoords: true,
      })
      if (propResult.updated > 0) {
        app.log.info(`[scheduled] streetview-batch: Updated ${propResult.updated}/${propResult.processed} properties`)
      }
    } catch (err) {
      app.log.error({ err }, '[scheduled] streetview-batch failed')
    }
  }
}
