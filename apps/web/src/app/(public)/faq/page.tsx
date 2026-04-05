import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, HelpCircle } from 'lucide-react'
import { FaqAccordion } from './FaqAccordion'

export const metadata: Metadata = {
  title: 'Perguntas Frequentes (FAQ) | Imobiliária Lemos — Franca/SP',
  description:
    'Tire suas dúvidas sobre compra, venda, locação, financiamento, documentação, FGTS e avaliação de imóveis com a Imobiliária Lemos em Franca/SP.',
  keywords: [
    'FAQ imobiliária',
    'perguntas frequentes imóveis',
    'compra de imóvel',
    'financiamento imobiliário',
    'FGTS imóvel',
    'documentos imóvel',
    'locação Franca SP',
    'Imobiliária Lemos',
  ],
  openGraph: {
    title: 'Perguntas Frequentes | Imobiliária Lemos — Franca/SP',
    description:
      'Dúvidas sobre compra, venda, locação e financiamento? Confira nossas respostas.',
    type: 'website',
    locale: 'pt_BR',
  },
}

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Como funciona o processo de compra de um imóvel?',
    answer:
      'O processo começa com a escolha do imóvel, seguida de uma análise documental do imóvel e do comprador. Em seguida, é feita uma proposta ao proprietário, negociação de valores e condições, assinatura do contrato de compra e venda, e finalmente a escritura e registro em cartório. Nossa equipe acompanha você em cada etapa.',
  },
  {
    question: 'Quais documentos são necessários para comprar um imóvel?',
    answer:
      'Os principais documentos são: RG e CPF, comprovante de estado civil, comprovante de renda (últimos 3 meses), comprovante de residência, declaração do Imposto de Renda e carteira de trabalho. Para financiamento, o banco pode solicitar documentos adicionais.',
  },
  {
    question: 'É possível usar o FGTS na compra de um imóvel?',
    answer:
      'Sim! O FGTS (Fundo de Garantia por Tempo de Serviço) pode ser utilizado para aquisição de imóvel residencial urbano, desde que o comprador atenda aos requisitos: ter no mínimo 3 anos de trabalho sob regime do FGTS, não possuir outro financiamento ativo no SFH, e o imóvel deve estar na cidade onde o comprador trabalha ou reside.',
  },
  {
    question: 'Como funciona o financiamento imobiliário?',
    answer:
      'O financiamento imobiliário permite parcelar o valor do imóvel em até 35 anos. Geralmente é necessária uma entrada de 10% a 30% do valor do imóvel. Os bancos avaliam sua renda e histórico de crédito para aprovar o financiamento. A parcela mensal não pode ultrapassar 30% da renda familiar. Trabalhamos com os principais bancos: Caixa, Bradesco, Itaú, Santander e Banco do Brasil.',
  },
  {
    question: 'Qual a diferença entre escritura e registro de imóvel?',
    answer:
      'A escritura é o documento que formaliza a vontade das partes em transferir a propriedade, lavrada em cartório de notas. Já o registro é a inscrição dessa escritura no Cartório de Registro de Imóveis, que efetivamente transfere a propriedade. Sem o registro, o imóvel não está legalmente no nome do comprador.',
  },
  {
    question: 'Como é feita a avaliação de um imóvel?',
    answer:
      'A avaliação considera diversos fatores: localização, área construída e do terreno, estado de conservação, acabamentos, idade da construção, infraestrutura do bairro, e valores praticados na região. Nossos corretores possuem experiência de mercado para determinar o valor justo do seu imóvel.',
  },
  {
    question: 'Quanto custa para anunciar meu imóvel?',
    answer:
      'O anúncio do seu imóvel na Imobiliária Lemos é gratuito. Trabalhamos com comissão sobre a venda ou locação, conforme tabela do CRECI. Entre em contato para saber mais sobre as condições.',
  },
  {
    question: 'Como funciona a locação de imóveis?',
    answer:
      'Para alugar um imóvel, o interessado deve apresentar documentos pessoais, comprovante de renda (geralmente 3x o valor do aluguel), e oferecer uma garantia locatícia (fiador, seguro fiança ou caução). Após a aprovação cadastral, é assinado o contrato de locação e entregue as chaves.',
  },
  {
    question: 'Quais são as garantias locatícias aceitas?',
    answer:
      'Aceitamos as seguintes garantias: fiador (com imóvel quitado na mesma cidade), seguro fiança (contratado junto a uma seguradora), caução (depósito de até 3 meses de aluguel), e título de capitalização. A escolha da garantia é combinada entre as partes.',
  },
  {
    question: 'Quem paga a comissão do corretor?',
    answer:
      'Na venda, a comissão é paga pelo vendedor, geralmente entre 5% e 6% do valor do imóvel. Na locação, o primeiro aluguel é pago pelo locatário como taxa de intermediação. Esses valores seguem as diretrizes do CRECI.',
  },
  {
    question: 'Posso vender um imóvel financiado?',
    answer:
      'Sim, é possível vender um imóvel financiado. O comprador pode quitar o saldo devedor e assumir o financiamento restante, ou contratar um novo financiamento. Nossa equipe auxilia em todo o processo de transferência.',
  },
  {
    question: 'O que é a matrícula do imóvel?',
    answer:
      'A matrícula é o documento que identifica o imóvel no Cartório de Registro de Imóveis. Ela contém todo o histórico do imóvel: proprietários anteriores, ônus, área, localização e eventuais restrições. É fundamental verificar a matrícula antes de qualquer negociação.',
  },
  {
    question: 'Quais os custos adicionais na compra de um imóvel?',
    answer:
      'Além do valor do imóvel, há custos como: ITBI (Imposto de Transmissão de Bens Imóveis, geralmente 2% a 3%), escritura pública (varia conforme o valor), registro em cartório, e eventuais taxas bancárias no caso de financiamento. Estima-se cerca de 4% a 5% do valor do imóvel em custos adicionais.',
  },
  {
    question: 'A Imobiliária Lemos atende quais regiões?',
    answer:
      'Atuamos principalmente em Franca/SP e região, incluindo cidades vizinhas. Com mais de 20 anos de mercado, temos amplo conhecimento dos bairros, condomínios e regiões em desenvolvimento da cidade.',
  },
  {
    question: 'Como entro em contato com a Imobiliária Lemos?',
    answer:
      'Você pode entrar em contato pelo WhatsApp (16) 98101-0005, pelo telefone fixo, pelo e-mail ou visitando nosso escritório em Franca/SP. Também é possível enviar uma mensagem pela nossa página de contato no site. Estamos prontos para atender você!',
  },
  {
    question: 'O que é CRECI e por que é importante?',
    answer:
      'CRECI é o Conselho Regional de Corretores de Imóveis, órgão que regulamenta e fiscaliza a profissão. Somente corretores e imobiliárias com registro ativo no CRECI estão autorizados a intermediar transações imobiliárias. O CRECI da Imobiliária Lemos é 279051, garantindo segurança e legalidade em todas as operações.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

export default function FaqPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="py-20 text-white text-center"
        style={{
          background:
            'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#C9A84C' }}
          >
            Imobiliária Lemos — Franca/SP
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Perguntas Frequentes
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Tire suas dúvidas sobre compra, venda, locação, financiamento e
            documentação de imóveis.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-gray-600 font-medium">FAQ</span>
        </nav>
      </div>

      {/* FAQ list */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="w-6 h-6" style={{ color: '#C9A84C' }} />
          <h2
            className="text-2xl font-bold"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            Dúvidas Mais Comuns
          </h2>
        </div>

        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div
          className="bg-white rounded-2xl border shadow-sm p-10 text-center"
          style={{ borderColor: '#ddd9d0' }}
        >
          <h3
            className="text-xl font-bold mb-3"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            Não encontrou sua resposta?
          </h3>
          <p className="text-gray-600 mb-6">
            Entre em contato com nossa equipe. Estamos prontos para ajudar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-transform hover:scale-105"
              style={{ backgroundColor: '#1B2B5B' }}
            >
              Fale Conosco
            </Link>
            <a
              href="https://wa.me/5516981010005?text=Olá! Tenho uma dúvida sobre imóveis."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: '#25D366',
                color: 'white',
              }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
