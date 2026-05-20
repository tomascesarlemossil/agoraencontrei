'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface ProposalEvent {
  id: string
  type: string
  actorType: string | null
  value: string | null
  note: string | null
  createdAt: string
}

interface PublicProposal {
  id: string
  status: string
  offerValue: string
  paymentMethod: string | null
  downPayment: string | null
  financingAmount: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  property: { title: string; slug: string | null; neighborhood: string | null; city: string | null; coverImage: string | null } | null
  events: ProposalEvent[]
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Rascunho',
  sent:      'Em análise',
  countered: 'Contra-proposta',
  accepted:  'Aceita',
  rejected:  'Recusada',
  expired:   'Expirada',
}
const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-gray-200 text-gray-700',
  sent:      'bg-blue-100 text-blue-800',
  countered: 'bg-amber-100 text-amber-800',
  accepted:  'bg-emerald-100 text-emerald-800',
  rejected:  'bg-red-100 text-red-800',
  expired:   'bg-gray-100 text-gray-500',
}

const STEPS = [
  { key: 'sent', label: 'Proposta enviada' },
  { key: 'countered', label: 'Em negociação' },
  { key: 'accepted', label: 'Aceita' },
]

function stepIndex(status: string): number {
  if (status === 'accepted') return 2
  if (status === 'countered') return 1
  if (status === 'rejected' || status === 'expired') return -1
  return 0
}

function fmtBRL(v: string | null) {
  if (!v) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PublicProposalPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PublicProposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/api/v1/public/proposals/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('not_found')))
      .then(j => { if (!cancelled) setData(j) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4] text-[#1B2B5B]">Carregando…</main>
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-[#1B2B5B]">Proposta não encontrada</h1>
          <p className="mt-2 text-sm text-gray-600">O link expirou ou está incorreto.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-[#1B2B5B] px-5 py-2.5 text-sm font-medium text-white">Voltar ao site</Link>
        </div>
      </main>
    )
  }

  const currentStep = stepIndex(data.status)
  const isRejected = data.status === 'rejected' || data.status === 'expired'
  const value = fmtBRL(data.offerValue)
  const down = fmtBRL(data.downPayment)
  const fin = fmtBRL(data.financingAmount)
  const location = [data.property?.neighborhood, data.property?.city].filter(Boolean).join(', ')

  return (
    <main className="min-h-screen bg-[#f9f7f4] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-[#C9A84C] font-semibold">Imobiliária Lemos</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[data.status] ?? STATUS_COLOR.sent}`}>
              {STATUS_LABEL[data.status] ?? data.status}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-[#1B2B5B]">Sua proposta</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enviada em {fmtDateTime(data.createdAt)}
          </p>

          {data.property && (
            <div className="mt-4 flex gap-3 rounded-xl border border-gray-100 p-3">
              {data.property.coverImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={data.property.coverImage} alt={data.property.title}
                  className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1B2B5B] truncate">{data.property.title}</p>
                {location && <p className="text-xs text-gray-500 mt-0.5">{location}</p>}
                {data.property.slug && (
                  <Link href={`/imoveis/${data.property.slug}`} className="text-xs text-[#1B2B5B] underline">
                    Ver imóvel →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Valor */}
          <div className="mt-4 rounded-xl bg-[#f9f7f4] p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Valor proposto</p>
            <p className="mt-1 text-3xl font-bold text-[#1B2B5B]">{value ?? '—'}</p>
            {(down || fin) && (
              <div className="mt-2 flex justify-center gap-4 text-xs text-gray-600">
                {down && <span>Entrada {down}</span>}
                {fin && <span>Financ. {fin}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-sm font-semibold text-[#1B2B5B]">Status da negociação</h2>
          {isRejected ? (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-center">
              <p className="text-sm font-semibold text-red-700">
                {data.status === 'expired' ? 'Sua proposta expirou.' : 'Sua proposta foi recusada.'}
              </p>
              <p className="mt-1 text-xs text-red-600">Que tal explorar outras opções com nosso time?</p>
              <Link href="/imoveis" className="mt-3 inline-block rounded-lg bg-[#1B2B5B] px-4 py-2 text-xs font-medium text-white">
                Ver outros imóveis
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between">
              {STEPS.map((step, i) => {
                const done = i <= currentStep
                const isActive = i === currentStep
                return (
                  <div key={step.key} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                        done ? 'bg-[#C9A84C] text-[#1B2B5B]' : 'bg-gray-200 text-gray-400'
                      } ${isActive ? 'ring-4 ring-[#C9A84C]/30' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <p className={`mt-2 text-[10px] font-medium ${done ? 'text-[#1B2B5B]' : 'text-gray-400'}`}>{step.label}</p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 ${i < currentStep ? 'bg-[#C9A84C]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Timeline */}
        {data.events.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-sm font-semibold text-[#1B2B5B]">Histórico</h2>
            <ol className="mt-4 space-y-3">
              {data.events.slice().reverse().map(ev => (
                <li key={ev.id} className="flex gap-3 border-l-2 border-[#C9A84C] pl-3 py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1B2B5B]">
                      {STATUS_LABEL[ev.type] ?? ev.type}
                      {ev.actorType && (
                        <span className="ml-2 font-normal text-gray-500">
                          · {ev.actorType === 'buyer' ? 'Cliente' : ev.actorType === 'broker' ? 'Corretor' : ev.actorType === 'seller' ? 'Proprietário' : 'Sistema'}
                        </span>
                      )}
                    </p>
                    {ev.value && <p className="text-xs text-gray-600 mt-0.5">{fmtBRL(ev.value)}</p>}
                    {ev.note && <p className="text-xs text-gray-700 mt-0.5">{ev.note}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{fmtDateTime(ev.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400">
          Sua proposta é confidencial e visível apenas para você e nossa equipe.
        </p>
      </div>
    </main>
  )
}
