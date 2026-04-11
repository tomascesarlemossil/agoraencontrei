export type TriggerEvent =
  | 'lead_created'
  | 'lead_updated'
  | 'deal_created'
  | 'deal_status_changed'
  | 'whatsapp_message'
  | 'agent_job_done'
  | 'schedule'
  | 'boleto_vencendo'
  | 'lead_sem_resposta_48h'
  | 'visita_agendada'
  | 'contrato_vencendo_30d'
  | 'cobranca_inadimplencia_5d'

export type ActionType =
  | 'send_whatsapp'
  | 'create_activity'
  | 'update_lead'
  | 'score_lead'
  | 'notify_webhook'
  | 'assign_broker'
  | 'create_deal'

export interface AutomationEventPayload {
  companyId: string
  event: TriggerEvent
  data: Record<string, unknown>
}

export interface ConditionRule {
  field: string
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in'
  value: unknown
}

export interface ActionDef {
  type: ActionType
  params: Record<string, unknown>
}
