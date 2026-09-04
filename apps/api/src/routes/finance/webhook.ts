/**
 * Asaas Webhook Handler — Recebe notificações de pagamento em tempo real
 *
 * Eventos suportados:
 * - PAYMENT_RECEIVED: Pagamento confirmado → baixa automática
 * - PAYMENT_OVERDUE: Pagamento em atraso → atualiza status
 * - PAYMENT_DELETED: Pagamento cancelado
 * - PAYMENT_REFUNDED: Pagamento estornado
 *
 * Segurança: Valida assinatura do webhook via ASAAS_WEBHOOK_SECRET
 * Idempotência: Verifica AuditLog antes de processar para evitar double-credit
 */

import type { FastifyInstance } from 'fastify'
import { env } from '../../utils/env.js'
import type { AsaasWebhookEvent } from '../../services/asaas.service.js'
import { scheduleRepasseWithSplit } from '../../services/repasse.service.js'
import { safeStringEqual } from '../../utils/crypto-safe.js'
import { notify } from '../../services/notification.service.js'
import { dispatchWebhooks } from '../../services/outgoing-webhook.service.js'
import { recordEvent } from '../../services/system-event.service.js'
import { issueLicense, isLicensingConfigured, oneYearFromNow } from '../../services/license.service.js'
import { sendEmail } from '../../services/email.service.js'

/**
 * Venda da edição OFFLINE: quando o Asaas confirma um pagamento cujo
 * externalReference é "offline-license:<plan>:<email>", emitimos a chave de
 * licença assinada e enviamos por e-mail com o link do instalador. Totalmente
 * isolado do fluxo de aluguel — qualquer erro aqui é logado e não afeta o resto.
 */
