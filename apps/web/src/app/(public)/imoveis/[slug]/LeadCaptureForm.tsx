'use client'

import { useState } from 'react'
import { MessageCircle, CheckCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Props {
  propertyId: string
  propertyTitle: string
}

export function LeadCaptureForm({ propertyId, propertyTitle }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const body = {
      name:       fd.get('name') as string,
      phone:      fd.get('phone') as string,
      email:      (fd.get('email') as string) || undefined,
      message:    (fd.get('message') as string) || undefined,
      interest:   (fd.get('interest') as string) || undefined,
      propertyId,
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Erro ao enviar. Tente novamente.')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-green-100 rounded-2xl p-6 text-center shadow-sm">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 text-lg">Mensagem enviada!</h3>
        <p className="text-gray-500 text-sm mt-1">Em breve entraremos em contato sobre <strong>{propertyTitle}</strong>.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Tenho interesse</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="name"
          required
          minLength={2}
          placeholder="Seu nome *"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="phone"
          required
          minLength={8}
          type="tel"
          placeholder="WhatsApp / Telefone *"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="email"
          type="email"
          placeholder="E-mail (opcional)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="interest"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="">Interesse</option>
          <option value="buy">Comprar</option>
          <option value="rent">Alugar</option>
        </select>
        <textarea
          name="message"
          rows={3}
          placeholder="Mensagem (opcional)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Enviando...' : 'Quero saber mais'}
        </button>
      </form>
    </div>
  )
}
