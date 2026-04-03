import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, TrendingDown, Shield, Phone, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Financiamento Imobiliário em Franca/SP | Imobiliária Lemos',
  description: 'Simule e financie seu imóvel com os melhores bancos. Caixa Econômica, Bradesco, Itaú, Santander, BB, Inter, SICOOB, Sicredi e BEXT. Imobiliária Lemos — CRECI 279051.',
  keywords: 'financiamento imobiliário franca, simulador financiamento franca, caixa econômica federal franca, financiar casa franca sp, crédito imobiliário franca',
}

const BANKS = [
  {
    name: 'Caixa Econômica Federal',
    shortName: 'Caixa',
    color: '#1565C0',
    bg: '#E3F2FD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Caixa_Econ%C3%B4mica_Federal_logo.svg/200px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png',
    href: 'https://simuladorhabitacao.caixa.gov.br/home',
    desc: 'Maior financiadora de imóveis do Brasil. Minha Casa Minha Vida, FGTS e taxas especiais para servidores.',
    highlight: 'Minha Casa Minha Vida',
  },
  {
    name: 'Bradesco',
    shortName: 'Bradesco',
    color: '#CC0000',
    bg: '#FFEBEE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Banco_Bradesco_logo_%28horizontal%29.svg/200px-Banco_Bradesco_logo_%28horizontal%29.svg.png',
    href: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-e-financiamento/encontre-seu-credito/simuladores-imoveis.shtm#box1-comprar',
    desc: 'Financiamento de imóveis residenciais e comerciais com condições flexíveis e prazo de até 30 anos.',
    highlight: 'Prazo até 30 anos',
  },
  {
    name: 'Itaú Unibanco',
    shortName: 'Itaú',
    color: '#F06400',
    bg: '#FFF3E0',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Banco_Ita%C3%BA_logo.svg/200px-Banco_Ita%C3%BA_logo.svg.png',
    href: 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario#section-5',
    desc: 'Crédito imobiliário com simulação online rápida, portabilidade de financiamento e taxa fixa ou atrelada ao IPCA.',
    highlight: 'Taxa fixa ou IPCA',
  },
  {
    name: 'Santander',
    shortName: 'Santander',
    color: '#EC0000',
    bg: '#FFEBEE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Santander_bank_logo.svg/200px-Santander_bank_logo.svg.png',
    href: 'https://www.negociosimobiliarios.santander.com.br/negociosimobiliarios/#/dados-pessoais?goal=3',
    desc: 'Financiamento imobiliário com análise de crédito rápida e atendimento personalizado em Franca/SP.',
    highlight: 'Análise rápida',
  },
  {
    name: 'Banco do Brasil',
    shortName: 'BB',
    color: '#003F87',
    bg: '#E3F2FD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Banco_do_Brasil_logo.svg/200px-Banco_do_Brasil_logo.svg.png',
    href: 'https://cim-simulador-imovelproprio.apps.bb.com.br/simulacao-imobiliario/sobre-imovel',
    desc: 'Crédito imobiliário para compra, construção e reforma. Condições especiais para correntistas.',
    highlight: 'Benefícios para correntistas',
  },
  {
    name: 'Banco Inter',
    shortName: 'Inter',
    color: '#FF8A00',
    bg: '#FFF3E0',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Banco_Inter_logo.svg/200px-Banco_Inter_logo.svg.png',
    href: 'https://inter.co/pra-voce/financiamento-imobiliario/residencial/',
    desc: '100% digital, sem tarifas de abertura de conta. Simulação e contratação pelo aplicativo.',
    highlight: '100% digital',
  },
  {
    name: 'SICOOB',
    shortName: 'SICOOB',
    color: '#007A37',
    bg: '#E8F5E9',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Sicoob_logo.svg/200px-Sicoob_logo.svg.png',
    href: 'https://www.sicoob.com.br/web/creditoimobiliario/simulador',
    desc: 'Sistema cooperativo com taxas competitivas e atendimento personalizado para associados.',
    highlight: 'Sistema cooperativo',
  },
  {
    name: 'Sicredi',
    shortName: 'Sicredi',
    color: '#1B7A3E',
    bg: '#E8F5E9',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sicredi_logo.svg/200px-Sicredi_logo.svg.png',
    href: 'https://www.sicredi.com.br/site/credito/para-voce/credito-imobiliario/',
    desc: 'Cooperativa de crédito com foco no relacionamento e condições especiais para cooperados.',
    highlight: 'Cooperativa de crédito',
  },
  {
    name: 'BEXT',
    shortName: 'BEXT',
    color: '#7C3AED',
    bg: '#EDE9FE',
    logo: null,
    href: 'https://bext.vc/financiamento-imobiliario',
    desc: 'Fintech especializada em financiamento imobiliário. Simulação inteligente e aprovação digital.',
    highlight: 'Aprovação digital',
  },
]

