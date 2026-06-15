import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { env } from '../utils/env.js'

// Origens fixas sempre permitidas.
const STATIC_ORIGINS = new Set(
  [
    env.WEB_URL,
    'https://www.agoraencontrei.com.br',
    'https://agoraencontrei.com.br',
    'https://agoraencontrei.vercel.app',
  ].filter(Boolean) as string[],
)

// Domínios customizados de tenants (ex.: www.joaoimoveis.com.br). Carregado do
// banco após o Prisma estar pronto e atualizado periodicamente — sem isso a
// busca por voz / chat / qualquer POST do browser falha com "Load failed" nos
// sites de cliente, porque o CORS não devolve Access-Control-Allow-Origin.
const customDomainHosts = new Set<string>()

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

function isAllowedOrigin(origin?: string): boolean {
  // Requisições sem Origin (server-to-server, curl, same-origin) — libera.
  if (!origin) return true
  if (STATIC_ORIGINS.has(origin)) return true

  let host: string
  let protocol: string
  try {
    const url = new URL(origin)
    host = url.hostname.toLowerCase()
    protocol = url.protocol
  } catch {
    return false
  }
  if (protocol !== 'https:' && protocol !== 'http:') return false

  // Domínio principal e QUALQUER subdomínio de tenant (slug.agoraencontrei.com.br).
  if (host === 'agoraencontrei.com.br' || host.endsWith('.agoraencontrei.com.br')) return true
  // Previews/deploys da Vercel.
  if (host.endsWith('.vercel.app')) return true
  // Desenvolvimento local.
  if (host === 'localhost' || host === '127.0.0.1') return true
  // Domínios próprios dos tenants.
  if (customDomainHosts.has(host)) return true

  return false
}

export default fp(async (app: FastifyInstance) => {
  async function refreshCustomDomains() {
    try {
      if (!app.prisma) return
      const tenants = await app.prisma.tenant.findMany({
        where: { isActive: true, customDomain: { not: null } },
        select: { customDomain: true },
      })
      customDomainHosts.clear()
      for (const t of tenants) {
        if (!t.customDomain) continue
        const h = normalizeHost(t.customDomain)
        if (!h) continue
        const bare = h.replace(/^www\./, '')
        customDomainHosts.add(bare)
        customDomainHosts.add(`www.${bare}`)
      }
    } catch (err) {
      app.log.warn({ err }, '[cors] falha ao carregar customDomains dos tenants')
    }
  }

  // Prisma é registrado depois do CORS — carrega quando tudo estiver pronto e
  // revalida a cada 10 min para pegar novos domínios sem precisar de redeploy.
  app.addHook('onReady', async () => { await refreshCustomDomains() })
  const timer = setInterval(refreshCustomDomains, 10 * 60 * 1000)
  if (typeof timer.unref === 'function') timer.unref()

  await app.register(fastifyCors, {
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-ID'],
  })
})
