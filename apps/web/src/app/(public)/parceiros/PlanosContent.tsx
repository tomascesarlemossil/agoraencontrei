'use client'

import Link from 'next/link'
import {
  CheckCircle, XCircle, Star, Crown, Zap, ArrowRight,
  BarChart3, MapPin, Bell, TrendingUp, Shield, Lock,
  Calculator, Eye, Target, Users, Building2, MessageCircle,
  ChevronRight, Award, Clock, Sparkles, DollarSign,
} from 'lucide-react'

// ── Planos Avulsos (Site, CRM, Pacotes de Imóveis) ─────────────────────────
const AVULSO_PLANS = [
  {
    id: 'SITE',
    name: 'Site Próprio',
    price: 990,
    period: 'único',
    desc: 'Site profissional da sua imobiliária com domínio próprio, SEO otimizado, integração com WhatsApp e painel administrativo.',
    features: ['Domínio próprio', 'Design responsivo', 'SEO otimizado', 'Integração WhatsApp', 'Painel admin', 'Certificado SSL'],
  },
  {
    id: 'CRM',
    name: 'CRM Completo',
    price: 20000,
    period: 'único',
    desc: 'Sistema CRM completo com gestão de leads, contratos, financeiro, agentes IA, documentos, automações e muito mais.',
    features: ['Gestão de leads', 'Contratos digitais', 'Financeiro integrado', 'Agentes IA', 'Documentos por IA', 'Editor de fotos', 'Automações', 'Portal do cliente', 'Notas fiscais'],
  },
]

const IMOVEIS_PLANS = [
  { id: 'PKG10', qty: 10, price: 150, label: '10 Imóveis' },
  { id: 'PKG20', qty: 20, price: 199.90, label: '20 Imóveis' },
  { id: 'PKG30', qty: 30, price: 249.90, label: '30 Imóveis' },
]

const DESTAQUE_PLANS = [
  { id: 'DEST3', qty: 3, price: 60, label: '3 Destaques', icon: '⭐' },
  { id: 'DEST6', qty: 6, price: 99.90, label: '6 Super Destaques', icon: '🌟' },
]

// ── Planos Recorrentes (Prime, VIP) ─────────────────────────────────────────
const PLANS = [
  {
    id: 'PRIME',
    name: 'Prime',
    price: 197,
    period: '/mês',
    subtitle: 'Para corretores autônomos',
    highlight: true,
    badge: 'Mais Popular',
    badgeColor: '#C9A84C',
    icon: Star,
    iconColor: '#C9A84C',
    borderColor: 'border-[#C9A84C]',
    bgColor: 'bg-[#C9A84C]/5',
    ctaStyle: 'bg-[#C9A84C] text-[#1B2B5B] hover:bg-[#b8943d]',
    tools: [
      { name: 'Dashboard de analytics', desc: 'Visualizações, cliques no WhatsApp e impressões em condomínios', included: true },
      { name: 'Calculadora ROI de leilões', desc: 'ITBI, reforma, desocupação, retorno estimado e score de oportunidade', included: true },
      { name: 'Alertas de oportunidades', desc: 'Notificações por e-mail de leilões com desconto > 40%', included: true },
      { name: 'Perfil verificado público', desc: 'Selo ✓ e topo das buscas por bairro e condomínio', included: true },
      { name: 'Link WhatsApp direto', desc: 'Clientes entram em contato sem intermediários', included: true },
      { name: 'Sentinela territorial', desc: 'Monitoramento exclusivo de bairros e condomínios', included: false },
      { name: 'Relatório mensal de leads', desc: 'PDF com performance, ROI e benchmark de mercado', included: false },
      { name: 'Acesso a dados do sistema', desc: 'Configurações, backups e dados administrativos', included: false },
    ],
  },
  {
    id: 'VIP',
    name: 'VIP',
    price: 497,
    period: '/mês',
    subtitle: 'Para imobiliárias e equipes',
    highlight: false,
    badge: 'Completo',
    badgeColor: '#1B2B5B',
    icon: Crown,
    iconColor: '#1B2B5B',
    borderColor: 'border-[#1B2B5B]',
    bgColor: 'bg-[#1B2B5B]/5',
    ctaStyle: 'bg-[#1B2B5B] text-white hover:bg-[#162247]',
    tools: [
      { name: 'Dashboard de analytics', desc: 'Visualizações, cliques no WhatsApp e impressões em condomínios', included: true },
      { name: 'Calculadora ROI de leilões', desc: 'ITBI, reforma, desocupação, retorno estimado e score de oportunidade', included: true },
      { name: 'Alertas de oportunidades', desc: 'Notificações por e-mail de leilões com desconto > 40%', included: true },
      { name: 'Perfil verificado público', desc: 'Selo ✓ e topo das buscas por bairro e condomínio', included: true },
      { name: 'Link WhatsApp direto', desc: 'Clientes entram em contato sem intermediários', included: true },
      { name: 'Sentinela territorial', desc: 'Monitoramento exclusivo de bairros e condomínios', included: true },
      { name: 'Relatório mensal de leads', desc: 'PDF com performance, ROI e benchmark de mercado', included: true },
      { name: 'Acesso a dados do sistema', desc: 'Configurações, backups e dados administrativos', included: false },
    ],
  },
]

