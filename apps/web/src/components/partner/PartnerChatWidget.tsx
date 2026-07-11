'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, MessageCircle, Send, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export function PartnerChatWidget({ tenantSlug, partnerName, propertyId, offsetForTomas = false }: { tenantSlug: string; partnerName: string; propertyId?: string; offsetForTomas?: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [visitorId, setVisitorId] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', consent: false })

  useEffect(() => {
    const key = 'ae_partner_visitor_id'
    const existing = localStorage.getItem(key)
    const id = existing || crypto.randomUUID()
    if (!existing) localStorage.setItem(key, id)
    setVisitorId(id)
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/v1/public/partner-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantSlug, visitorId, propertyId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || 'Não foi possível enviar sua mensagem.')
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar sua mensagem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`fixed right-5 z-50 ${offsetForTomas ? 'bottom-24' : 'bottom-5'}`}>
      {open && (
        <div className="mb-3 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-gray-950 px-4 py-3 text-white">
            <div><p className="text-sm font-bold">Fale com {partnerName}</p><p className="text-xs text-white/60">Atendimento da imobiliária</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar atendimento"><X className="h-5 w-5" /></button>
          </header>
          {sent ? (
            <div className="p-6 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" /><p className="mt-3 font-bold text-gray-900">Mensagem enviada</p><p className="mt-1 text-sm text-gray-600">A equipe recebeu seu contato e responderá em breve.</p></div>
          ) : (
            <form onSubmit={submit} className="space-y-3 p-4">
              <input required value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} placeholder="Seu nome" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              <input required value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} placeholder="WhatsApp com DDD" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              <input type="email" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} placeholder="E-mail (opcional)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              <textarea required rows={3} value={form.message} onChange={e => setForm(v => ({ ...v, message: e.target.value }))} placeholder="Como podemos ajudar?" className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              <label className="flex items-start gap-2 text-xs leading-relaxed text-gray-600"><input required type="checkbox" checked={form.consent} onChange={e => setForm(v => ({ ...v, consent: e.target.checked }))} className="mt-0.5 h-4 w-4" /><span>Autorizo o envio destes dados para {partnerName} e o contato pelo WhatsApp. Posso revogar a autorização.</span></label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Enviar para a equipe</button>
            </form>
          )}
        </div>
      )}
      <button type="button" onClick={() => setOpen(value => !value)} aria-label={`Falar com ${partnerName}`} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl hover:bg-emerald-600"><MessageCircle className="h-6 w-6" /></button>
    </div>
  )
}
