/**
 * Isenção de cobrança SaaS — fonte única de decisão.
 *
 * A parceira fundadora (Imobiliária Lemos) usa o AgoraEncontrei sem cobrança.
 * A isenção NÃO deve ser espalhada como flags soltas por vários caminhos de
 * billing (checkout, webhook, cron, sync Asaas): centralize aqui.
 *
 * Sinais de isenção (o provisionamento da Lemos grava TODOS):
 *   • plano interno: `plan.metadata.billingExempt === true` (plano "fundador"), ou
 *   • tenant:        `tenant.settings.billingExempt === true`, ou
 *   • company:       `company.settings.billingExempt === true`.
 *
 * Basta UM sinal para isentar (os caminhos de billing nem sempre têm o plano
 * carregado). Para reduzir o risco de uma flag acidental isentar um cliente
 * real, o provisionamento sempre grava os três de forma coerente.
 */

type WithSettings = { settings?: unknown } | null | undefined
type WithMetadata = { metadata?: unknown } | null | undefined

function flag(obj: unknown, key: string): boolean {
  return !!obj && typeof obj === 'object' && (obj as Record<string, unknown>)[key] === true
}

export function isBillingExempt(input: {
  plan?: WithMetadata
  tenant?: WithSettings
  company?: WithSettings
}): boolean {
  const planExempt = flag(input.plan?.metadata, 'billingExempt') || flag(input.plan?.metadata, 'internal')
  const tenantExempt = flag(input.tenant?.settings, 'billingExempt')
  const companyExempt = flag(input.company?.settings, 'billingExempt')
  return planExempt || tenantExempt || companyExempt
}
