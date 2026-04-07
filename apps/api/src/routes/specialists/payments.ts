// @ts-nocheck
/* eslint-disable */
/**
 * Rota de Pagamentos de Parceiros (Especialistas)
 * Integração com Asaas para assinaturas recorrentes mensais
 * Planos: START (gratuito), PRIME (R$197/mês), VIP (R$497/mês)
 */
import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../utils/env.js'
import { findOrCreateCustomer } from '../../services/asaas.service.js'

const ASAAS_BASE_URL = env.ASAAS_BASE_URL ?? 'https://www.asaas.com/api/v3'
const ASAAS_API_KEY  = env.ASAAS_API_KEY  ?? ''

const PLAN_PRICES: Record<string, number> = {
  PRIME: 197,
  VIP:   497,
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  PRIME: 'AgoraEncontrei Parceiros — Plano Prime (Mensal)',
  VIP:   'AgoraEncontrei Parceiros — Plano VIP (Mensal)',
}

async function asaasFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

async function createSubscription(payload: {
  customer: string
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
  value: number
  nextDueDate: string
  description: string
  externalReference?: string
}) {
  return asaasFetch<{ id: string; status: string; value: number; nextDueDate: string }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ ...payload, cycle: 'MONTHLY' }),
  })
}

async function cancelSubscription(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

export async function specialistPaymentRoutes(app: FastifyInstance) {
  // ── POST /checkout — Inicia assinatura para um especialista ──────────────
  app.post('/checkout', async (req, reply) => {
    const { specialistId, plan, billingType = 'PIX', cpfCnpj } = req.body as {
      specialistId: string
      plan: 'PRIME' | 'VIP'
      billingType?: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
      cpfCnpj?: string
    }

    if (!specialistId || !plan) {
      return reply.status(400).send({ error: 'specialistId e plan são obrigatórios' })
    }

    if (!PLAN_PRICES[plan]) {
      return reply.status(400).send({ error: 'Plano inválido. Use PRIME ou VIP.' })
    }

    if (!ASAAS_API_KEY) {
      return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED', message: 'Configure ASAAS_API_KEY para usar pagamentos.' })
    }

    try {
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
        select: { id: true, name: true, email: true, phone: true, cpfCnpj: true, asaasCustomerId: true, plan: true },
      })

      if (!specialist) return reply.status(404).send({ error: 'Especialista não encontrado' })
      if (specialist.plan === plan) return reply.status(409).send({ error: 'Especialista já possui este plano' })

      // Criar ou recuperar cliente no Asaas
      let asaasCustomerId = specialist.asaasCustomerId
      if (!asaasCustomerId) {
        const customer = await findOrCreateCustomer({
          name: specialist.name,
          cpfCnpj: cpfCnpj || specialist.cpfCnpj || '00000000000',
          email: specialist.email || undefined,
          phone: specialist.phone || undefined,
        })
        asaasCustomerId = customer.id
        await prisma.specialist.update({
          where: { id: specialistId },
          data: { asaasCustomerId },
        })
      }

      // Calcular próxima data de vencimento (hoje + 1 dia)
      const nextDueDate = new Date()
      nextDueDate.setDate(nextDueDate.getDate() + 1)
      const dueDateStr = nextDueDate.toISOString().split('T')[0]

      // Criar assinatura recorrente no Asaas
      const subscription = await createSubscription({
        customer: asaasCustomerId,
        billingType,
        value: PLAN_PRICES[plan],
        nextDueDate: dueDateStr,
        description: PLAN_DESCRIPTIONS[plan],
        externalReference: `specialist:${specialistId}:${plan}`,
      })

      // Atualizar especialista com dados da assinatura (pendente até webhook confirmar)
      await prisma.specialist.update({
        where: { id: specialistId },
        data: {
          asaasSubscriptionId: subscription.id,
          planStatus: 'PENDING_PAYMENT',
        },
      })

      return reply.send({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        nextDueDate: subscription.nextDueDate,
        message: 'Assinatura criada. Aguardando confirmação de pagamento.',
        paymentUrl: `https://www.asaas.com/c/${subscription.id}`,
      })
    } catch (err: any) {
      app.log.error({ err }, 'Erro ao criar assinatura Asaas')
      return reply.status(500).send({ error: 'Erro ao processar pagamento', details: err.message })
    }
  })

  // ── POST /webhook — Recebe eventos do Asaas ──────────────────────────────
  app.post('/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const event = req.body as {
      event: string
      payment?: { externalReference?: string; status?: string; subscription?: string }
      subscription?: { id?: string; externalReference?: string; status?: string }
    }

    app.log.info({ event: event.event }, 'Asaas webhook recebido')

    try {
      const externalRef = event.payment?.externalReference || event.subscription?.externalReference
      const subscriptionId = event.payment?.subscription || event.subscription?.id

      if (!externalRef && !subscriptionId) {
        return reply.send({ received: true })
      }

      // Extrair specialistId da referência externa
      let specialistId: string | null = null
      let targetPlan: string | null = null

      if (externalRef) {
        const parts = externalRef.split(':')
        if (parts[0] === 'specialist' && parts.length >= 3) {
          specialistId = parts[1]
          targetPlan = parts[2]
        }
      }

      // Se não tiver na referência, buscar pelo subscriptionId
      if (!specialistId && subscriptionId) {
        const found = await prisma.specialist.findFirst({
          where: { asaasSubscriptionId: subscriptionId },
          select: { id: true, plan: true },
        })
        if (found) {
          specialistId = found.id
        }
      }

      if (!specialistId) return reply.send({ received: true })

      switch (event.event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED': {
          // Pagamento confirmado — ativar plano
          const plan = (targetPlan as 'START' | 'PRIME' | 'VIP') || 'PRIME'
          await prisma.specialist.update({
            where: { id: specialistId },
            data: {
              plan,
              planStatus: 'ACTIVE',
              planActivatedAt: new Date(),
              planExpiresAt: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // +32 dias
            },
          })
          app.log.info({ specialistId, plan }, 'Plano ativado via webhook Asaas')
          break
        }

        case 'PAYMENT_OVERDUE': {
          // Pagamento vencido — notificar mas não cancelar imediatamente
          await prisma.specialist.update({
            where: { id: specialistId },
            data: { planStatus: 'OVERDUE' },
          })
          break
        }

        case 'PAYMENT_DELETED':
        case 'SUBSCRIPTION_CANCELLED': {
          // Assinatura cancelada — reverter para START
          await prisma.specialist.update({
            where: { id: specialistId },
            data: {
              plan: 'START',
              planStatus: 'CANCELLED',
              asaasSubscriptionId: null,
              planExpiresAt: null,
            },
          })
          app.log.info({ specialistId }, 'Plano cancelado via webhook Asaas')
          break
        }
      }

      return reply.send({ received: true })
    } catch (err: any) {
      app.log.error({ err }, 'Erro ao processar webhook Asaas')
      // Alerta por email ao admin quando o webhook falha
      try {
        const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
        if (isEmailConfigured()) {
          await sendEmail({
            to: 'tomascesarlemossilva@gmail.com',
            subject: '🚨 [AgoraEncontrei] Erro no Webhook Asaas — Ação necessária',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="background:#1B2B5B;padding:20px;border-radius:8px 8px 0 0">
                  <h2 style="color:#C9A84C;margin:0">🚨 Erro no Webhook Asaas</h2>
                </div>
                <div style="background:#fff;padding:20px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
                  <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                  <p><strong>Evento:</strong> <code>${(event as any)?.event ?? 'desconhecido'}</code></p>
                  <p><strong>Erro:</strong> ${(err as Error)?.message ?? 'Erro desconhecido'}</p>
                  <pre style="background:#f3f4f6;padding:12px;border-radius:4px;font-size:11px;overflow:auto;max-height:200px">${(err as Error)?.stack ?? ''}</pre>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
                  <p style="color:#6b7280;font-size:12px">Alerta automático — AgoraEncontrei Auto-Healing</p>
                </div>
              </div>
            `,
          })
        }
      } catch (_emailErr) {
        app.log.warn('Falha ao enviar alerta de email do webhook')
      }
      return reply.status(500).send({ error: 'Erro interno no webhook' })
    }
  })

  // ── DELETE /cancel — Cancela assinatura ──────────────────────────────────
  app.delete('/cancel/:specialistId', async (req, reply) => {
    const { specialistId } = req.params as { specialistId: string }

    if (!ASAAS_API_KEY) {
      return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED' })
    }

    try {
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
        select: { asaasSubscriptionId: true, plan: true },
      })

      if (!specialist) return reply.status(404).send({ error: 'Especialista não encontrado' })
      if (!specialist.asaasSubscriptionId) return reply.status(400).send({ error: 'Nenhuma assinatura ativa' })

      await cancelSubscription(specialist.asaasSubscriptionId)

      await prisma.specialist.update({
        where: { id: specialistId },
        data: {
          plan: 'START',
          planStatus: 'CANCELLED',
          asaasSubscriptionId: null,
          planExpiresAt: null,
        },
      })

      return reply.send({ success: true, message: 'Assinatura cancelada com sucesso' })
    } catch (err: any) {
      app.log.error({ err }, 'Erro ao cancelar assinatura')
      return reply.status(500).send({ error: 'Erro ao cancelar assinatura', details: err.message })
    }
  })

  // ── GET /status/:specialistId — Verifica status da assinatura ────────────
  app.get('/status/:specialistId', async (req, reply) => {
    const { specialistId } = req.params as { specialistId: string }

    const specialist = await prisma.specialist.findUnique({
      where: { id: specialistId },
      select: { plan: true, planStatus: true, planActivatedAt: true, planExpiresAt: true, asaasSubscriptionId: true },
    })

    if (!specialist) return reply.status(404).send({ error: 'Especialista não encontrado' })

    return reply.send({
      plan: specialist.plan,
      planStatus: specialist.planStatus,
      planActivatedAt: specialist.planActivatedAt,
      planExpiresAt: specialist.planExpiresAt,
      hasActiveSubscription: !!specialist.asaasSubscriptionId,
    })
  })
}
