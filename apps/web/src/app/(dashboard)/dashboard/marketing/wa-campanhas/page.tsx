'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { waCampaignsApi } from '@/lib/api'
import {
  MessageCircle, Plus, X, Shield, AlertTriangle, CheckCircle,
  Send, Users, Loader2, ChevronRight,
} from 'lucide-react'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT:            { label: 'Rascunho',        cls: 'bg-gray-100 text-gray-600' },
  PENDING_APPROVAL: { label: 'Aguard. aprovação', cls: 'bg-amber-100 text-amber-700' },
  APPROVED:         { label: 'Aprovada',        cls: 'bg-blue-100 text-blue-700' },
  QUEUED:           { label: 'Na fila',         cls: 'bg-indigo-100 text-indigo-700' },
  SENDING:          { label: 'Enviando',        cls: 'bg-indigo-100 text-indigo-700' },
  SENT:             { label: 'Concluída',       cls: 'bg-green-100 text-green-700' },
  CANCELLED:        { label: 'Cancelada',       cls: 'bg-gray-100 text-gray-500' },
  FAILED:           { label: 'Falhou',          cls: 'bg-red-100 text-red-700' },
}

const RISK_CFG: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Baixo',  cls: 'text-green-700 bg-green-100' },
  medium: { label: 'Médio',  cls: 'text-amber-700 bg-amber-100' },
  high:   { label: 'Alto',   cls: 'text-red-700 bg-red-100' },
}

export default function WaCampaignsPage() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', empreendimento: '', templateName: '', messageBody: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['wa-campaigns'],
    queryFn: () => waCampaignsApi.list(token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: () => waCampaignsApi.create(token!, {
      name: form.name,
      empreendimento: form.empreendimento || undefined,
      templateName: form.templateName || undefined,
      messageBody: form.messageBody,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-campaigns'] })
      setShowForm(false)
      setForm({ name: '', empreendimento: '', templateName: '', messageBody: '' })
    },
  })

  const campaigns = data?.data ?? []

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            Campanhas WhatsApp
          </h1>
          <p className="text-sm text-gray-500">
            Disparo profissional de imóveis e lançamentos — com validação, LGPD, opt-out e aprovação humana.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" /> Nova campanha
        </button>
      </div>

      {/* Banner MVP */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Shield className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <strong>Modo simulado (MVP):</strong> nenhuma mensagem real é enviada. A integração com o
          WhatsApp Business Platform está isolada e só é ativada com <code>WA_CAMPAIGNS_LIVE=true</code>.
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-500">
          Nenhuma campanha ainda. Crie a primeira.
        </div>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((c: any) => {
            const st = STATUS_LABEL[c.status] ?? STATUS_LABEL.DRAFT
            const risk = RISK_CFG[c.riskLevel] ?? RISK_CFG.low
            return (
              <Link
                key={c.id}
                href={`/dashboard/marketing/wa-campanhas/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-sm transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.totalRecipients} destinatários</span>
                    <span className="inline-flex items-center gap-1"><Send className="h-3 w-3" /> {c.totalSent} enviados</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${risk.cls}`}>
                      <AlertTriangle className="h-3 w-3" /> Risco {risk.label} ({c.riskScore})
                    </span>
                    {c.requiresApproval && c.status !== 'SENT' && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Shield className="h-3 w-3" /> Requer aprovação
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal de criação */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nova campanha</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome da campanha</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  placeholder="Ex.: Lançamento Residencial Aurora"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Imóvel / Empreendimento</label>
                <input
                  value={form.empreendimento}
                  onChange={(e) => setForm({ ...form, empreendimento: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  placeholder="Ex.: Residencial Aurora - Torre 1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Template aprovado (opcional)</label>
                <input
                  value={form.templateName}
                  onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  placeholder="nome_do_template_waba"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mensagem</label>
                <textarea
                  value={form.messageBody}
                  onChange={(e) => setForm({ ...form, messageBody: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  placeholder="Olá {{nome}}, temos uma oportunidade no {{imovel}}..."
                />
                <p className="mt-1 text-xs text-gray-400">Use {'{{nome}}'} e outras variáveis para personalizar.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.name || !form.messageBody || createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
