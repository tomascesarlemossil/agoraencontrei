'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { masterApi } from '@/lib/api'
import {
  Activity, RefreshCw, CheckCircle2, XCircle, CreditCard,
  Banknote, Webhook, Bot, Loader2, AlertTriangle,
} from 'lucide-react'

const INTEGRATION_META: Record<string, { label: string; icon: typeof CreditCard }> = {
  asaas:      { label: 'Asaas (pagamentos)',   icon: CreditCard },
  clicksign:  { label: 'Clicksign (assinatura)', icon: CheckCircle2 },
  streetview: { label: 'Google Street View',   icon: Activity },
  whatsapp:   { label: 'WhatsApp (Evolution)',  icon: Bot },
}

function fmtBRL(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const SCRAPER_STATUS: Record<string, string> = {
  success: 'text-emerald-400', completed: 'text-emerald-400',
  running: 'text-blue-400', failed: 'text-red-400', error: 'text-red-400',
}
const REPASSE_STATUS: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-300', SCHEDULED: 'bg-blue-500/15 text-blue-300',
  COMPLETED: 'bg-emerald-500/15 text-emerald-300', FAILED: 'bg-red-500/15 text-red-300',
}

export default function WebhooksHealthPage() {
  const { getValidToken, user } = useAuth()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['webhook-health'],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await masterApi.webhookHealth(token!)
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <Webhook size={24} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Saúde das Integrações</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Status de webhooks, pagamentos, repasses e scrapers em tempo real
            </p>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw size={13} className={isRefetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : !data ? (
          <p className="py-8 text-center text-sm text-gray-600">Sem dados.</p>
        ) : (
          <>
            {/* Integrations */}
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Integrações</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(data.integrations ?? {}).map(([key, val]: [string, any]) => {
                  const meta = INTEGRATION_META[key] ?? { label: key, icon: Activity }
                  const Icon = meta.icon
                  const ok = val.configured
                  return (
                    <div key={key} className={`rounded-xl border p-3 ${ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-800 bg-gray-900/40'}`}>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Icon size={13} />
                        {ok ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-gray-600" />}
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-white">{meta.label}</p>
                      <p className={`text-[10px] ${ok ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {ok ? 'Configurado' : 'Não configurado'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Webhook counts */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Webhooks (24h)</div>
                <p className="mt-1 text-xl font-bold text-white">{data.webhooks?.last24h ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Webhooks (7 dias)</div>
                <p className="mt-1 text-xl font-bold text-white">{data.webhooks?.last7d ?? 0}</p>
              </div>
            </div>

            {/* Recent payments */}
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                <CreditCard size={12} /> Pagamentos recentes (24h)
              </h2>
              {(data.webhooks?.recentPayments ?? []).length === 0 ? (
                <p className="text-xs text-gray-600 py-2">Nenhum evento de pagamento nas últimas 24h.</p>
              ) : (
                <div className="space-y-1">
                  {data.webhooks.recentPayments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-900/40 border border-gray-800 px-3 py-2 text-xs">
                      <span className="text-gray-300 font-mono">{p.action}</span>
                      <span className="text-gray-500">{fmtDateTime(p.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repasses */}
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                <Banknote size={12} /> Repasses recentes (7 dias)
              </h2>
              {(data.repasses ?? []).length === 0 ? (
                <p className="text-xs text-gray-600 py-2">Nenhum repasse agendado nos últimos 7 dias.</p>
              ) : (
                <div className="space-y-1">
                  {data.repasses.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-900/40 border border-gray-800 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REPASSE_STATUS[r.status] ?? 'bg-gray-700/40 text-gray-400'}`}>
                          {r.status}
                        </span>
                        <span className="text-gray-300 font-semibold">{fmtBRL(r.grossValue)}</span>
                      </div>
                      <span className="text-gray-500">
                        {r.scheduledDate ? `agendado ${fmtDateTime(r.scheduledDate)}` : fmtDateTime(r.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scraper runs */}
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                <Activity size={12} /> Execuções de scraper
              </h2>
              {(data.scraperRuns ?? []).length === 0 ? (
                <p className="text-xs text-gray-600 py-2">Nenhuma execução registrada.</p>
              ) : (
                <div className="space-y-1">
                  {data.scraperRuns.map((s: any) => (
                    <div key={s.id} className="rounded-lg bg-gray-900/40 border border-gray-800 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-medium">{s.source}</span>
                          <span className={`font-semibold ${SCRAPER_STATUS[s.status] ?? 'text-gray-400'}`}>{s.status}</span>
                        </div>
                        <span className="text-gray-500">{fmtDateTime(s.createdAt)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-500">
                        <span>{s.itemsFound ?? 0} encontrados</span>
                        <span className="text-emerald-400">{s.itemsCreated ?? 0} criados</span>
                        <span className="text-blue-400">{s.itemsUpdated ?? 0} atualizados</span>
                      </div>
                      {s.errorMessage && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-red-300">
                          <AlertTriangle size={10} /> {s.errorMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-gray-600">
              Atualizado {data.timestamp ? fmtDateTime(data.timestamp) : '—'} · auto-refresh a cada 60s
            </p>
          </>
        )}
      </div>
    </div>
  )
}
