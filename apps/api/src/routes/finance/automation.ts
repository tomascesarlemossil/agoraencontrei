/**
 * Finance Automation Routes
 * Rotas de automação financeira: geração em lote, dashboard unificado, repasses em lote
 */
import type { FastifyInstance } from 'fastify'
import {
  findOrCreateCustomer,
  createCharge,
  getCharge,
  cancelCharge,
  getBalance,
} from '../../services/asaas.service.js'
import { env } from '../../utils/env.js'
import { createAuditLog } from '../../services/audit.service.js'

export default async function financeAutomationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET /api/v1/finance/automation/dashboard ─────────────────────────────
  // Dashboard financeiro unificado com todos os KPIs em uma única chamada
  app.get('/dashboard', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const prevStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const next7      = new Date(now.getTime() + 7  * 86400000)
    const next30     = new Date(now.getTime() + 30 * 86400000)

    const [
      // Contratos
      activeContracts,
      totalContracts,
      // Aluguéis do mês atual
      paidThisMonth,
      pendingThisMonth,
      lateRentals,
      // Aluguéis mês anterior (comparação)
      paidLastMonth,
      // Repasses
      repassesPendentes,
      repassesPagos,
      // Vencimentos próximos
      vencendo7dias,
      vencendo30dias,
      // Inadimplentes (lista)
      inadimplentesLista,
      // Asaas balance (se configurado)
    ] = await Promise.all([
      app.prisma.contract.count({ where: { companyId: cid, status: 'ACTIVE' } }),
      app.prisma.contract.count({ where: { companyId: cid } }),

      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PAID', paymentDate: { gte: monthStart, lte: monthEnd } },
        _sum: { paidAmount: true, totalAmount: true },
        _count: true,
      }),
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PENDING', dueDate: { gte: monthStart, lte: monthEnd } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'LATE' },
        _sum: { totalAmount: true },
        _count: true,
      }),

      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PAID', paymentDate: { gte: prevStart, lte: prevEnd } },
        _sum: { paidAmount: true },
        _count: true,
      }),

      // Repasses pendentes (aluguel pago mas repasse não marcado)
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PAID', repassePaidAt: null,
          contract: { landlordDueDay: { not: null } } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PAID', repassePaidAt: { not: null },
          paymentDate: { gte: monthStart, lte: monthEnd } },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Vencendo em 7 dias
      app.prisma.rental.findMany({
        where: { companyId: cid, status: 'PENDING', dueDate: { gte: now, lte: next7 } },
        include: { contract: { select: { tenantName: true, propertyAddress: true, tenant: { select: { phone: true, email: true } } } } },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      // Vencendo em 30 dias
      app.prisma.rental.count({
        where: { companyId: cid, status: 'PENDING', dueDate: { gte: now, lte: next30 } },
      }),

      // Inadimplentes (LATE)
      app.prisma.rental.findMany({
        where: { companyId: cid, status: 'LATE' },
        include: { contract: { select: { id: true, tenantName: true, propertyAddress: true, tenant: { select: { id: true, name: true, phone: true, email: true } } } } },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
    ])

    // Calcular variação mês a mês
    const receitaMes      = Number(paidThisMonth._sum.paidAmount ?? paidThisMonth._sum.totalAmount ?? 0)
    const receitaMesAnter = Number(paidLastMonth._sum.paidAmount ?? 0)
    const variacaoReceita = receitaMesAnter > 0
      ? Math.round(((receitaMes - receitaMesAnter) / receitaMesAnter) * 1000) / 10
      : 0

    const totalInadimplencia = lateRentals._count + pendingThisMonth._count
    const totalRentaisDoMes  = paidThisMonth._count + pendingThisMonth._count + lateRentals._count
    const taxaInadimplencia  = totalRentaisDoMes > 0
      ? Math.round((lateRentals._count / totalRentaisDoMes) * 1000) / 10
      : 0

    // Asaas balance
    let asaasBalance = null
    if (env.ASAAS_API_KEY) {
      try {
        asaasBalance = await getBalance()
      } catch { /* ignore */ }
    }

    return reply.send({
      periodo: {
        mes: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        inicio: monthStart,
        fim: monthEnd,
      },
      contratos: {
        ativos: activeContracts,
        total: totalContracts,
      },
      receita: {
        mes: Math.round(receitaMes * 100) / 100,
        mesAnterior: Math.round(receitaMesAnter * 100) / 100,
        variacao: variacaoReceita,
        qtdPagos: paidThisMonth._count,
      },
      pendente: {
        total: Math.round(Number(pendingThisMonth._sum.totalAmount ?? 0) * 100) / 100,
        qtd: pendingThisMonth._count,
      },
      inadimplencia: {
        total: Math.round(Number(lateRentals._sum.totalAmount ?? 0) * 100) / 100,
        qtd: lateRentals._count,
        taxa: taxaInadimplencia,
        lista: inadimplentesLista,
      },
      repasses: {
        pendentes: {
          total: Math.round(Number(repassesPendentes._sum.totalAmount ?? 0) * 100) / 100,
          qtd: repassesPendentes._count,
        },
        pagos: {
          total: Math.round(Number(repassesPagos._sum.totalAmount ?? 0) * 100) / 100,
          qtd: repassesPagos._count,
        },
      },
      vencimentos: {
        em7dias: vencendo7dias,
        em30dias: vencendo30dias,
      },
      asaas: asaasBalance,
    })
  })

  // ── POST /api/v1/finance/automation/gerar-cobracas-mes ───────────────────
  // Gera cobranças mensais para todos os contratos ativos que ainda não têm rental no mês
  app.post('/gerar-cobracas-mes', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      month?: string   // YYYY-MM (default: mês atual)
      preview?: boolean // se true, só retorna o que seria gerado sem criar
      contractIds?: string[] // opcional: gerar só para contratos específicos
    }

    const now = new Date()
    const monthStr = body.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [y, m] = monthStr.split('-').map(Number)
    if (!y || !m) return reply.status(400).send({ error: 'INVALID_MONTH' })

    const periodStart = new Date(y, m - 1, 1)
    const periodEnd   = new Date(y, m, 0, 23, 59, 59)

    // Buscar contratos ativos
    const contractWhere: any = {
      companyId: cid,
      status: 'ACTIVE',
      isActive: true,
      rentValue: { not: null, gt: 0 },
    }
    if (body.contractIds?.length) {
      contractWhere.id = { in: body.contractIds }
    }

    const contracts = await app.prisma.contract.findMany({
      where: contractWhere,
      include: {
        tenant: { select: { id: true, name: true, phone: true, email: true, document: true } },
        property: { select: { id: true, condoFee: true, iptu: true } },
        rentals: {
          where: { dueDate: { gte: periodStart, lte: periodEnd } },
          take: 1,
        },
      },
    })

    // Separar contratos que já têm rental no mês dos que não têm
    const semCobranca = contracts.filter(c => c.rentals.length === 0)
    const jaExistem   = contracts.filter(c => c.rentals.length > 0)

    if (body.preview) {
      return reply.send({
        preview: true,
        month: monthStr,
        total: contracts.length,
        aGerar: semCobranca.map(c => ({
          contractId: c.id,
          legacyId: c.legacyId,
          tenantName: c.tenantName ?? c.tenant?.name,
          propertyAddress: c.propertyAddress,
          rentValue: Number(c.rentValue),
          dueDate: new Date(y, m - 1, c.tenantDueDay ?? 10).toISOString().split('T')[0],
        })),
        jaExistem: jaExistem.length,
      })
    }

    // Gerar rentals para os contratos sem cobrança
    const criados: any[] = []
    const erros: any[] = []

    for (const contract of semCobranca) {
      try {
        const dueDay = contract.tenantDueDay ?? 10
        const dueDate = new Date(y, m - 1, dueDay)
        // Se dia não existe no mês (ex: 31 em fevereiro), usa último dia
        if (dueDate.getMonth() !== m - 1) {
          dueDate.setDate(0)
        }

        const rentValue    = Number(contract.rentValue ?? 0)
        const condoAmount  = Number((contract as any).property?.condoFee ?? 0)
        const bankFee      = Number((contract as any).bankFee ?? 3.50)

        // Calcular IPTU parcela mensal (se configurado no contrato)
        const iptuAnnual   = Number((contract as any).iptuAnnual ?? (contract as any).property?.iptu ?? 0)
        const iptuParcels  = Number((contract as any).iptuParcels ?? 0)
        let iptuAmount     = 0
        let iptuParcela    = ''
        if (iptuAnnual > 0 && iptuParcels > 0) {
          // Verifica se o mês atual cai dentro das parcelas (ex: 8 parcelas = jan-ago)
          if (m <= iptuParcels) {
            iptuAmount = Math.round((iptuAnnual / iptuParcels) * 100) / 100
            iptuParcela = `${m}/${iptuParcels}`
          }
        }

        // Taxa de administração
        const adminPercent = Number((contract as any).adminFeePercent ?? contract.commission ?? 0)

        const totalAmount  = rentValue + condoAmount + iptuAmount + bankFee

        // Verificar se está atrasado
        const status = dueDate < now ? 'LATE' : 'PENDING'

        const rental = await app.prisma.rental.create({
          data: {
            companyId:      cid,
            contractId:     contract.id,
            dueDate,
            rentAmount:     rentValue,
            condoAmount:    condoAmount > 0 ? condoAmount : null,
            iptuAmount:     iptuAmount > 0 ? iptuAmount : null,
            iptuParcela:    iptuParcela || null,
            bankFeeAmount:  bankFee > 0 ? bankFee : null,
            adminFeeAmount: adminPercent > 0 ? Math.round(rentValue * adminPercent / 100 * 100) / 100 : null,
            totalAmount,
            status,
          },
        })
        criados.push({
          rentalId: rental.id,
          contractId: contract.id,
          tenantName: contract.tenantName ?? contract.tenant?.name,
          propertyAddress: contract.propertyAddress,
          rentValue,
          iptuAmount,
          bankFee,
          condoAmount,
          totalAmount,
          dueDate: rental.dueDate,
          status,
        })
      } catch (err: any) {
        erros.push({ contractId: contract.id, error: err.message })
      }
    }

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'rental.batch_generate',
      resource: 'rental',
      resourceId: 'batch',
      before: null,
      after: { month: monthStr, criados: criados.length, erros: erros.length },
    })

    return reply.status(201).send({
      month: monthStr,
      criados: criados.length,
      jaExistiam: jaExistem.length,
      erros: erros.length,
      detalhes: { criados, erros: erros.slice(0, 10) },
    })
  })

  // ── POST /api/v1/finance/automation/atualizar-status-lote ────────────────
  // Atualiza PENDING → LATE para cobranças vencidas
  app.post('/atualizar-status-lote', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()

    const result = await app.prisma.rental.updateMany({
      where: {
        companyId: cid,
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: { status: 'LATE' },
    })

    return reply.send({
      atualizados: result.count,
      message: `${result.count} cobranças marcadas como ATRASADAS`,
    })
  })

  // ── POST /api/v1/finance/automation/cobrar-lote-asaas ───────────────────
  // Envia cobranças em lote para o Asaas (PIX ou Boleto)
  app.post('/cobrar-lote-asaas', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      rentalIds?: string[]   // IDs específicos ou todos os PENDING do mês
      billingType?: 'PIX' | 'BOLETO'
      month?: string         // YYYY-MM
    }

    if (!env.ASAAS_API_KEY) {
      return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED', message: 'Configure a chave ASAAS_API_KEY para usar cobranças automáticas.' })
    }

    let rentals: any[]

    if (body.rentalIds?.length) {
      rentals = await app.prisma.rental.findMany({
        where: { id: { in: body.rentalIds }, companyId: cid },
        include: { contract: { include: { tenant: true } } },
      })
    } else {
      const now = new Date()
      const monthStr = body.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const [y, m] = monthStr.split('-').map(Number)
      const periodStart = new Date(y, m - 1, 1)
      const periodEnd   = new Date(y, m, 0, 23, 59, 59)

      rentals = await app.prisma.rental.findMany({
        where: {
          companyId: cid,
          status: { in: ['PENDING', 'LATE'] },
          dueDate: { gte: periodStart, lte: periodEnd },
          contract: { tenant: { document: { not: null } } },
        },
        include: { contract: { include: { tenant: true } } },
        take: 100,
      })
    }

    const billingType = body.billingType ?? 'PIX'
    const enviados: any[] = []
    const erros: any[] = []
    const semCpf: any[] = []

    for (const rental of rentals) {
      const tenant = rental.contract?.tenant
      if (!tenant?.document) {
        semCpf.push({ rentalId: rental.id, tenantName: rental.contract?.tenantName })
        continue
      }

      try {
        const customer = await findOrCreateCustomer({
          name:    tenant.name,
          cpfCnpj: tenant.document,
          email:   tenant.email  ?? undefined,
          phone:   tenant.phone  ?? undefined,
        })

        const dueDate = rental.dueDate
          ? new Date(rental.dueDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        const charge = await createCharge({
          customer:          customer.id,
          billingType,
          value:             Number(rental.totalAmount ?? rental.rentAmount ?? 0),
          dueDate,
          description:       `Aluguel ${rental.contract?.propertyAddress ?? ''} — ${new Date(dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}\nNAO RECEBER APOS 5 DIAS DO VENCIMENTO\nApos o vencto cobrar multa de 10%\nApos o vencto cobrar juros de mora de 1% ao mes`,
          externalReference: rental.id,
          fine:              { value: 10 },    // 10% multa (padrão Imobiliária Lemos)
          interest:          { value: 1 },    // 1% ao mês juros de mora
        })

        // Criar invoice vinculado ao rental
        await app.prisma.invoice.create({
          data: {
            companyId:        cid,
            contractId:       rental.contractId ?? null,
            dueDate:          new Date(dueDate),
            amount:           Number(rental.totalAmount ?? rental.rentAmount ?? 0),
            mensagem:         `Aluguel ${rental.contract?.propertyAddress ?? ''}`,
            asaasId:          charge.id,
            asaasStatus:      charge.status ?? 'PENDING',
            asaasBankSlipUrl: charge.bankSlipUrl ?? null,
            asaasPixCode:     charge.pixCode ?? null,
          },
        })

        enviados.push({
          rentalId:    rental.id,
          tenantName:  tenant.name,
          amount:      Number(rental.totalAmount ?? rental.rentAmount ?? 0),
          asaasId:     charge.id,
          billingType,
          bankSlipUrl: charge.bankSlipUrl,
          pixCode:     charge.pixCode,
        })
      } catch (err: any) {
        erros.push({ rentalId: rental.id, tenantName: rental.contract?.tenantName, error: err.message })
      }
    }

    return reply.send({
      enviados: enviados.length,
      erros: erros.length,
      semCpf: semCpf.length,
      detalhes: { enviados, erros: erros.slice(0, 10), semCpf },
    })
  })

  // ── POST /api/v1/finance/automation/repasses-lote ───────────────────────
  // Marca todos os repasses pendentes do mês como pagos
  app.post('/repasses-lote', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      rentalIds?: string[]
      repassePaidAt?: string
      month?: string
    }

    const repassePaidAt = body.repassePaidAt ? new Date(body.repassePaidAt) : new Date()

    let where: any = {
      companyId: cid,
      status: 'PAID',
      repassePaidAt: null,
      contract: { landlordDueDay: { not: null } },
    }

    if (body.rentalIds?.length) {
      where = { ...where, id: { in: body.rentalIds } }
    } else if (body.month) {
      const [y, m] = body.month.split('-').map(Number)
      where.paymentDate = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      }
    }

    const result = await app.prisma.rental.updateMany({
      where,
      data: { repassePaidAt },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'rental.repasse_lote',
      resource: 'rental',
      resourceId: 'batch',
      before: null,
      after: { count: result.count, repassePaidAt },
    })

    return reply.send({
      pagos: result.count,
      repassePaidAt,
      message: `${result.count} repasses marcados como pagos`,
    })
  })

  // ── POST /api/v1/finance/automation/notificar-lote ───────────────────────
  // Envia notificações WhatsApp em lote para inadimplentes
  app.post('/notificar-lote', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      rentalIds?: string[]
      canal: 'whatsapp' | 'email'
      mensagem?: string
    }

    if (!body.canal) return reply.status(400).send({ error: 'CANAL_REQUIRED' })

    const rentals = await app.prisma.rental.findMany({
      where: body.rentalIds?.length
        ? { id: { in: body.rentalIds }, companyId: cid }
        : { companyId: cid, status: 'LATE' },
      include: {
        contract: {
          select: {
            tenantName: true,
            propertyAddress: true,
            tenant: { select: { name: true, phone: true, email: true } },
          },
        },
      },
      take: 50,
    })

    const fmtCurrency = (v: number) =>
      v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const enviados: any[] = []
    const erros: any[] = []

    for (const rental of rentals) {
      const tenant = rental.contract?.tenant
      const tenantName = tenant?.name ?? rental.contract?.tenantName ?? 'Inquilino'
      const amount = Number(rental.totalAmount ?? rental.rentAmount ?? 0)
      const dueDate = rental.dueDate
        ? new Date(rental.dueDate).toLocaleDateString('pt-BR')
        : '—'

      if (body.canal === 'whatsapp') {
        const phone = tenant?.phone
        if (!phone) { erros.push({ rentalId: rental.id, reason: 'sem_telefone' }); continue }
        if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
          return reply.status(503).send({ error: 'WHATSAPP_NOT_CONFIGURED' })
        }

        const msg = body.mensagem ?? [
          `*Aviso de Cobrança — Imobiliária Lemos*`,
          ``,
          `Prezado(a) ${tenantName},`,
          ``,
          `Identificamos que o aluguel referente ao imóvel *${rental.contract?.propertyAddress ?? ''}* com vencimento em *${dueDate}* no valor de *${fmtCurrency(amount)}* encontra-se em aberto.`,
          ``,
          `Por favor, entre em contato para regularizar: *(16) 3723-0045*`,
          ``,
          `Imobiliária Lemos — CRECI 279051`,
        ].join('\n')

        try {
          const waRes = await fetch(
            `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_ID}/messages`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WHATSAPP_TOKEN}` },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone.replace(/\D/g, ''),
                type: 'text',
                text: { body: msg },
              }),
            },
          )
          if (waRes.ok) {
            enviados.push({ rentalId: rental.id, tenantName, phone })
          } else {
            const err = await waRes.text()
            erros.push({ rentalId: rental.id, tenantName, error: err })
          }
        } catch (err: any) {
          erros.push({ rentalId: rental.id, tenantName, error: err.message })
        }
      } else if (body.canal === 'email') {
        const email = tenant?.email
        if (!email) { erros.push({ rentalId: rental.id, reason: 'sem_email' }); continue }
        // Email via SMTP (se configurado)
        enviados.push({ rentalId: rental.id, tenantName, email, status: 'queued' })
      }
    }

    return reply.send({
      canal: body.canal,
      enviados: enviados.length,
      erros: erros.length,
      detalhes: { enviados, erros: erros.slice(0, 10) },
    })
  })

  // ── GET /api/v1/finance/automation/preview-mes ──────────────────────────
  // Preview do mês: o que precisa ser feito (cobranças a gerar, repasses pendentes, inadimplentes)
  app.get('/preview-mes', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()
    const q = req.query as { month?: string }
    const monthStr = q.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [y, m] = monthStr.split('-').map(Number)
    const periodStart = new Date(y, m - 1, 1)
    const periodEnd   = new Date(y, m, 0, 23, 59, 59)

    const [
      contratosAtivos,
      rentaisDoMes,
      inadimplentes,
      repassesPendentes,
      semCpf,
    ] = await Promise.all([
      app.prisma.contract.count({ where: { companyId: cid, status: 'ACTIVE', isActive: true, rentValue: { gt: 0 } } }),
      app.prisma.rental.count({ where: { companyId: cid, dueDate: { gte: periodStart, lte: periodEnd } } }),
      app.prisma.rental.count({ where: { companyId: cid, status: 'LATE' } }),
      app.prisma.rental.count({ where: { companyId: cid, status: 'PAID', repassePaidAt: null, contract: { landlordDueDay: { not: null } } } }),
      app.prisma.contract.count({ where: { companyId: cid, status: 'ACTIVE', tenant: { document: null } } }),
    ])

    const cobranasAGerar = Math.max(0, contratosAtivos - rentaisDoMes)

    return reply.send({
      month: monthStr,
      acoes: [
        {
          id: 'gerar_cobracas',
          titulo: 'Gerar Cobranças do Mês',
          descricao: `${cobranasAGerar} contrato(s) sem cobrança gerada para ${monthStr}`,
          qtd: cobranasAGerar,
          urgente: cobranasAGerar > 0,
          rota: '/api/v1/finance/automation/gerar-cobracas-mes',
        },
        {
          id: 'atualizar_status',
          titulo: 'Atualizar Status (PENDING → LATE)',
          descricao: `Marcar cobranças vencidas como atrasadas`,
          qtd: null,
          urgente: false,
          rota: '/api/v1/finance/automation/atualizar-status-lote',
        },
        {
          id: 'notificar_inadimplentes',
          titulo: 'Notificar Inadimplentes',
          descricao: `${inadimplentes} inquilino(s) com aluguel em atraso`,
          qtd: inadimplentes,
          urgente: inadimplentes > 0,
          rota: '/api/v1/finance/automation/notificar-lote',
        },
        {
          id: 'pagar_repasses',
          titulo: 'Pagar Repasses Pendentes',
          descricao: `${repassesPendentes} repasse(s) aguardando pagamento ao proprietário`,
          qtd: repassesPendentes,
          urgente: repassesPendentes > 0,
          rota: '/api/v1/finance/automation/repasses-lote',
        },
        {
          id: 'cobrar_asaas',
          titulo: 'Enviar Cobranças via Asaas',
          descricao: `Gerar boletos/PIX para inquilinos com CPF cadastrado`,
          qtd: contratosAtivos - semCpf,
          urgente: false,
          rota: '/api/v1/finance/automation/cobrar-lote-asaas',
        },
      ],
      resumo: {
        contratosAtivos,
        rentaisDoMes,
        cobranasAGerar,
        inadimplentes,
        repassesPendentes,
        semCpf,
      },
    })
  })

  // ── GET /api/v1/finance/automation/relatorio-mensal ─────────────────────
  // Relatório mensal completo para exportação
  app.get('/relatorio-mensal', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as { month?: string }
    const now = new Date()
    const monthStr = q.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [y, m] = monthStr.split('-').map(Number)
    const periodStart = new Date(y, m - 1, 1)
    const periodEnd   = new Date(y, m, 0, 23, 59, 59)

    const rentals = await app.prisma.rental.findMany({
      where: { companyId: cid, dueDate: { gte: periodStart, lte: periodEnd } },
      include: {
        contract: {
          select: {
            id: true, legacyId: true,
            tenantName: true, landlordName: true, propertyAddress: true,
            rentValue: true, commission: true, landlordDueDay: true,
            tenant:   { select: { name: true, phone: true, email: true, document: true } },
            landlord: { select: { name: true, phone: true, email: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    })

    const pagos     = rentals.filter(r => r.status === 'PAID')
    const pendentes = rentals.filter(r => r.status === 'PENDING')
    const atrasados = rentals.filter(r => r.status === 'LATE')

    const totalPago     = pagos.reduce((s, r) => s + Number(r.paidAmount ?? r.totalAmount ?? 0), 0)
    const totalPendente = pendentes.reduce((s, r) => s + Number(r.totalAmount ?? 0), 0)
    const totalAtrasado = atrasados.reduce((s, r) => s + Number(r.totalAmount ?? 0), 0)

    // Repasses do mês
    const repassesPagos = pagos.filter(r => r.repassePaidAt)
    const totalRepasse  = repassesPagos.reduce((r, rental) => {
      const rentValue  = Number(rental.contract?.rentValue ?? rental.totalAmount ?? 0)
      const commission = Number(rental.contract?.commission ?? 0)
      return r + (commission > 0 ? rentValue - (rentValue * commission / 100) : rentValue)
    }, 0)

    return reply.send({
      month: monthStr,
      periodo: { inicio: periodStart, fim: periodEnd },
      resumo: {
        totalRentais: rentals.length,
        pagos: pagos.length,
        pendentes: pendentes.length,
        atrasados: atrasados.length,
        totalPago:     Math.round(totalPago     * 100) / 100,
        totalPendente: Math.round(totalPendente * 100) / 100,
        totalAtrasado: Math.round(totalAtrasado * 100) / 100,
        totalRepasse:  Math.round(totalRepasse  * 100) / 100,
        taxaInadimplencia: rentals.length > 0
          ? Math.round((atrasados.length / rentals.length) * 1000) / 10
          : 0,
      },
      detalhes: { pagos, pendentes, atrasados },
    })
  })

  // ── REAJUSTE AUTOMÁTICO ─────────────────────────────────────────────────────
  // GET /api/v1/finance/automation/reajustes-pendentes — contratos com reajuste no mês
  app.get('/reajustes-pendentes', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const now = new Date()
    const currentMonth = q.month ? Number(q.month) : (now.getMonth() + 1)

    // Buscar contratos ativos com adjustmentMonth == mês atual
    // E que NÃO foram reajustados neste ano
    const currentYear = now.getFullYear()
    const contracts = await app.prisma.contract.findMany({
      where: {
        companyId: cid,
        status: 'ACTIVE',
        isActive: true,
        adjustmentMonth: currentMonth,
        OR: [
          { lastAdjustmentDate: null },
          { lastAdjustmentDate: { lt: new Date(currentYear, 0, 1) } },
        ],
      },
      include: {
        tenant:   { select: { id: true, name: true, email: true, phone: true, phoneMobile: true } },
        landlord: { select: { id: true, name: true, email: true, phone: true, phoneMobile: true } },
      },
      orderBy: { legacyId: 'asc' },
    })

    return reply.send({
      month: currentMonth,
      year: currentYear,
      total: contracts.length,
      contracts: contracts.map(c => ({
        id: c.id,
        legacyId: c.legacyId,
        tenantName: c.tenantName ?? c.tenant?.name,
        landlordName: c.landlordName ?? c.landlord?.name,
        propertyAddress: c.propertyAddress,
        currentRentValue: Number(c.rentValue),
        adjustmentIndex: c.adjustmentIndex,
        adjustmentPercent: c.adjustmentPercent ? Number(c.adjustmentPercent) : null,
        lastAdjustmentDate: c.lastAdjustmentDate,
        startDate: c.startDate,
      })),
    })
  })

  // POST /api/v1/finance/automation/aplicar-reajustes — aplica reajuste em lote
  app.post('/aplicar-reajustes', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      contractIds: string[]
      percent: number       // percentual a aplicar
      index: string         // IGPM, IPCA, INPC, FIXO
      notifyTenant?: boolean
      notifyLandlord?: boolean
      notifyAdmin?: boolean
    }

    if (!body.contractIds?.length || !body.percent || !body.index) {
      return reply.status(400).send({ error: 'MISSING_FIELDS', required: ['contractIds', 'percent', 'index'] })
    }

    const results = { applied: 0, errors: [] as string[], notifications: { tenant: 0, landlord: 0, admin: 0 } }

    for (const contractId of body.contractIds) {
      try {
        const contract = await app.prisma.contract.findFirst({
          where: { id: contractId, companyId: cid, status: 'ACTIVE' },
          include: {
            tenant:   { select: { name: true, email: true, phone: true, phoneMobile: true } },
            landlord: { select: { name: true, email: true, phone: true, phoneMobile: true } },
          },
        })
        if (!contract) { results.errors.push(`${contractId}: não encontrado`); continue }

        const oldValue = Number(contract.rentValue ?? 0)
        const newValue = Math.round(oldValue * (1 + body.percent / 100) * 100) / 100

        // Aplicar reajuste
        await app.prisma.contract.update({
          where: { id: contractId },
          data: {
            rentValue: newValue,
            adjustmentIndex: body.index,
            adjustmentPercent: body.percent,
            lastAdjustmentDate: new Date(),
          },
        })

        // Registrar no histórico
        await app.prisma.contractHistory.create({
          data: {
            contractId, companyId: cid,
            action: 'REAJUSTE',
            description: `Reajuste automático de ${body.percent}% (${body.index}). De R$ ${oldValue.toFixed(2)} para R$ ${newValue.toFixed(2)}.`,
            field: 'rentValue',
            oldValue: oldValue.toFixed(2),
            newValue: newValue.toFixed(2),
            userId: req.user.sub,
            userName: (req.user as any).name ?? null,
            metadata: { index: body.index, percent: body.percent, automatic: true },
          },
        })

        results.applied++

        // Notificações
        const msg = `Reajuste de Aluguel - Contrato ${contract.legacyId ?? contractId}\n` +
          `Imóvel: ${contract.propertyAddress ?? 'N/A'}\n` +
          `Índice: ${body.index} (${body.percent}%)\n` +
          `Valor anterior: R$ ${oldValue.toFixed(2)}\n` +
          `Novo valor: R$ ${newValue.toFixed(2)}\n` +
          `Vigência: a partir do próximo vencimento`

        // Notificar inquilino
        if (body.notifyTenant && contract.tenant?.email) {
          try {
            const nodemailer = await import('nodemailer')
            const smtpHost = process.env.SMTP_HOST ?? ''
            if (smtpHost) {
              const transporter = nodemailer.createTransport({
                host: smtpHost, port: Number(process.env.SMTP_PORT ?? '587'),
                auth: { user: process.env.SMTP_USER ?? '', pass: process.env.SMTP_PASS ?? '' },
              })
              await transporter.sendMail({
                from: process.env.SMTP_FROM ?? 'noreply@agoraencontrei.com.br',
                to: contract.tenant.email,
                subject: `Aviso de Reajuste de Aluguel — Imobiliária Lemos`,
                text: msg,
              })
              results.notifications.tenant++
            }
          } catch { /* SMTP não configurado */ }
        }

        // Notificar proprietário
        if (body.notifyLandlord && contract.landlord?.email) {
          try {
            const nodemailer = await import('nodemailer')
            const smtpHost = process.env.SMTP_HOST ?? ''
            if (smtpHost) {
              const transporter = nodemailer.createTransport({
                host: smtpHost, port: Number(process.env.SMTP_PORT ?? '587'),
                auth: { user: process.env.SMTP_USER ?? '', pass: process.env.SMTP_PASS ?? '' },
              })
              await transporter.sendMail({
                from: process.env.SMTP_FROM ?? 'noreply@agoraencontrei.com.br',
                to: contract.landlord.email,
                subject: `Aviso de Reajuste — Contrato ${contract.legacyId ?? contractId}`,
                text: msg,
              })
              results.notifications.landlord++
            }
          } catch { /* SMTP não configurado */ }
        }

      } catch (err: any) {
        results.errors.push(`${contractId}: ${err.message}`)
      }
    }

    // Notificar admin (tomas)
    if (body.notifyAdmin && results.applied > 0) {
      try {
        const nodemailer = await import('nodemailer')
        const smtpHost = process.env.SMTP_HOST ?? ''
        if (smtpHost) {
          const transporter = nodemailer.createTransport({
            host: smtpHost, port: Number(process.env.SMTP_PORT ?? '587'),
            auth: { user: process.env.SMTP_USER ?? '', pass: process.env.SMTP_PASS ?? '' },
          })
          await transporter.sendMail({
            from: process.env.SMTP_FROM ?? 'noreply@agoraencontrei.com.br',
            to: 'tomas@agoraencontrei.com.br',
            subject: `${results.applied} contrato(s) reajustados — ${body.index} ${body.percent}%`,
            text: `Foram aplicados ${results.applied} reajustes automáticos.\nÍndice: ${body.index}\nPercentual: ${body.percent}%\nErros: ${results.errors.length}`,
          })
          results.notifications.admin++
        }
      } catch { /* SMTP não configurado */ }
    }

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'contract.adjustment',
      resource: 'contract',
      resourceId: 'batch',
      before: null,
      after: { applied: results.applied, index: body.index, percent: body.percent },
    })

    return reply.send(results)
  })
}
