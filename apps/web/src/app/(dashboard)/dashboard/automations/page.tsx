'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { automationsApi, type AutomationRule } from '@/lib/api'
import { Zap, Plus, Play, Pencil, Trash2, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import RuleBuilderDialog from './RuleBuilderDialog'

const TRIGGER_LABELS: Record<string, string> = {
  lead_created:            'Lead criado',
  lead_updated:            'Lead atualizado',
  deal_created:            'Negócio criado',
  deal_status_changed:     'Negócio: status mudou',
  whatsapp_message:        'Mensagem WhatsApp',
  agent_job_done:          'Agente IA finalizado',
  schedule:                'Agendamento',
  boleto_vencendo:         'Boleto vencendo (3 dias)',
  lead_sem_resposta_48h:   'Lead sem resposta (48h)',
  visita_agendada:         'Visita agendada (2h antes)',
  contrato_vencendo_30d:   'Contrato vencendo (30 dias)',
}

const TRIGGER_COLORS: Record<string, string> = {
  lead_created:            'bg-blue-100 text-blue-700',
  lead_updated:            'bg-indigo-100 text-indigo-700',
  deal_created:            'bg-green-100 text-green-700',
  deal_status_changed:     'bg-emerald-100 text-emerald-700',
  whatsapp_message:        'bg-teal-100 text-teal-700',
  agent_job_done:          'bg-purple-100 text-purple-700',
  schedule:                'bg-orange-100 text-orange-700',
  boleto_vencendo:         'bg-red-100 text-red-700',
  lead_sem_resposta_48h:   'bg-amber-100 text-amber-700',
  visita_agendada:         'bg-yellow-100 text-yellow-700',
  contrato_vencendo_30d:   'bg-rose-100 text-rose-700',
}

export default function AutomationsPage() {
  const token = useAuthStore(s => s.accessToken)
  const queryClient = useQueryClient()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editRule, setEditRule] = useState<AutomationRule | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: () => automationsApi.list(token!),
    enabled: !!token,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      automationsApi.update(token!, id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => automationsApi.delete(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => automationsApi.test(token!, id),
  })

  const rules = data?.data ?? []

  function openNew() {
    setEditRule(null)
    setBuilderOpen(true)
  }

  function openEdit(rule: AutomationRule) {
    setEditRule(rule)
    setBuilderOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-yellow-50 shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Automações</h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Motor IFTTT — Se isso, então aquilo</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs sm:text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Regra</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total de Regras', value: data?.meta.total ?? 0 },
          { label: 'Ativas', value: rules.filter(r => r.isActive).length },
          { label: 'Inativas', value: rules.filter(r => !r.isActive).length },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma automação configurada</p>
          <p className="text-gray-400 text-sm mt-1">Crie sua primeira regra para automatizar tarefas</p>
          <button
            onClick={openNew}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium"
          >
            Criar primeira regra
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`bg-white rounded-xl border p-5 transition-all ${rule.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${rule.isActive ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    <Zap className={`w-4 h-4 ${rule.isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{rule.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIGGER_COLORS[rule.trigger] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TRIGGER_LABELS[rule.trigger] ?? rule.trigger}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{(rule.conditions as any[]).length} condição{(rule.conditions as any[]).length !== 1 ? 'ões' : ''}</span>
                      <span>{(rule.actions as any[]).length} ação{(rule.actions as any[]).length !== 1 ? 'ões' : ''}</span>
                      {rule.lastTriggeredAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Último disparo: {new Date(rule.lastTriggeredAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Testar"
                    onClick={() => testMutation.mutate(rule.id)}
                    disabled={testMutation.isPending}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    title={rule.isActive ? 'Desativar' : 'Ativar'}
                    onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                    className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    {rule.isActive
                      ? <ToggleRight className="w-5 h-5 text-yellow-500" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    title="Editar"
                    onClick={() => openEdit(rule)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/automations/${rule.id}`}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
                    title="Ver logs"
                  >
                    Logs
                  </Link>
                  <button
                    title="Excluir"
                    onClick={() => {
                      if (confirm(`Excluir "${rule.name}"?`)) deleteMutation.mutate(rule.id)
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RuleBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        editRule={editRule}
        token={token!}
      />
    </div>
  )
}