// ── Ferramentas do dashboard ─────────────────────────────────────────────────
const DASHBOARD_TOOLS = [
  {
    icon: BarChart3,
    color: '#C9A84C',
    bg: 'bg-[#C9A84C]/10',
    title: 'Analytics em Tempo Real',
    desc: 'Veja quantas pessoas visualizaram seu perfil, clicaram no seu WhatsApp e quantos condomínios estão gerando leads para você. Dados atualizados a cada hora.',
    plan: 'Prime+',
  },
  {
    icon: Calculator,
    color: '#1B2B5B',
    bg: 'bg-[#1B2B5B]/10',
    title: 'Calculadora ROI de Leilões',
    desc: 'Calcule o retorno real de qualquer leilão: ITBI, cartório, advogado, desocupação, reforma e lucro estimado. Score de oportunidade de 0 a 100.',
    plan: 'Prime+',
  },
  {
    icon: Bell,
    color: '#10b981',
    bg: 'bg-green-100',
    title: 'Alertas Inteligentes',
    desc: 'Receba e-mails automáticos quando surgirem leilões com desconto acima de 40% na sua cidade. Nunca perca uma oportunidade de negócio.',
    plan: 'Prime+',
  },
  {
    icon: Target,
    color: '#8b5cf6',
    bg: 'bg-purple-100',
    title: 'Sentinela Territorial',
    desc: 'Reivindique exclusividade em condomínios e bairros. Monitore sua presença e receba alertas quando novos imóveis aparecerem no seu território.',
    plan: 'VIP',
  },
  {
    icon: TrendingUp,
    color: '#ef4444',
    bg: 'bg-red-100',
    title: 'Relatório Mensal de Performance',
    desc: 'PDF automático com seus leads, conversões, ROI por condomínio e benchmark comparado com outros parceiros da sua categoria.',
    plan: 'VIP',
  },
  {
    icon: Eye,
    color: '#3b82f6',
    bg: 'bg-blue-100',
    title: 'Visibilidade em Leilões',
    desc: 'Seu perfil aparece nas páginas de leilões ativos da sua cidade, conectando você com compradores que precisam de reforma, avaliação ou corretagem.',
    plan: 'Prime+',
  },
]

// ── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'O que é o dashboard privado do parceiro?',
    a: 'É uma área exclusiva com ferramentas de inteligência imobiliária: calculadora ROI, analytics de leads, alertas de leilões e sentinela territorial. Você acessa apenas suas próprias ferramentas — sem ver dados de outros parceiros, configurações do sistema ou backups.',
  },
  {
    q: 'Como funciona o acesso após o pagamento?',
    a: 'Após confirmar o pagamento (PIX é instantâneo, boleto em até 3 dias úteis), seu plano é ativado automaticamente. Você acessa o dashboard em /meu-painel usando o e-mail cadastrado.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Sem fidelidade, sem multa. Cancele quando quiser pelo próprio painel ou pelo WhatsApp da nossa equipe. O acesso continua até o fim do período pago.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'PIX (aprovação imediata), boleto bancário (3 dias úteis) e cartão de crédito. A cobrança é mensal e automática via Asaas — plataforma regulada pelo Banco Central.',
  },
  {
    q: 'O parceiro tem acesso a dados do sistema ou de outros usuários?',
    a: 'Não. O dashboard do parceiro é completamente isolado. Você vê apenas seus próprios dados: seu perfil, suas métricas, seus territórios e as ferramentas de análise. Configurações do sistema, backups e dados de outros usuários são inacessíveis.',
  },
  {
    q: 'Posso usar o dashboard para minha equipe inteira?',
    a: 'O plano VIP é ideal para imobiliárias com equipes. Para múltiplos acessos individuais, entre em contato para um plano corporativo personalizado.',
  },
]

