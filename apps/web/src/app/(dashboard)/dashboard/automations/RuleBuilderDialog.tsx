'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { automationsApi, type AutomationRule } from '@/lib/api'
import { X, Plus, Trash2 } from 'lucide-react'

const TRIGGERS = [
  { value: 'lead_created',           label: 'Lead criado' },
  { value: 'lead_updated',           label: 'Lead atualizado' },
  { value: 'deal_created',           label: 'Negócio criado' },
  { value: 'deal_status_changed',    label: 'Negócio: status mudou' },
  { value: 'whatsapp_message',       label: 'Mensagem WhatsApp recebida' },
  { value: 'agent_job_done',         label: 'Agente IA finalizado' },
  { value: 'schedule',               label: 'Agendamento (cron)' },
  { value: 'boleto_vencendo',        label: 'Boleto vencendo em 3 dias' },
  { value: 'lead_sem_resposta_48h',  label: 'Lead sem resposta em 48h' },
  { value: 'visita_agendada',        label: 'Visita agendada (2h antes)' },
  { value: 'contrato_vencendo_30d',  label: 'Contrato vencendo em 30 dias' },
]

const ACTION_TYPES = [
  { value: 'send_whatsapp',   label: 'Enviar WhatsApp' },
  { value: 'create_activity', label: 'Criar atividade no CRM' },
  { value: 'update_lead',     label: 'Atualizar lead' },
  { value: 'score_lead',      label: 'Pontuar lead (IA)' },
  { value: 'notify_webhook',  label: 'Chamar webhook externo' },
  { value: 'assign_broker',   label: 'Atribuir corretor' },
]

const OPS = [
  { value: 'eq',       label: 'igual a' },
  { value: 'neq',      label: 'diferente de' },
  { value: 'gt',       label: 'maior que' },
  { value: 'lt',       label: 'menor que' },
  { value: 'contains', label: 'contém' },
  { value: 'in',       label: 'está em (lista)' },
]

interface Condition { field: string; op: string; value: string }
interface Action    { type: string; params: Record<string, string> }

interface Props {
  open: boolean
  onClose: () => void
  editRule: AutomationRule | null
  token: string
}

