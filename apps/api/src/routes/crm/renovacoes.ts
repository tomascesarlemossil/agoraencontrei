/**
 * CRM Renovações — Alertas de contratos vencendo e proprietários sem contato
 * Contrato não tem endDate — calculamos via startDate + duration (meses)
 */
import type { FastifyInstance } from 'fastify'

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}
function subDays(d: Date, days: number): Date {
  return new Date(d.getTime() - days * 24 * 60 * 60 * 1000)
}

function addMonths(d: Date, months: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + months)
  return r
}

export default async function renovacoesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/crm/renovacoes
  app.get('/', async (req, reply) => {
    const cid  = req.user.cid
    const hoje = new Date()
    const em90  = addDays(hoje, 90)

    // Fetch all active contracts with startDate + duration (compute endDate in-memory)
    const allContracts = await app.prisma.contract.findMany({
      where: {
        companyId: cid,
        status: 'ACTIVE',
        isActive: true,
        startDate: { not: null },
        duration: { not: null, gt: 0 },
      },
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { startDate: 'asc' },
      take: 500,
    })

    // Annotate with computed endDate and daysLeft
    const annotated = allContracts
      .map(c => {
        if (!c.startDate || !c.duration) return null
        const endDate = addMonths(c.startDate, c.duration)
        const daysLeft = Math.ceil((endDate.getTime() - hoje.getTime()) / 86_400_000)
        return { ...c, endDate, daysLeft }
      })
      .filter(c => c !== null && c.daysLeft >= 0 && c.endDate <= em90) as any[]

    const vencendo30 = annotated.filter(c => c.daysLeft <= 30)
    const vencendo60 = annotated.filter(c => c.daysLeft > 30 && c.daysLeft <= 60)
    const vencendo90 = annotated.filter(c => c.daysLeft > 60 && c.daysLeft <= 90)

    // Proprietários (LANDLORD) cadastrados há 30-90 dias (sem lastContactAt no schema — proxy por updatedAt == createdAt)
    const semContato = await app.prisma.client.findMany({
      where: {
        companyId: cid,
        roles: { has: 'LANDLORD' },
        createdAt: { lte: subDays(hoje, 30), gte: subDays(hoje, 90) },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return reply.send({
      vencendo30,
      vencendo60,
      vencendo90,
      semContato,
      stats: {
        urgente:    vencendo30.length,
        atencao:    vencendo60.length,
        aviso:      vencendo90.length,
        semContato: semContato.length,
      },
    })
  })

  // PATCH /api/v1/crm/renovacoes/contato/:clientId — marca cliente como contatado
  app.patch('/contato/:clientId', async (req, reply) => {
    const { clientId } = req.params as any
    const cid = req.user.cid

    const client = await app.prisma.client.findFirst({ where: { id: clientId, companyId: cid } })
    if (!client) return reply.status(404).send({ error: 'NOT_FOUND' })

    await app.prisma.client.update({ where: { id: clientId }, data: { updatedAt: new Date() } })
    return reply.send({ success: true })
  })
}
