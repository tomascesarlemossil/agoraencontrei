'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { automationsApi, type AutomationLog } from '@/lib/api'
import { ArrowLeft, Zap, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  done:    { label: 'Concluído', icon: CheckCircle, className: 'text-green-600 bg-green-50' },
  failed:  { label: 'Falhou',    icon: XCircle,     className: 'text-red-600 bg-red-50' },
  running: { label: 'Rodando',   icon: Loader2,     className: 'text-yellow-600 bg-yellow-50' },
  pending: { label: 'Pendente',  icon: Clock,       className: 'text-gray-600 bg-gray-50' },
}

const TRIGGER_LABELS: Record<string, string> = {
  lead_created:           'Lead criado',
  lead_updated:           'Lead atualizado',
  deal_created:           'Negócio criado',
  deal_status_changed:    'Negócio: status',
  whatsapp_message:       'WhatsApp',
  agent_job_done:         'Agente IA',
  schedule:               'Agendamento',
  boleto_vencendo:        'Boleto vencendo',
  lead_sem_resposta_48h:  'Lead sem resposta 48h',
  visita_agendada:        'Visita agendada',
  contrato_vencendo_30d:  'Contrato vencendo 30d',
}

export default function AutomationLogsPage() {
  const token = useAuthStore(s => s.accessToken)
  const params = useParams()
  const id = params.id as string

  const { data: ruleData, isLoading: ruleLoading } = useQuery({
    queryKey: ['automation', id],
    queryFn: () => automationsApi.get(token!, id),
    enabled: !!token && !!id,
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['automation-logs', id],
    queryFn: () => automationsApi.logs(token!, id, { limit: '50' }),
    enabled: !!token && !!id,
    refetchInterval: 10_000,
  })

  const rule = ruleData
  const logs = logsData?.data ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/automations"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Automações
      </Link>

      {/* Header */}
      {ruleLoading ? (
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ) : rule ? (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-yellow-50">
            <Zap className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{rule.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gatilho: <span className="font-medium">{TRIGGER_LABELS[rule.trigger] ?? rule.trigger}</span>
              {' · '}
              {(rule.conditions as any[]).length} condição{(rule.conditions as any[]).length !== 1 ? 'ões' : ''}
              {' · '}
              {(rule.actions as any[]).length} ação{(rule.actions as any[]).length !== 1 ? 'ões' : ''}
            </p>
          </div>
        </div>
      ) : null}

      {/* Logs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Histórico de Execuções
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({logsData?.meta.total ?? 0} total)
          </span>
        </h2>

        {logsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma execução registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => <LogRow key={log.id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function LogRow({ log }: { log: AutomationLog }) {
  const config = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          <div>
            <p className="text-sm text-gray-700 font-medium">
              {TRIGGER_LABELS[log.triggeredBy] ?? log.triggeredBy}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(log.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {log.errorMsg && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
          <strong>Erro:</strong> {log.errorMsg}
        </div>
      )}

      {log.result != null && (
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
            Ver resultado
          </summary>
          <pre className="mt-2 text-xs bg-gray-50 rounded-lg p-3 overflow-auto text-gray-600 max-h-40">
            {JSON.stringify(log.result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
