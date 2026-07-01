/**
 * WhatsApp Notify — helper compartilhado para envio de texto simples via
 * Meta Cloud API (graph.facebook.com).
 *
 * Extraído da lógica inline do saas-webhook para ser reutilizado por outros
 * fluxos (recuperação de senha, confirmação de cadastro, etc). Nunca lança:
 * retorna false (e loga) quando não configurado ou em caso de erro, para que
 * quem chama trate o WhatsApp como best-effort.
 */

/**
 * Envia uma mensagem de texto para um número (BR). Normaliza o telefone com o
 * DDI 55 quando ausente. Usa WHATSAPP_TOKEN||WHATSAPP_ACCESS_TOKEN e
 * WHATSAPP_PHONE_ID||WHATSAPP_PHONE_NUMBER_ID. Retorna true em sucesso, false
 * quando não configurado / telefone vazio / erro.
 */
export async function sendWhatsappText(phone: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = (phone || '').replace(/\D/g, '')
    if (!cleanPhone) {
      console.warn('[whatsapp-notify] telefone vazio — mensagem não enviada')
      return false
    }
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      console.warn('[whatsapp-notify] WhatsApp não configurado — mensagem não enviada')
      return false
    }

    const resp = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message, preview_url: false },
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      console.error(`[whatsapp-notify] envio falhou (${resp.status}): ${errText}`)
      return false
    }

    return true
  } catch (e: any) {
    console.error(`[whatsapp-notify] erro ao enviar: ${e?.message || e}`)
    return false
  }
}
