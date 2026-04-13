import { NextRequest } from 'next/server'
import { buildTomasSystemPrompt } from '@agoraencontrei/tomas-knowledge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-5'

/**
 * System prompt unificado — carregado do pacote compartilhado
 * @agoraencontrei/tomas-knowledge para evitar duplicação entre Fastify e Next.
 */
const SYSTEM_PROMPT = buildTomasSystemPrompt()

/**
 * app/api/chat/stream/route.ts
 *
 * Versão premium: consome a Responses API da OpenAI via fetch direto, parseia
 * eventos SSE do upstream e devolve para o frontend um stream de texto puro
 * (sem NDJSON, sem SSE). Assim o ChatPage pode simplesmente concatenar os
 * chunks e empurrá-los para o TomasVoiceController.
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('OPENAI_API_KEY não configurada', { status: 500 })
    }

    const { messages } = (await request.json().catch(() => ({ messages: [] }))) as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
          },
          ...messages.map((message) => ({
            role: message.role,
            content: [{ type: 'input_text', text: message.content }],
          })),
        ],
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text()
      return new Response(`Falha no stream upstream: ${text}`, { status: 500 })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader()
        let buffer = ''

        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const data = trimmed.slice(5).trim()
              if (!data || data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const text =
                  parsed?.type === 'response.output_text.delta'
                    ? parsed.delta
                    : parsed?.type === 'response.output_text.done'
                      ? ''
                      : ''

                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // ignora linhas que não sejam eventos JSON válidos
              }
            }
          }
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno.'
    return new Response(message, { status: 500 })
  }
}
