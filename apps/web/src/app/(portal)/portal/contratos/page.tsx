'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, FileText, FolderOpen, CheckCircle, XCircle, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Contract {
  id: string
  legacyId: string
  propertyAddress: string
  landlordName: string
  tenantName: string
  rentValue: number
  status: string
  startDate: string
  rescissionDate?: string
  isActive: boolean
  tenantDueDay: number
  adjustmentIndex: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

export default function ContratosPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) { router.push('/portal/login'); return }
    const auth = JSON.parse(stored)
    if (auth.expiresAt && Date.now() > auth.expiresAt) { localStorage.removeItem('portal_auth'); router.push('/portal/login'); return }

    fetch(`${API_URL}/api/v1/portal/contratos`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.ok ? r.json() : { contracts: [] })
      .then(d => setContracts(d.contracts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Meus Contratos</h1>
          <p className="text-sm text-gray-500">{contracts.length} contrato(s)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} />
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhum contrato encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 space-y-4 shadow-sm"
              style={{ border: `1px solid ${c.isActive ? '#C9A84C40' : '#ddd9d0'}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.isActive ? '#FEF3C7' : '#F3F4F6' }}>
                    <FileText className="w-5 h-5" style={{ color: c.isActive ? '#D97706' : '#9CA3AF' }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Contrato #{c.legacyId}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 leading-tight">{c.propertyAddress}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                  c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {c.isActive ? 'Ativo' : c.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t" style={{ borderColor: '#f0ece4' }}>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Valor</p>
                  <p className="text-sm font-bold text-gray-800">{fmt(c.rentValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Início</p>
                  <p className="text-sm font-semibold text-gray-700">{fmtDate(c.startDate)}</p>
                </div>
                {c.tenantDueDay && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Vencimento</p>
                    <p className="text-sm font-semibold text-gray-700">Dia {c.tenantDueDay}</p>
                  </div>
                )}
                {c.adjustmentIndex && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Reajuste</p>
                    <p className="text-sm font-semibold text-gray-700">{c.adjustmentIndex}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
