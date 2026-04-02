import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest } from 'fastify'

export type AuditAction =
  | 'contract.create' | 'contract.update' | 'contract.delete' | 'contract.rescission'
  | 'rental.pay'
  | 'client.create'   | 'client.update'   | 'client.delete'
  | 'property.create' | 'property.update' | 'property.delete'
  | 'contact.create'  | 'contact.update'  | 'contact.delete'
  | 'deal.create'     | 'deal.update'
  | 'user.login'      | 'user.register'

export interface AuditOptions {
  prisma:     PrismaClient
  req:        FastifyRequest
  action:     AuditAction
  resource:   string          // e.g. "contract", "client", "property", "contact"
  resourceId: string
  before?:    Record<string, unknown> | null
  after?:     Record<string, unknown> | null
}

/** Strip fields we never want in audit snapshots (large blobs, binary) */
function sanitize(obj: Record<string, unknown> | null | undefined) {
  if (!obj) return obj ?? null
  const { contractHtml: _html, images: _imgs, fileData: _fd, portalDescriptions: _pd, ...rest } = obj as any
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

    await prisma.auditLog.create({
      data: {
        companyId:  req.user.cid,
        userId:     req.user.sub,
        action,
        resource,
        resourceId,
        ipAddress:  (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip ?? null,
        userAgent:  (req.headers['user-agent'] as string | undefined) ?? null,
        payload,
      },
    })
  } catch (err) {
    // Never let audit failures break the main request
    console.warn('[audit] Failed to write audit log:', (err as Error).message)
  }
}
