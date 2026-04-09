import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { findOrCreateCustomer, createCharge } from '../../services/asaas.service.js'

const VALUATION_PRICE = 200 // R$ 200,00
const PIX_KEY = 'c278f53d-994f-47e5-b720-c3d67d18aeb1' // Chave PIX fixa para pagamentos

function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

function isValidCPF(cpf: string): boolean {
  const digits = cleanCPF(cpf)
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let check = 11 - (sum % 11)
  if (check >= 10) check = 0
  if (parseInt(digits[9]) !== check) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  check = 11 - (sum % 11)
  if (check >= 10) check = 0
  return parseInt(digits[10]) === check
}

const checkCPFSchema = z.object({
  cpf: z.string().min(11).max(14),
})

const createChargeSchema = z.object({
  cpf: z.string().min(11).max(14),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  billingType: z.enum(['PIX', 'BOLETO']).default('PIX'),
})

const registerSchema = z.object({
  cpf: z.string().min(11).max(14),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyType: z.string().optional(),
})

export async function valuationRoutes(app: FastifyInstance) {

  // ── GET /valuation/pix-info — Retorna chave PIX para pagamentos ────────
  app.get('/valuation/pix-info', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      pixKey: PIX_KEY,
      pixKeyType: 'EVP',
      beneficiary: 'AgoraEncontrei — Imobiliária Lemos',
      valuationPrice: VALUATION_PRICE,
    })
  })

  // ── GET /valuation/check-cpf — Verifica se CPF tem avaliação gratuita ──
  app.get('/valuation/check-cpf', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = checkCPFSchema.safeParse(req.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'CPF inválido' })
    }

    const cpf = cleanCPF(result.data.cpf)
    if (!isValidCPF(cpf)) {
      return reply.status(400).send({ error: 'CPF inválido' })
    }

    try {
      const rows = await app.prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM valuation_requests WHERE cpf = $1`,
        cpf
      )
      const count = Number(rows[0]?.count || 0)

      return reply.send({
        cpf,
        valuationCount: count,
        freeAvailable: count === 0,
        priceIfPaid: count > 0 ? VALUATION_PRICE : 0,
      })
    } catch {
      // Table may not exist yet - treat as free
      return reply.send({
        cpf,
        valuationCount: 0,
        freeAvailable: true,
        priceIfPaid: 0,
      })
    }
  })

  // ── POST /valuation/create-charge — Cria cobrança Asaas para avaliação ──
  app.post('/valuation/create-charge', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = createChargeSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
    }

    const { name, email, phone, billingType } = result.data
    const cpf = cleanCPF(result.data.cpf)

    if (!isValidCPF(cpf)) {
      return reply.status(400).send({ error: 'CPF inválido' })
    }

    try {
      // If Asaas is not configured, return static PIX key
      if (!process.env.ASAAS_API_KEY) {
        const refId = `valuation-${cpf}-${Date.now()}`
        await app.prisma.$executeRawUnsafe(
          `INSERT INTO valuation_requests (id, cpf, name, email, phone, "paymentStatus")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'PENDING')`,
          cpf, name, email || null, phone || null,
        )
        return reply.send({
          chargeId: refId,
          status: 'PENDING',
          value: VALUATION_PRICE,
          billingType: 'PIX',
          invoiceUrl: null,
          bankSlipUrl: null,
          pixCode: PIX_KEY,
          pixQrCodeUrl: null,
          dueDate: new Date().toISOString().split('T')[0],
          pixKeyType: 'static',
        })
      }

      // Find or create Asaas customer
      const customer = await findOrCreateCustomer({
        name,
        cpfCnpj: cpf,
        email,
        phone,
      })

      // Create charge (due today)
      const today = new Date().toISOString().split('T')[0]
      const charge = await createCharge({
        customer: customer.id,
        billingType,
        value: VALUATION_PRICE,
        dueDate: today,
        description: `Avaliação de Imóvel - AgoraEncontrei (CPF: ${cpf})`,
        externalReference: `valuation-${cpf}-${Date.now()}`,
      })

      // Record in database
      await app.prisma.$executeRawUnsafe(
        `INSERT INTO valuation_requests (id, cpf, name, email, phone, "asaasChargeId", "asaasPaymentUrl", "paymentStatus")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, 'PENDING')`,
        cpf, name, email || null, phone || null,
        charge.id,
        charge.invoiceUrl || charge.bankSlipUrl || null,
      )

      return reply.send({
        chargeId: charge.id,
        status: charge.status,
        value: charge.value,
        billingType: charge.billingType,
        invoiceUrl: charge.invoiceUrl,
        bankSlipUrl: charge.bankSlipUrl,
        pixCode: charge.pixCode,
        pixQrCodeUrl: charge.pixQrCodeUrl,
        dueDate: charge.dueDate,
      })
    } catch (err: any) {
      app.log.error('Valuation charge error:', err.message)
      return reply.status(500).send({
        error: 'Erro ao criar cobrança. Tente novamente.',
        details: err.message,
      })
    }
  })

  // ── POST /valuation/register — Registra uso de avaliação gratuita ──────
  app.post('/valuation/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = registerSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
    }

    const cpf = cleanCPF(result.data.cpf)
    if (!isValidCPF(cpf)) {
      return reply.status(400).send({ error: 'CPF inválido' })
    }

    try {
      await app.prisma.$executeRawUnsafe(
        `INSERT INTO valuation_requests (id, cpf, name, email, phone, "propertyCity", "propertyType", "paymentStatus")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, 'FREE')`,
        cpf,
        result.data.name || null,
        result.data.email || null,
        result.data.phone || null,
        result.data.propertyCity || null,
        result.data.propertyType || null,
      )

      return reply.send({ ok: true, message: 'Avaliação gratuita registrada.' })
    } catch (err: any) {
      app.log.error('Valuation register error:', err.message)
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── POST /valuation/check-payment — Verifica se pagamento foi confirmado ──
  app.post('/valuation/check-payment', async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({ chargeId: z.string() })
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'chargeId obrigatório' })
    }

    try {
      const { chargeId } = result.data

      // Check Asaas charge status
      const res = await fetch(`${process.env.ASAAS_BASE_URL || 'https://www.asaas.com/api/v3'}/payments/${chargeId}`, {
        headers: {
          'Content-Type': 'application/json',
          access_token: process.env.ASAAS_API_KEY || '',
        },
      })

      if (!res.ok) {
        return reply.status(400).send({ error: 'Cobrança não encontrada' })
      }

      const charge = await res.json()
      const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(charge.status)

      if (isPaid) {
        // Update local record
        await app.prisma.$executeRawUnsafe(
          `UPDATE valuation_requests SET "paymentStatus" = 'PAID' WHERE "asaasChargeId" = $1`,
          chargeId
        )
      }

      return reply.send({
        chargeId,
        status: charge.status,
        isPaid,
        value: charge.value,
      })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
}
