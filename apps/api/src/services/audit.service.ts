import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest } from 'fastify'

export type AuditAction =
  // Contratos & Locação
  | 'contract.create' | 'contract.update' | 'contract.delete' | 'contract.rescission' | 'contract.renewal' | 'contract.adjustment'
  | 'rental.pay' | 'rental.estorno' | 'rental.estornar' | 'rental.repasse_paid' | 'rental.repasse_estorno'
  | 'rental.batch_generate' | 'rental.repasse_lote'
  // Clientes
  | 'client.create'   | 'client.update'   | 'client.delete'
  // Imóveis
  | 'property.create' | 'property.update' | 'property.delete'
  // Contatos
  | 'contact.create'  | 'contact.update'  | 'contact.delete'
  // Negócios (CRM)
  | 'deal.create'     | 'deal.update'     | 'deal.delete'
  // Leads
  | 'lead.create'     | 'lead.update'     | 'lead.delete'     | 'lead.start_deal'
  // Jurídico
  | 'legal.create'    | 'legal.update'    | 'legal.delete'
  // Blog
  | 'blog.create'     | 'blog.update'     | 'blog.delete'     | 'blog.publish'
  // Usuários
  | 'user.login'      | 'user.register'   | 'user.update'     | 'user.delete'
  | 'user.password_change' | 'user.password_reset' | 'user.role_change' | 'user.invite'
  // Configurações do sistema
  | 'config.update'   | 'config.reset'    | 'config.permissions_update'
  // Financeiro
  | 'finance.create'  | 'finance.update'  | 'finance.delete'
  // Fiscal / NF
  | 'fiscal.create'   | 'fiscal.update'   | 'fiscal.delete'
  // Financiamentos
  | 'financing.create'| 'financing.update'| 'financing.delete'
  // Automações
  | 'automation.create'| 'automation.update'| 'automation.delete'| 'automation.run'
  // Portais
  | 'portal.sync'     | 'portal.update'
  // Documentos IA
  | 'document.create' | 'document.update' | 'document.delete'
  // Notificações
  | 'notification.read' | 'notification.delete_all'

export interface AuditOptions {
  prisma:     PrismaClient
  req:        FastifyRequest
  action:     AuditAction
  resource:   string          // e.g. "contract", "client", "property", "contact"
  resourceId: string
  before?:    Record<string, unknown> | null
  after?:     Record<string, unknown> | null
  meta?:      Record<string, unknown>   // extra context (e.g. section name for config)
}

/** Strip fields we never want in audit snapshots (large blobs, binary) */
function sanitize(obj: Record<string, unknown> | null | undefined) {
  if (!obj) return obj ?? null
  const {
    contractHtml: _html,
    images: _imgs,
    fileData: _fd,
    portalDescriptions: _pd,
    customCss: _css,
    customJs: _js,
    contractTemplateHtml: _tpl,
    ...rest
  } = obj as any
  return rest as Record<string, unknown>
}

/** Compute which field names changed between before and after */
function computeChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  if (!before || !after) return []
  return Object.keys(after).filter(
    k => JSON.stringify((after as any)[k]) !== JSON.stringify((before as any)[k])
  )
}

/**
 * Write one audit log entry.
 * Wrapped in try/catch so a DB write failure never propagates a 500 to the user.
 */
export async function createAuditLog(opts: AuditOptions): Promise<void> {
  try {
    const { prisma, req, action, resource, resourceId } = opts
    const before  = sanitize(opts.before  as any)
    const after   = sanitize(opts.after   as any)
    const changes = computeChanges(before, after)

    const payload: Record<string, unknown> = {}
    if (before  !== null) payload.before  = before
    if (after   !== null) payload.after   = after
    if (changes.length)   payload.changes = changes
    if (opts.meta)        payload.meta    = opts.meta

    await prisma.auditLog.create({
      data: {
        companyId:  req.user.cid,
        userId:     req.user.sub,
        action,
        resource,
        resourceId,
        ipAddress:  (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip ?? null,
        userAgent:  (req.headers['user-agent'] as string | undefined) ?? null,
        payload: payload as any,
      },
    })
  } catch (err) {
    // Never let audit failures break the main request
    console.warn('[audit] Failed to write audit log:', (err as Error).message)
  }
}
