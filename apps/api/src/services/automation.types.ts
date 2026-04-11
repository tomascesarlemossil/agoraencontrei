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
  // ── Growth Engine events ──
  | 'outbound_sent'
  | 'outbound_replied'
  | 'preview_created'
  | 'preview_clicked'
  | 'checkout_created'
  | 'payment_confirmed'
  | 'followup_sent'
  | 'funnel_stage_changed'
  | 'affiliate_earning_created'

export type ActionType =
  | 'send_whatsapp'
  | 'create_activity'
  | 'update_lead'
  | 'score_lead'
  | 'notify_webhook'
  | 'assign_broker'
  | 'create_deal'
  | 'generate_preview'
  | 'send_checkout'
  | 'schedule_followup'

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
