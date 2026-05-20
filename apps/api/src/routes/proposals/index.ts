/**
 * Proposals — admin actions over Proposal records.
 *
 * PATCH /api/v1/proposals/:id — change status (counter/accept/reject),
 *   appends a ProposalEvent, notifies the buyer with the tracking link.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

export default async function proposalsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.patch('/:id', { schema: { tags: ['proposals'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      status:        z.enum(['sent', 'countered', 'accepted', 'rejected', 'expired']).optional(),
      counterValue:  z.number().positive().optional(),
      note:          z.string().max(2000).optional(),
    }).parse(req.body)

    const proposal = await app.prisma.proposal.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!proposal) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.proposal.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.counterValue !== undefined && { offerValue: body.counterValue }),
      },
    })

    // Append a timeline event so the buyer page shows the change.
    await app.prisma.proposalEvent.create({
      data: {
        proposalId: id,
        type: body.status ?? 'countered',
        actorType: 'broker',
        value: body.counterValue ?? null,
        note: body.note ?? null,
      },
    }).catch(() => {})

    // Notifica o comprador com o link de acompanhamento — fechar o loop.
    if (proposal.contactId) {
      const contact = await app.prisma.contact.findUnique({
        where: { id: proposal.contactId },
        select: { email: true, name: true },
      }).catch(() => null)

      if (contact?.email) {
        try {
          const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
          if (isEmailConfigured()) {
            const trackingUrl = `https://www.agoraencontrei.com.br/proposta/${id}`
            const labels: Record<string, string> = {
              countered: 'Recebemos uma contra-proposta',
              accepted:  'Sua proposta foi aceita!',
              rejected:  'Sua proposta foi recusada',
              expired:   'Sua proposta expirou',
              sent:      'Sua proposta está em análise',
            }
            const subject = labels[body.status ?? 'countered'] ?? 'Atualização da sua proposta'
            const firstName = (contact.name ?? '').split(' ')[0] || 'Cliente'
            await sendEmail({
              to: contact.email,
              subject: `${subject} — AgoraEncontrei`,
              html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#1B2B5B;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <strong style="font-size:16px">AgoraEncontrei</strong>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;font-size:18px;color:#111">${firstName}, ${subject.toLowerCase()}</h2>
    ${body.note ? `<p style="margin:0 0 16px;color:#444;line-height:1.6">${body.note.replace(/</g, '&lt;')}</p>` : ''}
    <a href="${trackingUrl}" style="display:inline-block;background:#C9A84C;color:#1B2B5B;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none">Ver detalhes da proposta</a>
  </div>
</div>`,
            })
          }
        } catch { /* non-fatal */ }
      }
    }

    return reply.send({ data: updated })
  })

  app.get('/:id', { schema: { tags: ['proposals'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const proposal = await app.prisma.proposal.findFirst({
      where: { id, companyId: req.user.cid },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    })
    if (!proposal) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ data: proposal })
  })
}
