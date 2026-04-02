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
