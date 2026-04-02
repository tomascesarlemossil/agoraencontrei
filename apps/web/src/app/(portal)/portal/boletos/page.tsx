'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, FolderOpen, Receipt, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Rental {
  id: string
  dueDate: string
  status: 'PENDING' | 'LATE' | 'PAID' | 'CANCELLED'
  amount: number
  paidAt?: string
  asaasBoletoUrl?: string
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pendente', icon: Clock, color: '#D97706', bg: '#FEF3C7' },
  LATE:    { label: 'Em atraso', icon: AlertTriangle, color: '#DC2626', bg: '#FEE2E2' },
  PAID:    { label: 'Pago', icon: CheckCircle, color: '#059669', bg: '#D1FAE5' },
  CANCELLED: { label: 'Cancelado', icon: FolderOpen, color: '#9CA3AF', bg: '#F3F4F6' },
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

export default function BoletosPage() {
  const router = useRouter()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) { router.push('/portal/login'); return }
    const auth = JSON.parse(stored)
    if (auth.expiresAt && Date.now() > auth.expiresAt) { localStorage.removeItem('portal_auth'); router.push('/portal/login'); return }

    fetch(`${API_URL}/api/v1/portal/boletos`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.ok ? r.json() : { rentals: [] })
      .then(d => setRentals(d.rentals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const pending = rentals.filter(r => r.status === 'PENDING' || r.status === 'LATE')
  const paid = rentals.filter(r => r.status === 'PAID')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Boletos & Aluguéis</h1>
          <p className="text-sm text-gray-500">{pending.length} pendente(s) · {paid.length} pago(s)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} />
        </div>
      ) : rentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhum boleto encontrado</p>
          <p className="text-sm mt-1">Os boletos aparecerão aqui quando gerados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING
            const Icon = cfg.icon
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm"
                style={{ border: '1px solid #ddd9d0' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-gray-800">{fmt(r.amount)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.status === 'PAID' && r.paidAt
                      ? `Pago em ${fmtDate(r.paidAt)}`
                      : `Vencimento: ${fmtDate(r.dueDate)}`}
                  </p>
                </div>
                {r.asaasBoletoUrl && r.status !== 'PAID' && (
                  <a
                    href={r.asaasBoletoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                  >
                    <Receipt className="w-4 h-4" />
                    Pagar
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
