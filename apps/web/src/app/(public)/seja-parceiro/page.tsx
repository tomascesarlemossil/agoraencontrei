import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, Megaphone, Monitor, CheckCircle, Globe, BarChart3,
  MessageCircle, Cpu, Wifi, Package, Sparkles, Building2,
} from 'lucide-react'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Parceria com o AgoraEncontrei — Divulgue seu Negócio ou Contrate Site/Sistema',
  description:
    'Duas formas de crescer com o AgoraEncontrei: Divulgue seu Negócio (landing page + Google a partir de R$ 39,90/mês) ou Seja um Parceiro de tecnologia (site próprio, CRM com IA e versões offline).',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/seja-parceiro' },
}

const DIVULGUE_BULLETS = [
  { icon: Globe, text: 'Landing page pronta e otimizada para o Google' },
  { icon: Building2, text: 'Sua empresa na lista de Empresas Parceiras' },
  { icon: MessageCircle, text: 'Leads diretos no seu WhatsApp' },
  { icon: BarChart3, text: 'Painel simples para editar e ver cliques/leads' },
]

const PARCEIRO_BULLETS = [
  { icon: Monitor, text: 'Site imobiliário próprio com domínio e SEO' },
  { icon: Cpu, text: 'CRM completo com IA, funil e automações' },
  { icon: Wifi, text: 'Versões online e offline do sistema' },
  { icon: Package, text: 'Pacotes de imóveis, destaques e módulos' },
]

export default function SejaParceiroHub() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* HERO */}
      <section className="relative overflow-hidden text-white py-20 px-4" style={{ background: 'linear-gradient(135deg, #143A1F 0%, #0E2A15 60%, #0f1c3a 100%)' }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            <Sparkles className="w-3.5 h-3.5" /> Cresça com o AgoraEncontrei
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            O que você procura?
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Existem duas formas de fazer parceria com o AgoraEncontrei. Escolha a que faz sentido para o seu momento.
          </p>
        </div>
      </section>

      {/* AS DUAS OPÇÕES */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Divulgue seu Negócio */}
          <div className="bg-white rounded-3xl border-2 border-[#C9A84C] shadow-lg p-8 flex flex-col">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
              <Megaphone className="w-6 h-6" style={{ color: '#C9A84C' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#C9A84C' }}>A partir de R$ 39,90/mês</span>
            <h2 className="text-2xl font-bold text-[#143A1F] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Divulgue seu Negócio</h2>
            <p className="text-gray-600 text-sm mb-5">
              Para quem quer <strong>anunciar sua empresa ou serviço</strong> e ter uma landing page própria no
              AgoraEncontrei. Ideal para prestadores de serviço, lojas e profissionais que querem ser encontrados
              por quem está comprando, alugando ou reformando um imóvel.
            </p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {DIVULGUE_BULLETS.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <b.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} /> {b.text}
                </li>
              ))}
            </ul>
            <Link href="/divulgue" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#C9A84C] text-[#143A1F] hover:brightness-105 transition-all">
              Quero divulgar meu negócio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Seja um Parceiro (Tecnologia) */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm p-8 flex flex-col">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(20,58,31,0.08)' }}>
              <Monitor className="w-6 h-6" style={{ color: '#143A1F' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400">Tecnologia e sistemas</span>
            <h2 className="text-2xl font-bold text-[#143A1F] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Seja um Parceiro</h2>
            <p className="text-gray-600 text-sm mb-5">
              Para quem quer <strong>contratar tecnologia</strong>: um site imobiliário próprio, o CRM completo com IA,
              versões offline do sistema e outros módulos. Ideal para imobiliárias e corretores que querem sua própria
              plataforma de vendas.
            </p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {PARCEIRO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <b.icon className="w-4 h-4 flex-shrink-0 text-[#143A1F]" /> {b.text}
                </li>
              ))}
            </ul>
            <Link href="/parceiros/planos" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#143A1F] text-white hover:bg-[#0E2A15] transition-all">
              Ver sites, sistemas e planos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Comparativo rápido */}
        <div className="mt-8 bg-white rounded-2xl border overflow-hidden">
          <div className="grid grid-cols-3 text-sm">
            <div className="p-4 font-semibold text-gray-500">Resumo</div>
            <div className="p-4 text-center font-bold text-[#143A1F] border-l" style={{ backgroundColor: 'rgba(201,168,76,0.06)' }}>Divulgue seu Negócio</div>
            <div className="p-4 text-center font-bold text-[#143A1F] border-l">Seja um Parceiro</div>
          </div>
          {[
            { label: 'O que é', a: 'Anúncio + landing page', b: 'Site/sistema próprio' },
            { label: 'Para quem', a: 'Prestadores e empresas', b: 'Imobiliárias e corretores' },
            { label: 'Investimento', a: 'A partir de R$ 39,90/mês', b: 'Planos e projetos sob medida' },
            { label: 'Você gerencia', a: 'Sua página e seus leads', b: 'Sua plataforma completa' },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 text-sm border-t">
              <div className="p-4 text-gray-600">{row.label}</div>
              <div className="p-4 text-center text-gray-700 border-l" style={{ backgroundColor: 'rgba(201,168,76,0.04)' }}>{row.a}</div>
              <div className="p-4 text-center text-gray-700 border-l">{row.b}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Ainda com dúvida?{' '}
            <a href="https://wa.me/5516981010004?text=Olá! Quero entender as opções de parceria do AgoraEncontrei." target="_blank" rel="noreferrer" className="font-semibold text-[#143A1F] underline">Fale com a gente no WhatsApp</a>.
          </p>
        </div>
      </section>
    </div>
  )
}