export default function RuleBuilderDialog({ open, onClose, editRule, token }: Props) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [trigger,     setTrigger]     = useState('lead_created')
  const [conditions,  setConditions]  = useState<Condition[]>([])
  const [actions,     setActions]     = useState<Action[]>([{ type: 'create_activity', params: { title: '' } }])

  useEffect(() => {
    if (editRule) {
      setName(editRule.name)
      setDescription(editRule.description ?? '')
      setTrigger(editRule.trigger)
      setConditions((editRule.conditions as Condition[]) ?? [])
      setActions((editRule.actions as Action[]).length ? (editRule.actions as Action[]) : [{ type: 'create_activity', params: { title: '' } }])
    } else {
      setName('')
      setDescription('')
      setTrigger('lead_created')
      setConditions([])
      setActions([{ type: 'create_activity', params: { title: '' } }])
    }
    setError('')
  }, [editRule, open])

  if (!open) return null

  function addCondition() {
    setConditions(prev => [...prev, { field: 'status', op: 'eq', value: '' }])
  }

  function removeCondition(i: number) {
    setConditions(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateCondition(i: number, key: keyof Condition, val: string) {
    setConditions(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c))
  }

  function addAction() {
    setActions(prev => [...prev, { type: 'create_activity', params: { title: '' } }])
  }

  function removeAction(i: number) {
    setActions(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateActionType(i: number, type: string) {
    setActions(prev => prev.map((a, idx) => idx === i ? { type, params: {} } : a))
  }

  function updateActionParam(i: number, key: string, val: string) {
    setActions(prev => prev.map((a, idx) =>
      idx === i ? { ...a, params: { ...a.params, [key]: val } } : a
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (!actions.length) { setError('Pelo menos uma ação é obrigatória'); return }
    setSaving(true)
    setError('')
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined, trigger, conditions, actions, isActive: true }
      if (editRule) {
        await automationsApi.update(token, editRule.id, payload)
      } else {
        await automationsApi.create(token, payload)
      }
      await queryClient.invalidateQueries({ queryKey: ['automations'] })
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{editRule ? 'Editar Regra' : 'Nova Regra de Automação'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Notificar corretor quando lead é criado"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Opcional"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔔 Gatilho <span className="text-gray-400 font-normal">— quando isso acontecer</span>
            </label>
            <select
              value={trigger}
              onChange={e => setTrigger(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">
                🔍 Condições <span className="text-gray-400 font-normal">— filtros opcionais (todas devem ser verdadeiras)</span>
              </label>
              <button type="button" onClick={addCondition} className="text-xs text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            {conditions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Sem condições — regra sempre dispara</p>
            ) : (
              <div className="space-y-2">
                {conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.field}
                      onChange={e => updateCondition(i, 'field', e.target.value)}
                      placeholder="campo (ex: status)"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <select
                      value={c.op}
                      onChange={e => updateCondition(i, 'op', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {OPS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                    </select>
                    <input
                      type="text"
                      value={c.value}
                      onChange={e => updateCondition(i, 'value', e.target.value)}
                      placeholder="valor"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button type="button" onClick={() => removeCondition(i)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">
                ⚡ Ações <span className="text-gray-400 font-normal">— executar em sequência</span>
              </label>
              <button type="button" onClick={addAction} className="text-xs text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((action, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium w-4">{i + 1}.</span>
                    <select
                      value={action.type}
                      onChange={e => updateActionType(i, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    {actions.length > 1 && (
                      <button type="button" onClick={() => removeAction(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <ActionParamsForm action={action} index={i} onChange={updateActionParam} />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editRule ? 'Salvar alterações' : 'Criar regra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ActionParamsForm({
  action,
  index,
  onChange,
}: {
  action: Action
  index: number
  onChange: (i: number, key: string, val: string) => void
}) {
  const p = action.params

  switch (action.type) {
    case 'send_whatsapp':
      return (
        <div className="space-y-1.5 pl-5">
          <input
            type="text"
            value={p.phone ?? ''}
            onChange={e => onChange(index, 'phone', e.target.value)}
            placeholder="Telefone (ou vazio para usar do evento)"
            className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <textarea
            value={p.message ?? ''}
            onChange={e => onChange(index, 'message', e.target.value)}
            placeholder="Mensagem — use {{name}}, {{status}} para dados do evento"
            rows={2}
            className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
          />
        </div>
      )

    case 'create_activity':
      return (
        <div className="space-y-1.5 pl-5">
          <input
            type="text"
            value={p.title ?? ''}
            onChange={e => onChange(index, 'title', e.target.value)}
            placeholder="Título da atividade — ex: Automação disparada"
            className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <select
            value={p.type ?? 'system'}
            onChange={e => onChange(index, 'type', e.target.value)}
            className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="system">Sistema</option>
            <option value="note">Nota</option>
            <option value="call">Ligação</option>
            <option value="email">E-mail</option>
          </select>
        </div>
      )

    case 'update_lead':
      return (
        <div className="grid grid-cols-2 gap-1.5 pl-5">
          <input
            type="text"
            value={p.leadId ?? ''}
            onChange={e => onChange(index, 'leadId', e.target.value)}
            placeholder="Lead ID (ou vazio para usar do evento)"
            className="col-span-2 border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <select
            value={p.status ?? ''}
            onChange={e => onChange(index, 'status', e.target.value)}
            className="border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">— Manter status —</option>
            {['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST','INACTIVE'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          <input
            type="number"
            value={p.score ?? ''}
            onChange={e => onChange(index, 'score', e.target.value)}
            placeholder="Score (0-100)"
            min={0} max={100}
            className="border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      )

    case 'notify_webhook':
      return (
        <div className="pl-5">
          <input
            type="url"
            value={p.url ?? ''}
            onChange={e => onChange(index, 'url', e.target.value)}
            placeholder="https://sua-api.com/webhook"
            className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      )

    case 'assign_broker':
      return (
        <div className="pl-5">
          <input
            type="text"
            value={p.brokerId ?? ''}
            onChange={e => onChange(index, 'brokerId', e.target.value)}
            placeholder="User ID do corretor"
            className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      )

    case 'score_lead':
      return (
        <p className="pl-5 text-xs text-gray-400 italic">
          O agente IA analisará o lead e atualizará o score automaticamente
        </p>
      )

    default:
      return null
  }
}
