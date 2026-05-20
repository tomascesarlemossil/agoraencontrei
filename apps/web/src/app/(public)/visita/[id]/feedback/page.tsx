'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface VisitInfo {
  id: string
  visitorName: string
  scheduledAt: string
  status: string
  alreadyRated: boolean
  property: { title: string; slug: string | null; neighborhood: string | null; city: string | null } | null
}

export default function PublicVisitFeedbackPage() {
  const { id } = useParams<{ id: string }>()
  const [visit, setVisit] = useState<VisitInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/api/v1/public/visits/${id}/feedback`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('not_found')))
      .then(j => { if (!cancelled) setVisit(j) })
      .catch(() => { if (!cancelled) setError('Visita não encontrada.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  async function submit() {
    if (!rating) { setError('Escolha uma nota de 1 a 5.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/public/visits/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        if (j.error === 'ALREADY_RATED') setError('Você já avaliou esta visita. Obrigado!')
        else if (j.error === 'VISIT_NOT_COMPLETED') setError('Essa visita ainda não foi finalizada.')
        else setError('Não foi possível enviar. Tente novamente.')
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4] text-[#1B2B5B]">Carregando…</main>
  }

  if (error && !visit) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-[#1B2B5B]">Visita não encontrada</h1>
          <p className="mt-2 text-sm text-gray-600">O link expirou ou está incorreto.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-[#1B2B5B] px-5 py-2.5 text-sm font-medium text-white">Voltar ao site</Link>
        </div>
      </main>
    )
  }

  if (done || visit?.alreadyRated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">✓</div>
          <h1 className="mt-4 text-xl font-bold text-[#1B2B5B]">Obrigado pela avaliação!</h1>
          <p className="mt-2 text-sm text-gray-600">Sua opinião nos ajuda a melhorar o atendimento.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-[#C9A84C] px-5 py-2.5 text-sm font-medium text-[#1B2B5B]">Ver mais imóveis</Link>
        </div>
      </main>
    )
  }

  const propLabel = visit?.property?.title ?? 'o imóvel'
  const location = [visit?.property?.neighborhood, visit?.property?.city].filter(Boolean).join(' · ')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f7f4] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-[#C9A84C] font-semibold">Imobiliária Lemos</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1B2B5B]">Como foi sua visita?</h1>
          <p className="mt-1 text-sm text-gray-600">
            Olá <strong>{visit?.visitorName?.split(' ')[0]}</strong>, conte pra gente como foi visitar <strong>{propLabel}</strong>{location ? ` (${location})` : ''}.
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-4xl transition-transform ${n <= rating ? 'text-[#C9A84C] scale-110' : 'text-gray-300 hover:text-gray-400'}`}
              aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Conte o que achou — o imóvel atendeu? Tem interesse? Quer ver opções parecidas?"
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B2B5B] focus:outline-none focus:ring-1 focus:ring-[#1B2B5B]"
          style={{ fontSize: '16px' }}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="mt-5 w-full rounded-lg bg-[#1B2B5B] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Enviando…' : 'Enviar avaliação'}
        </button>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Apenas o corretor responsável e a equipe Lemos verão seu feedback.
        </p>
      </div>
    </main>
  )
}
