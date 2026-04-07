import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield, Crown, ArrowRight, CheckCircle, MapPin, Building2,
  Bell, BarChart3, TrendingUp, FileText, Star, Zap, Lock,
  Users, Target, Award, MessageCircle, ChevronRight, Eye,
  AlertTriangle, Clock, DollarSign,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Plano VIP — Sentinela Territorial Exclusivo | AgoraEncontrei',
  description:
    'Domine seu território. Com o Plano VIP do AgoraEncontrei, você reivindica exclusividade em condomínios e bairros de Franca/SP e aparece em primeiro lugar quando o cliente mais precisa de você. R$ 497/mês.',
  keywords: [
    'sentinela territorial imobiliário',
    'exclusividade condomínio corretor',
    'dashboard vip corretor franca sp',
    'ferramentas exclusivas imobiliária',
    'plano vip agoraencontrei',
    'monitoramento territorial imóveis',
    'leads exclusivos corretor',
  ],
  openGraph: {
    title: 'Plano VIP — Sentinela Territorial | AgoraEncontrei',
    description:
      'Reivindique exclusividade em condomínios e bairros. Seja o único corretor que aparece quando o cliente busca imóveis no seu território.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/parceiros/plano-vip' },
}

const SENTINELA_FEATURES = [
  {
    icon: Shield,
    title: 'Exclusividade por condomínio',
    desc: 'Reivindique um condomínio e seja o único profissional exibido naquela página. Nenhum concorrente aparece no seu território.',
    badge: 'Exclusivo VIP',
    badgeColor: '#1B2B5B',
  },
  {
    icon: MapPin,
    title: 'Domínio por bairro',
    desc: 'Marque um bairro inteiro como seu território. Todos os imóveis e condomínios daquele bairro exibem o seu perfil em destaque.',
    badge: 'Exclusivo VIP',
    badgeColor: '#1B2B5B',
  },
  {
    icon: Bell,
    title: 'Alertas de disputa territorial',
    desc: 'Receba notificação imediata quando outro profissional tentar reivindicar seu território. Você mantém a prioridade máxima.',
    badge: 'Tempo real',
    badgeColor: '#C9A84C',
  },
  {
    icon: Target,
    title: 'Fila de espera gerenciada',
    desc: 'Se um território já está ocupado, entre na fila com prioridade VIP. Quando o titular sair, você assume automaticamente.',
    badge: 'Prioridade máxima',
    badgeColor: '#C9A84C',
  },
  {
    icon: Eye,
    title: 'Visibilidade exclusiva no mapa',
    desc: 'No mapa de busca do site, apenas o seu pin aparece nos condomínios do seu território. Visibilidade 100% sua.',
    badge: 'Destaque no mapa',
    badgeColor: '#1B2B5B',
  },
  {
    icon: TrendingUp,
    title: 'Score de prioridade máximo',
    desc: 'O algoritmo de ranking do AgoraEncontrei atribui score 100 ao VIP — o mais alto possível. Você sempre aparece primeiro.',
    badge: 'Score 100',
    badgeColor: '#C9A84C',
  },
]

const ALL_VIP_TOOLS = [
  { icon: Shield, name: 'Sentinela Territorial', desc: 'Exclusividade em condomínios e bairros', vipOnly: true },
  { icon: FileText, name: 'Relatório Mensal de Leads', desc: 'PDF com performance, ROI e benchmark de mercado', vipOnly: true },
  { icon: Building2, name: 'Banner em condomínios de luxo', desc: 'Destaque visual exclusivo nos condomínios premium', vipOnly: true },
  { icon: BarChart3, name: 'Dashboard de analytics', desc: 'Visualizações, cliques no WhatsApp e impressões', vipOnly: false },
  { icon: DollarSign, name: 'Calculadora ROI de leilões', desc: 'ITBI, reforma, desocupação e score de oportunidade', vipOnly: false },
  { icon: Bell, name: 'Alertas de oportunidades', desc: 'Leilões com desconto > 40% em tempo real', vipOnly: false },
  { icon: Star, name: 'Perfil verificado + Selo ✓', desc: 'Topo das buscas por bairro e condomínio', vipOnly: false },
  { icon: MessageCircle, name: 'Link WhatsApp direto', desc: 'Clientes entram em contato sem intermediários', vipOnly: false },
]

