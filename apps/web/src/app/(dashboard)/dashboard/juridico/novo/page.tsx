'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { ArrowLeft, Scale, Save, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const TYPES = [
  ['DESPEJO','Despejo'],['COBRANCA','Cobrança'],['REVISIONAL','Revisional'],
  ['RESCISAO','Rescisão'],['DANO','Dano'],['TRABALHISTA','Trabalhista'],
  ['CRIMINAL','Criminal'],['OUTROS','Outros'],
]
const STATUSES = [['ATIVO','Ativo'],['SUSPENSO','Suspenso'],['ENCERRADO','Encerrado'],['ARQUIVADO','Arquivado']]
const PRIORITIES = [['BAIXA','Baixa'],['NORMAL','Normal'],['ALTA','Alta'],['URGENTE','Urgente']]
const UPDATE_TYPES = [
  ['ANDAMENTO','Andamento'],['AUDIENCIA','Audiência'],['DECISAO','Decisão'],
  ['RECURSO','Recurso'],['ACORDO','Acordo'],['CITACAO','Citação'],
  ['PETICAO','Petição'],['OUTROS','Outros'],
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/50 font-medium">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
const selectCls = "w-full bg-[#1a2744] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"

export default function NovoProcessoPage() {
  const router = useRouter()
  const { getValidToken } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', type: 'DESPEJO', status: 'ATIVO', priority: 'NORMAL',
    caseNumber: '', plaintiffName: '', defendantName: '',
    lawyerName: '', lawyerOab: '', lawyerPhone: '', lawyerEmail: '',
    court: '', courtSection: '', courtCity: '',
    openedAt: '', closedAt: '', nextHearingAt: '',
    claimedValue: '', settledValue: '', courtCosts: '',
    observations: '', internalNotes: '',
    tags: '',
    // Primeiro andamento
    firstUpdate: '', firstUpdateType: 'ANDAMENTO', firstUpdateDate: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('O título é obrigatório.'); return }
    setSaving(true); setError('')
    try {
      const token = await getValidToken()
      const body: any = {
        title: form.title.trim(),
        type: form.type,
        status: form.status,
        priority: form.priority,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      if (form.caseNumber)    body.caseNumber    = form.caseNumber
      if (form.plaintiffName) body.plaintiffName = form.plaintiffName
      if (form.defendantName) body.defendantName = form.defendantName
      if (form.lawyerName)    body.lawyerName    = form.lawyerName
      if (form.lawyerOab)     body.lawyerOab     = form.lawyerOab
      if (form.lawyerPhone)   body.lawyerPhone   = form.lawyerPhone
      if (form.lawyerEmail)   body.lawyerEmail   = form.lawyerEmail
      if (form.court)         body.court         = form.court
      if (form.courtSection)  body.courtSection  = form.courtSection
      if (form.courtCity)     body.courtCity     = form.courtCity
      if (form.openedAt)      body.openedAt      = form.openedAt
      if (form.closedAt)      body.closedAt      = form.closedAt
      if (form.nextHearingAt) body.nextHearingAt = form.nextHearingAt
      if (form.claimedValue)  body.claimedValue  = parseFloat(form.claimedValue.replace(',','.'))
      if (form.settledValue)  body.settledValue  = parseFloat(form.settledValue.replace(',','.'))
      if (form.courtCosts)    body.courtCosts    = parseFloat(form.courtCosts.replace(',','.'))
      if (form.observations)  body.observations  = form.observations
      if (form.internalNotes) body.internalNotes = form.internalNotes

      const res = await fetch(`${API_URL}/api/v1/legal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? 'Erro ao salvar') }
      const created = await res.json()

      // Adicionar primeiro andamento se preenchido
      if (form.firstUpdate.trim()) {
        await fetch(`${API_URL}/api/v1/legal/${created.id}/updates`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: form.firstUpdate.trim(),
            type: form.firstUpdateType,
            occurredAt: form.firstUpdateDate || undefined,
          }),
        })
      }

      router.push(`/dashboard/juridico/${created.id}`)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar processo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/juridico">
          <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">Novo Processo Jurídico</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dados Gerais */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Dados Gerais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Título do Processo" required>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Ex: Ação de Despejo — João Silva" className={inputCls} />
            </Field>
            <Field label="Número do Processo">
              <input value={form.caseNumber} onChange={e => set('caseNumber', e.target.value)}
                placeholder="0000000-00.0000.0.00.0000" className={inputCls} />
            </Field>
            <Field label="Tipo" required>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={selectCls}>
                {TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={selectCls}>
                {STATUSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Prioridade">
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={selectCls}>
                {PRIORITIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Tags (separadas por vírgula)">
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="despejo, locação, 2026" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Partes Envolvidas */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Partes Envolvidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Autor / Requerente">
              <input value={form.plaintiffName} onChange={e => set('plaintiffName', e.target.value)}
                placeholder="Nome do autor" className={inputCls} />
            </Field>
            <Field label="Réu / Requerido">
              <input value={form.defendantName} onChange={e => set('defendantName', e.target.value)}
                placeholder="Nome do réu" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Advogado */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Advogado Responsável</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Nome do Advogado">
              <input value={form.lawyerName} onChange={e => set('lawyerName', e.target.value)}
                placeholder="Dr. Nome Sobrenome" className={inputCls} />
            </Field>
            <Field label="OAB">
              <input value={form.lawyerOab} onChange={e => set('lawyerOab', e.target.value)}
                placeholder="SP 123456" className={inputCls} />
            </Field>
            <Field label="Telefone">
              <input value={form.lawyerPhone} onChange={e => set('lawyerPhone', e.target.value)}
                placeholder="(16) 99999-9999" className={inputCls} />
            </Field>
            <Field label="E-mail">
              <input type="email" value={form.lawyerEmail} onChange={e => set('lawyerEmail', e.target.value)}
                placeholder="advogado@email.com" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Tribunal */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Tribunal / Vara</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tribunal">
              <input value={form.court} onChange={e => set('court', e.target.value)}
                placeholder="Ex: TJSP" className={inputCls} />
            </Field>
            <Field label="Vara / Seção">
              <input value={form.courtSection} onChange={e => set('courtSection', e.target.value)}
                placeholder="Ex: 2ª Vara Cível" className={inputCls} />
            </Field>
            <Field label="Cidade">
              <input value={form.courtCity} onChange={e => set('courtCity', e.target.value)}
                placeholder="Ex: Franca - SP" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Datas */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Datas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Data de Abertura">
              <input type="date" value={form.openedAt} onChange={e => set('openedAt', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Próxima Audiência">
              <input type="datetime-local" value={form.nextHearingAt} onChange={e => set('nextHearingAt', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Data de Encerramento">
              <input type="date" value={form.closedAt} onChange={e => set('closedAt', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Valores */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Valores Financeiros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Valor Reclamado (R$)">
              <input type="number" step="0.01" min="0" value={form.claimedValue} onChange={e => set('claimedValue', e.target.value)}
                placeholder="0,00" className={inputCls} />
            </Field>
            <Field label="Valor Acordado (R$)">
              <input type="number" step="0.01" min="0" value={form.settledValue} onChange={e => set('settledValue', e.target.value)}
                placeholder="0,00" className={inputCls} />
            </Field>
            <Field label="Custas Processuais (R$)">
              <input type="number" step="0.01" min="0" value={form.courtCosts} onChange={e => set('courtCosts', e.target.value)}
                placeholder="0,00" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Observações</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Observações Gerais">
              <textarea value={form.observations} onChange={e => set('observations', e.target.value)}
                rows={4} placeholder="Informações relevantes sobre o processo..."
                className={inputCls + ' resize-none'} />
            </Field>
            <Field label="Notas Internas (confidencial)">
              <textarea value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)}
                rows={4} placeholder="Notas internas da equipe..."
                className={inputCls + ' resize-none'} />
            </Field>
          </div>
        </div>

        {/* Primeiro Andamento */}
        <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/20 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Primeiro Andamento (opcional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tipo de Andamento">
              <select value={form.firstUpdateType} onChange={e => set('firstUpdateType', e.target.value)} className={selectCls}>
                {UPDATE_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Data do Andamento">
              <input type="date" value={form.firstUpdateDate} onChange={e => set('firstUpdateDate', e.target.value)} className={inputCls} />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Descrição do Andamento">
                <textarea value={form.firstUpdate} onChange={e => set('firstUpdate', e.target.value)}
                  rows={3} placeholder="Descreva o andamento inicial do processo..."
                  className={inputCls + ' resize-none'} />
              </Field>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/juridico">
            <button type="button" className="px-4 py-2 bg-white/10 rounded-lg text-sm text-white/70 hover:bg-white/20 transition-colors">
              Cancelar
            </button>
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-yellow-400 rounded-lg text-sm font-bold text-[#1B2B5B] hover:bg-yellow-300 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Processo'}
          </button>
        </div>
      </form>
    </div>
  )
}
