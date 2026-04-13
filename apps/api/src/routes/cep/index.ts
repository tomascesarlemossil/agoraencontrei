import type { FastifyInstance } from 'fastify'

// ── Response shapes dos provedores públicos de CEP ─────────────────────────
// ViaCEP: https://viacep.com.br/ws/{cep}/json/  — campos em português
// BrasilAPI v2: https://brasilapi.com.br/api/cep/v2/{cep} — campos em inglês
interface ViaCepResponse {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
  [k: string]: unknown
}

interface BrasilApiResponse {
  cep?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  [k: string]: unknown
}

export default async function cepRoutes(app: FastifyInstance) {
  // GET /api/v1/cep/:cep — Proxy para ViaCEP (evita CORS no browser)
  app.get('/:cep', async (req, reply) => {
    const { cep } = req.params as { cep: string }
    const digits = cep.replace(/\D/g, '')

    if (digits.length !== 8) {
      return reply.status(400).send({ error: 'CEP_INVALID', message: 'CEP deve ter 8 dígitos' })
    }

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })

      if (!res.ok) {
        // Fallback: tentar BrasilAPI
        const res2 = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        }).catch(() => null)

        if (res2 && res2.ok) {
          const data2 = await res2.json() as BrasilApiResponse
          return reply.send({
            cep: data2.cep,
            logradouro: data2.street || '',
            bairro: data2.neighborhood || '',
            localidade: data2.city || '',
            uf: data2.state || '',
            source: 'brasilapi',
          })
        }

        return reply.status(404).send({ error: 'CEP_NOT_FOUND' })
      }

      const data = await res.json() as ViaCepResponse

      if (data.erro) {
        // Fallback: tentar BrasilAPI
        const res2 = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        }).catch(() => null)

        if (res2 && res2.ok) {
          const data2 = await res2.json() as BrasilApiResponse
          return reply.send({
            cep: data2.cep,
            logradouro: data2.street || '',
            bairro: data2.neighborhood || '',
            localidade: data2.city || '',
            uf: data2.state || '',
            source: 'brasilapi',
          })
        }

        return reply.status(404).send({ error: 'CEP_NOT_FOUND' })
      }

      return reply.send({ ...data, source: 'viacep' })
    } catch (err: any) {
      // Se ViaCEP falhar (timeout, etc), tentar BrasilAPI
      try {
        const res2 = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        })

        if (res2.ok) {
          const data2 = await res2.json() as BrasilApiResponse
          return reply.send({
            cep: data2.cep,
            logradouro: data2.street || '',
            bairro: data2.neighborhood || '',
            localidade: data2.city || '',
            uf: data2.state || '',
            source: 'brasilapi',
          })
        }
      } catch { /* ignore */ }

      return reply.status(502).send({
        error: 'CEP_SERVICE_UNAVAILABLE',
        message: 'Serviço de CEP temporariamente indisponível',
      })
    }
  })
}
