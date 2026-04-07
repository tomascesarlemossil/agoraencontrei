/**
 * Email Service — nodemailer with SMTP
 * Supports any SMTP provider: Gmail, SendGrid, Mailgun, etc.
 * Configure via: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
import nodemailer from 'nodemailer'
import { env } from '../utils/env.js'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface BulkEmailOptions {
  recipients: string[]
  subject: string
  html: string
  text?: string
  batchSize?: number
  delayMs?: number
  onProgress?: (sent: number, total: number) => void
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Build transporter once (lazy — only when SMTP is configured)
let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null

  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  })
  return _transporter
}

export function isEmailConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM)
}

export async function sendEmail(opts: SendEmailOptions): Promise<EmailResult> {
  const transporter = getTransporter()
  if (!transporter) {
    return { success: false, error: 'SMTP_NOT_CONFIGURED' }
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? stripHtml(opts.html),
      replyTo: opts.replyTo,
    })
    return { success: true, messageId: info.messageId }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'SMTP_ERROR' }
  }
}

/**
 * Send bulk emails in batches to avoid rate limits.
 * Processes `batchSize` recipients per batch with `delayMs` between batches.
 */
export async function sendBulkEmail(opts: BulkEmailOptions): Promise<{ sent: number; failed: number }> {
  const {
    recipients,
    subject,
    html,
    text,
    batchSize = 50,
    delayMs = 1000,
    onProgress,
  } = opts

  if (!isEmailConfigured()) {
    return { sent: 0, failed: recipients.length }
  }

  let sent = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    for (const email of batch) {
      const result = await sendEmail({ to: email, subject, html, text })
      if (result.success) sent++
      else failed++
    }
    onProgress?.(sent, recipients.length)
    if (i + batchSize < recipients.length) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  return { sent, failed }
}

/**
 * Build HTML template for marketing campaigns
 */
export function buildCampaignHtml(opts: {
  companyName: string
  companyLogo?: string
  mensagem: string
  nomeCampanha: string
  unsubscribeUrl?: string
}): string {
  const { companyName, companyLogo, mensagem, nomeCampanha, unsubscribeUrl } = opts
  const mensagemHtml = mensagem.replace(/\n/g, '<br />')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${nomeCampanha}</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #1B2B5B; padding: 24px 32px; text-align: center; }
    .header img { height: 48px; max-width: 200px; object-fit: contain; }
    .header h1 { color: #C9A84C; font-size: 20px; margin: 12px 0 0; }
    .body { padding: 32px; color: #333; font-size: 15px; line-height: 1.7; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { background: #1B2B5B; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; }
    .footer { padding: 20px 32px; background: #f9f9f9; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
    .footer a { color: #1B2B5B; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" />` : `<h2 style="color:#C9A84C;margin:0">${companyName}</h2>`}
      <h1>${nomeCampanha}</h1>
    </div>
    <div class="body">
      ${mensagemHtml}
    </div>
    <div class="cta">
      <a href="https://agoraencontrei.vercel.app/imoveis">Ver Imóveis Disponíveis</a>
    </div>
    <div class="footer">
      <p>${companyName} | Franca — SP | <a href="https://wa.me/5516981010004">(16) 98101-0004</a></p>
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Cancelar inscrição</a></p>` : ''}
    </div>
  </div>
</body>
</html>`
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
