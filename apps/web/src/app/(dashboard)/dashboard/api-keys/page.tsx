'use client'

import { useState, useEffect, useCallback } from 'react'
import { KeyRound, Loader2, Plus, Trash2, Copy, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { WebhooksSection } from './WebhooksSection'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const SCOPES: [string, string][] = [
  ['properties:read', 'Ler imóveis'],
  ['leads:write', 'Criar leads'],
]

interface ApiKey {
  id: string; name: string; prefix: string; scopes: string[]
  isActive: boolean; lastUsedAt: string | null; createdAt: string
}

export default function ApiKeysPage() {
  const { getValidToken } = useAuth()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['properties:read'])
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')

  const token = useCallback(async () => {
    const t = await getValidToken()
    if (!t) throw new Error('Sessão expirada.')
    return t
  }, [getValidToken])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/api-keys`, {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const j = await res.json()
      setKeys(j.data ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  async function createKey() {
    if (name.trim().length < 2 || scopes.length === 0) return
    setBusy(true); setToast('')
    try {
      const res = await fetch(`${API_URL}/api/v1/api-keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scopes }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.message || j.error || 'Falha ao criar')
      setSecret(j.data.secret)
      setName('')
      await load()
    } catch (e) { setToast((e as Error).message) }
    finally { setBusy(false) }
  }

  async function revoke(id: string) {
    if (!confirm('Revogar esta chave? Aplicações que a usam deixarão de funcionar.')) return
    try {
      await fetch(`${API_URL}/api/v1/api-keys/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${await token()}` },
      })
      await load()
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <KeyRound size={24} className="text-amber-400" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">AgoraEncontrei Open API</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Chaves de API para parceiros integrarem imóveis e leads
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 space-y-5">
        {/* Secret reveal */}
        {secret && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-200">Chave criada — copie agora</p>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Este é o único momento em que o segredo é exibido. Guarde-o com segurança.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-gray-950 px-3 py-2 text-xs text-emerald-300">{secret}</code>
              <button
                onClick={() => { navigator.clipboard?.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="flex items-center gap-1 rounded-md bg-amber-600 px-3 py-2 text-xs text-white hover:bg-amber-500"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <button onClick={() => setSecret(null)} className="mt-2 text-xs text-amber-200/60 hover:text-amber-200">
              Já guardei — fechar
            </button>
          </div>
        )}

        {/* Create */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Nova chave</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-500 mb-1">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Integração Portal X"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none" />
            </div>
            <div className="flex gap-3">
              {SCOPES.map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-xs text-gray-300">
                  <input type="checkbox" checked={scopes.includes(v)}
                    onChange={() => setScopes(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])}
                    className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-900 accent-amber-500" />
                  {l}
                </label>
              ))}
            </div>
            <button onClick={createKey} disabled={busy || name.trim().length < 2 || scopes.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
            </button>
          </div>
          {toast && <p className="mt-2 text-xs text-red-400">{toast}</p>}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : keys.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">Nenhuma chave criada.</p>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/60 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Prefixo</th>
                  <th className="px-3 py-2">Escopos</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {keys.map(k => (
                  <tr key={k.id} className="hover:bg-gray-900/40">
                    <td className="px-3 py-2 text-white">{k.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">{k.prefix}…</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{k.scopes.join(', ')}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${k.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-500/15 text-gray-400'}`}>
                        {k.isActive ? 'Ativa' : 'Revogada'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {k.isActive && (
                        <button onClick={() => revoke(k.id)} title="Revogar"
                          className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 text-xs text-gray-400">
          <p className="font-semibold text-gray-300">Como usar</p>
          <p className="mt-1">Envie o header <code className="text-amber-300">x-api-key</code> em cada requisição:</p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-gray-950 p-2 text-[11px] text-emerald-300">{`GET  ${API_URL}/public-api/v1/properties
GET  ${API_URL}/public-api/v1/properties/:id
POST ${API_URL}/public-api/v1/leads`}</pre>
        </div>

        <WebhooksSection />
      </div>
    </div>
  )
}
