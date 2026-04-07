'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Crown, Shield, TrendingUp, MapPin, Star, CheckCircle2,
  ArrowRight, Phone, MessageCircle, Zap, Users, BarChart3,
  Lock, Clock, Award, ChevronDown, ChevronUp,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

const STATS = [
  { value: '40.117', label: 'Páginas SEO indexadas', icon: <TrendingUp className="w-5 h-5" /> },
  { value: '10', label: 'Vagas de Membro Fundador', icon: <Crown className="w-5 h-5" /> },
  { value: 'R$ 11', label: 'Custo por lead (vs R$ 60 no Meta)', icon: <BarChart3 className="w-5 h-5" /> },
  { value: '24/7', label: 'Monitor de leilões ativo', icon: <Clock className="w-5 h-5" /> },
]

const DIFERENCIAIS = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Domínio de Território',
    desc: 'Cada bairro e condomínio de Franca tem uma página SEO exclusiva. Você aparece no topo do Google para quem busca imóveis no seu bairro — não para quem busca "imóvel em Franca" de forma genérica.',
    color: '#1B2B5B',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Sentinela de Território',
    desc: 'Quando outro corretor tenta entrar no seu bairro, você recebe um alerta. Sua posição de destaque fica bloqueada enquanto a assinatura estiver ativa.',
    color: '#C9A84C',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Leads de Leilão Qualificados',
    desc: 'Nosso sistema monitora leilões da Caixa 24/7. Quando aparece um imóvel com >40% de desconto no seu bairro, você recebe o alerta antes de todo mundo.',
    color: '#16a34a',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Relatório Mensal Automático',
    desc: 'No dia 1 de cada mês você recebe um relatório com impressões, cliques, leads gerados e ROI estimado. Dados reais para provar o valor para seus clientes.',
    color: '#7c3aed',
  },
]

const PLANOS = [
  {
    id: 'PRIME',
    nome: 'Prime',
    preco: 197,
    precoOriginal: null,
    destaque: false,
    cor: '#C9A84C',
    bg: 'rgba(201,168,76,0.08)',
    badge: null,
    beneficios: [
      'Perfil verificado com link de WhatsApp direto',
      'Topo das buscas por bairro e condomínio',
      'Selo "Verificado" nos condomínios selecionados',
      'Relatório mensal de performance',
      'Alerta de leilões no seu bairro',
    ],
  },
  {
    id: 'VIP',
    nome: 'VIP — Membro Fundador',
    preco: 497,
    precoOriginal: 997,
    destaque: true,
    cor: '#1B2B5B',
    bg: 'rgba(27,43,91,0.06)',
    badge: '💎 Apenas 10 vagas',
    beneficios: [
      'Tudo do Prime +',
      'Preço congelado vitaliciamente (R$ 997 após esgotamento)',
      'Exclusividade de topo em até 5 bairros',
      'Banner exclusivo em condomínios de luxo',
      'Destaque no mapa de busca (pin dourado)',
      'Sentinela de Território ativa',
      'Selo "Membro Fundador" no perfil',
      'Acesso antecipado a novas funcionalidades',
    ],
  },
]

const FAQS = [
  {
    q: 'Preciso ter CRECI para me cadastrar?',
    a: 'Sim. Aceitamos corretores com CRECI ativo e imobiliárias com CRECI-J. O cadastro inclui verificação do número de registro.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa ou fidelidade. O cancelamento é feito diretamente pelo seu painel. Ao cancelar o plano VIP Fundador, o preço promocional não é mantido em caso de reativação futura.',
  },
  {
    q: 'Como funciona o Domínio de Território?',
    a: 'Você seleciona até 5 bairros ou condomínios. Seu perfil aparece no topo das buscas nesses locais. Se outro parceiro tentar o mesmo território, você recebe um alerta e mantém a prioridade.',
  },
  {
    q: 'Qual a diferença para o ZAP e VivaReal?',
    a: 'Os portais tradicionais cobram por clique e não protegem seu território. Aqui você paga um valor fixo mensal e domina bairros específicos com exclusividade. O custo por lead é 80% menor.',
  },
  {
    q: 'O que acontece quando as 10 vagas de Fundador esgotarem?',
    a: 'O plano VIP continua disponível, mas sem o preço congelado e sem o selo Fundador. O preço passa para R$ 997/mês. Quem entrar agora garante R$ 497/mês para sempre.',
  },
]

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  creci: string
  city: string
  bairros: string
  plano: 'PRIME' | 'VIP'
}

