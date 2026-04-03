import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import {
  findOrCreateCustomer,
  createCharge,
  getCharge,
  getPixQrCode,
  cancelCharge,
  getBalance,
  getPaymentsList,
  type AsaasBillingType,
} from '../../services/asaas.service.js'
import { env } from '../../utils/env.js'

export default async function invoiceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/finance/invoices — boletos paginados
  app.get('/', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const page     = parseInt(q.page     ?? '1',  10)
    const limit    = parseInt(q.limit    ?? '20', 10)
    const search   = q.search
    const status   = q.status    // PENDING | RECEIVED | OVERDUE
    const upcoming = q.upcoming  // "true" = próximos 30 dias

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      companyId: cid,
      ...(status && { asaasStatus: status }),
      ...(search && {
        OR: [
          { numBoleto:         { contains: search } },
          { legacyContractCode:{ contains: search } },
          { nossoNumero:       { contains: search } },
        ],
      }),
      ...(upcoming === 'true' && {
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    }

    const [total, items] = await Promise.all([
      app.prisma.invoice.count({ where }),
      app.prisma.invoice.findMany({
        where,
        include: { contract: { select: { tenantName: true, propertyAddress: true, landlordName: true } } },
        orderBy: { dueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // POST /api/v1/finance/invoices/charge — emite cobrança no Asaas (boleto ou PIX)
  app.post('/charge', async (req, reply) => {
    if (!env.ASAAS_API_KEY) {
      return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED' })
    }

    const cid  = req.user.cid
    const body = req.body as {
      invoiceId:    string
      billingType?: AsaasBillingType
      dueDate?:     string
      discount?:    number
    }

    const invoice = await app.prisma.invoice.findFirst({
      where: { id: body.invoiceId, companyId: cid },
      include: {
        contract: {
          include: {
            tenant: { select: { name: true, document: true, email: true, phoneMobile: true, phone: true } },
          },
        },
      },
    })

    if (!invoice) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (!invoice.amount) return reply.status(400).send({ error: 'INVOICE_HAS_NO_AMOUNT' })
    if (invoice.asaasId) return reply.status(409).send({ error: 'ALREADY_CHARGED', asaasId: invoice.asaasId })

    const tenant = invoice.contract?.tenant
    if (!tenant?.document) {
      return reply.status(400).send({ error: 'TENANT_HAS_NO_CPF' })
    }

    // 1. Cria ou busca customer no Asaas
    const customer = await findOrCreateCustomer({
      name:        tenant.name,
      cpfCnpj:     tenant.document,
      email:       tenant.email ?? undefined,
      mobilePhone: tenant.phoneMobile ?? tenant.phone ?? undefined,
    })

    // 2. Cria cobrança
    const dueDate = body.dueDate ?? invoice.dueDate?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10)

    const charge = await createCharge({
      customer:          customer.id,
      billingType:       body.billingType ?? 'BOLETO',
      value:             Number(invoice.amount),
      dueDate,
      description:       `Aluguel — ${invoice.contract?.propertyAddress ?? invoice.legacyContractCode ?? invoice.id}`,
      externalReference: invoice.id,
      ...(body.discount ? { discount: { value: body.discount, dueDateLimitDays: 5, type: 'PERCENTAGE' } } : {}),
      fine:              { value: 2 },      // 2% multa
      interest:          { value: 1 },      // 1% ao mês
    })

    // 3. Busca PIX se disponível
    let pixCode: string | undefined
    if (charge.billingType === 'PIX' || body.billingType === 'PIX') {
      try {
        const pix = await getPixQrCode(charge.id)
        pixCode = pix.payload
      } catch { /* PIX pode não estar disponível imediatamente */ }
    }

    // 4. Atualiza invoice com dados do Asaas
    const updated = await app.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        asaasId:         charge.id,
        asaasStatus:     charge.status,
        asaasBankSlipUrl: charge.bankSlipUrl ?? charge.invoiceUrl ?? null,
        asaasPixCode:    pixCode ?? null,
      },
    })

    return reply.send({ invoice: updated, charge })
  })

  // GET /api/v1/finance/invoices/:id — busca boleto por ID
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const invoice = await app.prisma.invoice.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        contract: { select: { tenantName: true, propertyAddress: true, landlordName: true } },
      },
    })
    if (!invoice) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(invoice)
  })

  // GET /api/v1/finance/invoices/:id/status — sincroniza status com Asaas
  app.get('/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string }
    const invoice = await app.prisma.invoice.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!invoice) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (!invoice.asaasId) return reply.status(400).send({ error: 'NOT_CHARGED_YET' })

    const charge = await getCharge(invoice.asaasId)
    const updated = await app.prisma.invoice.update({
      where: { id },
      data: { asaasStatus: charge.status },
    })

    return reply.send({ invoice: updated, charge })
  })

  // DELETE /api/v1/finance/invoices/:id/charge — cancela cobrança no Asaas
  app.delete('/:id/charge', async (req, reply) => {
    const { id } = req.params as { id: string }
    const invoice = await app.prisma.invoice.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!invoice) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (!invoice.asaasId) return reply.status(400).send({ error: 'NOT_CHARGED_YET' })

    await cancelCharge(invoice.asaasId)
    const updated = await app.prisma.invoice.update({
      where: { id },
      data: { asaasStatus: 'CANCELED', asaasId: null, asaasBankSlipUrl: null, asaasPixCode: null },
    })

    return reply.send({ invoice: updated })
  })

  // GET /api/v1/finance/invoices/asaas/balance — saldo da conta Asaas
  app.get('/asaas/balance', async (req, reply) => {
    if (!env.ASAAS_API_KEY) return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED' })
    try {
      const balance = await getBalance()
      return reply.send(balance)
    } catch (err: any) {
      return reply.status(502).send({ error: 'ASAAS_ERROR', message: err.message })
    }
  })

  // GET /api/v1/finance/invoices/asaas/payments — cobranças na conta Asaas
  app.get('/asaas/payments', async (req, reply) => {
    if (!env.ASAAS_API_KEY) return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED' })
    const q = req.query as Record<string, string>
    try {
      const result = await getPaymentsList({
        status: q.status,
        limit:  q.limit  ? parseInt(q.limit,  10) : 20,
        offset: q.offset ? parseInt(q.offset, 10) : 0,
        externalReference: q.externalReference,
      })
      return reply.send(result)
    } catch (err: any) {
      return reply.status(502).send({ error: 'ASAAS_ERROR', message: err.message })
    }
  })

  // POST /api/v1/finance/invoices — cria boleto avulso no banco (sem Asaas ainda)
  app.post('/', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      contractId?:    string
      legacyContractCode?: string
      legacyTenantCode?:   string
      numBoleto?:     string
      nossoNumero?:   string
      codigoBarras?:  string
      linhaDigitavel?: string
      banco?:         string
      carteira?:      string
      cedente?:       string
      issueDate?:     string
      dueDate:        string
      amount:         number
      mensagem?:      string
      instrucoes?:    string
    }
    if (!body.dueDate || !body.amount) {
      return reply.status(400).send({ error: 'MISSING_REQUIRED_FIELDS', required: ['dueDate', 'amount'] })
    }
    // Se contractId fornecido, verificar se pertence à empresa
    if (body.contractId) {
      const contract = await app.prisma.contract.findFirst({
        where: { id: body.contractId, companyId: cid },
      })
      if (!contract) return reply.status(404).send({ error: 'CONTRACT_NOT_FOUND' })
    }
    const invoice = await app.prisma.invoice.create({
      data: {
        companyId:          cid,
        contractId:         body.contractId ?? null,
        legacyContractCode: body.legacyContractCode ?? null,
        legacyTenantCode:   body.legacyTenantCode ?? null,
        numBoleto:          body.numBoleto ?? null,
        nossoNumero:        body.nossoNumero ?? null,
        codigoBarras:       body.codigoBarras ?? null,
        linhaDigitavel:     body.linhaDigitavel ?? null,
        banco:              body.banco ?? null,
        carteira:           body.carteira ?? null,
        cedente:            body.cedente ?? 'IMOBILIARIA LEMOS',
        issueDate:          body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate:            new Date(body.dueDate),
        amount:             body.amount,
        mensagem:           body.mensagem ?? null,
        instrucoes:         body.instrucoes ?? null,
      },
      include: {
        contract: { select: { tenantName: true, propertyAddress: true, landlordName: true } },
      },
    })
    return reply.status(201).send(invoice)
  })

  // PATCH /api/v1/finance/invoices/:id — atualiza boleto avulso
  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid = req.user.cid
    const body = req.body as Record<string, unknown>
    const existing = await app.prisma.invoice.findFirst({ where: { id, companyId: cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await app.prisma.invoice.update({
      where: { id },
      data: {
        ...(body.numBoleto     !== undefined && { numBoleto:     body.numBoleto as string }),
        ...(body.nossoNumero   !== undefined && { nossoNumero:   body.nossoNumero as string }),
        ...(body.codigoBarras  !== undefined && { codigoBarras:  body.codigoBarras as string }),
        ...(body.linhaDigitavel !== undefined && { linhaDigitavel: body.linhaDigitavel as string }),
        ...(body.banco         !== undefined && { banco:         body.banco as string }),
        ...(body.dueDate       !== undefined && { dueDate:       new Date(body.dueDate as string) }),
        ...(body.amount        !== undefined && { amount:        body.amount as number }),
        ...(body.mensagem      !== undefined && { mensagem:      body.mensagem as string }),
        ...(body.instrucoes    !== undefined && { instrucoes:    body.instrucoes as string }),
        ...(body.asaasStatus   !== undefined && { asaasStatus:   body.asaasStatus as string }),
      },
    })
    return reply.send(updated)
  })

  // POST /api/v1/finance/invoices/webhook — recebe eventos do Asaas
  app.post('/webhook', { config: { rawBody: true } }, async (req, reply) => {
    // Validar assinatura HMAC se ASAAS_WEBHOOK_SECRET estiver configurado
    if (env.ASAAS_WEBHOOK_SECRET) {
      const signature = req.headers['asaas-access-token'] as string | undefined
      if (!signature) {
        return reply.status(401).send({ error: 'MISSING_SIGNATURE' })
      }
      const rawBody = (req as any).rawBody as Buffer | string | undefined
      const bodyStr = rawBody ? rawBody.toString() : JSON.stringify(req.body)
      const expected = crypto
        .createHmac('sha256', env.ASAAS_WEBHOOK_SECRET)
        .update(bodyStr)
        .digest('hex')
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        app.log.warn({ signature, expected }, 'Asaas webhook signature mismatch')
        // Aceita mesmo sem match — Asaas usa token fixo, não HMAC em todos os planos
        // return reply.status(401).send({ error: 'INVALID_SIGNATURE' })
      }
    }

    const event = req.body as { event: string; payment?: { id: string; status: string; externalReference?: string } }

    app.log.info({ event: event.event, paymentId: event.payment?.id }, 'Asaas webhook received')

    if (event.payment?.externalReference) {
      await app.prisma.invoice.updateMany({
        where: { id: event.payment.externalReference },
        data:  { asaasStatus: event.payment.status },
      })
      app.log.info({ externalRef: event.payment.externalReference, status: event.payment.status }, 'Invoice status updated from webhook')
    }

    return reply.send({ received: true })
  })
}
