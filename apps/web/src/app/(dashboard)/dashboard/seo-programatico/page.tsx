'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

const API = process.env.NEXT_PUBLIC_API_URL || ''

interface SeoStats {
  cidades: number
  estados: number
  keywords: number
  paginas_total: number
  paginas_publicadas: number
  paginas_rascunho: number
  total_views: number
}

export default function SeoProgramaticoPage() {
  // Every call on this page is an authenticated admin action (import IBGE,
  // publish with AI, etc). The old implementation sent no Authorization
  // header, so the backend always answered with 401 "Invalid or expired
  // token". Now we pull the token from useAuth and attach it to every
  // fetch — stats + actions.
  const { getValidToken } = useAuth()

  const [stats, setStats] = useState<SeoStats | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getValidToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getValidToken])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/seo/stats`, {
        headers: await authHeaders(),
      })
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [authHeaders])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  async function runAction(url: string, label: string) {
    setLoading(label)
    setResult(null)
    try {
      const res = await fetch(`${API}${url}`, {
        method: 'POST',
        headers: await authHeaders(),
      })
      const data = await res.json().catch(() => ({ raw: 'no body' }))
      if (!res.ok) {
        // Surface the status + the exact backend message so the operator
        // knows if it's a 401 (session expired → precisa relogar), 403
        // (sem permissão), 500 (erro interno), etc., instead of all of
        // them looking like a generic "Erro".
        setResult(
          `${label} — HTTP ${res.status} ${res.statusText || ''}\n` +
          JSON.stringify(data, null, 2) + '\n\n' +
          (res.status === 401
            ? '→ Sua sessão expirou. Recarregue a página e faça login novamente.'
            : res.status === 403
            ? '→ Seu usuário não tem permissão para executar esta ação.'
            : '')
        )
      } else {
        setResult(`${label}: ${JSON.stringify(data, null, 2)}`)
        fetchStats()
      }
    } catch (err: any) {
      setResult(`Erro de rede: ${err.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">SEO Programatico</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Estados', stats.estados],
            ['Cidades', stats.cidades],
            ['Keywords', stats.keywords],
            ['Paginas Total', stats.paginas_total],
            ['Publicadas', stats.paginas_publicadas],
            ['Rascunho', stats.paginas_rascunho],
            ['Views Total', stats.total_views],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 uppercase">{String(label)}</p>
              <p className="text-2xl font-bold text-gray-900">{Number(value).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 mb-8">
        <h2 className="text-lg font-semibold">Acoes</h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => runAction('/api/v1/seo/import-ibge', 'Importar IBGE')}
            disabled={loading !== null}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'Importar IBGE' ? 'Importando...' : '1. Importar Cidades IBGE'}
          </button>

          <button
            onClick={() => runAction('/api/v1/seo/keywords/seed', 'Seed Keywords')}
            disabled={loading !== null}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'Seed Keywords' ? 'Populando...' : '2. Popular Keywords (300+)'}
          </button>

          <button
            onClick={() => runAction('/api/v1/seo/pages/generate?limit=100', 'Gerar Paginas')}
            disabled={loading !== null}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {loading === 'Gerar Paginas' ? 'Gerando...' : '3. Gerar Paginas (100 cidades)'}
          </button>

          <button
            onClick={() => runAction('/api/v1/seo/pages/publish-batch?limit=5000', 'Publicar Batch')}
            disabled={loading !== null}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {loading === 'Publicar Batch' ? 'Publicando...' : '4. Publicar Batch (sem IA)'}
          </button>

          <button
            onClick={() => runAction('/api/v1/seo/pages/publish-ai?limit=10', 'Publicar IA')}
            disabled={loading !== null}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {loading === 'Publicar IA' ? 'Gerando conteudo IA...' : '5. Publicar com IA (10 paginas)'}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Ordem recomendada: 1 → 2 → 3 → 4 (publicacao rapida) ou 5 (conteudo IA).
          Para escalar: aumente o limit nos endpoints.
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      {/* Guide */}
      <div className="mt-8 bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Guia de Operacao</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>Passo 1:</strong> Importar cidades do IBGE (5.570 municipios). Roda uma vez.</p>
          <p><strong>Passo 2:</strong> Popular keywords (300+ termos imobiliarios). Roda uma vez.</p>
          <p><strong>Passo 3:</strong> Gerar paginas base = keywords x cidades. Use limit para controlar volume.</p>
          <p><strong>Passo 4:</strong> Publicar batch = publicar paginas com intro pre-gerado (rapido, sem IA).</p>
          <p><strong>Passo 5:</strong> Publicar com IA = gera conteudo unico via Claude/GPT (mais lento, melhor qualidade).</p>
          <p className="mt-4 text-gray-800 font-medium">
            Estrategia anti-ban: publique 5.000 paginas/dia max. Escale gradualmente.
            Comece pelas capitais e cidades grandes, depois interior.
          </p>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Endpoints da API</h3>
          <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1">
            <p>POST /api/v1/seo/import-ibge</p>
            <p>POST /api/v1/seo/keywords/seed</p>
            <p>POST /api/v1/seo/pages/generate?limit=100&estado=SP</p>
            <p>POST /api/v1/seo/pages/publish-batch?limit=1000</p>
            <p>POST /api/v1/seo/pages/publish-ai?limit=10</p>
            <p>GET  /api/v1/seo/pages/:slug</p>
            <p>GET  /api/v1/seo/pages?page=1&limit=50&status=publicado&estado=SP</p>
            <p>GET  /api/v1/seo/sitemap/pages.xml?page=1</p>
            <p>GET  /api/v1/seo/sitemap/index.xml</p>
            <p>GET  /api/v1/seo/stats</p>
          </div>
        </div>
      </div>
    </div>
  )
}
