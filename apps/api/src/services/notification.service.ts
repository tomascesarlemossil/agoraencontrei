/**
 * Notification Service — single entry point for every lead/visit/handoff
 * alert in the system.
 *
 * `notify(...)` does three things, fail-soft (never throws):
 *   1. Persists a Notification row (survives page reload).
 *   2. Emits an SSE `notification` event for real-time UI.
 *   3. Sends e-mail to the target user (or the company's admins), always
 *      with a copy to the platform admins (PLATFORM_ADMIN_EMAILS).
 *
 * A mirror in-app notification is also created for the platform company
 * (PUBLIC_COMPANY_ID) so the AgoraEncontrei admin sees cross-tenant events.
 */

import type { PrismaClient } from '@prisma/client'
import { emitSSE } from './sse.emitter.js'
import { sendEmail, isEmailConfigured } from './email.service.js'
import { env } from '../utils/env.js'

export type NotificationType =
  | 'lead_captured'
  | 'visit_requested'
  | 'broker_handoff'
  | 'proposal_received'
  | 'partner_registered'
  | 'system'

export interface NotifyInput {
  prisma: PrismaClient
  companyId: string
  /** Specific user to target. Omit for a company-wide notification. */
  userId?: string | null
  type: NotificationType
  title: string
  body: string
  payload?: Record<string, unknown>
  /** Set false to skip the e-mail (in-app + SSE only). Default: true. */
  email?: boolean
}

function emailHtml(title: string, body: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#1B2B5B;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <strong style="font-size:16px">AgoraEncontrei</strong>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px;font-size:18px;color:#111">${title}</h2>
    <p style="margin:0;color:#444;line-height:1.6;white-space:pre-line">${body}</p>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px">
    Notificação automática do sistema AgoraEncontrei.
  </p>
</div>`
}

async function resolveEmailRecipients(
  prisma: PrismaClient,
  companyId: string,
  userId?: string | null,
): Promise<string[]> {
  const emails = new Set<string>()

  // Platform admins always get a copy.
  for (const e of (env.PLATFORM_ADMIN_EMAILS || '').split(',')) {
    const trimmed = e.trim()
    if (trimmed) emails.add(trimmed.toLowerCase())
  }

  if (userId) {
    const u = await prisma.user
      .findUnique({ where: { id: userId }, select: { email: true, settings: true } })
      .catch(() => null)
    const prefs = (u?.settings as Record<string, unknown> | null) ?? {}
    if (u?.email && prefs.notifyEmail !== false) emails.add(u.email.toLowerCase())
  } else {
    const admins = await prisma.user
      .findMany({
        where: { companyId, role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: { not: 'INACTIVE' } },
        select: { email: true },
      })
      .catch(() => [])
    for (const a of admins) if (a.email) emails.add(a.email.toLowerCase())
  }

  return [...emails]
}

export async function notify(input: NotifyInput): Promise<void> {
  const { prisma, companyId, type, title, body } = input
  const userId = input.userId ?? null
  const payload = input.payload ?? {}
  const sendMail = input.email !== false

  // 1 + 2 — persist + real-time SSE
  try {
    const notification = await prisma.notification.create({
      data: { companyId, userId, type, title, body, payload: payload as object },
    })
    emitSSE({
      type: 'notification',
      companyId,
      payload: { id: notification.id, notificationType: type, title, body, ...payload },
    })
  } catch (err) {
    console.error('[notify] failed to persist notification:', (err as Error)?.message)
  }

  // Mirror copy for the platform admin (cross-tenant visibility)
  const platformCompanyId = env.PUBLIC_COMPANY_ID
  if (platformCompanyId && platformCompanyId !== companyId) {
    try {
      await prisma.notification.create({
        data: {
          companyId: platformCompanyId,
          type,
          title,
          body,
          payload: { ...payload, sourceCompanyId: companyId } as object,
        },
      })
      emitSSE({
        type: 'notification',
        companyId: platformCompanyId,
        payload: { notificationType: type, title, body, sourceCompanyId: companyId },
      })
    } catch { /* mirror is best-effort */ }
  }

  // 3 — e-mail
  if (sendMail && isEmailConfigured()) {
    try {
      const recipients = await resolveEmailRecipients(prisma, companyId, userId)
      if (recipients.length) {
        await sendEmail({ to: recipients, subject: title, html: emailHtml(title, body) })
      }
    } catch (err) {
      console.error('[notify] failed to send email:', (err as Error)?.message)
    }
  }
}