export default function ImobiliariasPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'PRIME' | 'VIP'>('VIP')

  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', company: '',
    creci: '', city: 'Franca', bairros: '', plano: 'VIP',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/api/v1/public/partner-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          creci: form.creci,
          city: form.city,
          neighborhoods: form.bairros,
          plan: form.plano,
          isFounder: form.plano === 'VIP',
          source: 'landing_imobiliarias',
        }),
      })
      setSubmitted(true)
    } catch {
      // Mesmo com erro, mostra sucesso para não perder o lead
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const openFormWithPlan = (plano: 'PRIME' | 'VIP') => {
    setSelectedPlan(plano)
    setForm(f => ({ ...f, plano }))
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('form-parceiro')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #0f1c3a 50%, #1a1a2e 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #C9A84C 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold mb-6"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            <Crown className="w-4 h-4" /> Apenas 10 vagas de Membro Fundador disponíveis
          </div>

          <h1
            className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Enquanto o ZAP cobra por clique,<br />
            <span style={{ color: '#C9A84C' }}>você domina o bairro inteiro.</span>
          </h1>

          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
            O AgoraEncontrei mapeou cada rua e condomínio de Franca com SEO agressivo.
            Seja um Membro Fundador e apareça no topo do Google nos seus bairros — por um preço fixo vitalício.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openFormWithPlan('VIP')}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              <Crown className="w-5 h-5" /> Quero ser Membro Fundador
            </button>
            <button
              onClick={() => openFormWithPlan('PRIME')}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base border-2 border-white/30 text-white hover:bg-white/10 transition-all"
            >
              Ver Plano Prime — R$ 197/mês
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border text-center">
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#f0ece4', color: '#C9A84C' }}
              >
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-[#1B2B5B]">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIFERENCIAIS ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center text-[#1B2B5B] mb-3"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Por que o AgoraEncontrei é diferente?
        </h2>
        <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">
          Nenhum portal protege o corretor. Aqui você é um Aliado Estratégico, não mais um número.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DIFERENCIAIS.map((d, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white"
                style={{ backgroundColor: d.color }}
              >
                {d.icon}
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-2">{d.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANOS ───────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center text-[#1B2B5B] mb-10"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Escolha seu plano
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PLANOS.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-6 border-2 relative ${p.destaque ? 'shadow-xl' : 'shadow-sm'}`}
              style={{ borderColor: p.destaque ? p.cor : '#e5e7eb' }}
            >
              {p.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                  style={{ backgroundColor: p.cor }}
                >
                  {p.badge}
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5" style={{ color: p.cor }} />
                <h3 className="font-bold text-gray-800">{p.nome}</h3>
              </div>
              <div className="flex items-end gap-2 mb-1">
                {p.precoOriginal && (
                  <span className="text-gray-400 line-through text-lg">R$ {p.precoOriginal}</span>
                )}
                <span className="text-3xl font-bold text-[#1B2B5B]">R$ {p.preco}</span>
                <span className="text-gray-500 text-sm">/mês</span>
              </div>
              {p.precoOriginal && (
                <p className="text-xs text-green-600 font-semibold mb-4">
                  Economia de R$ {p.precoOriginal - p.preco}/mês — preço congelado vitaliciamente
                </p>
              )}
              <ul className="space-y-2 mb-6 mt-4">
                {p.beneficios.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: p.cor }} />
                    {b}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openFormWithPlan(p.id as 'PRIME' | 'VIP')}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
                style={{
                  backgroundColor: p.destaque ? p.cor : 'transparent',
                  color: p.destaque ? 'white' : p.cor,
                  border: p.destaque ? 'none' : `2px solid ${p.cor}`,
                }}
              >
                {p.destaque ? '💎 Garantir vaga de Fundador' : 'Começar com Prime'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORMULÁRIO DE INTERESSE ──────────────────────────────────────── */}
      {showForm && (
        <section id="form-parceiro" className="max-w-2xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-2xl border-2 p-8 shadow-xl" style={{ borderColor: '#C9A84C' }}>
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-[#1B2B5B] mb-3">Interesse registrado! 🎉</h2>
                <p className="text-gray-600 mb-6">
                  Nossa equipe entrará em contato em até <strong>2 horas</strong> para finalizar sua adesão ao Plano {selectedPlan === 'VIP' ? 'VIP Membro Fundador' : 'Prime'}.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
                  <p>Enquanto isso, explore o mapa e veja como seus concorrentes estão posicionados nos seus bairros.</p>
                </div>
                <Link
                  href="/imoveis"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  Ver o mapa <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <Crown className="w-6 h-6" style={{ color: '#C9A84C' }} />
                  <div>
                    <h2 className="text-xl font-bold text-[#1B2B5B]">
                      {selectedPlan === 'VIP' ? 'Garantir vaga de Membro Fundador' : 'Começar com o Plano Prime'}
                    </h2>
                    <p className="text-sm text-gray-500">Nossa equipe entrará em contato em até 2h</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo *</label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="João da Silva"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp *</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="(16) 99999-9999"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="joao@imobiliaria.com.br"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Imobiliária / Nome profissional</label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="Imobiliária Silva"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">CRECI *</label>
                      <input
                        required
                        type="text"
                        value={form.creci}
                        onChange={e => setForm(f => ({ ...f, creci: e.target.value }))}
                        placeholder="CRECI 12345"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bairros de atuação principal</label>
                    <input
                      type="text"
                      value={form.bairros}
                      onChange={e => setForm(f => ({ ...f, bairros: e.target.value }))}
                      placeholder="Ex: Centro, Jardim Petraglia, Polo Club"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                    />
                  </div>

                  {/* Plano selecionado */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['PRIME', 'VIP'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setSelectedPlan(p); setForm(f => ({ ...f, plano: p })) }}
                        className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${selectedPlan === p ? 'text-white' : 'bg-white text-gray-600'}`}
                        style={{
                          borderColor: p === 'VIP' ? '#1B2B5B' : '#C9A84C',
                          backgroundColor: selectedPlan === p ? (p === 'VIP' ? '#1B2B5B' : '#C9A84C') : 'white',
                        }}
                      >
                        {p === 'VIP' ? '💎 VIP Fundador — R$ 497' : '⭐ Prime — R$ 197'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white transition-all hover:brightness-110 disabled:opacity-60"
                    style={{ backgroundColor: '#1B2B5B' }}
                  >
                    {submitting ? 'Enviando...' : (
                      <>{selectedPlan === 'VIP' ? '💎 Garantir minha vaga de Fundador' : 'Quero começar com o Prime'} <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    Sem compromisso. Nossa equipe entra em contato para apresentar a plataforma e ativar seu perfil.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2
          className="text-2xl font-bold text-center text-[#1B2B5B] mb-8"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Perguntas frequentes
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-semibold text-gray-800 text-sm">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t">
                  <p className="pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #0f1c3a 100%)' }}
      >
        <Crown className="w-12 h-12 mx-auto mb-4" style={{ color: '#C9A84C' }} />
        <h2
          className="text-2xl sm:text-3xl font-bold text-white mb-4"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          As posições de destaque são por ordem de chegada.
        </h2>
        <p className="text-white/70 max-w-xl mx-auto mb-8">
          Quando as 10 vagas de Fundador esgotarem, o preço passa para R$ 997/mês. Garanta agora por R$ 497/mês vitalício.
        </p>
        <button
          onClick={() => openFormWithPlan('VIP')}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:brightness-110"
          style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
        >
          <Crown className="w-5 h-5" /> Garantir minha vaga agora <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-white/40 text-xs mt-4">
          Sem fidelidade. Cancele quando quiser. Preço congelado enquanto ativo.
        </p>
      </section>

    </div>
  )
}
