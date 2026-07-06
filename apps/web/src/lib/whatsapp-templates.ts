/**
 * WhatsApp click-to-chat helpers + modelos de mensagem para visitas.
 *
 * Estes modelos são para o envio manual de 1 clique (link `wa.me`), que abre o
 * WhatsApp do corretor com a mensagem já escrita para o cliente. Não dependem de
 * template aprovado no Meta — funcionam para qualquer número, na hora.
 */

/** Normaliza um telefone brasileiro para o formato do wa.me (só dígitos, com DDI 55). */
export function normalizeBrPhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  // Evita duplicar o DDI quando o número já vem com 55.
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

/** Monta o link wa.me (click-to-chat) com a mensagem pré-preenchida. */
export function buildWaLink(phone: string | null | undefined, message: string): string {
  const dest = normalizeBrPhone(phone)
  return `https://wa.me/${dest}?text=${encodeURIComponent(message)}`
}

/** Primeiro nome, para deixar a mensagem pessoal. */
function firstName(name: string | null | undefined): string {
  const n = (name ?? '').trim()
  if (!n) return 'tudo bem'
  return n.split(/\s+/)[0]
}

/** Ex.: "sábado, 18/07 às 10:30". Aceita ISO string ou Date. */
function formatVisitDate(scheduledAt: string | Date | null | undefined): string {
  if (!scheduledAt) return ''
  const d = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt
  if (isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${day} às ${time}`
}

export interface VisitMessageInput {
  visitorName: string | null | undefined
  propertyTitle: string | null | undefined
  scheduledAt: string | Date | null | undefined
}

export type VisitTemplateKey = 'confirm' | 'reminder' | 'reschedule'

/** Mensagem de confirmação — enviada logo após o agendamento. */
export function visitConfirmationMsg(i: VisitMessageInput): string {
  const first = firstName(i.visitorName)
  const prop = i.propertyTitle?.trim() || 'o imóvel'
  const when = formatVisitDate(i.scheduledAt)
  return [
    `Olá ${first}! 👋 Tudo bem?`,
    ``,
    `Estou confirmando sua visita:`,
    ``,
    `🏡 *${prop}*`,
    when ? `📅 ${when}` : ``,
    ``,
    `Consigo confirmar esse horário com você? Qualquer coisa, é só me chamar por aqui. 😊`,
  ].filter(Boolean).join('\n')
}

/** Mensagem de lembrete — reforço no dia/véspera da visita. */
export function visitReminderMsg(i: VisitMessageInput): string {
  const first = firstName(i.visitorName)
  const prop = i.propertyTitle?.trim() || 'o imóvel'
  const when = formatVisitDate(i.scheduledAt)
  return [
    `Oi ${first}! 👋 Passando para lembrar da sua visita:`,
    ``,
    `🏡 *${prop}*`,
    when ? `📅 ${when}` : ``,
    ``,
    `Nos vemos lá! Se precisar remarcar, é só me avisar. 🙌`,
  ].filter(Boolean).join('\n')
}

/** Mensagem de reagendamento — quando o horário precisa mudar. */
export function visitRescheduleMsg(i: VisitMessageInput): string {
  const first = firstName(i.visitorName)
  const prop = i.propertyTitle?.trim() || 'o imóvel'
  const when = formatVisitDate(i.scheduledAt)
  return [
    `Olá ${first}! Precisamos ajustar o horário da sua visita${when ? ` (${when})` : ''}:`,
    ``,
    `🏡 *${prop}*`,
    ``,
    `Qual outro dia e horário ficam melhores para você? 🗓️`,
  ].filter(Boolean).join('\n')
}

export interface VisitTemplate {
  key: VisitTemplateKey
  label: string
  build: (i: VisitMessageInput) => string
}

/** Modelos disponíveis, na ordem de uso mais comum. */
export const VISIT_TEMPLATES: VisitTemplate[] = [
  { key: 'confirm', label: 'Confirmar visita', build: visitConfirmationMsg },
  { key: 'reminder', label: 'Lembrete', build: visitReminderMsg },
  { key: 'reschedule', label: 'Reagendar', build: visitRescheduleMsg },
]
