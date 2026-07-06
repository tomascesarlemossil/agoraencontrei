/**
 * Camada de provider de envio — a integração real fica ISOLADA aqui.
 *
 * No MVP o provider padrão é o `SimulatedProvider`: ele NÃO envia nada, apenas
 * devolve um id fake e um status determinístico. A integração oficial (Meta
 * WhatsApp Cloud API ou provedor parceiro autorizado) implementa a mesma
 * interface e só é ativada quando `WA_CAMPAIGNS_LIVE=true` e as credenciais
 * existem. Nenhuma automação de navegador/WhatsApp Web é usada.
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../../utils/env.js'
import { getIntegrationConfig } from '../integration-config.service.js'
import { whatsappService } from '../whatsapp.service.js'

export interface SendMessageInput {
  to: string // E.164
  /** Corpo já renderizado (variáveis substituídas). */
  body: string
  /** Nome do template WABA aprovado, quando houver. */
  templateName?: string
  templateLang?: string
  /** Componentes do template (parâmetros) já montados, quando aplicável. */
  templateComponents?: unknown[]
}

export interface SendMessageResult {
  providerMessageId: string
  status: 'SENT' | 'FAILED'
  errorMessage?: string
  /** true quando nada foi realmente enviado (modo simulado). */
  simulated: boolean
}

export interface WhatsAppCampaignProvider {
  readonly name: string
  send(input: SendMessageInput): Promise<SendMessageResult>
}

/** Provider simulado — padrão do MVP. Nunca envia mensagem real. */
export class SimulatedProvider implements WhatsAppCampaignProvider {
  readonly name = 'simulated'

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    // Determinístico e sem I/O externo: gera um id fake baseado no destino.
    const stamp = Buffer.from(`${input.to}:${input.body.length}`).toString('base64url').slice(0, 16)
    return {
      providerMessageId: `sim_${stamp}`,
      status: 'SENT',
      simulated: true,
    }
  }
}

/**
 * Provider real (Meta WhatsApp Cloud API). Reutiliza o `whatsappService`
 * existente e as credenciais por tenant (`getIntegrationConfig`). Só é usado
 * quando explicitamente ligado — jamais no MVP.
 */
export class CloudApiProvider implements WhatsAppCampaignProvider {
  readonly name = 'cloud_api'

  constructor(private readonly cfg: { token?: string; phoneId?: string }) {}

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    try {
      // Envio em massa/utility DEVE usar template aprovado (política da Meta).
      const res: any = input.templateName
        ? await whatsappService.sendTemplate(
            input.to,
            input.templateName,
            input.templateLang ?? 'pt_BR',
            (input.templateComponents as unknown[]) ?? [],
            this.cfg,
          )
        : await whatsappService.sendText(input.to, input.body, this.cfg)

      const id = res?.messages?.[0]?.id ?? `wa_${Date.now()}`
      return { providerMessageId: id, status: 'SENT', simulated: false }
    } catch (err: any) {
      return {
        providerMessageId: '',
        status: 'FAILED',
        errorMessage: err?.message ?? 'Falha no envio',
        simulated: false,
      }
    }
  }
}

/**
 * Fábrica de provider. Retorna o simulado a menos que:
 *   1. `WA_CAMPAIGNS_LIVE=true`, e
 *   2. haja credenciais WhatsApp (do tenant ou do ambiente).
 *
 * Isso garante que o MVP nunca dispare mensagens reais mesmo com credenciais
 * presentes, até que o operador ligue a flag conscientemente.
 */
export async function getWaProvider(
  prisma: PrismaClient,
  companyId: string | null | undefined,
): Promise<WhatsAppCampaignProvider> {
  if (env.WA_CAMPAIGNS_LIVE !== 'true') {
    return new SimulatedProvider()
  }
  const cfg = await getIntegrationConfig(prisma, companyId, 'whatsapp').catch(() => ({}) as Record<string, string>)
  const token = cfg.token || env.WHATSAPP_TOKEN
  const phoneId = cfg.phoneId || env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) {
    return new SimulatedProvider()
  }
  return new CloudApiProvider({ token, phoneId })
}

/** Renderiza {{chave}} no corpo da mensagem a partir das variáveis. */
export function renderMessage(body: string, variables: Record<string, unknown>): string {
  return (body || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = variables?.[key]
    return v == null ? '' : String(v)
  })
}