export function PlanosContent() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #0f1c3a 60%, #1a1a2e 100%)' }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Dashboard Exclusivo para Parceiros
          </div>
          <h1
            className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Ferramentas que transformam{' '}
            <span style={{ color: '#C9A84C' }}>dados em negócios</span>
          </h1>
          <p className="text-white/65 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Acesse o dashboard privado do AgoraEncontrei. Calculadora ROI de leilões,
            sentinela territorial, analytics de leads e alertas inteligentes — tudo em um só lugar.
          </p>

          {/* Stats rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { value: '101+', label: 'Leilões ativos' },
              { value: '49.8%', label: 'Desconto médio' },
              { value: '300+', label: 'Condomínios' },
              { value: '5.000+', label: 'Famílias atendidas' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{s.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="#planos"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              Ver planos e preços <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/meu-painel"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Já sou parceiro — Acessar painel
            </Link>
          </div>
        </div>
      </section>

      {/* ── O que é o dashboard ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>
            O que você acessa
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
            Ferramentas exclusivas do dashboard privado
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Cada ferramenta foi desenvolvida para maximizar seus resultados no mercado imobiliário.
            Você acessa apenas suas próprias métricas — sem dados do sistema, sem backups, sem configurações administrativas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DASHBOARD_TOOLS.map((tool, i) => {
            const Icon = tool.icon
            return (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${tool.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" style={{ color: tool.color }} />
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-[#1B2B5B] text-sm leading-tight">{tool.title}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: tool.plan === 'VIP' ? 'rgba(27,43,91,0.1)' : 'rgba(201,168,76,0.15)',
                      color: tool.plan === 'VIP' ? '#1B2B5B' : '#b8943d',
                    }}
                  >
                    {tool.plan}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{tool.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Aviso de segurança */}
        <div className="mt-8 flex items-start gap-3 p-4 rounded-2xl border" style={{ backgroundColor: 'rgba(27,43,91,0.04)', borderColor: 'rgba(27,43,91,0.12)' }}>
          <Shield className="w-5 h-5 text-[#1B2B5B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#1B2B5B]">Acesso 100% isolado e seguro</p>
            <p className="text-xs text-gray-500 mt-0.5">
              O dashboard do parceiro é completamente separado do sistema administrativo.
              Você vê apenas seus próprios dados. Configurações do sistema, backups, dados de outros usuários
              e informações administrativas são inacessíveis por design.
            </p>
          </div>
        </div>
      </section>

      {/* ── Planos ───────────────────────────────────────────────────────── */}
      <section id="planos" className="max-w-5xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>
            Planos e preços
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
            Escolha o plano ideal para você
          </h2>
          <p className="text-gray-500 mt-2 text-sm">Sem fidelidade. Cancele quando quiser. Pagamento via PIX, boleto ou cartão.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 ${plan.borderColor} shadow-sm overflow-hidden relative`}
              >
                {plan.badge && (
                  <div
                    className="absolute top-0 right-0 px-4 py-1.5 text-xs font-bold rounded-bl-xl"
                    style={{ backgroundColor: plan.badgeColor, color: plan.id === 'VIP' ? 'white' : '#1B2B5B' }}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div className={`px-6 pt-8 pb-6 ${plan.bgColor}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: plan.id === 'VIP' ? 'rgba(27,43,91,0.12)' : 'rgba(201,168,76,0.15)' }}
                    >
                      <PlanIcon className="w-6 h-6" style={{ color: plan.iconColor }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1B2B5B]">Plano {plan.name}</h3>
                      <p className="text-xs text-gray-500">{plan.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-[#1B2B5B]">R$ {plan.price}</span>
                    <span className="text-gray-400 text-sm mb-1">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ferramentas incluídas</p>
                  <ul className="space-y-3">
                    {plan.tools.map((tool, i) => (
                      <li key={i} className={`flex items-start gap-2.5 ${tool.included ? '' : 'opacity-40'}`}>
                        {tool.included
                          ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                        }
                        <div>
                          <p className="text-sm font-medium text-[#1B2B5B] leading-tight">{tool.name}</p>
                          <p className="text-xs text-gray-400 leading-tight mt-0.5">{tool.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <Link
                    href={`/parceiros/cadastro?plan=${plan.id}`}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${plan.ctaStyle}`}
                  >
                    Assinar {plan.name} — R$ {plan.price}/mês
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {plan.id === 'VIP' && (
                    <Link
                      href="/parceiros/plano-vip"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium mt-2 border border-[#1B2B5B]/20 text-[#1B2B5B] hover:bg-[#1B2B5B]/5 transition-all"
                    >
                      <Shield className="w-4 h-4" /> Saiba mais sobre o Sentinela Territorial
                    </Link>
                  )}
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Pagamento seguro via Asaas · PIX, boleto ou cartão
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Nota sobre acesso */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 max-w-lg mx-auto">
            <Lock className="w-3 h-3 inline mr-1 mb-0.5" />
            O acesso ao dashboard é pessoal e intransferível. Cada parceiro acessa apenas
            seus próprios dados e ferramentas. Nenhum dado administrativo do sistema é exposto.
          </p>
        </div>
      </section>

      {/* ── Como funciona o checkout ─────────────────────────────────────── */}
      <section style={{ backgroundColor: '#1B2B5B' }} className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>
              Processo simples
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Do cadastro ao dashboard em minutos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: Users,
                title: 'Cadastre seu perfil',
                desc: 'Preencha nome, e-mail, categoria e selecione os condomínios onde você atua.',
              },
              {
                step: '02',
                icon: DollarSign,
                title: 'Escolha o plano',
                desc: 'Selecione Prime ou VIP e pague via PIX (aprovação imediata), boleto ou cartão.',
              },
              {
                step: '03',
                icon: CheckCircle,
                title: 'Pagamento confirmado',
                desc: 'Seu plano é ativado automaticamente após a confirmação do pagamento.',
              },
              {
                step: '04',
                icon: BarChart3,
                title: 'Acesse o dashboard',
                desc: 'Entre em /meu-painel com seu e-mail e comece a usar todas as ferramentas.',
              },
            ].map((s, i) => {
              const StepIcon = s.icon
              return (
                <div key={i} className="text-center">
                  <div
                    className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}
                  >
                    <StepIcon className="w-6 h-6" style={{ color: '#C9A84C' }} />
                  </div>
                  <div className="text-xs font-bold mb-1" style={{ color: '#C9A84C' }}>PASSO {s.step}</div>
                  <h3 className="font-bold text-white text-sm mb-2">{s.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Pagamento seguro */}
          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 p-5 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <Shield className="w-8 h-8 flex-shrink-0" style={{ color: '#C9A84C' }} />
            <div className="text-center sm:text-left">
              <p className="font-bold text-white text-sm">Pagamento 100% seguro via Asaas</p>
              <p className="text-white/50 text-xs mt-0.5">
                Plataforma de pagamentos regulada pelo Banco Central do Brasil.
                Seus dados financeiros nunca passam pelos nossos servidores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos Avulsos (Site, CRM, Pacotes) ──────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>Soluções Avulsas</p>
          <h2 className="text-2xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
            Site Próprio, CRM e Pacotes de Imóveis
          </h2>
          <p className="text-gray-500 text-sm mt-2">Contrate apenas o que você precisa. Sem mensalidade obrigatória.</p>
        </div>

        {/* Site + CRM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {AVULSO_PLANS.map(plan => (
            <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
              <h3 className="text-lg font-bold text-[#1B2B5B] mb-1" style={{ fontFamily: 'Georgia, serif' }}>{plan.name}</h3>
              <p className="text-gray-500 text-xs mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-[#1B2B5B]">R$ {plan.price.toLocaleString('pt-BR')}</span>
                <span className="text-gray-400 text-sm">/{plan.period}</span>
              </div>
              <div className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <a href={`https://wa.me/5516981010004?text=Olá! Tenho interesse no ${plan.name} do AgoraEncontrei.`}
                target="_blank" rel="noreferrer"
                className="block text-center py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                style={{ backgroundColor: '#1B2B5B', color: 'white' }}>
                Contratar {plan.name}
              </a>
            </div>
          ))}
        </div>

        {/* Pacotes de Imóveis */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-[#1B2B5B] mb-4 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            Pacotes de Anúncios de Imóveis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {IMOVEIS_PLANS.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-lg hover:border-[#C9A84C] transition-all">
                <p className="text-2xl font-bold text-[#1B2B5B]">{plan.qty}</p>
                <p className="text-xs text-gray-500 mb-3">imóveis anunciados</p>
                <p className="text-xl font-bold mb-4" style={{ color: '#C9A84C' }}>R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-sm text-gray-400">/mês</span></p>
                <a href={`https://wa.me/5516981010004?text=Olá! Quero o pacote de ${plan.qty} imóveis do AgoraEncontrei.`}
                  target="_blank" rel="noreferrer"
                  className="block py-2.5 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                  style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}>
                  Assinar {plan.label}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Destaques */}
        <div>
          <h3 className="text-lg font-bold text-[#1B2B5B] mb-4 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            Planos de Destaque
          </h3>
          <p className="text-center text-xs text-gray-500 mb-4">Seus imóveis aparecem no topo das buscas com selo dourado de destaque</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {DESTAQUE_PLANS.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border-2 p-5 text-center hover:shadow-lg transition-all"
                style={{ borderColor: plan.qty === 6 ? '#C9A84C' : '#e5e7eb' }}>
                <p className="text-3xl mb-2">{plan.icon}</p>
                <p className="text-sm font-bold text-[#1B2B5B]">{plan.label}</p>
                <p className="text-xs text-gray-500 mb-3">imóveis em destaque</p>
                <p className="text-xl font-bold mb-4" style={{ color: '#C9A84C' }}>R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-sm text-gray-400">/mês</span></p>
                <a href={`https://wa.me/5516981010004?text=Olá! Quero o plano de ${plan.label} do AgoraEncontrei.`}
                  target="_blank" rel="noreferrer"
                  className="block py-2.5 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                  style={{ backgroundColor: '#1B2B5B', color: 'white' }}>
                  Assinar {plan.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparativo de planos (tabela) ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
            Comparativo completo
          </h2>
        </div>

        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-3 border-b">
            <div className="p-4 text-sm font-semibold text-gray-500">Recurso</div>
            <div className="p-4 text-center border-l">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-bold text-[#1B2B5B]">Prime</span>
              </div>
              <div className="text-sm font-bold text-[#C9A84C]">R$ 197/mês</div>
            </div>
            <div className="p-4 text-center border-l" style={{ backgroundColor: '#1B2B5B' }}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Crown className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-bold text-white">VIP</span>
              </div>
              <div className="text-sm font-bold text-[#C9A84C]">R$ 497/mês</div>
            </div>
          </div>

          {/* Rows */}
          {[
            { feature: 'Dashboard de analytics', prime: true, vip: true },
            { feature: 'Calculadora ROI de leilões', prime: true, vip: true },
            { feature: 'Alertas de oportunidades por e-mail', prime: true, vip: true },
            { feature: 'Perfil público verificado (Selo ✓)', prime: true, vip: true },
            { feature: 'Link WhatsApp direto', prime: true, vip: true },
            { feature: 'Topo das buscas por bairro/condomínio', prime: true, vip: true },
            { feature: 'Sentinela territorial exclusiva', prime: false, vip: true },
            { feature: 'Relatório mensal de leads (PDF)', prime: false, vip: true },
            { feature: 'Banner em condomínios de luxo', prime: false, vip: true },
            { feature: 'Suporte prioritário', prime: false, vip: true },
            { feature: 'Acesso a dados do sistema', prime: false, vip: false },
            { feature: 'Acesso a backups ou configurações', prime: false, vip: false },
            { feature: 'Dados de outros usuários', prime: false, vip: false },
          ].map((row, i) => {
            const isRestricted = !row.prime && !row.vip
            return (
              <div key={i} className={`grid grid-cols-3 border-b last:border-0 ${isRestricted ? 'bg-red-50/50' : ''}`}>
                <div className={`p-3.5 text-sm ${isRestricted ? 'text-red-600 font-medium' : 'text-gray-700'} flex items-center gap-2`}>
                  {isRestricted && <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  {row.feature}
                </div>
                <div className="p-3.5 text-center border-l flex items-center justify-center">
                  {row.prime
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-gray-200" />
                  }
                </div>
                <div className={`p-3.5 text-center border-l flex items-center justify-center ${isRestricted ? '' : 'bg-[#1B2B5B]/3'}`}>
                  {row.vip
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-gray-300" />
                  }
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA abaixo da tabela */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/parceiros/cadastro?plan=PRIME"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            <Star className="w-4 h-4" /> Assinar Prime — R$ 197/mês
          </Link>
          <Link
            href="/parceiros/cadastro?plan=VIP"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: '#1B2B5B', color: 'white' }}
          >
            <Crown className="w-4 h-4" /> Assinar VIP — R$ 497/mês
          </Link>
        </div>
      </section>

      {/* ── Depoimentos ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#f0ece4' }} className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
              O que dizem nossos parceiros
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                text: 'A calculadora ROI mudou como eu analiso leilões. Em 2 semanas fechei um negócio com 42% de desconto que eu nunca teria identificado sem a ferramenta.',
                name: 'Marcos Oliveira',
                role: 'Corretor · CRECI-SP',
                plan: 'Prime',
              },
              {
                text: 'O sentinela territorial me avisa quando novos imóveis aparecem nos condomínios que monitoro. Chego antes da concorrência sempre.',
                name: 'Ana Paula Costa',
                role: 'Engenheira Civil · Franca/SP',
                plan: 'VIP',
              },
              {
                text: 'O relatório mensal me mostra exatamente quais condomínios geram mais leads. Consigo focar onde realmente vale a pena.',
                name: 'Ricardo Fernandes',
                role: 'Arquiteto · Franca/SP',
                plan: 'VIP',
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#C9A84C] text-[#C9A84C]" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: '#1B2B5B' }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1B2B5B]">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: t.plan === 'VIP' ? 'rgba(27,43,91,0.1)' : 'rgba(201,168,76,0.15)',
                      color: t.plan === 'VIP' ? '#1B2B5B' : '#b8943d',
                    }}
                  >
                    {t.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
            Perguntas frequentes
          </h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 shadow-sm">
              <h3 className="font-bold text-[#1B2B5B] text-sm mb-2 flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                {item.q}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed pl-6">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────────────── */}
      <section
        className="py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #0f1c3a 100%)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <Award className="w-12 h-12 mx-auto mb-4" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Pronto para ter vantagem competitiva?
          </h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            Junte-se aos parceiros que já usam inteligência de dados para fechar mais negócios.
            Comece hoje — sem fidelidade, sem burocracia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/parceiros/cadastro?plan=PRIME"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              <Star className="w-4 h-4" /> Começar com Prime — R$ 197/mês
            </Link>
            <Link
              href="/parceiros/cadastro?plan=VIP"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              <Crown className="w-4 h-4" /> Plano VIP — R$ 497/mês
            </Link>
          </div>
          <p className="text-white/30 text-xs mt-5">
            <Clock className="w-3 h-3 inline mr-1" />
            Ativação imediata via PIX · Cancele quando quiser
          </p>
        </div>
      </section>

    </div>
  )
}