const TIPS = [
  {
    icon: <Calculator className="w-5 h-5" />,
    title: 'Simule antes de decidir',
    desc: 'Compare as taxas e parcelas em diferentes bancos para escolher a melhor opção para seu orçamento.',
  },
  {
    icon: <TrendingDown className="w-5 h-5" />,
    title: 'Use o FGTS',
    desc: 'Utilize o saldo do FGTS para dar entrada, amortizar parcelas ou reduzir o saldo devedor na Caixa.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Analise o CET',
    desc: 'O Custo Efetivo Total (CET) inclui taxas, seguros e tarifas. Compare sempre o CET, não só os juros.',
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Organize sua documentação',
    desc: 'Tenha documentos pessoais, comprovantes de renda e declaração de IR em mãos para agilizar o processo.',
  },
]

export default function FinanciamentosPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      {/* Hero */}
      <div className="py-14 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
          Crédito Imobiliário
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Financie seu Imóvel
        </h1>
        <p className="text-white/70 text-base max-w-2xl mx-auto mb-8">
          Compare as melhores opções de financiamento imobiliário e simule suas parcelas diretamente nos sites dos bancos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/5516981010004?text=Olá!%20Gostaria%20de%20ajuda%20para%20financiar%20um%20imóvel."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Falar com corretor
          </a>
          <a
            href="tel:1637230045"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Phone className="w-4 h-4" />
            (16) 3723-0045
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {/* Bank grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Simule nas maiores instituições financeiras
          </h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            Clique em um banco para abrir o simulador oficial de financiamento imobiliário.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BANKS.map(bank => (
              <a
                key={bank.name}
                href={bank.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-5 rounded-2xl border-2 bg-white hover:shadow-lg transition-all hover:-translate-y-0.5"
                style={{ borderColor: bank.color + '25' }}
              >
                {/* Logo */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: bank.bg }}
                >
                  {bank.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bank.logo} alt={bank.shortName}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement
                        el.style.display = 'none'
                        const fb = el.nextElementSibling as HTMLElement | null
                        if (fb) fb.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <span
                    className="text-lg font-extrabold"
                    style={{ color: bank.color, display: bank.logo ? 'none' : 'flex' }}
                  >
                    {bank.shortName.slice(0, 3)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm text-gray-800 truncate">{bank.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">{bank.desc}</p>
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: bank.bg, color: bank.color }}
                  >
                    {bank.highlight}
                  </span>
                </div>

                <div className="flex-shrink-0 self-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: bank.color + '15' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={bank.color} strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Simulator anchor */}
        <div id="simulador" className="bg-white rounded-3xl p-8 border shadow-sm mb-10" style={{ borderColor: '#e8e4dc' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Precisa de orientação para financiar?
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Nossa equipe pode indicar qual banco oferece as melhores condições para o seu perfil e imóvel de interesse.
            Fale com um corretor agora.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://wa.me/5516981010004?text=Olá!%20Preciso%20de%20ajuda%20para%20entender%20as%20opções%20de%20financiamento."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] shadow-md"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar pelo WhatsApp
            </a>
            <Link
              href="/imoveis?purpose=SALE"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 border-2"
              style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
            >
              Ver imóveis à venda
            </Link>
          </div>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Dicas para financiar com sucesso
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPS.map((tip, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border shadow-sm flex gap-4" style={{ borderColor: '#e8e4dc' }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
                >
                  {tip.icon}
                </div>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: '#1B2B5B' }}>{tip.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
