'use client'

import { useState, useEffect, useCallback } from 'react'
import { Webhook, Loader2, Plus, Trash2, Copy, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Hook {
  id: string; url: string; events: string[]; isActive: boolean
  lastFiredAt: string | null; failCount: number
}

const EVENT_LABEL: Record<string, string> = {
  'lead.created': 'Lead criado',
  'property.created': 'Imóvel publicado',
  'deal.payment_received': 'Sinal pago',
}

export function WebhooksSection() {
  const { getValidToken } = useAuth()
  const [hooks, setHooks] = useState<Hook[]>([])
  const [available, setAvailable] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')

  const token = useCallback(async () => {
    const t = await getValidToken()
    if (!t) throw new Error('Sessão expirada.')
    return t
  }, [getValidToken])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks`, {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const j = await res.json()
      setHooks(j.data ?? [])
      setAvailable(j.availableEvents ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  async function create() {
    if (!url.trim() || events.length === 0) return
    setBusy(true); setErr('')
    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.message || j.error || 'Falha ao criar')
      setSecret(j.data.secret)
      setUrl(''); setEvents([])
      await load()
    } catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }

  async function remove(id: string) {
    if (!confirm('Remover este webhook?')) return
    try {
      await fetch(`${API_URL}/api/v1/webhooks/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${await token()}` },
      })
      await load()
    } catch { /* ignore */ }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Webhook size={18} className="text-amber-400" />
        <h2 className="font-semibold">Webhooks de saída</h2>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Receba um POST assinado (HMAC-SHA256, header <code className="text-amber-300">x-agoraencontrei-signature</code>)
        no seu sistema quando um evento acontecer.
      </p>

      {secret && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold text-amber-200">Segredo do webhook — copie agora</p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-gray-950 px-2 py-1.5 text-xs text-emerald-300">{secret}</code>
            <button
              onClick={() => { navigator.clipboard?.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="flex items-center gap-1 rounded bg-amber-600 px-2 py-1.5 text-xs text-white hover:bg-amber-500"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <button onClick={() => setSecret(null)} className="mt-1.5 text-xs text-amber-200/60 hover:text-amber-200">
            Já guardei — fechar
          </button>
        </div>
      )}

      {/* Create */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-800 bg-gray-900/50 p-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">URL do endpoint</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://seu-sistema.com/webhooks/agoraencontrei"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {available.map(ev => (
            <label key={ev} className="flex items-center gap-1.5 text-xs text-gray-300">
              <input type="checkbox" checked={events.includes(ev)}
                onChange={() => setEvents(s => s.includes(ev) ? s.filter(x => x !== ev) : [...s, ev])}
                className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-900 accent-amber-500" />
              {EVENT_LABEL[ev] ?? ev}
            </label>
          ))}
        </div>
        <button onClick={create} disabled={busy || !url.trim() || events.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Adicionar
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-amber-400" /></div>
      ) : hooks.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">Nenhum webhook configurado.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {hooks.map(h => (
            <div key={h.id} className="flex items-center justify-between rounded-lg border border-gray-800 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{h.url}</p>
                <p className="text-xs text-gray-500">
                  {h.events.map(e => EVENT_LABEL[e] ?? e).join(', ')}
                  {h.failCount > 0 && <span className="text-red-400"> · {h.failCount} falha(s)</span>}
                </p>
              </div>
              <button onClick={() => remove(h.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
