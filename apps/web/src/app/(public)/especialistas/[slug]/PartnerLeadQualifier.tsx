'use client'

import { useMemo, useState } from 'react'
import { Bot, CheckCircle2, MessageCircle, Send } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

type ServiceOption = { name: string; description?: string }

type SubmitState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; score: number; scoreLabel: string; recommendedAction?: string; summary?: string }
  | { status: 'error'; message: string }

interface PartnerLeadQualifierProps {
  specialistId: string
  specialistName: string
  categoryLabel: string
  whatsapp?: string | null
  services: ServiceOption[]
}

function waLink(phone: string | null | undefined, text: string) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  const normalized = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
}

function leadTemperature(label: string) {
  if (label === 'quente') return 'Lead quente'
  if (label === 'morno') return 'Lead morno'
  return 'Lead inicial'
}

export function PartnerLeadQualifier({
  specialistId,
  specialistName,
  categoryLabel,
  whatsapp,
  services,
}: PartnerLeadQualifierProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    projectType: services[0]?.name || '',
    objective: '',
    property: '',
    budget: '',
    timeline: '',
    message: '',
  })
  const [state, setState] = useState<SubmitState>({ status: 'idle' })

  const whatsappText = useMemo(() => {
    const lines = [
      `Ola ${specialistName}, vim pelo AgoraEncontrei.`,
      '',
      `Nome: ${form.name || 'Nao informado'}`,
      `Telefone: ${form.phone || 'Nao informado'}`,
      form.email ? `Email: ${form.email}` : null,
      form.city ? `Cidade: ${form.city}` : null,
      form.projectType ? `Servico/projeto: ${form.projectType}` : null,
      form.objective ? `Objetivo: ${form.objective}` : null,
      form.property ? `Imovel: ${form.property}` : null,
      form.budget ? `Orcamento: ${form.budget}` : null,
      form.timeline ? `Prazo: ${form.timeline}` : null,
      form.message ? `Observacoes: ${form.message}` : null,
    ].filter(Boolean)
    return lines.join('\n')
  }, [form, specialistName])

  const whatsappHref = waLink(whatsapp, whatsappText)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setState({ status: 'error', message: 'Informe nome e telefone para enviar o briefing.' })
      return
    }

    setState({ status: 'loading' })
    try {
      const res = await fetch(`${API_URL}/api/v1/public/partner-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: specialistId,
          partnerName: specialistName,
          ...form,
          pageUrl: window.location.href,
        }),
      })
      if (!res.ok) throw new Error('Falha ao registrar briefing')
      const json = await res.json()
      setState({
        status: 'done',
        score: Number(json?.data?.score || 0),
        scoreLabel: String(json?.data?.scoreLabel || 'inicial'),
        recommendedAction: json?.data?.recommendedAction,
        summary: json?.data?.summary,
      })
    } catch {
      setState({ status: 'error', message: 'Nao foi possivel registrar agora. O WhatsApp continua disponivel.' })
    }
  }

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'
  const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500'

  return (
    <section className="rounded-2xl border border-[#C9A84C]/25 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#143A1F]/5 px-3 py-1 text-xs font-bold text-[#143A1F]">
            <Bot className="h-3.5 w-3.5" /> Briefing inteligente
          </p>
          <h2 className="text-xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
            Qualifique seu projeto com {specialistName}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {categoryLabel} recebe seu contexto antes do contato e responde com mais precisao.
          </p>
        </div>
        {state.status === 'done' && (
          <div className="hidden rounded-2xl bg-[#143A1F] px-4 py-3 text-right text-white sm:block">
            <p className="text-xs text-white/60">Score</p>
            <p className="text-2xl font-bold">{state.score}</p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nome</label>
          <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Seu nome" />
        </div>
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input className={inputClass} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 90000-0000" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="voce@email.com" />
        </div>
        <div>
          <label className={labelClass}>Cidade</label>
          <input className={inputClass} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Cidade/UF" />
        </div>
        <div>
          <label className={labelClass}>Servico</label>
          <select className={inputClass} value={form.projectType} onChange={e => setForm(f => ({ ...f, projectType: e.target.value }))}>
            {services.length === 0 && <option value="">Atendimento</option>}
            {services.map(service => (
              <option key={service.name} value={service.name}>{service.name}</option>
            ))}
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Objetivo</label>
          <select className={inputClass} value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}>
            <option value="">Selecione</option>
            <option value="Construir">Construir</option>
            <option value="Reformar">Reformar</option>
            <option value="Valorizar para venda ou aluguel">Valorizar para venda ou aluguel</option>
            <option value="Regularizar ou aprovar projeto">Regularizar ou aprovar projeto</option>
            <option value="Comparar orcamento">Comparar orcamento</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Imovel</label>
          <select className={inputClass} value={form.property} onChange={e => setForm(f => ({ ...f, property: e.target.value }))}>
            <option value="">Selecione</option>
            <option value="Casa">Casa</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Comercial">Comercial</option>
            <option value="Terreno">Terreno</option>
            <option value="Area gourmet ou lazer">Area gourmet ou lazer</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Prazo</label>
          <select className={inputClass} value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}>
            <option value="">Selecione</option>
            <option value="Urgente">Urgente</option>
            <option value="Ate 30 dias">Ate 30 dias</option>
            <option value="Ate 60 dias">Ate 60 dias</option>
            <option value="Sem pressa">Sem pressa</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Faixa de investimento</label>
          <input className={inputClass} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Ex.: ate R$ 15 mil, R$ 30 mil a R$ 80 mil, sob consulta" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Observacoes</label>
          <textarea className={`${inputClass} min-h-[96px] resize-y`} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Medidas, fotos disponiveis, endereco aproximado, etapa atual, referencias ou duvidas." />
        </div>

        {state.status === 'error' && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.message}</p>
        )}

        {state.status === 'done' && (
          <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#f8f6f1] p-4 sm:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-[#143A1F]">
                  <CheckCircle2 className="h-4 w-4 text-[#C9A84C]" /> {leadTemperature(state.scoreLabel)}
                </p>
                {state.recommendedAction && <p className="mt-1 text-xs text-gray-600">{state.recommendedAction}</p>}
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#143A1F]">Score {state.score}/100</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
          <button
            type="submit"
            disabled={state.status === 'loading'}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#143A1F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0E2A15] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {state.status === 'loading' ? 'Enviando...' : 'Gerar briefing'}
          </button>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#20bd5a]"
            >
              <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
            </a>
          )}
        </div>
      </form>
    </section>
  )
}