const COMPARISON = [
  { feature: 'Perfil público verificado', start: true, prime: true, vip: true },
  { feature: 'Link WhatsApp direto', start: false, prime: true, vip: true },
  { feature: 'Topo das buscas por bairro', start: false, prime: true, vip: true },
  { feature: 'Dashboard de analytics', start: false, prime: true, vip: true },
  { feature: 'Calculadora ROI de leilões', start: false, prime: true, vip: true },
  { feature: 'Alertas de oportunidades', start: false, prime: true, vip: true },
  { feature: 'Sentinela Territorial', start: false, prime: false, vip: true },
  { feature: 'Relatório mensal (PDF)', start: false, prime: false, vip: true },
  { feature: 'Banner condomínios de luxo', start: false, prime: false, vip: true },
  { feature: 'Score de prioridade máximo', start: false, prime: false, vip: true },
  { feature: 'Suporte prioritário', start: false, prime: false, vip: true },
]

const FAQS = [
  {
    q: 'O que acontece se outro corretor já reivindicou o condomínio que eu quero?',
    a: 'Você entra na fila de espera com prioridade VIP. Se o titular cancelar o plano ou não renovar, você assume automaticamente o território. Você também recebe um alerta imediato para agir.',
  },
  {
    q: 'Posso reivindicar mais de um território?',
    a: 'Sim. Com o Plano VIP você pode reivindicar múltiplos condomínios e bairros. Cada território é gerenciado individualmente no seu dashboard privado.',
  },
  {
    q: 'O que significa "exclusividade" no Sentinela?',
    a: 'Exclusividade significa que apenas o seu perfil aparece naquele condomínio ou bairro. Nenhum outro profissional é exibido para o visitante daquela página — é como ter uma vitrine só sua.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. O cancelamento é sem multa e sem burocracia. Ao cancelar, seus territórios são liberados e entram na fila de espera dos próximos interessados.',
  },
  {
    q: 'O dashboard privado tem acesso a dados do sistema, backups ou configurações?',
    a: 'Não. O dashboard do parceiro é totalmente isolado — você acessa apenas suas ferramentas, seus leads e seus territórios. Nenhum dado de outros usuários ou configurações administrativas são visíveis.',
  },
  {
    q: 'Qual a diferença entre o Plano Prime e o VIP?',
    a: 'O Prime dá acesso às ferramentas de analytics, ROI e alertas. O VIP inclui tudo do Prime mais o Sentinela Territorial (exclusividade), relatório mensal em PDF, banner em condomínios de luxo e suporte prioritário.',
  },
]

