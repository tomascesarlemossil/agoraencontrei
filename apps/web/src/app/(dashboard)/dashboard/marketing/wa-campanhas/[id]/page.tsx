'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { waCampaignsApi } from '@/lib/api'
import {
  ArrowLeft, Users, Send, Shield, AlertTriangle, CheckCircle, XCircle,
  Loader2, Upload, Search, Trash2, Ban,
} from 'lucide-react'

const RISK_CFG: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Baixo', cls: 'text-green-700 bg-green-50 border-green-200' },
  medium: { label: 'Médio', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  high:   { label: 'Alto',  cls: 'text-red-700 bg-red-50 border-red-200' },
}

const STATUS_CFG: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600', QUEUED: 'bg-indigo-100 text-indigo-700',
  SENT: 'bg-blue-100 text-blue-700', DELIVERED: 'bg-green-100 text-green-700',
  READ: 'bg-green-100 text-green-700', REPLIED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700', UNSUBSCRIBED: 'bg-orange-100 text-orange-700',
  SKIPPED: 'bg-gray-100 text-gray-400',
}

const CONSENT_LABEL: Record<string, string> = {
  consent: 'Consentimento', legitimate_interest: 'Legítimo interesse',
  contract: 'Contrato', existing_customer: 'Cliente existente',
}

