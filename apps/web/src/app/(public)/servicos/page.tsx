import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Building, CreditCard, BarChart3, Calculator, ClipboardList, Home, Phone, Mail, MapPin, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nossos Serviços | Imobiliária Lemos — Franca/SP',
  description: 'Conheça todos os serviços da Imobiliária Lemos: 2ª via de boleto, extrato do proprietário, fichas cadastrais, financiamento, avaliação e muito mais. CRECI 279051.',
  keywords: '2 via boleto aluguel franca, extrato proprietário imóvel, ficha cadastral locação, financiamento imobiliário franca, imobiliária lemos serviços',
}

const SERVICES = [
  {
    icon: Building,
    title: 'Compra e Venda',
    description: 'Assessoria completa na compra e venda de imóveis. Avaliação gratuita, divulgação nos principais portais e suporte jurídico até a escritura.',
    href: '/imoveis?purpose=SALE',
    color: '#1B2B5B',
  },
  {
    icon: Home,
    title: 'Locação',
    description: 'Administração completa de contratos de locação. Cobrança, repasse ao proprietário, vistoria e manutenção do imóvel durante toda a vigência.',
    href: '/imoveis?purpose=RENT',
    color: '#1B2B5B',
  },
  {
    icon: CreditCard,
    title: '2ª Via de Boleto',
    description: 'Perdeu o boleto do aluguel? Solicite a 2ª via de forma rápida e segura diretamente pelo nosso site ou WhatsApp.',
    href: '/servicos/2via-boleto',
    color: '#C9A84C',
  },
  {
    icon: BarChart3,
    title: 'Extrato do Proprietário',
    description: 'Proprietários podem consultar o extrato completo de repasses, aluguéis recebidos e despesas de seus imóveis.',
    href: '/servicos/extrato-proprietario',
    color: '#C9A84C',
  },
  {
    icon: ClipboardList,
    title: 'Fichas Cadastrais',
    description: 'Preencha as fichas de cadastro para locação ou compra de imóveis. Proposta de compra, proposta de locação, cadastro de fiador e locador.',
    href: '/servicos/fichas-cadastrais',
    color: '#16a34a',
  },
  {
    icon: Calculator,
    title: 'Simulação de Financiamento',
    description: 'Simule seu financiamento imobiliário gratuitamente. Parceria com os principais bancos: Caixa, Bradesco, Itaú, Santander e BV Financeira.',
    href: '/financiamentos',
    color: '#2563eb',
  },
  {
    icon: FileText,
    title: 'Avaliação de Imóveis',
    description: 'Avaliação gratuita e precisa do valor do seu imóvel com base em dados reais de mercado e expertise local de mais de 20 anos.',
    href: '/avaliacao',
    color: '#7c3aed',
  },
  {
    icon: Building,
    title: 'Cadastre seu Imóvel',
    description: 'Quer vender ou alugar seu imóvel? Cadastre gratuitamente e alcance milhares de compradores e locatários em Franca e região.',
    href: '/anunciar',
    color: '#dc2626',
  },
]

export default function ServicosPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      {/* Hero */}
      <section className="py-16 text-center" style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Nossos Serviços
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            A Imobiliária Lemos oferece uma linha completa de serviços para proprietários, inquilinos e compradores em Franca e região.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map(svc => (
            <Link
              key={svc.title}
              href={svc.href}
              className="group bg-white rounded-2xl p-6 border hover:shadow-xl hover:border-transparent transition-all duration-300"
              style={{ borderColor: '#e8e4dc' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${svc.color}15` }}
              >
                <svc.icon className="w-6 h-6" style={{ color: svc.color }} />
              </div>
              <h2 className="font-bold text-gray-900 mb-2 group-hover:text-[#1B2B5B] transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                {svc.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {svc.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2" style={{ color: svc.color }}>
                Saiba mais →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Prefeitura de Franca */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e4dc', backgroundColor: '#fff' }}>
          <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#ede9df', backgroundColor: '#fafaf8' }}>
            <MapPin className="w-5 h-5" style={{ color: '#1B2B5B' }} />
            <h2 className="font-bold text-base" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Prefeitura de Franca — Serviços Online
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://franca.sp.gov.br/pmf-bairrologradouro/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 rounded-xl border hover:shadow-md transition-all group"
              style={{ borderColor: '#e8e4dc' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(27,43,91,0.08)', color: '#1B2B5B' }}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                  Mapa de Zoneamento Urbano
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Consulte o uso do solo, bairros e logradouros de Franca/SP no mapa oficial da Prefeitura.</p>
              </div>
            </a>
            <a
              href="https://franca.siltecnologia.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 rounded-xl border hover:shadow-md transition-all group"
              style={{ borderColor: '#e8e4dc' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                  IPTU e Tributos Municipais
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Consulte e emita boletos de IPTU, taxas e outros tributos municipais de Franca/SP.</p>
              </div>
            </a>
            <a
              href="https://franca.sp.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 rounded-xl border hover:shadow-md transition-all group"
              style={{ borderColor: '#e8e4dc' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                <Building className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                  Portal da Prefeitura de Franca
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Acesse certidões, serviços municipais, legislação e informações da cidade.</p>
              </div>
            </a>
            <a
              href="https://franca.sp.gov.br/pmf-bairrologradouro/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 rounded-xl border hover:shadow-md transition-all group"
              style={{ borderColor: '#e8e4dc' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                  Consulta de Logradouros
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Pesquise endereços, lotes e informações cadastrais de imóveis em Franca/SP.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="rounded-2xl p-8 text-white text-center" style={{ backgroundColor: '#1B2B5B' }}>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Precisa de ajuda?
          </h2>
          <p className="text-white/70 mb-6">
            Nossa equipe está pronta para atendê-lo de segunda a sexta, das 8h às 18h, e sábados das 8h às 12h.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5516981010004"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
              style={{ backgroundColor: '#25D366', color: 'white' }}
            >
              <Phone className="w-4 h-4" /> (16) 98101-0004
            </a>
            <a
              href="mailto:contato@imobiliarialemos.com.br"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border-2 border-white/20 hover:border-white/40 transition-all"
              style={{ color: 'white' }}
            >
              <Mail className="w-4 h-4" /> contato@imobiliarialemos.com.br
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