export default function PlanoVIPPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 px-4"
        style={{ background: 'linear-gradient(135deg, #0f1c3a 0%, #1B2B5B 60%, #243a73 100%)' }}
      >
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C9A84C 0%, transparent 40%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] px-5 py-2 rounded-full text-sm font-semibold mb-8">
            <Crown className="w-4 h-4" />
            Plano VIP — Exclusivo para profissionais sérios
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Domine seu território.<br />
            <span style={{ color: '#C9A84C' }}>Seja o único a aparecer.</span>
          </h1>

          <p className="text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed">
            O <strong className="text-white">Sentinela Territorial</strong> do Plano VIP garante exclusividade em condomínios e bairros de Franca/SP.
            Quando um cliente busca um imóvel no seu território, <strong className="text-white">só você aparece</strong>.
          </p>

          {/* Preço */}
          <div className="inline-flex flex-col items-center bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl px-10 py-8 mb-10">
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">Plano VIP</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-white/50 text-xl">R$</span>
              <span className="text-6xl font-bold text-white leading-none">497</span>
              <span className="text-white/50 text-xl mb-2">/mês</span>
            </div>
            <p className="text-white/50 text-xs">Assinatura mensal · Cancele quando quiser</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/parceiros/cadastro?plan=VIP"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:brightness-110 shadow-lg"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Ativar Plano VIP agora <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/parceiros/planos"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              Comparar todos os planos
            </Link>
          </div>

          {/* Garantias */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/50 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Sem contrato de fidelidade</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Cancelamento sem multa</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Ativação em minutos</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Suporte prioritário</span>
          </div>
        </div>
      </section>

      {/* ── O QUE É O SENTINELA ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#f8f6f1]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#1B2B5B]/8 text-[#1B2B5B] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Shield className="w-4 h-4" /> A tecnologia central do Plano VIP
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1B2B5B] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              O que é o Sentinela Territorial?
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
              É um sistema de <strong>reivindicação e proteção de territórios</strong> que garante que apenas você apareça
              nas páginas de condomínios e bairros que você escolheu. Como ter uma vitrine exclusiva em cada endereço do seu mercado.
            </p>
          </div>

          {/* Diagrama visual do Sentinela */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                step: '01',
                title: 'Você reivindica',
                desc: 'Escolhe os condomínios e bairros que quer dominar no seu dashboard privado.',
                icon: Target,
                color: '#C9A84C',
              },
              {
                step: '02',
                title: 'O sistema protege',
                desc: 'O Sentinela bloqueia outros profissionais de aparecer no seu território com exclusividade.',
                icon: Shield,
                color: '#1B2B5B',
              },
              {
                step: '03',
                title: 'Clientes te encontram',
                desc: 'Quem busca imóveis naquele condomínio ou bairro vê apenas o seu perfil em destaque.',
                icon: Users,
                color: '#C9A84C',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border p-8 text-center shadow-sm">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: item.color }}>
                  Passo {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#1B2B5B] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Alerta de escassez */}
          <div className="bg-[#1B2B5B] rounded-2xl p-6 flex items-start gap-4 text-white">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
            <div>
              <p className="font-bold mb-1">Territórios são limitados por definição</p>
              <p className="text-white/70 text-sm leading-relaxed">
                Cada condomínio e bairro só pode ter <strong className="text-white">um titular exclusivo</strong> por vez.
                Quando um profissional VIP reivindica um território, nenhum outro pode ocupar aquela posição enquanto o plano estiver ativo.
                Quanto antes você agir, mais territórios estratégicos ficam disponíveis para você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES DO SENTINELA ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1B2B5B] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Tudo que o Sentinela faz por você
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Seis mecanismos que trabalham 24h para garantir sua posição de destaque no mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SENTINELA_FEATURES.map((feature, i) => (
              <div key={i} className="group bg-[#f8f6f1] hover:bg-white rounded-2xl border border-transparent hover:border-[#1B2B5B]/10 p-6 transition-all hover:shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1B2B5B]/8 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-[#1B2B5B]" />
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${feature.badgeColor}15`, color: feature.badgeColor }}
                  >
                    {feature.badge}
                  </span>
                </div>
                <h3 className="font-bold text-[#1B2B5B] mb-2 text-base">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TODAS AS FERRAMENTAS VIP ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#f8f6f1]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1B2B5B] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              O dashboard completo do Plano VIP
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Além do Sentinela, você acessa todas as ferramentas do dashboard privado — sem acesso a dados do sistema, backups ou configurações.
            </p>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            {/* Header do card */}
            <div className="p-6 border-b flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1B2B5B, #243a73)' }}>
              <Crown className="w-6 h-6" style={{ color: '#C9A84C' }} />
              <div>
                <p className="font-bold text-white">Dashboard Privado — Plano VIP</p>
                <p className="text-white/60 text-xs">Acesso exclusivo às suas ferramentas · R$ 497/mês</p>
              </div>
            </div>

            {/* Lista de ferramentas */}
            <div className="divide-y">
              {ALL_VIP_TOOLS.map((tool, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f6f1] transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tool.vipOnly ? 'bg-[#1B2B5B]/8' : 'bg-[#C9A84C]/10'
                  }`}>
                    <tool.icon className={`w-5 h-5 ${tool.vipOnly ? 'text-[#1B2B5B]' : 'text-[#C9A84C]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1B2B5B] text-sm">{tool.name}</p>
                    <p className="text-gray-400 text-xs">{tool.desc}</p>
                  </div>
                  {tool.vipOnly ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#1B2B5B]/8 text-[#1B2B5B] flex-shrink-0">
                      Exclusivo VIP
                    </span>
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Aviso de isolamento */}
            <div className="p-5 bg-gray-50 border-t flex items-start gap-3">
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-500">Acesso 100% isolado:</strong> O dashboard do parceiro não tem acesso a dados de outros usuários, configurações do sistema, backups ou informações administrativas. Você vê apenas suas próprias ferramentas e métricas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARATIVO DE PLANOS ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1B2B5B] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Por que o VIP vale mais?
            </h2>
            <p className="text-gray-500">Compare o que cada plano oferece</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-semibold text-gray-500 bg-gray-50">Recurso</th>
                  <th className="p-4 text-center bg-gray-50">
                    <p className="text-sm font-bold text-gray-400">Start</p>
                    <p className="text-xs text-gray-400">Grátis</p>
                  </th>
                  <th className="p-4 text-center bg-[#C9A84C]/5">
                    <p className="text-sm font-bold" style={{ color: '#C9A84C' }}>Prime</p>
                    <p className="text-xs text-gray-400">R$ 197/mês</p>
                  </th>
                  <th className="p-4 text-center bg-[#1B2B5B]/5">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Crown className="w-4 h-4" style={{ color: '#1B2B5B' }} />
                      <p className="text-sm font-bold text-[#1B2B5B]">VIP</p>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: '#1B2B5B' }}>R$ 497/mês</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="p-4 text-sm text-gray-700 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.start
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <span className="text-gray-200 text-lg font-bold mx-auto block text-center">—</span>
                      }
                    </td>
                    <td className="p-4 text-center bg-[#C9A84C]/3">
                      {row.prime
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <span className="text-gray-200 text-lg font-bold mx-auto block text-center">—</span>
                      }
                    </td>
                    <td className="p-4 text-center bg-[#1B2B5B]/3">
                      {row.vip
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <span className="text-gray-200 text-lg font-bold mx-auto block text-center">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/parceiros/cadastro?plan=VIP"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:brightness-110 shadow-md"
              style={{ background: '#1B2B5B', color: 'white' }}
            >
              <Crown className="w-5 h-5" style={{ color: '#C9A84C' }} />
              Quero o Plano VIP <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROVA SOCIAL / URGÊNCIA ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#f8f6f1]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1B2B5B] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              O mercado de Franca/SP em números
            </h2>
            <p className="text-gray-500">Entenda o tamanho da oportunidade que você pode dominar</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { value: '300+', label: 'Condomínios mapeados', sub: 'disponíveis para reivindicação', icon: Building2 },
              { value: '1.011+', label: 'Imóveis ativos', sub: 'indexados com SEO local', icon: MapPin },
              { value: '101', label: 'Leilões monitorados', sub: 'com ROI calculado em tempo real', icon: TrendingUp },
              { value: '40+', label: 'Bairros mapeados', sub: 'em Franca e região', icon: Target },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border p-6 text-center shadow-sm">
                <stat.icon className="w-6 h-6 mx-auto mb-3 text-[#C9A84C]" />
                <p className="text-3xl font-bold text-[#1B2B5B] mb-1">{stat.value}</p>
                <p className="text-sm font-semibold text-gray-700 mb-1">{stat.label}</p>
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Card de urgência */}
          <div className="bg-white rounded-2xl border border-[#C9A84C]/30 p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-[#1B2B5B] mb-2">Cada dia sem o Sentinela é um dia que seu concorrente pode reivindicar seu território</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Os melhores condomínios de Franca/SP — Collis Residence, Residencial Dom Bosco, Piemonte, Safra — ainda estão disponíveis.
                Quando um VIP os reivindicar, você precisará esperar na fila. Aja agora.
              </p>
            </div>
            <Link
              href="/parceiros/cadastro?plan=VIP"
              className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:brightness-110"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Garantir meu território <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1B2B5B] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#f8f6f1] rounded-2xl p-6">
                <p className="font-bold text-[#1B2B5B] mb-3 flex items-start gap-2">
                  <span className="text-[#C9A84C] font-bold flex-shrink-0">P.</span>
                  {faq.q}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────────── */}
      <section
        className="py-24 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #0f1c3a 0%, #1B2B5B 60%, #243a73 100%)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10" style={{ color: '#C9A84C' }} />
          </div>

          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Pronto para dominar<br />seu território?
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Ative o Plano VIP agora, reivindique seus condomínios e bairros,<br />
            e comece a receber leads exclusivos do seu mercado.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link
              href="/parceiros/cadastro?plan=VIP"
              className="inline-flex items-center gap-2 px-12 py-5 rounded-2xl font-bold text-xl transition-all hover:brightness-110 shadow-xl"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <Crown className="w-6 h-6" />
              Ativar Plano VIP — R$ 497/mês
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-white/40 text-sm mb-8">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Ativação imediata</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Sem fidelidade</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Suporte prioritário</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Cancele quando quiser</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/parceiros/planos" className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2">
              Ver todos os planos
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/parceiros/cadastro" className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2">
              Começar gratuitamente
            </Link>
            <span className="text-white/20">·</span>
            <a
              href="https://wa.me/5516981010004?text=Olá! Tenho dúvidas sobre o Plano VIP e o Sentinela Territorial."
              target="_blank"
              rel="noreferrer"
              className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
            >
              Falar com um especialista
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