export default function WaCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const [rawList, setRawList] = useState('')
  const [source, setSource] = useState('import')
  const [consentBasis, setConsentBasis] = useState('consent')
  const [sourceRef, setSourceRef] = useState('')
  const [researchQuery, setResearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['wa-campaign', id],
    queryFn: () => waCampaignsApi.get(token!, id),
    enabled: !!token && !!id,
  })

  const { data: prospectsData } = useQuery({
    queryKey: ['wa-prospects', id],
    queryFn: () => waCampaignsApi.listProspects(token!, id),
    enabled: !!token && !!id,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['wa-campaign', id] })
    qc.invalidateQueries({ queryKey: ['wa-prospects', id] })
  }

  const addMutation = useMutation({
    mutationFn: () => waCampaignsApi.addRecipients(token!, id, { rawList, source, consentBasis, sourceRef: sourceRef || undefined }),
    onSuccess: (res) => { setRawList(''); setLastReport(res.data.report); invalidate() },
  })
  const [lastReport, setLastReport] = useState<any>(null)

  const approveMutation = useMutation({ mutationFn: () => waCampaignsApi.approve(token!, id), onSuccess: invalidate })
  const dispatchMutation = useMutation({ mutationFn: () => waCampaignsApi.dispatch(token!, id), onSuccess: invalidate })
  const riskMutation = useMutation({ mutationFn: () => waCampaignsApi.recomputeRisk(token!, id), onSuccess: invalidate })
  const removeMutation = useMutation({ mutationFn: (rid: string) => waCampaignsApi.removeRecipient(token!, id, rid), onSuccess: invalidate })
  const researchMutation = useMutation({
    mutationFn: () => waCampaignsApi.research(token!, id, { query: researchQuery }),
    onSuccess: () => { setResearchQuery(''); invalidate() },
  })
  const reviewMutation = useMutation({
    mutationFn: (args: { pid: string; action: 'approve' | 'reject'; phone?: string }) =>
      waCampaignsApi.reviewProspect(token!, args.pid, { action: args.action, phone: args.phone }),
    onSuccess: invalidate,
  })
  const importMutation = useMutation({ mutationFn: () => waCampaignsApi.importProspects(token!, id), onSuccess: invalidate })

  if (isLoading || !data?.data) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  const c = data.data
  const risk = RISK_CFG[c.riskLevel] ?? RISK_CFG.low
  const recipients: any[] = c.recipients ?? []
  const prospects: any[] = prospectsData?.data ?? []
  const canDispatch = !['SENT', 'SENDING', 'QUEUED', 'CANCELLED'].includes(c.status)
  const blockedByApproval = c.requiresApproval && c.status !== 'APPROVED'

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      <Link href="/dashboard/marketing/wa-campanhas" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Campanhas
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{c.name}</h1>
          <p className="text-sm text-gray-500">{c.empreendimento || 'Sem empreendimento vinculado'} · Status: <strong>{c.status}</strong></p>
        </div>
        <div className="flex gap-2">
          {blockedByApproval && (
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              <Shield className="h-4 w-4" /> Aprovar
            </button>
          )}
          <button onClick={() => dispatchMutation.mutate()} disabled={!canDispatch || blockedByApproval || dispatchMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {dispatchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Disparar (simulado)
          </button>
        </div>
      </div>

      {dispatchMutation.data && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Disparo enfileirado: {dispatchMutation.data.data.enqueued} destinatário(s), modo <strong>{dispatchMutation.data.data.mode}</strong>
          {dispatchMutation.data.data.simulated ? ' — SIMULADO (nenhuma mensagem real enviada).' : '.'}
        </div>
      )}

      {/* Métricas + risco */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Destinatários" value={c.totalRecipients} icon={Users} />
        <Metric label="Enviados" value={c.totalSent} icon={Send} />
        <Metric label="Entregues" value={c.totalDelivered} icon={CheckCircle} />
        <Metric label="Descadastros" value={c.totalOptOut} icon={Ban} />
      </div>

      <div className={`rounded-xl border p-4 ${risk.cls}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Risco {risk.label} · score {c.riskScore}/100
            {c.requiresApproval && <span className="text-xs font-normal">(requer aprovação humana)</span>}
          </div>
          <button onClick={() => riskMutation.mutate()} className="text-xs underline">recalcular</button>
        </div>
        {Array.isArray(c.riskFactors) && c.riskFactors.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs">
            {c.riskFactors.map((f: any, i: number) => (
              <li key={i}>• {f.label} (+{f.weight})</li>
            ))}
          </ul>
        )}
      </div>

      {/* Adicionar destinatários */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><Upload className="h-4 w-4" /> Adicionar contatos</h2>
        <textarea
          value={rawList}
          onChange={(e) => setRawList(e.target.value)}
          rows={4}
          placeholder="Cole os telefones — um por linha ou separados por vírgula. Ex.: (11) 91234-5678"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
        />
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="text-gray-600">Origem do contato</span>
            <input value={source} onChange={(e) => setSource(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder="manual / import / crm" />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Base de uso (LGPD)</span>
            <select value={consentBasis} onChange={(e) => setConsentBasis(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base">
              <option value="consent">Consentimento</option>
              <option value="legitimate_interest">Legítimo interesse</option>
              <option value="contract">Contrato</option>
              <option value="existing_customer">Cliente existente</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Fonte / referência</span>
            <input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder="planilha, formulário, evento..." />
          </label>
        </div>
        <button onClick={() => addMutation.mutate()} disabled={!rawList.trim() || addMutation.isPending}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50">
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Validar e adicionar
        </button>

        {lastReport && (
          <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <strong>{lastReport.added}</strong> adicionados ·{' '}
            <strong>{lastReport.invalid}</strong> inválidos ·{' '}
            <strong>{lastReport.duplicatesInBatch + lastReport.duplicatesExisting}</strong> duplicados ·{' '}
            <strong>{lastReport.blockedOptOut}</strong> bloqueados por opt-out
          </div>
        )}
      </section>

      {/* Agente de prospecção */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1"><Search className="h-4 w-4" /> Agente de prospecção (contatos comerciais públicos)</h2>
        <p className="text-xs text-gray-500 mb-3">Resultados simulados. Toda lista exige fonte e aprovação humana antes de virar destinatário.</p>
        <div className="flex gap-2">
          <input value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)}
            placeholder="Ex.: construtoras em Curitiba"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base" />
          <button onClick={() => researchMutation.mutate()} disabled={researchQuery.length < 2 || researchMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
            {researchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Pesquisar
          </button>
        </div>
        {prospects.length > 0 && (
          <div className="mt-3 space-y-2">
            {prospects.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-gray-800">{p.name} <span className="text-xs text-gray-400">· {p.status}</span></div>
                  <div className="text-xs text-gray-500 truncate">{p.phone || 'sem telefone'} · fonte: {p.sourceRef}</div>
                </div>
                {p.status === 'PENDING_REVIEW' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <input placeholder="telefone" id={`ph-${p.id}`} className="w-32 rounded border border-gray-300 px-2 py-1 text-xs" />
                    <button
                      onClick={() => {
                        const el = document.getElementById(`ph-${p.id}`) as HTMLInputElement
                        reviewMutation.mutate({ pid: p.id, action: 'approve', phone: el?.value || undefined })
                      }}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white">Aprovar</button>
                    <button onClick={() => reviewMutation.mutate({ pid: p.id, action: 'reject' })}
                      className="rounded bg-gray-200 px-2 py-1 text-xs">Rejeitar</button>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}
              className="mt-1 inline-flex items-center gap-2 rounded-lg border border-purple-300 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50">
              Importar aprovados para a campanha
            </button>
          </div>
        )}
      </section>

      {/* Lista de destinatários */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Destinatários ({recipients.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="py-2 pr-2">Telefone</th>
                <th className="py-2 pr-2">Nome</th>
                <th className="py-2 pr-2">Origem</th>
                <th className="py-2 pr-2">Base LGPD</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-2 font-mono text-xs">{r.phoneE164 || <span className="text-red-500">{r.rawPhone} ✕</span>}</td>
                  <td className="py-2 pr-2">{r.name || '—'}</td>
                  <td className="py-2 pr-2 text-xs">{r.source}</td>
                  <td className="py-2 pr-2 text-xs">{CONSENT_LABEL[r.consentBasis] ?? r.consentBasis}</td>
                  <td className="py-2 pr-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CFG[r.status] ?? 'bg-gray-100'}`}>{r.status}</span>
                    {r.invalidReason && <span className="ml-1 text-xs text-red-400">{r.invalidReason}</span>}
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeMutation.mutate(r.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {recipients.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-gray-400">Nenhum destinatário ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-400"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value ?? 0}</div>
    </div>
  )
}
