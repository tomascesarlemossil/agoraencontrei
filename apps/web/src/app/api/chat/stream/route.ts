import { NextRequest } from 'next/server'
import { buildTomasSystemPrompt } from '@agoraencontrei/tomas-knowledge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Vercel serverless timeout: 60s no Pro plan, 25s no Hobby.
// Streaming mantém a conexão viva, mas precisamos do maxDuration
// para que o Vercel não mate a function antes do stream completar.
export const maxDuration = 60

/**
 * System prompt unificado — carregado do pacote compartilhado
 * @agoraencontrei/tomas-knowledge para evitar duplicação entre Fastify e Next.
 */
const SYSTEM_PROMPT = buildTomasSystemPrompt()

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

/**
 * app/api/chat/stream/route.ts
 *
 * Stream de texto do Tomás — usado pelo ChatPage (chat premium do
 * dashboard).
 *
 * Estratégia de resolução (em ordem de prioridade):
 *
 *   1. **Anthropic (Claude)** direto do Vercel quando
 *      ANTHROPIC_API_KEY está setada. Usa streaming nativo da API
 *      Anthropic (/v1/messages com stream:true). Isso é o mesmo
 *      modelo que o Tomás público usa no backend Fastify — unifica
 *      provider, elimina necessidade de OPENAI_API_KEY separada, e
 *      mantém o mesmo tom/personalidade.
 *
 *   2. **Proxy para o Fastify** quando ANTHROPIC_API_KEY não está no
 *      Vercel. Faz POST no backend /api/v1/tomas/chat e converte a
 *      resposta JSON completa num single-chunk — não é streaming
 *      verdadeiro, mas pelo menos não quebra com timeout.
 *
 * O antigo endpoint fazia fetch na OpenAI Responses API com modelo
 * "gpt-5" (inexistente) e formato de input errado, resultando em
 * "Stream idle timeout - partial response received" 100% das vezes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({ messages: [] })) as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }
    const { messages } = body

    if (!messages?.length) {
      return new Response('Nenhuma mensagem enviada.', { status: 400 })
    }

    // ── Strategy 1: Anthropic streaming direto ────────────────────────────
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (anthropicKey) {
      return streamFromAnthropic(anthropicKey, messages)
    }

    // ── Strategy 2: proxy para Fastify (non-streaming fallback) ──────────
    return proxyToFastify(messages)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno.'
    console.error('[chat/stream] error:', message)
    return new Response(message, { status: 500 })
  }
}

// ── Anthropic streaming ──────────────────────────────────────────────────────

async function streamFromAnthropic(
  apiKey: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<Response> {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      stream: true,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
    // 55s cap — leaves 5s for Vercel to flush the response. Without
    // this a stalled Anthropic connection would produce the exact
    // "stream idle timeout" the user reported.
    signal: AbortSignal.timeout(55_000),
  })

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => 'empty body')
    console.error('[chat/stream] Anthropic non-OK:', upstream.status, text)
    return new Response(
      `Erro do servidor de IA (${upstream.status}). Tente novamente em instantes.`,
      { status: 502 },
    )
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

              // Anthropic streaming events:
              //   content_block_delta → delta.text contains the new chunk
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(encoder.encode(parsed.delta.text))
              }
            } catch {
              // Non-JSON SSE lines (event:, etc.) — ignore silently.
            }
          }
        }
      } catch (err) {
        // AbortError from the 55s timeout or a broken pipe from Vercel
        // — flush whatever we have and close cleanly instead of crashing.
        console.error('[chat/stream] stream read error:', err)
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
      'X-Accel-Buffering': 'no', // tell Nginx/proxies not to buffer
    },
  })
}

// ── Fastify fallback (non-streaming) ─────────────────────────────────────────

async function proxyToFastify(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<Response> {
  try {
    const res = await fetch(`${API_URL}/api/v1/tomas/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        channel: 'dashboard',
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return new Response(
        `Erro do servidor (${res.status}): ${text || 'sem detalhe'}`,
        { status: 502 },
      )
    }

    const data = await res.json() as { message?: string }
    const text = data.message || 'Desculpe, não consegui processar sua mensagem.'

    // Return as a single-chunk "stream" — the ChatPage just concatenates
    // all chunks anyway, so a single block works fine.
    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (err: any) {
    console.error('[chat/stream] Fastify proxy failed:', err.message)
    return new Response(
      err.name === 'TimeoutError'
        ? 'O servidor demorou demais para responder. Tente novamente.'
        : `Erro de conexão com o servidor: ${err.message}`,
      { status: 502 },
    )
  }
}
