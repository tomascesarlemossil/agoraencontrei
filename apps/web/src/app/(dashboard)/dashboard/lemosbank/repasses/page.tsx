'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, CheckCircle, Clock, Phone, Mail, ChevronRight,
  DollarSign,
} from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import { financeApi } from '@/lib/api'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

export default function RepassesPage() {
  const token = useAuthStore(s => s.accessToken)
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [marcando, setMarcando] = useState<string | null>(null)

  const params: Record<string, string> = {}
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['finance-repasses', search],
    queryFn:  () => financeApi.repasses(token!, params),
    enabled:  !!token,
    refetchInterval: 60_000,
  })

  const repasses    = data?.data ?? []
  const meta        = data?.meta
  const pendentes   = repasses.filter((r: any) => !r.repassePaid)
  const pagos       = repasses.filter((r: any) =>  r.repassePaid)

  const handleMarcarPago = async (r: any) => {
    if (!token || !r.thisMonthRental?.id) {
      alert('Este contrato não possui aluguel registrado neste mês para marcar como pago.')
      return
    }
    if (!confirm(`Confirmar repasse de ${fmt(r.repasseValue)} para ${r.landlordName}?`)) return
    setMarcando(r.id)
    try {
      await financeApi.pagarAluguel(token, r.thisMonthRental.id, {
        paymentDate: new Date().toISOString().split('T')[0],
        paidAmount: r.thisMonthRental.totalAmount,
      })
      qc.invalidateQueries({ queryKey: ['finance-repasses'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setMarcando(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-green-50">
          <RefreshCw className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro e Repasses</h1>
          <p className="text-sm text-gray-500">Contratos com repasse ao proprietário configurado</p>
        </div>
      </div>

      {/* Summary cards */}
      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 uppercase font-medium">Total de Contratos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{repasses.length}</p>
            <p className="text-xs text-gray-400">com repasse ativo</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 uppercase font-medium">Repasse a Pagar</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmt(meta.totalRepasseAReceber)}</p>
            <p className="text-xs text-gray-400">{pendentes.length} proprietário(s)</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 uppercase font-medium">Repasse Pago</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmt(meta.totalRepassePago)}</p>
            <p className="text-xs text-gray-400">{pagos.length} proprietário(s)</p>
          </div>
        </div>
      )}

      {/* Search */}
      <SearchInputWithVoice
        value={search}
        onChange={e => setSearch(e.target.value)}
        onVoiceResult={(t) => setSearch(t)}
        placeholder="Buscar proprietário, inquilino, endereço..."
        className="w-full py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : repasses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum contrato com repasse encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repasses.map((r: any) => (
            <div key={r.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${r.repassePaid ? 'border-green-100' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {r.repassePaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3" /> Pago este mês
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                        <Clock className="w-3 h-3" /> A Repassar — Dia {r.landlordDueDay}
                      </span>
                    )}
                    {r.legacyId && <span className="text-xs text-gray-400 font-mono">#{r.legacyId}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-xs text-gray-400">Proprietário</span>
                      <p className="font-medium text-gray-900 truncate">{r.landlordName ?? '—'}</p>
                      {r.landlord?.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{r.landlord.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Inquilino</span>
                      <p className="font-medium text-gray-700 truncate">{r.tenantName ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{r.propertyAddress ?? ''}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div>
                    <p className="text-xs text-gray-400">Aluguel</p>
                    <p className="text-sm font-semibold text-gray-700">{fmt(r.rentValue)}</p>
                  </div>
                  {r.commission > 0 && (
                    <div>
                      <p className="text-xs text-gray-400">Comissão ({r.commission}%)</p>
                      <p className="text-xs text-red-500">- {fmt(r.rentValue * r.commission / 100)}</p>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-1">
                    <p className="text-xs text-gray-400">Repasse</p>
                    <p className="text-lg font-bold text-green-700">{fmt(r.repasseValue)}</p>
                  </div>
                  <Link href={`/dashboard/contratos/${r.id}`} className="text-xs text-blue-500 hover:underline block">
                    Ver contrato <ChevronRight className="inline w-3 h-3" />
                  </Link>
                  {!r.repassePaid && (
                    <button
                      onClick={() => handleMarcarPago(r)}
                      disabled={marcando === r.id}
                      className="flex items-center gap-1 mt-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 w-full justify-center"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      {marcando === r.id ? 'Processando...' : 'Marcar Repasse Pago'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
