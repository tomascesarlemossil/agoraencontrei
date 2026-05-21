'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { masterApi } from '@/lib/api'
import { Banknote, RefreshCw, Loader2, Clock, CheckCircle2, XCircle, Cog } from 'lucide-react'

const STATUS: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  SCHEDULED:  { label: 'Agendado',    cls: 'bg-blue-500/15 text-blue-300',     icon: Clock },
  PROCESSING: { label: 'Processando', cls: 'bg-amber-500/15 text-amber-300',   icon: Cog },
  COMPLETED:  { label: 'Concluído',   cls: 'bg-emerald-500/15 text-emerald-300', icon: CheckCircle2 },
  FAILED:     { label: 'Falhou',      cls: 'bg-red-500/15 text-red-300',       icon: XCircle },
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function RepassesQueuePage() {
  const { getValidToken, user } = useAuth()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const [filter, setFilter] = useState('')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['repasse-queue', filter],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await masterApi.repasseQueue(token!, filter ? { status: filter } : undefined)
      return res.data
    },
    enabled: isSuperAdmin,
    refetchInterval: 60_000,
  })

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-sm text-gray-500">Acesso restrito ao super-admin.</p>
      </div>
    )
  }

  const summary = data?.summary ?? {}
  const repasses = data?.repasses ?? []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <Banknote size={24} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Fila de Repasses</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Repasses agendados, em processamento e concluídos em toda a plataforma
            </p>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw size={13} className={isRefetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED'] as const).map(s => {
                const meta = STATUS[s]
                const Icon = meta.icon
                const v = summary[s] ?? { count: 0, total: 0 }
                return (
                  <div key={s} className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                      <Icon size={11} /> {meta.label}
                    </div>
                    <p className="mt-1 text-xl font-bold text-white">{v.count}</p>
                    <p className="mt-0.5 text-[10px] text-gray-500">{fmtBRL(v.total)}</p>
                  </div>
                )
              })}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-1">
              {[['', 'Todos'], ['SCHEDULED', 'Agendados'], ['PROCESSING', 'Processando'], ['COMPLETED', 'Concluídos'], ['FAILED', 'Falhas']]
                .map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`rounded-full px-3 py-1 text-xs ${filter === v ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>

            {repasses.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">Nenhum repasse na fila.</p>
            ) : (
              <div className="space-y-2">
                {repasses.map((r: any) => {
                  const s = STATUS[r.status] ?? STATUS.SCHEDULED
                  return (
                    <div key={r.id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">{r.landlordName ?? 'Locador'}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {r.companyName ?? 'Empresa'} · agendado {fmtDate(r.scheduledDate)}
                            {r.processedAt && <span> · processado {fmtDate(r.processedAt)}</span>}
                          </p>
                          {r.failureReason && (
                            <p className="mt-1 text-[11px] text-red-300">⚠ {r.failureReason}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-amber-300">{fmtBRL(r.netValue)}</p>
                          <p className="text-[10px] text-gray-500">
                            bruto {fmtBRL(r.grossValue)} · com. {fmtBRL(r.commissionValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="text-center text-[10px] text-gray-600">
              Auto-refresh a cada 60s
            </p>
          </>
        )}
      </div>
    </div>
  )
}