async function handleOfflineLicensePurchase(app: FastifyInstance, externalRef: string): Promise<void> {
  const parts = externalRef.split(':')          // ["offline-license", plan, email...]
  const plan = parts[1] || 'basic'
  const email = parts.slice(2).join(':').trim() // e-mail pode conter ':'? não, mas é defensivo
  if (!email) { app.log.warn('[offline-license] sem e-mail no externalReference'); return }
  if (!isLicensingConfigured()) { app.log.error('[offline-license] LICENSE_PRIVATE_KEY ausente'); return }

  const expires = oneYearFromNow()
  const key = issueLicense({ customer: email, plan, email, expires })
  // Link do INSTALADOR (não a landing /software). Sem env var, aponta direto
  // para o release público do GitHub — sempre o .exe mais recente.
  const downloadUrl = env.SOFTWARE_DOWNLOAD_URL
    || 'https://github.com/tomascesarlemossil/agoraencontrei/releases/download/desktop-latest/AgoraEncontrei-Software-Setup.exe'

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#143A1F">
      <h2>Sua licença do Sistema Administrador AgoraEncontrei</h2>
      <p>Pagamento confirmado — obrigado pela compra! 🎉</p>
      <p><strong>1.</strong> Baixe o instalador: <a href="${downloadUrl}">${downloadUrl}</a></p>
      <p><strong>2.</strong> Instale e, na tela de ativação, cole a sua chave de licença:</p>
      <pre style="background:#f4f6fb;border:1px solid #d7def0;border-radius:8px;padding:12px;white-space:pre-wrap;word-break:break-all;font-size:12px">${key}</pre>
      <p>Plano: <strong>${plan}</strong> · Validade: <strong>${expires}</strong></p>
      <p style="color:#6b7799;font-size:13px">Guarde este e-mail. Em caso de dúvida, responda esta mensagem.</p>
    </div>`

  const res = await sendEmail({ to: email, subject: 'Sua licença — Sistema Administrador AgoraEncontrei', html })
  if (res.success) app.log.info(`[offline-license] licença enviada para ${email}`)
  else app.log.error(`[offline-license] falha ao enviar e-mail: ${res.error}`)
}

function isUniqueConstraintError(err: any): boolean {
  return err?.code === 'P2002'
}

/**
 * Descobre a QUAL parcela (Rental) e a qual boleto (Invoice) um pagamento do
 * Asaas se refere.
 *
 * Por que isso precisa ser tolerante: o sistema emite cobranca por quatro
 * caminhos diferentes e cada um gravou o `externalReference` de um jeito —
 * `rental:<id>`, o id do rental puro, o id da invoice puro e ate o
 * `contract.legacyId`. Um webhook que so entendesse um formato deixaria de
 * dar baixa em tudo que veio pelos outros tres (foi exatamente o que
 * aconteceu com as 99 cobrancas de abril/2026, todas presas em PENDING).
 *
 * A ordem abaixo vai do sinal mais forte para o mais fraco:
 *   1. prefixo explicito (`rental:` / `invoice:`);
 *   2. a Invoice que ja guarda este `asaasId` — funciona para QUALQUER
 *      formato de externalReference, inclusive os legados;
 *   3. o id puro, testado como rental e depois como invoice.
 *
 * Quando chegamos na parcela pela invoice (ou vice-versa), completamos o par
 * pelo `invoice.rentalId` / `invoice.contractId`, para que a baixa atualize
 * os dois lados.
 */
async function resolvePaymentTarget(
  app: FastifyInstance,
  externalRef: string | undefined,
  asaasPaymentId: string,
): Promise<{ rentalId: string | null; invoiceId: string | null }> {
  const ref = (externalRef ?? '').trim()
  let rentalId: string | null = null
  let invoiceId: string | null = null

  // 1. Prefixo explicito.
  if (ref.startsWith('rental:')) rentalId = ref.slice('rental:'.length) || null
  else if (ref.startsWith('invoice:')) invoiceId = ref.slice('invoice:'.length) || null

  // 2. Invoice pelo asaasId — o vinculo mais confiavel, porque foi gravado
  //    no momento da emissao e nao depende do formato do externalReference.
  if (!invoiceId) {
    const byAsaas = await app.prisma.invoice.findFirst({
      where: { asaasId: asaasPaymentId },
      select: { id: true, rentalId: true },
    }).catch(() => null)
    if (byAsaas) {
      invoiceId = byAsaas.id
      rentalId = rentalId ?? byAsaas.rentalId ?? null
    }
  }

  // 3. Id puro: pode ser de um rental ou de uma invoice.
  if (!rentalId && !invoiceId && ref && !ref.includes(':')) {
    const asRental = await app.prisma.rental.findUnique({
      where: { id: ref }, select: { id: true },
    }).catch(() => null)
    if (asRental) rentalId = asRental.id
    else {
      const asInvoice = await app.prisma.invoice.findUnique({
        where: { id: ref }, select: { id: true, rentalId: true },
      }).catch(() => null)
      if (asInvoice) {
        invoiceId = asInvoice.id
        rentalId = asInvoice.rentalId ?? null
      }
    }
  }

  // 4. Fecha o par nas duas direcoes.
  if (rentalId && !invoiceId) {
    const inv = await app.prisma.invoice.findFirst({
      where: { rentalId }, select: { id: true }, orderBy: { createdAt: 'desc' },
    }).catch(() => null)
    invoiceId = inv?.id ?? null
  }
  if (invoiceId && !rentalId) {
    const inv = await app.prisma.invoice.findUnique({
      where: { id: invoiceId }, select: { rentalId: true },
    }).catch(() => null)
    rentalId = inv?.rentalId ?? null
  }

  // Se o rental apontado nao existe mais, nao adianta tentar atualizar.
  if (rentalId) {
    const exists = await app.prisma.rental.findUnique({
      where: { id: rentalId }, select: { id: true },
    }).catch(() => null)
    if (!exists) rentalId = null
  }

  return { rentalId, invoiceId }
}

/** Espelha o status do Asaas na Invoice, para o boleto nao ficar eternamente PENDING. */
async function syncInvoice(
  app: FastifyInstance,
  invoiceId: string | null,
  payment: any,
  event: string,
): Promise<void> {
  if (!invoiceId) return
  const pago = event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED'
  const estorno = event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED'
  const quando = payment.confirmedDate ? new Date(payment.confirmedDate) : new Date()

  await app.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      asaasStatus: payment.status ?? (pago ? 'RECEIVED' : undefined),
      ...(pago ? {
        status: 'PAID',
        paidAt: quando,
        paidAmount: payment.value ?? undefined,
        paymentMethod: payment.billingType || 'UNDEFINED',
        paidByName: 'Asaas (webhook)',
        paymentRef: payment.id,
      } : {}),
      ...(event === 'PAYMENT_OVERDUE' ? { status: 'OVERDUE' } : {}),
      ...(estorno ? {
        status: 'REVERSED',
        paidAt: null,
        paidAmount: null,
        reversedAt: new Date(),
        reversalReason: event === 'PAYMENT_REFUNDED' ? 'Estorno via Asaas' : 'Cancelamento via Asaas',
      } : {}),
    },
  }).catch((e: any) => app.log.warn(`[asaas-webhook] Invoice ${invoiceId} update failed: ${e.message}`))
}

function isMissingModelOrTableError(err: any): boolean {
  return err?.code === 'P2021' || err?.code === 'P2022' || /Cannot read properties of undefined|does not exist|doesn't exist/i.test(err?.message ?? '')
}

function getPrismaDelegate(prisma: any, name: string) {
  const delegate = prisma?.[name]
  return delegate && typeof delegate.create === 'function' ? delegate : null
}

export default async function asaasWebhookRoutes(app: FastifyInstance) {
  // POST /api/v1/finance/webhook/asaas — Público (chamado pelo Asaas)
  app.post('/asaas', {
    config: { rateLimit: { max: 100, timeWindow: '1 minute' } },
    schema: { tags: ['finance-webhook'] },
  }, async (req, reply) => {
    // Validate webhook secret if configured — timing-safe comparison so an
    // attacker cannot learn the token byte-by-byte via response latency.
    const webhookToken = (req.headers['asaas-access-token'] as string) || ''
    if (env.ASAAS_WEBHOOK_SECRET && !safeStringEqual(webhookToken, env.ASAAS_WEBHOOK_SECRET)) {
      app.log.warn('[asaas-webhook] Invalid webhook token')
      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }

    const body = req.body as AsaasWebhookEvent & { id?: string; dateCreated?: string }
    const { event, payment } = body

    if (!event || !payment?.id) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD' })
    }

    app.log.info(`[asaas-webhook] Event: ${event}, Payment: ${payment.id}, Status: ${payment.status}`)

    // Declarado fora do try/catch principal para que o catch externo consiga
    // marcar o registro como erro quando o processamento falhar.
    let eventRecordId: string | null = null

    try {
      // Idempotency guard — uses DB UNIQUE constraint on eventKey to handle
      // concurrent re-deliveries atomically (no race window between check and insert).
      const eventKey = `asaas:${event}:${payment.id}`
      const processedEventDelegate = getPrismaDelegate(app.prisma as any, 'webhookProcessedEvent')
      try {
        if (processedEventDelegate) {
          await processedEventDelegate.create({
            data: {
              eventKey,
              provider: 'asaas',
              eventType: event,
              externalId: payment.id,
              payload: { event, paymentId: payment.id, status: payment.status },
            },
          })
        } else {
          app.log.warn('[asaas-webhook] webhookProcessedEvent delegate unavailable; continuing without hard idempotency')
        }
      } catch (uniqueErr: any) {
        // P2002 = Prisma unique constraint violation → duplicate delivery
        if (isUniqueConstraintError(uniqueErr)) {
          app.log.info(`[asaas-webhook] Duplicate event skipped: ${eventKey}`)
          return reply.send({ success: true, skipped: true })
        }
        if (isMissingModelOrTableError(uniqueErr)) {
          app.log.warn(`[asaas-webhook] Hard idempotency unavailable (continuing): ${uniqueErr?.message ?? uniqueErr}`)
        } else {
          throw uniqueErr
        }
      }

      // Descobre a parcela e o boleto alvo. Tolerante aos quatro formatos de
      // externalReference que as rotas de emissao ja gravaram (ver
      // resolvePaymentTarget) e com fallback pelo asaasId da Invoice.
      const externalRef = (payment as any).externalReference as string | undefined
      const { rentalId, invoiceId } = await resolvePaymentTarget(app, externalRef, payment.id)
      if (!rentalId && !invoiceId && !externalRef?.startsWith('offline-license:')) {
        app.log.warn(
          `[asaas-webhook] Pagamento ${payment.id} sem alvo (externalReference="${externalRef ?? ''}") — ` +
          'nenhuma parcela ou boleto correspondente no banco.',
        )
      }

      // ─── Idempotency gate ───────────────────────────────────────────────────
      // Asaas pode reentregar eventos em caso de timeout / retry.
      // Primeiro tentamos inserir um registro na tabela de dedup com UNIQUE
      // em dedupKey. Se falhar (P2002), é duplicata — pulamos com 200 OK.
      const eventTimestamp =
        (payment as any).confirmedDate ||
        (payment as any).clientPaymentDate ||
        body.dateCreated ||
        ''
      const dedupKey = body.id
        ? `asaas:${body.id}`
        : `asaas:${event}:${payment.id}:${payment.status ?? 'unknown'}:${eventTimestamp}`

      const asaasEventDelegate = getPrismaDelegate(app.prisma as any, 'asaasWebhookEvent')
      try {
        if (asaasEventDelegate) {
          const record = await asaasEventDelegate.create({
            data: {
              dedupKey,
              event,
              paymentId: payment.id,
              rentalId,
              status: payment.status ?? null,
              payload: body as any,
            },
            select: { id: true },
          })
          eventRecordId = record.id
        }
      } catch (err: any) {
        // P2002 unique constraint violation = duplicate webhook, já processamos
        if (isUniqueConstraintError(err)) {
          app.log.info(`[asaas-webhook] Duplicate event ignored: ${dedupKey}`)
          return reply.send({ success: true, duplicate: true, event, paymentId: payment.id })
        }
        // Tabela pode não existir ainda em alguns ambientes — continua sem dedup
        if (!isMissingModelOrTableError(err)) {
          app.log.warn(`[asaas-webhook] Dedup record creation failed (continuing): ${err?.message ?? err}`)
        }
      }

      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED': {
          // 0. Venda da edição OFFLINE — emite licença + e-mail (isolado do aluguel).
          if (externalRef?.startsWith('offline-license:')) {
            await handleOfflineLicensePurchase(app, externalRef)
              .catch((e: any) => app.log.error(`[offline-license] ${e?.message || e}`))
          }

          // 1a. Espelha o pagamento no boleto (Invoice), quando houver.
          await syncInvoice(app, invoiceId, payment, event)

          // 1. Atualiza o rental para PAID.
          //    O `status: { not: 'PAID' }` no updateMany e a trava contra
          //    dobra: o Asaas manda PAYMENT_RECEIVED e PAYMENT_CONFIRMED para
          //    a mesma cobranca, e reentrega em caso de timeout. Sem isso, a
          //    segunda passada agendaria um SEGUNDO repasse do mesmo aluguel.
          let jaEstavaPago = false
          if (rentalId) {
            const flip = await app.prisma.rental.updateMany({
              where: { id: rentalId, status: { not: 'PAID' } },
              data: {
                status: 'PAID',
                paymentDate: payment.confirmedDate ? new Date(payment.confirmedDate) : new Date(),
                paidAmount: payment.value ?? undefined,
                paymentMethod: payment.billingType || 'UNDEFINED',
              },
            }).catch((e: any) => {
              app.log.warn(`[asaas-webhook] Rental update failed: ${e.message}`)
              return { count: 0 }
            })
            jaEstavaPago = flip.count === 0
            if (jaEstavaPago) {
              app.log.info(`[asaas-webhook] Rental ${rentalId} ja estava PAID — repasse nao sera reagendado`)
            }

            // 2. Log the payment — pull landlordDueDay (c_venc_pro do Uniloc)
            // junto, porque cada contrato da Imobiliária Lemos tem sua própria
            // data mensal de repasse (normalmente 02, 12, 17, 22 ou 27). Sem
            // isso, o scheduler cairia no `tenant.repasseFixedDay` global e
            // pagaria todo mundo no mesmo dia — regra de negócio incorreta.
            const rental = await app.prisma.rental.findUnique({
              where: { id: rentalId },
              include: {
                contract: {
                  select: {
                    companyId: true,
                    tenantName: true,
                    propertyAddress: true,
                    landlordName: true,
                    landlordId: true,
                    commission: true,
                    landlordDueDay: true,
                  },
                },
              },
            })

            if (rental?.contract) {
              await app.prisma.auditLog.create({
                data: {
                  companyId: rental.contract.companyId,
                  action: 'rental.pay',
                  resource: 'rental',
                  resourceId: rentalId,
                  payload: {
                    asaasId: payment.id,
                    value: payment.value,
                    netValue: payment.netValue,
                    billingType: payment.billingType,
                    tenantName: rental.contract.tenantName,
                    propertyAddress: rental.contract.propertyAddress,
                    source: 'asaas_webhook',
                  },
                },
              }).catch(() => {})

              // 3. Schedule repasse ao proprietário
              const contract = rental.contract as any
              if (contract.landlordId && payment.value && !jaEstavaPago) {
                // Check if this company has a tenant (SaaS clone) for commission split
                const tenant = await (app.prisma as any).tenant?.findFirst?.({
                  where: { companyId: contract.companyId, isActive: true },
                  select: { id: true, splitPercent: true, repasseDelayDays: true, repasseFixedDay: true },
                }).catch(() => null)

                // `??` (not `||`) so commission=0 and delay=0 survive — `||`
                // would silently replace a zero with the default 10% / 7 days.
                const commissionRaw = contract.commission != null ? Number(contract.commission) : null
                const commissionPercent = (commissionRaw != null && Number.isFinite(commissionRaw))
                  ? commissionRaw
                  : 10
                const delayDays = tenant?.repasseDelayDays ?? 7

                // PRIORIDADE para o dia de repasse do proprietário:
                //   1. contract.landlordDueDay — dia REAL do contrato (Uniloc
                //      c_venc_pro: 02/12/17/22/27 para Lemos).
                //   2. tenant.repasseFixedDay — default global do SaaS.
                //   3. undefined → scheduleRepasse usa D+delayDays.
                // Validação: só aceita dias 1-31 (Prisma guarda como Int?).
                const landlordDueDay = contract.landlordDueDay
                const contractFixedDay = (typeof landlordDueDay === 'number' && landlordDueDay >= 1 && landlordDueDay <= 31)
                  ? landlordDueDay
                  : undefined
                const tenantFixedDay = (typeof tenant?.repasseFixedDay === 'number' && tenant.repasseFixedDay >= 1 && tenant.repasseFixedDay <= 31)
                  ? tenant.repasseFixedDay
                  : undefined
                const fixedDay = contractFixedDay ?? tenantFixedDay

                // Rateia entre os beneficiários do contrato (RepasseBeneficiary).
                // Sem beneficiários cadastrados, cai em 1 repasse de 100% para
                // contract.landlordId (comportamento histórico preservado).
                await scheduleRepasseWithSplit(app.prisma as any, {
                  tenantId: tenant?.id || undefined,
                  companyId: contract.companyId,
                  contractId: rental.contractId ?? undefined,
                  rentalId,
                  fallbackLandlordId: contract.landlordId,
                  fallbackLandlordName: contract.landlordName ?? undefined,
                  grossValue: payment.value,
                  commissionPercent,
                  delayDays,
                  fixedDay,
                })

                app.log.info(
                  `[asaas-webhook] Repasse scheduled for rental ${rentalId} ` +
                  `(R$ ${payment.value}, landlordDueDay=${contractFixedDay ?? 'n/a'}, ` +
                  `tenantFixedDay=${tenantFixedDay ?? 'n/a'}, delayDays=${delayDays})`
                )
              }

              app.log.info(`[asaas-webhook] Rental ${rentalId} marked as PAID (${payment.billingType}, R$ ${payment.value})`)
            }
          }

          // Deal sinal payment — mark received and advance the Transaction Hub.
          {
            const dealPayment = await app.prisma.dealPayment.findUnique({
              where: { asaasChargeId: payment.id },
            }).catch(() => null)
            if (dealPayment && dealPayment.status !== 'received') {
              await app.prisma.dealPayment.update({
                where: { id: dealPayment.id },
                data: {
                  status: 'received',
                  paidAt: payment.confirmedDate ? new Date(payment.confirmedDate) : new Date(),
                },
              }).catch(() => {})

              const deal = await app.prisma.deal.findUnique({ where: { id: dealPayment.dealId } }).catch(() => null)
              if (deal) {
                // Advance the Transaction Hub to "sinal" once the signal is paid.
                const meta = (deal.metadata as Record<string, unknown>) ?? {}
                const tx = (meta.transaction as Record<string, unknown>) ?? {}
                const ORDER = ['lead', 'proposta', 'kyc', 'sinal']
                const cur = (tx.stage as string) ?? 'lead'
                if (dealPayment.type === 'signal' && ORDER.includes(cur)) {
                  await app.prisma.deal.update({
                    where: { id: deal.id },
                    data: { metadata: { ...meta, transaction: { ...tx, stage: 'sinal' } } },
                  }).catch(() => {})
                }
                await notify({
                  prisma: app.prisma,
                  companyId: deal.companyId,
                  type: 'proposal_received',
                  title: `Sinal pago — negociação "${deal.title}"`,
                  body: `Pagamento de R$ ${Number(payment.value ?? dealPayment.amount).toLocaleString('pt-BR')} confirmado.`,
                  payload: { dealId: deal.id, dealPaymentId: dealPayment.id },
                  email: false,
                }).catch(() => {})

                void dispatchWebhooks(app.prisma, deal.companyId, 'deal.payment_received', {
                  dealId: deal.id, dealPaymentId: dealPayment.id,
                  amount: Number(payment.value ?? dealPayment.amount), type: dealPayment.type,
                })

                void recordEvent({
                  prisma: app.prisma, companyId: deal.companyId,
                  eventType: 'deal.payment_received', source: 'asaas_webhook',
                  entityType: 'deal_payment', entityId: dealPayment.id,
                  payload: {
                    dealId: deal.id,
                    amount: Number(payment.value ?? dealPayment.amount),
                    type: dealPayment.type,
                    billingType: payment.billingType,
                  },
                })
              }
              app.log.info(`[asaas-webhook] DealPayment ${dealPayment.id} marked received`)
            }
          }
          break
        }

        case 'PAYMENT_OVERDUE': {
          await syncInvoice(app, invoiceId, payment, event)
          if (rentalId) {
            await app.prisma.rental.update({
              where: { id: rentalId },
              data: { status: 'LATE' },
            }).catch((e: any) => app.log.warn(`[asaas-webhook] Rental overdue update failed: ${e.message}`))

            app.log.info(`[asaas-webhook] Rental ${rentalId} marked as LATE`)
          }
          break
        }

        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED': {
          await syncInvoice(app, invoiceId, payment, event)
          if (rentalId) {
            await app.prisma.rental.update({
              where: { id: rentalId },
              data: {
                status: 'PENDING',
                paymentDate: null,
                paidAmount: null,
                reversedAt: new Date(),
                reversalReason: event === 'PAYMENT_REFUNDED' ? 'Estorno via Asaas' : 'Cancelamento via Asaas',
              },
            }).catch((e: any) => app.log.warn(`[asaas-webhook] Rental reversal update failed: ${e.message}`))

            app.log.info(`[asaas-webhook] Rental ${rentalId} reversed (${event})`)
          }
          break
        }

        default:
          app.log.info(`[asaas-webhook] Unhandled event: ${event}`)
      }

      // Marca o evento de dedup como processado com sucesso
      if (eventRecordId) {
        await getPrismaDelegate(app.prisma as any, 'asaasWebhookEvent')
          ?.update({
            where: { id: eventRecordId },
            data: { processedAt: new Date(), result: 'ok' },
          })
          .catch((err: any) =>
            app.log.warn(`[asaas-webhook] Failed to mark event ${eventRecordId} as processed: ${err?.message ?? err}`),
          )
      }
      return reply.send({ success: true, event, paymentId: payment.id })
    } catch (error: any) {
      app.log.error(`[asaas-webhook] Error processing event ${event}:`, error.message)
      // Marca dedup record como erro para auditoria — útil para replay manual
      if (eventRecordId) {
        await getPrismaDelegate(app.prisma as any, 'asaasWebhookEvent')
          ?.update({
            where: { id: eventRecordId },
            data: { processedAt: new Date(), result: 'error', errorMessage: error?.message ?? String(error) },
          })
          .catch(() => {})
      }
      // Clear the hard-dedup record so Asaas's retry can re-enter and
      // reprocess the event; otherwise the first idempotency guard would
      // short-circuit every retry and the payment would never settle.
      const eventKey = `asaas:${event}:${payment.id}`
      await getPrismaDelegate(app.prisma as any, 'webhookProcessedEvent')
        ?.delete({ where: { eventKey } })
        .catch(() => {})
      // Return 5xx so Asaas retries — financial events must not be dropped.
      return reply.status(500).send({ success: false, error: 'PROCESSING_FAILED' })
    }
  })
}
