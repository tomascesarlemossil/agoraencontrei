/**
 * Sentry — monitoramento de erros (opcional e tolerante a ausência).
 *
 * Projetado para NÃO ser um risco de deploy:
 *  - O pacote `@sentry/node` é carregado por **dynamic import** dentro de
 *    try/catch. Se ele não estiver instalado, o boot segue normal (no-op) —
 *    nada de import estático que derrubaria o `node dist/server.js`.
 *  - Só inicializa quando `SENTRY_DSN` está setada.
 *
 * Para ATIVAR em produção:
 *   1) pnpm --filter @agoraencontrei/api add @sentry/node
 *   2) setar SENTRY_DSN (e, opcional, SENTRY_TRACES_SAMPLE_RATE) no Railway
 */

import { env } from './env.js'

let sentry: any = null

export async function initSentry(app: { log: { info: (m: string) => void; warn: (m: string) => void } }) {
  if (!env.SENTRY_DSN) return

  try {
    // @ts-ignore — dependência opcional; instalada sob demanda (ver doc acima).
    const Sentry = await import('@sentry/node')
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: Number(env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1') || 0,
    })
    sentry = Sentry
    app.log.info('[sentry] monitoramento de erros ativo')
  } catch {
    app.log.warn('[sentry] SENTRY_DSN setada, mas @sentry/node não está instalado — rode `pnpm --filter @agoraencontrei/api add @sentry/node`')
  }
}

/** Envia uma exceção ao Sentry, se ativo. Nunca lança. */
export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!sentry) return
  try {
    if (context) sentry.captureException?.(err, { extra: context })
    else sentry.captureException?.(err)
  } catch {
    /* monitoramento nunca pode derrubar o request */
  }
}

/** Indica se o Sentry foi inicializado com sucesso. */
export function isSentryActive(): boolean {
  return sentry != null
}
